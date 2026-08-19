#!/usr/bin/env bash
# Levanta todo VIGÍA en un solo comando: backend + frontend (+ IA y visión opcionales).
# Uso:
#   scripts/dev.sh            # solo backend + frontend
#   scripts/dev.sh --todo     # también ai-agent y pipeline de visión
#   scripts/dev.sh --stop     # apaga todo lo que inició este script
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BACKEND_PORT=8000
FRONTEND_PORT=3000
AGENT_PORT=8001
VISION_PORT=8002

PIDFILE="$ROOT/scripts/.dev.pids"

stop_all() {
  if [[ -f "$PIDFILE" ]]; then
    echo "==> Apagando servicios (pids: $(tr '\n' ' ' < "$PIDFILE"))"
    xargs -r kill < "$PIDFILE" 2>/dev/null || true
    rm -f "$PIDFILE"
  fi
  echo "==> Detenido"
}

if [[ "${1:-}" == "--stop" ]]; then
  stop_all
  exit 0
fi

# Verificar que los puertos estén libres
for port in "$BACKEND_PORT" "$FRONTEND_PORT" "$AGENT_PORT" "$VISION_PORT"; do
  if ss -tlnp 2>/dev/null | grep -q ":$port "; then
    echo "ERROR: el puerto $port ya está en uso. Usa 'scripts/dev.sh --stop' o libéralo." >&2
    exit 1
  fi
done

: > "$PIDFILE"

echo "==> [1/2] Backend FastAPI  :$BACKEND_PORT"
(
  cd backend
  if [[ ! -d .venv ]]; then
    echo "    Creando venv e instalando dependencias..."
    python -m venv .venv
    .venv/bin/pip install -q -r requirements.txt
  fi
  if [[ ! -f .env ]]; then
    echo "    Creando backend/.env desde .env.example..."
    cp .env.example .env
  fi
  nohup .venv/bin/uvicorn app.main:app --port "$BACKEND_PORT" > "$ROOT/scripts/logs/backend.log" 2>&1 &
  echo "$!" >> "$PIDFILE"
)

echo "==> [2/2] Frontend Next.js :$FRONTEND_PORT"
nohup npm run dev -- -p "$FRONTEND_PORT" > "$ROOT/scripts/logs/frontend.log" 2>&1 &
echo "$!" >> "$PIDFILE"

if [[ "${1:-}" == "--todo" ]]; then
  echo "==> [3/4] Agente IA       :$AGENT_PORT"
  (
    cd ai-agent
    if [[ ! -d .venv ]]; then
      python -m venv .venv
      .venv/bin/pip install -q -r requirements.txt
    fi
    nohup .venv/bin/uvicorn src.main:app --port "$AGENT_PORT" > "$ROOT/scripts/logs/agent.log" 2>&1 &
    echo "$!" >> "$PIDFILE"
  )

  echo "==> [4/4] Visión          :$VISION_PORT"
  (
    cd vision
    if [[ ! -d .venv ]]; then
      python -m venv .venv
      .venv/bin/pip install -q -r requirements.txt
    fi
    nohup .venv/bin/uvicorn src.main:app --port "$VISION_PORT" > "$ROOT/scripts/logs/vision.log" 2>&1 &
    echo "$!" >> "$PIDFILE"
  )
fi

echo
echo "==> Arrancando... los logs quedan en scripts/logs/"
echo "    Backend  → http://localhost:$BACKEND_PORT/health"
echo "    Frontend → http://localhost:$FRONTEND_PORT/login"
echo "    Detener:  scripts/dev.sh --stop"