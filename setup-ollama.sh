#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
# setup-ollama.sh — Instala Ollama + modelo + configura .env
# Ejecutar con Git Bash: bash setup-ollama.sh
# ══════════════════════════════════════════════════════════════

set -e

MODEL="qwen2.5-coder:7b"
OLLAMA_EXE="$LOCALAPPDATA/Programs/Ollama/ollama.exe"
ENV_FILE=".env"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[..] $1${NC}"; }
err()  { echo -e "${RED}[ERR]${NC} $1"; exit 1; }

echo ""
echo "══════════════════════════════════════════════"
echo "  Setup Ollama — Modelo: $MODEL"
echo "══════════════════════════════════════════════"
echo ""

# ── PASO 1: Instalar Ollama ────────────────────────────────────
warn "Paso 1/4 — Verificando Ollama..."

if command -v ollama &>/dev/null || [ -f "$OLLAMA_EXE" ]; then
  log "Ollama ya está instalado, saltando instalación."
else
  warn "Ollama no encontrado. Instalando via winget..."

  if command -v winget &>/dev/null; then
    winget install Ollama.Ollama --silent --accept-package-agreements --accept-source-agreements
    log "Ollama instalado via winget."
  else
    warn "winget no disponible. Descargando instalador manualmente..."
    INSTALLER="/tmp/OllamaSetup.exe"
    curl -L "https://ollama.com/download/OllamaSetup.exe" -o "$INSTALLER"
    warn "Ejecutando instalador silencioso..."
    cmd.exe /c "$INSTALLER /S"
    log "Ollama instalado."
  fi
fi

# Agregar al PATH si no está
if ! command -v ollama &>/dev/null; then
  export PATH="$LOCALAPPDATA/Programs/Ollama:$PATH"
fi

# ── PASO 2: Iniciar servicio Ollama ───────────────────────────
warn "Paso 2/4 — Iniciando servicio Ollama..."

if ! curl -s http://localhost:11434 &>/dev/null; then
  warn "Iniciando ollama serve en background..."
  nohup ollama serve &>/tmp/ollama.log &
  sleep 3
fi

if curl -s http://localhost:11434 &>/dev/null; then
  log "Servicio Ollama activo en http://localhost:11434"
else
  err "No se pudo iniciar Ollama. Revisa /tmp/ollama.log"
fi

# ── PASO 3: Descargar modelo ──────────────────────────────────
warn "Paso 3/4 — Descargando modelo $MODEL (~4.7GB, puede tardar varios minutos)..."

ollama pull "$MODEL"
log "Modelo $MODEL descargado."

# ── PASO 4: Actualizar .env ───────────────────────────────────
warn "Paso 4/4 — Actualizando $ENV_FILE..."

if [ ! -f "$ENV_FILE" ]; then
  err "No se encontró el archivo $ENV_FILE en $(pwd)"
fi

sed -i "s|^MODEL_PO=.*|MODEL_PO=ollama:${MODEL}|"       "$ENV_FILE"
sed -i "s|^MODEL_SCRUM=.*|MODEL_SCRUM=ollama:${MODEL}|" "$ENV_FILE"
sed -i "s|^MODEL_DBA=.*|MODEL_DBA=ollama:${MODEL}|"     "$ENV_FILE"
sed -i "s|^MODEL_BACKEND=.*|MODEL_BACKEND=ollama:${MODEL}|"   "$ENV_FILE"
sed -i "s|^MODEL_FRONTEND=.*|MODEL_FRONTEND=ollama:${MODEL}|" "$ENV_FILE"
sed -i "s|^MODEL_TESTER=.*|MODEL_TESTER=ollama:${MODEL}|"     "$ENV_FILE"
sed -i "s|^MODEL_DOCS=.*|MODEL_DOCS=ollama:${MODEL}|"         "$ENV_FILE"

log ".env actualizado — todos los agentes usan ollama:${MODEL}"

# ── VERIFICACIÓN FINAL ────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
echo "  Verificación final"
echo "══════════════════════════════════════════════"

warn "Probando modelo con una pregunta rápida..."
RESPONSE=$(ollama run "$MODEL" "responde solo la palabra: ok" 2>/dev/null || echo "")

if echo "$RESPONSE" | grep -qi "ok"; then
  log "Modelo responde correctamente."
else
  warn "El modelo respondió algo inesperado (puede ser normal): '$RESPONSE'"
fi

echo ""
echo "══════════════════════════════════════════════"
echo -e "${GREEN}  Setup completado!${NC}"
echo ""
echo "  Modelo activo : $MODEL"
echo "  Endpoint      : http://localhost:11434"
echo ""
echo "  Próximo paso:"
echo "  npx ts-node orchestrator/orchestrator.ts saasfinancial \"Dame el estado actual\""
echo "══════════════════════════════════════════════"
echo ""
