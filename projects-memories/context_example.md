# context_example.md
# Copia este archivo, renómbralo a context.md y llénalo con los datos de tu proyecto.
# Elimina los comentarios (#) y los valores de ejemplo antes de usarlo.

---

# Proyecto: {Nombre del proyecto}

## Descripción general
# Explica brevemente qué hace el sistema y para quién es.
# Ejemplo: Sistema de control escolar para nivel secundaria. Permite registrar alumnos,
# maestros, grupos, asistencias y calificaciones por parcial.

## Siglas del proyecto
# Se usan en los commits. Deben ser cortas y únicas.
# Ejemplo: ESC, SF, ECOMM, INVENT
SIGLAS: {2-5 letras en mayúsculas}

## Usuarios del sistema
# Lista los tipos de usuario y qué puede hacer cada uno.
# Ejemplo:
# - Director: acceso total
# - Maestro: captura calificaciones y asistencias de sus grupos
# - Alumno: consulta sus calificaciones

---

## Stack tecnológico

### Frontend
# Framework, lenguaje, librerías principales
# Ejemplo: Vue 3 + TypeScript + Quasar Framework + Pinia + Vue Router

### Backend
# Framework, lenguaje, ORM
# Ejemplo: .NET 8 / C# + Entity Framework Core + Clean Architecture

### Base de datos
# Motor, versión
# Ejemplo: PostgreSQL 15

### Testing
# Frameworks por capa
# Unitarias Backend:  xUnit + Moq
# Unitarias Frontend: Vitest + Vue Test Utils
# Integración:        Vitest + MSW (Mock Service Worker)
# E2E:                Playwright

### Otros
# Autenticación, servicios externos, herramientas adicionales
# Ejemplo: JWT, Cloudinary para imágenes, SendGrid para emails

---

## Repositorios

# Rutas absolutas en tu máquina
back-repo:  ~/projects/{proyecto}/back-repo/
front-repo: ~/projects/{proyecto}/front-repo/
db-repo:    ~/projects/{proyecto}/db-repo/
test-repo:  ~/projects/{proyecto}/test-repo/

---

## Estructura de carpetas

### back-repo/
# Describe las carpetas principales y su propósito.
# Ejemplo:
# src/
#   Domain/         → entidades y reglas de negocio
#   Application/    → casos de uso y servicios
#   Infrastructure/ → repositorios, EF, servicios externos
#   API/            → controllers, DTOs, middlewares
# tests/
#   unit/           → pruebas unitarias

### front-repo/
# Ejemplo:
# src/
#   components/     → componentes reutilizables
#   views/          → vistas por módulo
#   stores/         → estado global (Pinia)
#   services/       → llamadas a la API
#   router/         → definición de rutas
# tests/
#   unit/           → pruebas unitarias de componentes
#   integration/    → pruebas de integración con el backend

### db-repo/
# Ejemplo:
# migrations/       → scripts SQL versionados (001_nombre.sql)
# seeds/            → datos iniciales
# docs/             → diagramas ER

### test-repo/
# Ejemplo:
# e2e/              → pruebas E2E con Playwright
# regression/       → suite de regresión entre sprints

---

## Convenciones de código

### Nomenclatura — Base de datos
# Ejemplo: snake_case para tablas y columnas
# Ejemplo: prefijo tbl_ para tablas, idx_ para índices

### Nomenclatura — Backend
# Ejemplo: PascalCase para clases, camelCase para variables
# Ejemplo: sufijo Controller, Service, Repository, Dto

### Nomenclatura — Frontend
# Ejemplo: PascalCase para componentes, camelCase para variables
# Ejemplo: prefijo The para componentes únicos (TheHeader, TheSidebar)

---

## Reglas de negocio importantes
# Lista las reglas que los agentes deben conocer para no tomar decisiones incorrectas.
# Sé específico — estas reglas evitan errores costosos.
# Ejemplo:
# - Un alumno solo puede pertenecer a un grupo activo a la vez
# - Las calificaciones se capturan por parcial (3 parciales por ciclo escolar)
# - Una calificación mínima aprobatoria es 6.0
# - No se pueden modificar calificaciones de ciclos escolares cerrados

---

## Entidades principales
# Lista las entidades del sistema y su descripción breve.
# Los agentes usan esto para entender el dominio antes de diseñar o codificar.
# Ejemplo:
# - Alumno: persona inscrita al sistema con datos personales y académicos
# - Maestro: docente asignado a uno o más grupos y materias
# - Grupo: conjunto de alumnos de un grado y sección
# - Materia: asignatura impartida en el ciclo escolar
# - Calificacion: valor numérico de un alumno en una materia por parcial

---

## Ambientes

### Desarrollo
# URL base API: http://localhost:5000
# URL frontend:  http://localhost:3000
# BD:            postgresql://localhost:5432/{nombre_bd_dev}

### Staging (si aplica)
# URL base API: https://staging.{proyecto}.com/api
# URL frontend:  https://staging.{proyecto}.com

---

## Notas adicionales
# Cualquier cosa relevante que los agentes deban saber y no encaje en las secciones anteriores.
# Ejemplo: el proyecto tiene un módulo legacy en PHP que no se toca, o hay una decisión
# arquitectónica tomada previamente que no debe cambiarse.
