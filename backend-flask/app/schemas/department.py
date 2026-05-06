from flask_babel import gettext as _
from pydantic import BaseModel, Field, EmailStr, field_validator
from app.utils.validators import validate_phone


class DepartmentBaseSchema(BaseModel):
    leader: str | None = Field(default=None, max_length=128)
    phone: str | None = None
    email: EmailStr | None = None
    status: int = Field(default=1)
    parent_id: int | None = None

    # 添加“预处理”校验器，把可选字段的空字符串转成 None
    @field_validator("leader", "phone", "email", "parent_id", mode="before")
    @classmethod
    def empty_str_to_none(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
        return v

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        if v is None:
            return None
        if not validate_phone(v):
            raise ValueError(_("Invalid phone number format"))
        return v


class DepartmentCreateSchema(DepartmentBaseSchema):
    name: str = Field(min_length=1, max_length=64)
    order: int = Field(ge=0)


class DepartmentUpdateSchema(DepartmentBaseSchema):
    name: str | None = Field(default=None, min_length=1, max_length=64)
    order: int | None = Field(default=None, ge=0)
