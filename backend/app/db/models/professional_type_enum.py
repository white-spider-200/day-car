from sqlalchemy import Enum

from app.core.professional_roles import ProfessionalType

ProfessionalTypeDBEnum = Enum(ProfessionalType, name="professional_type", native_enum=True)

