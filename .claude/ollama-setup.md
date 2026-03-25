# Ollama Setup — LLM Local Gratis

## ¿Por qué Ollama?

- ✅ Gratis (sin créditos, sin APIs)
- ✅ Privado (todo local)
- ✅ Rápido con GPU
- ✅ Modelos open source (Mistral, Llama, etc)

## Instalación

### 1. Descargar Ollama
```bash
# macOS
brew install ollama

# Linux
curl https://ollama.ai/install.sh | sh

# Windows
# Descargar desde https://ollama.ai/download
```

### 2. Iniciar servidor Ollama
```bash
ollama serve
# Espera a ver: "Listening on 127.0.0.1:11434"
# Deja corriendo en background (en tu equipo gaming)
```

### 3. Descargar modelo
```bash
# En otra terminal:
ollama pull mistral
# Descarga ~5GB (tarda unos minutos)

# Otros modelos disponibles:
ollama pull llama2           # Similar a mistral
ollama pull neural-chat      # Más pequeño
```

## Configuración en .env

### Opción A: Ollama local (mismo equipo)
```env
MODEL_PO=ollama:mistral
MODEL_SCRUM=ollama:mistral
MODEL_DBA=ollama:mistral
MODEL_BACKEND=ollama:mistral
MODEL_FRONTEND=ollama:mistral
MODEL_TESTER=ollama:mistral
MODEL_DOCS=ollama:mistral

# Opcional (si Ollama está en puerto diferente):
OLLAMA_BASE_URL=http://localhost:11434
```

### Opción B: Ollama remoto (en equipo gaming desde trabajo/personal)
```env
MODEL_PO=http://192.168.1.100:11434
MODEL_SCRUM=http://192.168.1.100:11434
MODEL_DBA=http://192.168.1.100:11434
MODEL_BACKEND=http://192.168.1.100:11434
MODEL_FRONTEND=http://192.168.1.100:11434
MODEL_TESTER=http://192.168.1.100:11434
MODEL_DOCS=http://192.168.1.100:11434
```

**Nota**: Reemplaza `192.168.1.100` con la IP local de tu equipo gaming.

## Encontrar IP del equipo gaming

### En Windows (equipo gaming):
```cmd
ipconfig
# Busca "IPv4 Address" bajo tu conexión (típicamente 192.168.x.x)
```

### En macOS/Linux (equipo gaming):
```bash
ifconfig
# O simplemente:
hostname -I
```

### En equipo trabajo/personal (verificar conexión):
```bash
ping 192.168.1.100
# Si responde, la IP es correcta
```

## Flujo recomendado

### Equipo Gaming (servidor Ollama)
```bash
# Terminal 1: Inicia Ollama una vez
ollama serve
# Mantén esto corriendo siempre

# Terminal 2: Descarga modelo una sola vez
ollama pull mistral
```

### Equipo Trabajo (cliente)
```bash
# Actualiza .env con IP gaming:
MODEL_PO=http://192.168.1.100:11434
# ... (todos los modelos)

# Usa normalmente:
npx ts-node orchestrator/orchestrator.ts saasfinancial "Dame el estado"
# Conecta automáticamente al gaming
```

### Equipo Personal (cliente)
```bash
# Igual que equipo trabajo, mismo .env con IP gaming
MODEL_PO=http://192.168.1.100:11434
```

## Modelos disponibles

| Modelo | Tamaño | Velocidad | Calidad | GPU mínima |
|--------|--------|-----------|---------|-----------|
| **mistral** | 5GB | Rápido | Muy buena | 8GB |
| **llama2** | 4GB | Rápido | Muy buena | 8GB |
| **neural-chat** | 4GB | Muy rápido | Buena | 6GB |
| **mixtral** | 26GB | Lento | Excelente | 24GB |

**Recomendación para RTX 5060 (8GB)**: Mistral o Llama2

## Descargar otro modelo

```bash
ollama pull llama2
ollama pull neural-chat
ollama list  # Ver modelos descargados
```

## Cambiar modelo en .env

```env
# Cambiar de mistral a llama2:
MODEL_PO=ollama:llama2
# O si es remoto:
MODEL_PO=http://192.168.1.100:11434
```

## Troubleshooting

### Error: "Connection refused" / "Cannot reach Ollama"
```
✓ ¿Ollama está corriendo? (ollama serve)
✓ ¿Es la IP correcta? (ping 192.168.1.100)
✓ ¿Puertos abiertos? (firewall puede bloquear 11434)
```

### Error: "Model not found: mistral"
```bash
# Descarga el modelo:
ollama pull mistral
```

### Muy lento (30+ segundos)
```
Soluciones:
✓ Asegúrate que GPU se está usando: ollama pull mistral (muestra "GPU")
✓ Usa modelo más pequeño: neural-chat
✓ En CPU es normal, espera 30-60s
```

### Ollama no inicia
```bash
# Verifica que el puerto 11434 no esté en uso:
# macOS/Linux:
lsof -i :11434

# Windows:
netstat -ano | findstr :11434

# Si lo está, mata el proceso o cambia puerto
```

## Comandos útiles

```bash
# Ver modelos descargados
ollama list

# Eliminar modelo
ollama rm mistral

# Correr modelo interactivo
ollama run mistral

# Check status
curl http://localhost:11434/api/tags
```

## Performance con tu GPU

### RTX 5060 (8GB) + Mistral
```
Esperado:
- Primera respuesta: 2-3 segundos
- Respuestas siguientes: 1-2 segundos
- Completamente usable para desarrollo
```

### RTX 3050 (3-4GB)
```
Esperado (si cabe):
- Primera respuesta: 10-20 segundos
- Respuestas siguientes: 5-10 segundos
- Usable pero lento
```

## Mantener Ollama actualizado

```bash
# Actualizar Ollama
ollama update   # macOS/Linux
# Windows: descargar nueva versión

# Los modelos auto-actualiza si necesarios
```

## Notas técnicas

- **API Ollama**: Compatible con formato OpenAI (genera compatible)
- **Tokens**: Ollama no reporta exactos, estimamos por longitud
- **Streaming**: No implementado (pero se puede agregar)
- **Temperatura**: Por defecto 0.7 (creativo, se puede cambiar)

## Próximo paso

1. Instala Ollama en tu equipo gaming
2. `ollama pull mistral`
3. `ollama serve` (deja corriendo)
4. Encuentra tu IP (192.168.x.x)
5. Actualiza .env en trabajo/personal
6. Prueba: `npx ts-node orchestrator/orchestrator.ts saasfinancial "Hola"`
