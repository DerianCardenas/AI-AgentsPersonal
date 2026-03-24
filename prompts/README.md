# prompts/

Plantillas de instrucciones reutilizables para los agentes.

## ¿Qué va aquí?

Un prompt entra a esta carpeta cuando se cumple esto:
- Se usó en un proyecto real y funcionó bien
- Se repetirá en otros proyectos
- Tiene variables (`{{ESTO}}`) para adaptarse a cada contexto

Si una instrucción es específica de un proyecto → va en el `context.md` de ese proyecto, no aquí.

---

## Estructura

```
prompts/
├── dba/
├── backend/
├── frontend/
├── tester/
├── scrum/
├── po/
└── docs/
```

---

## Formato de un prompt

Cada archivo `.md` sigue esta estructura:

```markdown
# Prompt: {nombre descriptivo}
# Agente: {dba | backend | frontend | tester | scrum | po | docs}
# Cuándo usarlo: {situación en la que aplica}

---

{instrucción con variables entre dobles llaves}

Contexto disponible:
- Stack: {{STACK}}
- Entidad o recurso: {{ENTIDAD}}
- Información adicional: {{INFO_EXTRA}}
```

---

## Cómo añadir un prompt nuevo

1. Usas al agente en un proyecto real
2. La tarea salió bien — el resultado fue exactamente lo que necesitabas
3. Copias la instrucción que usaste
4. Reemplazas los datos específicos del proyecto con variables `{{NOMBRE_VARIABLE}}`
5. La guardas en la carpeta del agente correspondiente

**Los mejores prompts no se diseñan desde cero — emergen del uso real.**

---

## Ejemplo

```markdown
# Prompt: Crear CRUD completo
# Agente: backend
# Cuándo usarlo: cuando necesitas el CRUD básico de una entidad nueva

---

Crea el CRUD completo para la entidad {{ENTIDAD}}.

Usa el siguiente esquema de base de datos:
{{ESQUEMA_SQL}}

Requisitos:
- Validación de todos los inputs
- Manejo de errores con códigos HTTP correctos
- Documentación Swagger en cada endpoint
- Pruebas unitarias para cada método del servicio
- Sigue los patrones existentes en el proyecto

Entrega:
- Controller con las rutas
- Service con la lógica
- DTOs de request y response
- Archivo de pruebas unitarias
- Lista exacta de archivos creados
```

---

## Estado actual

> Esta carpeta está vacía intencionalmente.
> Los prompts se añadirán conforme se usen los agentes en proyectos reales.
