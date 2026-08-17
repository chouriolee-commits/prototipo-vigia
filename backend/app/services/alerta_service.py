from collections import defaultdict, deque
from datetime import datetime

from app.schemas.vision import EventoDeteccion

UMBRAL_CONFIANZA = "umbral_confianza_alerta"
ANIMALES_MINIMOS = "animales_minimos_hato"
VENTANA_INACTIVIDAD = "ventana_inactividad_min"
FRAMES_AISLAMIENTO = "frames_aislamiento"

_DEFAULT_CONFIG = {
    UMBRAL_CONFIANZA: 0.75,
    ANIMALES_MINIMOS: 3,
    VENTANA_INACTIVIDAD: 60,
    FRAMES_AISLAMIENTO: 10,
}


class EvaluadorAlertas:
    """Reglas de negocio de spec-02 §5.1 con estado en memoria por fuente."""

    def __init__(self) -> None:
        self._frames_solo: defaultdict[str, int] = defaultdict(int)
        self._ultimo_evento: dict[str, datetime] = {}
        self._confianza_reciente: defaultdict[str, deque[float]] = defaultdict(
            lambda: deque(maxlen=10)
        )

    def reiniciar_fuente(self, fuente: str) -> None:
        self._frames_solo.pop(fuente, None)
        self._ultimo_evento.pop(fuente, None)
        self._confianza_reciente.pop(fuente, None)

    def evaluar(self, evento: EventoDeteccion, config: dict[str, str]) -> list[dict]:
        """Devuelve alertas candidatas: list[dict] con tipo_alerta/nivel/descripcion."""
        umbral = float(config.get(UMBRAL_CONFIANZA, _DEFAULT_CONFIG[UMBRAL_CONFIANZA]))
        minimo = int(config.get(ANIMALES_MINIMOS, _DEFAULT_CONFIG[ANIMALES_MINIMOS]))
        ventana = int(config.get(VENTANA_INACTIVIDAD, _DEFAULT_CONFIG[VENTANA_INACTIVIDAD]))
        frames_aisl = int(config.get(FRAMES_AISLAMIENTO, _DEFAULT_CONFIG[FRAMES_AISLAMIENTO]))

        alertas: list[dict] = []
        fuente = evento.fuente
        n = max(1, len(evento.animales_detectados))
        confianza_media = sum(a.confianza for a in evento.animales_detectados) / n

        if evento.conteo_total == 1 and evento.animales_detectados:
            solo = evento.animales_detectados[0]
            if solo.confianza >= umbral:
                self._frames_solo[fuente] += 1
                if self._frames_solo[fuente] >= frames_aisl:
                    alertas.append(
                        {
                            "tipo_alerta": "posible_aislamiento",
                            "nivel": "media",
                            "descripcion": (
                                f"Animal detectado solo durante {self._frames_solo[fuente]} "
                                f"frames con confianza {solo.confianza:.2f}"
                            ),
                        }
                    )
            else:
                self._frames_solo[fuente] = 0
        else:
            self._frames_solo[fuente] = 0

        if evento.conteo_total < minimo:
            alertas.append(
                {
                    "tipo_alerta": "conteo_bajo",
                    "nivel": "alta",
                    "descripcion": (
                        f"Conteo ({evento.conteo_total}) por debajo del mínimo "
                        f"del hato ({minimo})"
                    ),
                }
            )

        ultimo = self._ultimo_evento.get(fuente)
        if ultimo is not None:
            gap_min = (evento.timestamp - ultimo).total_seconds() / 60
            if gap_min > ventana:
                alertas.append(
                    {
                        "tipo_alerta": "sin_actividad",
                        "nivel": "alta",
                        "descripcion": (
                            f"Sin detecciones durante {gap_min:.0f} minutos "
                            f"(ventana configurada: {ventana} min)"
                        ),
                    }
                )
        self._ultimo_evento[fuente] = evento.timestamp

        self._confianza_reciente[fuente].append(confianza_media)
        if len(self._confianza_reciente[fuente]) == 10:
            promedio = sum(self._confianza_reciente[fuente]) / 10
            if promedio < 0.5:
                alertas.append(
                    {
                        "tipo_alerta": "calidad_video_baja",
                        "nivel": "baja",
                        "descripcion": (
                            f"Confianza promedio {promedio:.2f} por debajo del 50% "
                            f"en los últimos 10 eventos"
                        ),
                    }
                )

        return alertas
