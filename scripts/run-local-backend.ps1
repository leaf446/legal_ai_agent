# CHAGOK 로컬 백엔드 실행 (API 키 불필요 — UI 탐색용)
# SQLite를 사용하고, AWS/OpenAI에는 더미 값을 설정합니다.
# AI 기능(증거 분석, 초안 생성)은 실제 키를 환경변수로 설정해야 동작합니다.
#
# 사용법: 프로젝트 루트에서  .\scripts\run-local-backend.ps1

$backendDir = Join-Path $PSScriptRoot "..\backend"

$env:DATABASE_URL = "sqlite:///./leh_local.db"
$env:APP_ENV = "local"
$env:APP_DEBUG = "false"
$env:BACKEND_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"
$env:COOKIE_SECURE = "false"
$env:COOKIE_SAMESITE = "lax"
$env:LOG_FORMAT = "text"

# 미설정 시에만 더미 값 주입 (실제 키가 있으면 그대로 사용)
if (-not $env:AWS_ACCESS_KEY_ID) { $env:AWS_ACCESS_KEY_ID = "local-dummy" }
if (-not $env:AWS_SECRET_ACCESS_KEY) { $env:AWS_SECRET_ACCESS_KEY = "local-dummy" }
if (-not $env:AWS_REGION) { $env:AWS_REGION = "ap-northeast-2" }
if (-not $env:OPENAI_API_KEY) { $env:OPENAI_API_KEY = "sk-local-dummy" }

Set-Location $backendDir

$venvPython = Join-Path $backendDir ".venv\Scripts\python.exe"
if (Test-Path $venvPython) {
    & $venvPython -m uvicorn app.main:app --reload --port 8000
} else {
    python -m uvicorn app.main:app --reload --port 8000
}
