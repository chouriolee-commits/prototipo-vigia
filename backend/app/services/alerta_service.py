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
        # Estado edge-triggered (alerta solo ante cambios, no por condición sostenida).
        self._aislamiento_alertado: defaultdict[str, bool] = defaultdict(bool)
        self._conteo_bajo_activo: defaultdict[str, bool] = defaultdict(bool)
        self._sin_actividad_emitida: defaultdict[str, bool] = defaultdict(bool)
        self._calidad_baja_activa: defaultdict[str, bool] = defaultdict(bool)

    def reiniciar_fuente(self, fuente: str) -> None:
        self._frames_solo.pop(fuente, None)
        self._ultimo_evento.pop(fuente, None)
        self._confianza_reciente.pop(fuente, None)
        self._aislamiento_alertado.pop(fuente, None)
        self._conteo_bajo_activo.pop(fuente, None)
        self._sin_actividad_emitida.pop(fuente, None)
        self._calidad_baja_activa.pop(fuente, None)

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
                if (
                    self._frames_solo[fuente] >= frames_aisl
                    and not self._aislamiento_alertado[fuente]
                ):
                    self._aislamiento_alertado[fuente] = True
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
                self._aislamiento_alertado[fuente] = False
        else:
            self._frames_solo[fuente] = 0
            self._aislamiento_alertado[fuente] = False

        bajo = evento.conteo_total < minimo
        if bajo and not self._conteo_bajo_activo[fuente]:
            self._conteo_bajo_activo[fuente] = True
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
        elif not bajo:
            self._conteo_bajo_activo[fuente] = False

        ultimo = self._ultimo_evento.get(fuente)
        if ultimo is not None:
            gap_min = (evento.timestamp - ultimo).total_seconds() / 60
            if gap_min > ventana and not self._sin_actividad_emitida[fuente]:
                self._sin_actividad_emitida[fuente] = True
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
            elif gap_min <= ventana:
                self._sin_actividad_emitida[fuente] = False
        self._ultimo_evento[fuente] = evento.timestamp

        self._confianza_reciente[fuente].append(confianza_media)
        if len(self._confianza_reciente[fuente]) == 10:
            promedio = sum(self._confianza_reciente[fuente]) / 10
            baja = promedio < 0.5
            if baja and not self._calidad_baja_activa[fuente]:
                self._calidad_baja_activa[fuente] = True
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
            elif not baja:
                self._calidad_baja_activa[fuente] = False

        return alertas
