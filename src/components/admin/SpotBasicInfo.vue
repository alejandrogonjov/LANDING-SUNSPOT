<template>
  <div class="spot-basic-info animate-fade-in">
    <!-- Sección 1: Información General -->
    <div class="form-card">
      <div class="card-header">
        <icon-mdi-information-outline class="card-header-icon" />
        <span class="card-header-title">Información General</span>
      </div>

      <div class="input-stack">
        <div class="input-field">
          <label class="input-label">Nombre del Sitio</label>
          <div class="input-wrapper">
            <input v-model.trim="form.name" type="text" placeholder="Ej: Jardín del Turia - Tramo XI" required
              class="modern-input" />
            <icon-mdi-tag-text-outline class="input-icon" />
          </div>
        </div>

        <div class="input-field">
          <label class="input-label">Dirección en Valencia</label>
          <div class="input-wrapper">
            <input v-model.trim="form.address" type="text" placeholder="Ej: Av. de Manuel de Falla, s/n"
              class="modern-input" />
            <icon-mdi-map-marker-outline class="input-icon" />
          </div>
        </div>

        <div class="input-field">
          <label class="input-label">Sitio Web (Opcional)</label>
          <div class="input-wrapper">
            <input v-model.trim="form.web" type="url" placeholder="Ej: https://turia.valencia.es"
              class="modern-input" />
            <icon-mdi-web class="input-icon" />
          </div>
        </div>

        <div class="input-field">
          <label class="input-label">Descripción Detallada</label>
          <div class="input-wrapper">
            <textarea v-model.trim="form.description"
              placeholder="Describe lo especial de este sunspot, accesibilidad, mejores rincones..."
              class="modern-input textarea-resize" @input="adjustTextarea" ref="descTextarea"></textarea>
            <icon-mdi-text-box-search-outline class="input-icon textarea-icon" />
          </div>
        </div>
      </div>
    </div>

    <!-- Sección 2: Categoría -->
    <div class="form-card">
      <div class="card-header">
        <icon-mdi-shape-outline class="card-header-icon" />
        <span class="card-header-title">Categoría</span>
      </div>

      <div class="card-body-stack">
        <!-- Interactive Category Grid -->
        <div class="category-select-section">
          <label class="input-label">Categoría del Sunspot</label>
          <div class="category-grid">
            <button v-for="cat in categories" :key="cat.value" type="button" class="category-btn"
              :class="{ active: form.category === cat.value }" :style="form.category === cat.value ? {
                backgroundColor: `color-mix(in srgb, ${cat.color}, transparent 90%)`,
                borderColor: cat.color,
                color: cat.color
              } : {}" @click="form.category = cat.value">
              <component :is="cat.icon" class="cat-btn-icon" />
              <span class="cat-btn-label">{{ cat.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección 3: Atributos Premium -->
    <div class="form-card">
      <div class="card-header">
        <icon-mdi-star-face class="card-header-icon" />
        <span class="card-header-title">Características del Spot</span>
      </div>

      <div class="attribute-section">
        <label class="input-label">Etiquetas y Atributos</label>
        <div class="attribute-pills">
          <label class="pill" :class="form.is_free ? 'active-free' : 'active-paid'">
            <input type="checkbox" v-model="form.is_free" />
            <icon-mdi-currency-eur-off v-if="form.is_free" />
            <icon-bxs-door-open v-else />
            <span>{{ form.is_free ? 'Acceso Gratis' : 'Establecimiento' }}</span>
          </label>

          <label class="pill" :class="{ 'active-sunrise': form.is_sunrise }">
            <input type="checkbox" v-model="form.is_sunrise" />
            <icon-mdi-weather-sunset-up />
            <span>Sunrise</span>
          </label>

          <label class="pill" :class="{ 'active-sunset': form.is_sunset }">
            <input type="checkbox" v-model="form.is_sunset" />
            <icon-mdi-weather-sunset-down />
            <span>Sunset</span>
          </label>

          <label class="pill" :class="{ 'active-shadow': form.has_shadow }">
            <input type="checkbox" v-model="form.has_shadow" />
            <icon-mdi-umbrella />
            <span>Sombra</span>
          </label>

          <label class="pill" :class="{ 'active-natural-shadow': form.has_natural_shadow }">
            <input type="checkbox" v-model="form.has_natural_shadow" />
            <icon-mdi-tree />
            <span>Sombra Natural</span>
          </label>

          <label class="pill" :class="{ 'active-quiet': form.is_quiet }">
            <input type="checkbox" v-model="form.is_quiet" />
            <icon-tabler-ear-off />
            <span>Calma acústica</span>
          </label>

          <label class="pill" :class="{ 'active-windy': form.is_windy }">
            <input type="checkbox" v-model="form.is_windy" />
            <icon-tabler-wind />
            <span>Brisa</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import IconMdiLeaf from '~icons/mdi/leaf'
import IconMdiCity from '~icons/mdi/city'
import IconMdiDumbbell from '~icons/mdi/dumbbell'
import IconMdiPalette from '~icons/mdi/palette'
import IconMdiCoffee from '~icons/mdi/coffee'

const props = defineProps({
  form: {
    type: Object,
    required: true
  }
})

const descTextarea = ref(null)

// Define categories with labels, icons and specific brand-inspired theme colors
const categories = [
  { value: 'nature', label: 'Naturaleza', icon: IconMdiLeaf, color: 'var(--cat-nature)' },
  { value: 'sport', label: 'Deporte', icon: IconMdiDumbbell, color: 'var(--cat-sport)' },
  { value: 'culture', label: 'Cultura', icon: IconMdiPalette, color: 'var(--cat-culture)' },
  { value: 'hostelry', label: 'Hostelería', icon: IconMdiCoffee, color: 'var(--cat-hostelry)' }
]

onMounted(() => {
  if (props.form.description && descTextarea.value) {
    nextTick(() => {
      adjustTextarea({ target: descTextarea.value })
    })
  }
})

const adjustTextarea = (event) => {
  const el = event.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}
</script>

<style scoped>
.spot-basic-info {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.animate-fade-in {
  animation: fadeIn 0.35s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Premium Form Card */
.form-card {
  background: var(--clr-white);
  padding: 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--clr-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.form-card:hover {
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1.5px solid var(--clr-border);
  padding-bottom: 0.6rem;
}

.card-header-icon {
  font-size: 1.2rem;
  color: var(--clr-primary);
}

.card-header-title {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--clr-text);
  letter-spacing: 0.5px;
}

/* Input Stack */
.input-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.input-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--clr-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.modern-input {
  padding: 0.85rem 1rem 0.85rem 2.5rem;
  border-radius: 12px;
  border: 1.5px solid var(--clr-input-border);
  background: var(--clr-input-bg);
  font-size: 0.95rem;
  font-weight: 600;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.modern-input:focus {
  outline: none;
  border-color: var(--clr-primary);
  background: var(--clr-input-bg-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-primary), transparent 88%);
}

.input-icon {
  position: absolute;
  left: 12px;
  font-size: 1.15rem;
  color: var(--clr-grey);
  transition: color 0.2s;
}

.modern-input:focus+.input-icon {
  color: var(--clr-primary);
}

/* Textarea Specifics */
textarea.modern-input.textarea-resize {
  min-height: 100px;
  max-height: 250px;
  resize: vertical;
  line-height: 1.4;
  font-family: inherit;
}

.textarea-icon {
  top: 14px;
}

/* Card Body Stack */
.card-body-stack {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Category Grid Selector */
.category-select-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem;
  border-radius: 12px;
  border: 1.5px solid var(--clr-input-border);
  background: var(--clr-input-bg);
  color: var(--clr-text-muted);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-align: left;
  box-sizing: border-box;
}

.category-btn:hover {
  transform: translateY(-2px);
  border-color: var(--clr-grey);
}

.category-btn:active {
  transform: scale(0.96);
}

.category-btn.active {
  font-weight: 800;
  box-shadow: var(--shadow-sm);
}

.cat-btn-icon {
  font-size: 1.2rem;
}

.cat-btn-label {
  font-size: 0.8rem;
  font-weight: 700;
}

/* Attribute Section */
.attribute-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attribute-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1rem;
  border-radius: 20px;
  background: var(--clr-neutral-soft);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--clr-text-muted);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  user-select: none;
}

.pill:hover {
  transform: translateY(-2px);
  background: var(--clr-border);
}

.pill:active {
  transform: scale(0.95);
}

.pill svg {
  font-size: 1.05rem;
}

/* Custom Semantic Active States for Pills */
.pill.active-free {
  background: color-mix(in srgb, var(--clr-free), transparent 88%);
  color: var(--clr-free);
  border-color: color-mix(in srgb, var(--clr-free), transparent 80%);
}

.pill.active-paid {
  background: color-mix(in srgb, var(--clr-warn), transparent 88%);
  color: var(--clr-warn);
  border-color: color-mix(in srgb, var(--clr-warn), transparent 80%);
}

.pill.active-sunrise {
  background: color-mix(in srgb, var(--clr-sunrise), transparent 88%);
  color: var(--clr-sunrise);
  border-color: color-mix(in srgb, var(--clr-sunrise), transparent 80%);
}

.pill.active-sunset {
  background: color-mix(in srgb, var(--clr-sunset), transparent 88%);
  color: var(--clr-sunset);
  border-color: color-mix(in srgb, var(--clr-sunset), transparent 80%);
}

.pill.active-shadow {
  background: color-mix(in srgb, var(--clr-shadow), transparent 88%);
  color: var(--clr-shadow);
  border-color: color-mix(in srgb, var(--clr-shadow), transparent 80%);
}

.pill.active-natural-shadow {
  background: color-mix(in srgb, var(--clr-natural-shadow), transparent 88%);
  color: var(--clr-natural-shadow);
  border-color: color-mix(in srgb, var(--clr-natural-shadow), transparent 80%);
}

.pill.active-quiet {
  background: color-mix(in srgb, var(--clr-quiet), transparent 85%);
  color: var(--clr-quiet);
  border-color: color-mix(in srgb, var(--clr-quiet), transparent 80%);
  box-shadow: 0 2px 8px rgba(100, 116, 139, 0.1);
}

.pill.active-windy {
  background: color-mix(in srgb, var(--clr-windy), transparent 85%);
  color: var(--clr-windy);
  border-color: color-mix(in srgb, var(--clr-windy), transparent 80%);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
}

.pill input {
  display: none;
}
</style>
