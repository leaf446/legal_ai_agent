#!/usr/bin/env bash
# CHAGOK 로컬 백엔드 실행 (API 키 불필요 — UI 탐색용)
# SQLite를 사용하고, AWS/OpenAI에는 더미 값을 설정합니다.
# AI 기능(증거 분석, 초안 생성)은 실제 키를 환경변수로 설정해야 동작합니다.
#
# 사용법: 프로젝트 루트에서  bash scripts/run-local-backend.sh

set -e
cd "$(dirname "$0")/../backend"

export DATABASE_URL="sqlite:///./leh_local.db"
export APP_ENV="local"
export APP_DEBUG="false"
export BACKEND_CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
export COOKIE_SECURE="false"
export COOKIE_SAMESITE="lax"
export LOG_FORMAT="text"

# 미설정 시에만 더미 값 주입 (실제 키가 있으면 그대로 사용)
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-local-dummy}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-local-dummy}"
export AWS_REGION="${AWS_REGION:-ap-northeast-2}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-sk-local-dummy}"

if [ -f ".venv/bin/python" ]; then
    .venv/bin/python -m uvicorn app.main:app --reload --port 8000
else
    python -m uvicorn app.main:app --reload --port 8000
fi
