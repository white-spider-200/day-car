import enum
from typing import Any


class ProfessionalType(str, enum.Enum):
    PSYCHIATRIST = "PSYCHIATRIST"
    THERAPIST = "THERAPIST"


def can_prescribe_medication(professional_type: ProfessionalType | None) -> bool:
    return professional_type == ProfessionalType.PSYCHIATRIST


def badge_payload_for_professional_type(professional_type: ProfessionalType | None) -> dict[str, Any]:
    normalized = professional_type or ProfessionalType.THERAPIST
    if normalized == ProfessionalType.PSYCHIATRIST:
        return {
            "professional_type": normalized.value,
            "title": "🩺 طبيب نفسي معتمد",
            "icon": "🩺",
            "color": "blue",
            "tooltip": "هذا المختص مخول قانونياً بوصف الأدوية النفسية حسب الأنظمة المعتمدة.",
            "clarification_note": "هذا المختص مخول قانونياً بوصف الأدوية النفسية حسب الأنظمة المعتمدة.",
            "capabilities": [
                "✔ يمكنه تشخيص الحالات",
                "✔ يمكنه وصف الأدوية النفسية",
                "✔ جلسات علاج + متابعة دوائية",
            ],
            "medication_authority_warning": "⚠️ يملك صلاحية وصف الأدوية النفسية.",
            "can_prescribe_medication": True,
        }

    return {
        "professional_type": ProfessionalType.THERAPIST.value,
        "title": "🧠 معالج نفسي",
        "icon": "🧠",
        "color": "green",
        "tooltip": "هذا المختص يقدم جلسات علاج نفسي فقط ولا يملك صلاحية وصف الأدوية.",
        "clarification_note": "هذا المختص يقدم جلسات علاج نفسي فقط ولا يملك صلاحية وصف الأدوية.",
        "capabilities": [
            "✔ جلسات علاج نفسي",
            "✔ دعم سلوكي ومعرفي",
            "❌ لا يمكنه وصف أدوية",
        ],
        "medication_authority_warning": "⚠️ غير مخول بوصف الأدوية النفسية.",
        "can_prescribe_medication": False,
    }

