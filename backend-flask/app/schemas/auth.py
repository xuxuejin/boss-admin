from pydantic import BaseModel, Field


class LoginSchema(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)
    captcha_id: str = Field(min_length=1)
    captcha_code: str = Field(min_length=1, max_length=10)


class RegisterSchema(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=6, max_length=128)
    nickname: str | None = Field(default=None, max_length=64)
    phone_number: str | None = None
    email: str | None = None


class ResetPasswordSchema(BaseModel):
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=6, max_length=128)
