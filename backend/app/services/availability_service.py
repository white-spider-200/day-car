from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import and_, delete, or_, select
from sqlalchemy.orm import Session

from app.db.models import (
    Appointment,
    AppointmentStatus,
    DoctorAvailabilityException,
    DoctorAvailabilityRule,
)
from app.schemas.availability import AvailabilityExceptionIn, AvailabilityRuleIn, AvailabilitySlotOut


def replace_rules(db: Session, doctor_user_id, rules: list[AvailabilityRuleIn]) -> list[DoctorAvailabilityRule]:
    db.execute(
        delete(DoctorAvailabilityRule).where(DoctorAvailabilityRule.doctor_user_id == doctor_user_id)
    )
    new_rules = [
        DoctorAvailabilityRule(
            doctor_user_id=doctor_user_id,
            day_of_week=rule.day_of_week,
            start_time=rule.start_time,
            end_time=rule.end_time,
            timezone=rule.timezone,
            slot_duration_minutes=rule.slot_duration_minutes,
            buffer_minutes=rule.buffer_minutes,
        )
        for rule in rules
    ]
    db.add_all(new_rules)
    db.commit()
    return list(
        db.scalars(
            select(DoctorAvailabilityRule)
            .where(DoctorAvailabilityRule.doctor_user_id == doctor_user_id)
            .order_by(DoctorAvailabilityRule.day_of_week, DoctorAvailabilityRule.start_time)
        )
    )


def replace_exceptions(
    db: Session, doctor_user_id, exceptions: list[AvailabilityExceptionIn]
) -> list[DoctorAvailabilityException]:
    db.execute(
        delete(DoctorAvailabilityException).where(
            DoctorAvailabilityException.doctor_user_id == doctor_user_id
        )
    )
    new_items = [
        DoctorAvailabilityException(
            doctor_user_id=doctor_user_id,
            date=item.date,
            is_unavailable=item.is_unavailable,
            start_time=item.start_time,
            end_time=item.end_time,
            note=item.note,
        )
        for item in exceptions
    ]
    db.add_all(new_items)
    db.commit()
    return list(
        db.scalars(
            select(DoctorAvailabilityException)
            .where(DoctorAvailabilityException.doctor_user_id == doctor_user_id)
            .order_by(DoctorAvailabilityException.date)
        )
    )


def _slot_overlaps(start_1: datetime, end_1: datetime, start_2: datetime, end_2: datetime) -> bool:
    return start_1 < end_2 and end_1 > start_2


def _is_blocked_by_exception(
    day_exceptions: list[DoctorAvailabilityException],
    slot_start_local: datetime,
    slot_end_local: datetime,
) -> bool:
    for item in day_exceptions:
        if not item.is_unavailable:
            continue
        if item.is_unavailable and item.start_time is None and item.end_time is None:
            return True
        if item.start_time and item.end_time:
            blocked_start = datetime.combine(slot_start_local.date(), item.start_time, slot_start_local.tzinfo)
            blocked_end = datetime.combine(slot_start_local.date(), item.end_time, slot_start_local.tzinfo)
            if _slot_overlaps(slot_start_local, slot_end_local, blocked_start, blocked_end):
                return True
    return False


def _get_rules(db: Session, doctor_user_id) -> list[DoctorAvailabilityRule]:
    return list(
        db.scalars(
            select(DoctorAvailabilityRule)
            .where(DoctorAvailabilityRule.doctor_user_id == doctor_user_id)
            .order_by(DoctorAvailabilityRule.day_of_week, DoctorAvailabilityRule.start_time)
        )
    )


def _get_exceptions_map(
    db: Session, doctor_user_id, date_from: date, date_to: date
) -> dict[date, list[DoctorAvailabilityException]]:
    exceptions = list(
        db.scalars(
            select(DoctorAvailabilityException)
            .where(
                DoctorAvailabilityException.doctor_user_id == doctor_user_id,
                DoctorAvailabilityException.date >= date_from,
                DoctorAvailabilityException.date <= date_to,
            )
            .order_by(DoctorAvailabilityException.date)
        )
    )
    by_date: dict[date, list[DoctorAvailabilityException]] = {}
    for item in exceptions:
        by_date.setdefault(item.date, []).append(item)
    return by_date


def _get_confirmed_appointments(
    db: Session, doctor_user_id, window_start_utc: datetime, window_end_utc: datetime
) -> list[Appointment]:
    return list(
        db.scalars(
            select(Appointment).where(
                Appointment.doctor_user_id == doctor_user_id,
                Appointment.status == AppointmentStatus.CONFIRMED,
                Appointment.start_at < window_end_utc,
                Appointment.end_at > window_start_utc,
            )
        )
    )


def generate_slots(
    db: Session, doctor_user_id, date_from: date, date_to: date
) -> list[AvailabilitySlotOut]:
    rules = _get_rules(db, doctor_user_id)
    if not rules:
        return []

    exceptions_map = _get_exceptions_map(db, doctor_user_id, date_from, date_to)
    window_start_utc = datetime.combine(date_from, time.min, tzinfo=UTC)
    window_end_utc = datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=UTC)
    confirmed = _get_confirmed_appointments(db, doctor_user_id, window_start_utc, window_end_utc)

    slots: list[AvailabilitySlotOut] = []
    day = date_from
    while day <= date_to:
        weekday = day.weekday()
        day_exceptions = exceptions_map.get(day, [])

        for rule in rules:
            if rule.day_of_week != weekday:
                continue
            tz = ZoneInfo(rule.timezone)
            start_local = datetime.combine(day, rule.start_time, tz)
            end_local = datetime.combine(day, rule.end_time, tz)
            duration = timedelta(minutes=rule.slot_duration_minutes)
            step = timedelta(minutes=rule.slot_duration_minutes + rule.buffer_minutes)

            slot_start_local = start_local
            while slot_start_local + duration <= end_local:
                slot_end_local = slot_start_local + duration
                if _is_blocked_by_exception(day_exceptions, slot_start_local, slot_end_local):
                    slot_start_local += step
                    continue

                slot_start_utc = slot_start_local.astimezone(UTC)
                slot_end_utc = slot_end_local.astimezone(UTC)

                is_overlapping_confirmed = any(
                    _slot_overlaps(slot_start_utc, slot_end_utc, appt.start_at, appt.end_at)
                    for appt in confirmed
                )
                if not is_overlapping_confirmed:
                    slots.append(
                        AvailabilitySlotOut(
                            start_at=slot_start_utc,
                            end_at=slot_end_utc,
                            timezone=rule.timezone,
                        )
                    )

                slot_start_local += step

        day += timedelta(days=1)

    slots.sort(key=lambda item: item.start_at)
    return slots


def resolve_slot(
    db: Session,
    doctor_user_id,
    requested_start_at_utc: datetime,
    check_confirmed_conflict: bool,
) -> tuple[datetime | None, bool]:
    """
    Returns: (slot_end_at_utc, has_conflict_with_confirmed).
    If slot does not match rules/exceptions, slot_end_at_utc is None.
    """
    rules = _get_rules(db, doctor_user_id)
    if not rules:
        return None, False

    for rule in rules:
        tz = ZoneInfo(rule.timezone)
        local_start = requested_start_at_utc.astimezone(tz)
        if local_start.weekday() != rule.day_of_week:
            continue

        local_day = local_start.date()
        rule_start = datetime.combine(local_day, rule.start_time, tz)
        rule_end = datetime.combine(local_day, rule.end_time, tz)
        duration = timedelta(minutes=rule.slot_duration_minutes)
        step = timedelta(minutes=rule.slot_duration_minutes + rule.buffer_minutes)

        if local_start < rule_start:
            continue

        local_end = local_start + duration
        if local_end > rule_end:
            continue

        delta_seconds = int((local_start - rule_start).total_seconds())
        step_seconds = int(step.total_seconds())
        if step_seconds == 0 or delta_seconds % step_seconds != 0:
            continue

        day_exceptions = _get_exceptions_map(db, doctor_user_id, local_day, local_day).get(local_day, [])
        if _is_blocked_by_exception(day_exceptions, local_start, local_end):
            continue

        end_utc = local_end.astimezone(UTC)

        if check_confirmed_conflict:
            conflict_exists = db.scalar(
                select(Appointment.id).where(
                    Appointment.doctor_user_id == doctor_user_id,
                    Appointment.status == AppointmentStatus.CONFIRMED,
                    Appointment.start_at < end_utc,
                    Appointment.end_at > requested_start_at_utc,
                )
            )
            if conflict_exists:
                return end_utc, True

        return end_utc, False

    return None, False


def has_confirmed_overlap(db: Session, doctor_user_id, start_at: datetime, end_at: datetime) -> bool:
    return (
        db.scalar(
            select(Appointment.id).where(
                Appointment.doctor_user_id == doctor_user_id,
                Appointment.status == AppointmentStatus.CONFIRMED,
                Appointment.start_at < end_at,
                Appointment.end_at > start_at,
            )
        )
        is not None
    )
