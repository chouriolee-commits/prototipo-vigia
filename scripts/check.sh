#!/usr/bin/env bash
# Check rápido de "no rompí nada": backend + frontend.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> [backend] pytest"
backend/.venv/bin/pytest backend/tests -q

echo "==> [frontend] tsc --noEmit"
npx tsc --noEmit

echo "==> [frontend] eslint"
npm run lint

echo "==> OK: todo verde"