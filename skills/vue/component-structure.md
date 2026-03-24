# Skill: Componente Vue 3 con Estados
# Stack: Vue 3 / TypeScript / Tailwind CSS
# Agente: Frontend
# Leer antes de: crear cualquier componente nuevo

---

## Estructura base obligatoria

Todo componente tiene exactamente 3 estados visuales:
- **Cargando** → mientras espera datos del backend
- **Vacío** → cuando no hay datos que mostrar
- **Error** → cuando el backend falla o hay un problema
- **Éxito** → el estado principal con los datos

```
components/
└── {Modulo}/
    └── {Nombre}Card.vue       → componente de display
    └── {Nombre}Form.vue       → componente de formulario
    └── {Nombre}List.vue       → componente de lista

views/
└── {Modulo}/
    └── {Nombre}View.vue       → vista que orquesta componentes
```

---

## Componente de lista — template de referencia

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAlumnoStore } from '@/stores/alumnoStore'
import type { AlumnoResponseDto } from '@/types/alumno'

// Props tipadas siempre
interface Props {
  grupoId: number
  soloActivos?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  soloActivos: true
})

// Emits tipados siempre
const emit = defineEmits<{
  seleccionar: [alumno: AlumnoResponseDto]
  error: [mensaje: string]
}>()

const store = useAlumnoStore()

// Estado local del componente
const cargando = ref(false)
const error    = ref<string | null>(null)

onMounted(async () => {
  await cargarDatos()
})

async function cargarDatos() {
  cargando.value = true
  error.value    = null

  try {
    await store.cargarPorGrupo(props.grupoId, props.soloActivos)
  } catch (e) {
    error.value = 'No se pudo cargar la lista de alumnos. Intenta de nuevo.'
    emit('error', error.value)
  } finally {
    cargando.value = false
  }
}

function seleccionar(alumno: AlumnoResponseDto) {
  emit('seleccionar', alumno)
}
</script>

<template>
  <div class="w-full">

    <!-- Estado: Cargando -->
    <div v-if="cargando" class="flex justify-center items-center py-12">
      <span class="text-gray-500 text-sm">Cargando alumnos...</span>
    </div>

    <!-- Estado: Error -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm"
    >
      {{ error }}
      <button
        class="ml-2 underline text-red-600 hover:text-red-800"
        @click="cargarDatos"
      >
        Reintentar
      </button>
    </div>

    <!-- Estado: Vacío -->
    <div
      v-else-if="store.alumnos.length === 0"
      class="text-center py-12 text-gray-400 text-sm"
    >
      No hay alumnos registrados en este grupo.
    </div>

    <!-- Estado: Éxito -->
    <ul v-else class="divide-y divide-gray-200">
      <li
        v-for="alumno in store.alumnos"
        :key="alumno.id"
        class="py-3 px-4 hover:bg-gray-50 cursor-pointer transition-colors"
        @click="seleccionar(alumno)"
      >
        <span class="font-medium text-gray-800">
          {{ alumno.apPaterno }} {{ alumno.nombre }}
        </span>
        <span class="text-sm text-gray-400 ml-2">{{ alumno.curp }}</span>
      </li>
    </ul>

  </div>
</template>
```

---

## Componente de formulario — template de referencia

```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAlumnoStore } from '@/stores/alumnoStore'
import type { CreateAlumnoRequestDto } from '@/types/alumno'

const emit = defineEmits<{
  guardado: []
  cancelar: []
}>()

const store    = useAlumnoStore()
const guardando = ref(false)
const error     = ref<string | null>(null)

const form = reactive<CreateAlumnoRequestDto>({
  nombre:    '',
  apPaterno: '',
  curp:      ''
})

async function guardar() {
  error.value = null

  // Validaciones mínimas en el frontend antes de llamar al backend
  if (!form.nombre.trim() || !form.apPaterno.trim()) {
    error.value = 'Nombre y apellido paterno son obligatorios.'
    return
  }

  guardando.value = true

  try {
    await store.crear(form)
    emit('guardado')
  } catch (e: any) {
    // Muestra el error del backend si existe, si no uno genérico
    error.value = e?.response?.data?.message
      ?? 'No se pudo guardar. Intenta de nuevo.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="guardar">

    <!-- Error del backend -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm"
    >
      {{ error }}
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Nombre <span class="text-red-500">*</span>
      </label>
      <input
        v-model="form.nombre"
        type="text"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Nombre del alumno"
        :disabled="guardando"
      />
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <button
        type="button"
        class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        :disabled="guardando"
        @click="emit('cancelar')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg
               hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="guardando"
      >
        {{ guardando ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>

  </form>
</template>
```

---

## Reglas importantes

1. **Los 4 estados son obligatorios** — cargando, error, vacío, éxito
2. **Props y emits siempre tipados** con `defineProps<Interface>()` y `defineEmits<{}>()`
3. **`finally`** siempre presente para resetear el estado de carga
4. **Error genérico de respaldo** — nunca dejes el componente sin mensaje de error
5. **Botón de "Reintentar"** en el estado de error para listas y datos críticos
6. **`disabled` en inputs y botones** mientras se guarda — evita doble envío
7. **Validaciones básicas en el frontend** — no esperes solo al backend
8. **Clases de Tailwind directas** — sin clases custom salvo que el proyecto lo indique

---

## Checklist antes de marcar el componente como terminado

- [ ] Estado de carga implementado
- [ ] Estado de error implementado con mensaje descriptivo
- [ ] Estado vacío implementado
- [ ] Props tipadas con interface
- [ ] Emits tipados
- [ ] `finally` en todos los bloques try/catch
- [ ] Inputs deshabilitados mientras se guarda
- [ ] Prueba unitaria del componente escrita
