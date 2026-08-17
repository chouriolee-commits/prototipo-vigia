from pydantic import BaseModel


class DashboardResumen(BaseModel):
    animales_activos: int
    eventos_hoy: int
    alertas_pendientes: int


class ActividadHora(BaseModel):
    hora: int
    eventos: int


class DashboardActividad(BaseModel):
    horas: list[ActividadHora]


class AlertaReciente(BaseModel):
    id: int
    tipo_alerta: str
    nivel: str
    estado: str
    timestamp: str
    descripcion: str