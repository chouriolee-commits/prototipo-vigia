from datetime import datetime

from sqlalchemy import (
    JSON,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Evento(Base):
    __tablename__ = "eventos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    animal_id: Mapped[int | None] = mapped_column(
        ForeignKey("animales.id", ondelete="SET NULL"), nullable=True
    )
    tipo: Mapped[str] = mapped_column(String(50), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    timestamp_evento: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    datos_raw: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    nivel_relevancia: Mapped[str] = mapped_column(
        Enum("normal", "media", "alta", name="nivel_relevancia"),
        default="normal",
        nullable=False,
    )
    fuente: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )