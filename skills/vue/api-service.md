# Skill: Consumo de API — Service + Composable
# Stack: Vue 3 / TypeScript
# Agente: Frontend
# Leer antes de: crear cualquier llamada a la API

---

## Estructura de carpetas

```
src/
├── services/
│   └── alumnoService.ts      → llamadas HTTP puras
├── stores/
│   └── alumnoStore.ts        → estado global con Pinia
├── composables/
│   └── useAlumnos.ts         → lógica reutilizable de componente
└── types/
    └── alumno.ts             → interfaces TypeScript
```

---

## Tipos — siempre primero

```typescript
// src/types/alumno.ts

// Debe coincidir exactamente con el Response DTO del backend
export interface AlumnoResponseDto {
  id:        number
  nombre:    string
  apPaterno: string
  apMaterno: string | null
  curp:      string
}

// Debe coincidir exactamente con el Request DTO del backend
export interface CreateAlumnoRequestDto {
  nombre:    string
  apPaterno: string
  apMaterno?: string
  curp:      string
}

// Para errores del backend
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
```

---

## Service — solo HTTP, sin estado

```typescript
// src/services/alumnoService.ts
import axios from 'axios'
import type { AlumnoResponseDto, CreateAlumnoRequestDto } from '@/types/alumno'

const BASE_URL = `${import.meta.env.VITE_API_URL}/alumnos`

export const alumnoService = {

  async getById(id: number): Promise<AlumnoResponseDto> {
    const { data } = await axios.get<AlumnoResponseDto>(`${BASE_URL}/${id}`)
    return data
  },

  async getByGrupo(grupoId: number): Promise<AlumnoResponseDto[]> {
    const { data } = await axios.get<AlumnoResponseDto[]>(BASE_URL, {
      params: { grupoId }
    })
    return data
  },

  async create(dto: CreateAlumnoRequestDto): Promise<AlumnoResponseDto> {
    const { data } = await axios.post<AlumnoResponseDto>(BASE_URL, dto)
    return data
  },

  async update(id: number, dto: Partial<CreateAlumnoRequestDto>): Promise<AlumnoResponseDto> {
    const { data } = await axios.put<AlumnoResponseDto>(`${BASE_URL}/${id}`, dto)
    return data
  },

  async delete(id: number): Promise<void> {
    await axios.delete(`${BASE_URL}/${id}`)
  }
}
```

**Reglas del Service:**
- Solo llamadas HTTP — sin estado, sin lógica de negocio
- Siempre tipado el tipo de retorno
- Usa `import.meta.env.VITE_API_URL` — nunca hardcodees la URL
- Desestructura `{ data }` de la respuesta de axios

---

## Store con Pinia — estado global

```typescript
// src/stores/alumnoStore.ts
import { defineStore } from 'pinia'
import { ref }         from 'vue'
import { alumnoService } from '@/services/alumnoService'
import type { AlumnoResponseDto, CreateAlumnoRequestDto } from '@/types/alumno'

export const useAlumnoStore = defineStore('alumno', () => {

  // Estado
  const alumnos  = ref<AlumnoResponseDto[]>([])
  const actual   = ref<AlumnoResponseDto | null>(null)

  // Acciones
  async function cargarPorGrupo(grupoId: number, soloActivos = true) {
    const resultado = await alumnoService.getByGrupo(grupoId)
    alumnos.value   = soloActivos
      ? resultado.filter(a => a.activo)
      : resultado
  }

  async function cargarPorId(id: number) {
    actual.value = await alumnoService.getById(id)
  }

  async function crear(dto: CreateAlumnoRequestDto) {
    const nuevo = await alumnoService.create(dto)
    alumnos.value.push(nuevo)   // actualiza el estado local sin re-fetch
    return nuevo
  }

  async function eliminar(id: number) {
    await alumnoService.delete(id)
    alumnos.value = alumnos.value.filter(a => a.id !== id)
  }

  function limpiar() {
    alumnos.value = []
    actual.value  = null
  }

  return { alumnos, actual, cargarPorGrupo, cargarPorId, crear, eliminar, limpiar }
})
```

**Reglas del Store:**
- Usa Composition API style (`defineStore('id', () => {...})`)
- No maneja estados de carga ni error — eso es del componente
- Actualiza el estado local después de crear/eliminar — evita re-fetch innecesario
- Expone solo lo necesario en el `return`

---

## Composable — lógica reutilizable de componente

Úsalo cuando la misma lógica de carga se repite en varios componentes:

```typescript
// src/composables/useAlumnos.ts
import { ref, onMounted } from 'vue'
import { useAlumnoStore } from '@/stores/alumnoStore'

export function useAlumnos(grupoId: number) {
  const store    = useAlumnoStore()
  const cargando = ref(false)
  const error    = ref<string | null>(null)

  async function cargar() {
    cargando.value = true
    error.value    = null

    try {
      await store.cargarPorGrupo(grupoId)
    } catch {
      error.value = 'No se pudieron cargar los alumnos.'
    } finally {
      cargando.value = false
    }
  }

  onMounted(cargar)

  return {
    alumnos:  store.alumnos,   // referencia reactiva del store
    cargando,
    error,
    recargar: cargar
  }
}
```

Uso en el componente:
```vue
<script setup lang="ts">
import { useAlumnos } from '@/composables/useAlumnos'

const { alumnos, cargando, error, recargar } = useAlumnos(props.grupoId)
</script>
```

---

## Variables de entorno

```bash
# .env.development
VITE_API_URL=http://localhost:5000/api

# .env.production
VITE_API_URL=https://tu-dominio.com/api
```

Nunca hardcodees URLs en los services.

---

## Checklist antes de marcar como terminado

- [ ] Tipos definidos en `src/types/` que coinciden con los DTOs del backend
- [ ] Service con funciones puras sin estado
- [ ] URL desde variable de entorno `VITE_API_URL`
- [ ] Store con Composition API style
- [ ] Store no maneja estados de carga/error
- [ ] Composable creado si la lógica se repite en más de un componente
- [ ] Prueba de integración escrita que verifica la llamada real al backend
