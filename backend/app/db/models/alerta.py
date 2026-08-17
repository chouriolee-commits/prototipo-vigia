from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
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


class Alerta(Base):
    __tablename__ = "alertas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    evento_id: Mapped[int] = mapped_column(
        ForeignKey("eventos.id"), nullable=False
    )
    tipo_alerta: Mapped[str] = mapped_column(String(100), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    nivel: Mapped[str] = mapped_column(
        Enum("baja", "media", "alta", name="nivel"), default="media", nullable=False
    )
    estado: Mapped[str] = mapped_column(
        Enum("pendiente", "revisada", "descartada", name="estado"),
        default="pendiente",
        nullable=False,
    )
    analisis_ia: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    notificado_n8n: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )