from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.db.models import (
    Appointment,
    AppointmentStatus,
    DoctorAvailabilityException,
    DoctorAvailabilityRule,
    RecurrenceType,
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
            is_blocked=rule.is_blocked,
            effective_from=rule.effective_from,
            effective_to=rule.effective_to,
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
            is_blocking=item.is_blocking,
            is_recurring=item.is_recurring,
            recurrence_type=item.recurrence_type,
            recurrence_interval=item.recurrence_interval,
            recurrence_until=item.recurrence_until,
            weekday=item.weekday,
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
            .order_by(DoctorAvailabilityException.date, DoctorAvailabilityException.created_at)
        )
    )


def _slot_overlaps(start_1: datetime, end_1: datetime, start_2: datetime, end_2: datetime) -> bool:
    return start_1 < end_2 and end_1 > start_2


def _rule_active_on_day(rule: DoctorAvailabilityRule, day: date) -> bool:
    if rule.effective_from and day < rule.effective_from:
        return False
    if rule.effective_to and day > rule.effective_to:
        return False
    return True


def _exception_applies_on_day(item: DoctorAvailabilityException, target_day: date) -> bool:
    if not item.is_recurring:
        return item.date == target_day
    if target_day < item.date:
        return False
    if item.recurrence_until and target_day > item.recurrence_until:
        return False

    recurrence_interval = max(1, int(item.recurrence_interval or 1))
    recurrence_type = item.recurrence_type

    if recurrence_type == RecurrenceType.WEEKLY:
        expected_weekday = item.weekday if item.weekday is not None else item.date.weekday()
        if target_day.weekday() != expected_weekday:
            return False
        weeks_delta = (target_day - item.date).days // 7
        return weeks_delta % recurrence_interval == 0

    if recurrence_type == RecurrenceType.MONTHLY:
        if target_day.day != item.date.day:
            return False
        months_delta = (target_day.year - item.date.year) * 12 + (target_day.month - item.date.month)
        return months_delta % recurrence_interval == 0

    return False


def _is_blocked_by_exception(
    day_exceptions: list[DoctorAvailabilityException],
    slot_start_local: datetime,
    slot_end_local: datetime,
) -> bool:
    blocked = False
    for item in day_exceptions:
        if item.start_time is None and item.end_time is None:
            overlaps = True
        elif item.start_time and item.end_time:
            blocked_start = datetime.combine(slot_start_local.date(), item.start_time, slot_start_local.tzinfo)
            blocked_end = datetime.combine(slot_start_local.date(), item.end_time, slot_start_local.tzinfo)
            overlaps = _slot_overlaps(slot_start_local, slot_end_local, blocked_start, blocked_end)
        else:
            overlaps = False

        if not overlaps:
            continue

        if item.is_blocking and item.is_unavailable:
            blocked = True
            continue
        if not item.is_blocking:
            blocked = False
    return blocked


def _is_blocked_by_rules(
    blocked_rules: list[DoctorAvailabilityRule],
    *,
    slot_start_utc: datetime,
    slot_end_utc: datetime,
    day: date,
) -> bool:
    for rule in blocked_rules:
        if rule.day_of_week != day.weekday() or not _rule_active_on_day(rule, day):
            continue
        tz = ZoneInfo(rule.timezone)
        block_start = datetime.combine(day, rule.start_time, tz).astimezone(UTC)
        block_end = datetime.combine(day, rule.end_time, tz).astimezone(UTC)
        if _slot_overlaps(slot_start_utc, slot_end_utc, block_start, block_end):
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
                DoctorAvailabilityException.date <= date_to,
                or_(
                    DoctorAvailabilityException.is_recurring.is_(False),
                    DoctorAvailabilityException.recurrence_until.is_(None),
                    DoctorAvailabilityException.recurrence_until >= date_from,
                ),
            )
            .order_by(DoctorAvailabilityException.date, DoctorAvailabilityException.created_at)
        )
    )

    by_date: dict[date, list[DoctorAvailabilityException]] = {}
    day = date_from
    while day <= date_to:
        for item in exceptions:
            if _exception_applies_on_day(item, day):
                by_date.setdefault(day, []).append(item)
        day += timedelta(days=1)
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
    all_rules = _get_rules(db, doctor_user_id)
    if not all_rules:
        return []

    blocked_rules = [rule for rule in all_rules if rule.is_blocked]
    rules = [rule for rule in all_rules if not rule.is_blocked]

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
            if rule.day_of_week != weekday or not _rule_active_on_day(rule, day):
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

                if _is_blocked_by_rules(
                    blocked_rules,
                    slot_start_utc=slot_start_utc,
                    slot_end_utc=slot_end_utc,
                    day=day,
                ):
                    slot_start_local += step
                    continue

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
    all_rules = _get_rules(db, doctor_user_id)
    if not all_rules:
        return None, False

    blocked_rules = [rule for rule in all_rules if rule.is_blocked]
    rules = [rule for rule in all_rules if not rule.is_blocked]

    for rule in rules:
        tz = ZoneInfo(rule.timezone)
        local_start = requested_start_at_utc.astimezone(tz)
        if local_start.weekday() != rule.day_of_week:
            continue

        local_day = local_start.date()
        if not _rule_active_on_day(rule, local_day):
            continue

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
        if _is_blocked_by_rules(
            blocked_rules,
            slot_start_utc=requested_start_at_utc,
            slot_end_utc=end_utc,
            day=local_day,
        ):
            continue

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
