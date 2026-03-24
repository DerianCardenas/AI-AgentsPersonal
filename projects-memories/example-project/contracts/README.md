# contracts/

Acuerdos formales entre Backend y Frontend sobre cómo se comunicarán los endpoints. **Nadie empieza a codificar sin un contrato acordado.**

---

## ¿Por qué contratos?

Sin contrato:
```
Backend implementa → Frontend dice "ese campo se llama diferente"
                   → Todo el trabajo a rehacer
```

Con contrato:
```
Ambos acuerdan el formato ANTES → cada uno implementa en paralelo
                                → sin sorpresas al integrar
```

---

## Nomenclatura de archivos

```
{METHOD}_{recurso}.json
{METHOD}_{recurso}_{detalle}.json

Ejemplos:
  GET_alumnos.json
  POST_alumnos.json
  GET_alumnos_{id}.json
  PUT_alumnos_{id}.json
  DELETE_alumnos_{id}.json
  GET_alumnos_{id}_calificaciones.json
```

---

## Estructura de un contrato

```json
{
  "contract_id": "CTR-{numero}",
  "hu": "HU-{numero}",
  "status": "draft | agreed | implemented | deprecated",
  "agreed_at": "YYYY-MM-DD",
  "agreed_by": ["backend", "frontend"],

  "endpoint": {
    "method": "GET | POST | PUT | PATCH | DELETE",
    "path": "/api/{recurso}",
    "description": "Qué hace este endpoint"
  },

  "request": {
    "headers": {},
    "query_params": {},
    "body": {}
  },

  "response": {
    "success": {
      "status": 200,
      "body": {}
    },
    "errors": [
      {
        "status": 400,
        "when": "cuándo ocurre este error",
        "body": {}
      }
    ]
  },

  "notes": "Aclaraciones importantes para ambos lados",

  "frontend_mock": {
    "description": "Datos para usar mientras el backend implementa",
    "data": {}
  }
}
```

---

## Estados del contrato

| Status | Significado |
|---|---|
| `draft` | El Backend lo propuso, el Frontend aún no acepta |
| `agreed` | Ambos aceptaron — se puede empezar a codificar |
| `implemented` | Backend lo implementó y Tester lo validó |
| `deprecated` | El endpoint cambió — hay un contrato nuevo que lo reemplaza |

**El Frontend puede avanzar con `frontend_mock` desde que el contrato está en `agreed`.**
**No necesita esperar a `implemented`.**

---

## Flujo de vida de un contrato

```
1. PO define la HU con criterios de aceptación
           ↓
2. Backend propone el contrato (status: draft)
           ↓
3. Frontend revisa y acepta o pide cambios
           ↓
4. Ambos firman (status: agreed)
           ↓
5. Backend implementa usando el contrato como spec
   Frontend avanza con frontend_mock en paralelo
           ↓
6. Backend termina → Frontend reemplaza mock por llamada real
           ↓
7. Tester valida integración
           ↓
8. Contrato marcado como implemented
```

---

## Relación con tasks.json

Cada tarea de Backend y Frontend referencia su contrato:

```json
{
  "id": "T003",
  "agente": "backend",
  "descripcion": "Implementar GET /api/alumnos",
  "contrato": ["CTR-001"],
  "dependencias": ["T002"]
}
```

El Scrum Master verifica que:
- El contrato esté en `agreed` antes de asignar T003 al Backend
- El contrato esté en `agreed` antes de asignar T004 al Frontend
- El Frontend no reemplaza el mock hasta que T003 esté `completado`

---

## Reglas importantes

1. **Sin contrato `agreed` → nadie codifica** ese endpoint
2. **El Frontend puede avanzar con `frontend_mock`** desde que el contrato está `agreed`
3. **No se modifica un contrato `agreed`** sin avisar a ambos lados — si cambia, se crea uno nuevo y el anterior va a `deprecated`
4. **Los nombres de campos en el JSON del contrato son camelCase** — igual que los DTOs del backend
5. **Siempre documentar los errores posibles** — el Frontend necesita saber qué manejar
