from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Animal(Base):
    __tablename__ = "animales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    identificador: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    especie: Mapped[str] = mapped_column(
        Enum("bovino", "equino", "ovino", "otro", name="especie"), nullable=False
    )
    sexo: Mapped[str] = mapped_column(
        Enum("macho", "hembra", "desconocido", name="sexo"),
        default="desconocido",
        nullable=False,
    )
    fecha_registro: Mapped[date] = mapped_column(Date, nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )