<template>
  <div class="spot-image-manager animate-fade-in">
    <div class="form-card">
      <div class="card-header">
        <icon-mdi-image-multiple-outline class="card-header-icon" />
        <div class="header-text-group">
          <span class="card-header-title">Galería de Imágenes</span>
          <span class="header-hint">Máximo 3 imágenes. Primera foto será la de portada.</span>
        </div>
      </div>

      <!-- URL / Public ID Input Area -->
      <div v-if="images.length < 3" class="add-image-bar">
        <div class="input-wrapper">
          <input v-model="newUrl" type="text" placeholder="Pega URL o ID Público de Cloudinary..." class="url-input"
            @keyup.enter="addImage" />
          <icon-mdi-link-variant class="input-icon" />
        </div>
        <button type="button" @click="addImage" class="btn-add-image" :disabled="!newUrl">
          <icon-mdi-plus class="btn-icon" />
          <span>Añadir</span>
        </button>
      </div>

      <div v-else class="limit-reached-banner">
        <icon-mdi-information class="banner-icon" />
        <span>Has alcanzado el límite de 3 imágenes para este spot.</span>
      </div>

      <!-- Image Grid -->
      <div class="image-upload-grid">
        <!-- Image Previews -->
        <div v-for="(img, idx) in images" :key="img" class="image-preview-wrapper">
          <img :src="img" class="image-preview" alt="Preview" />

          <!-- Portada Tag on First Image -->
          <div v-if="idx === 0" class="cover-badge">
            <icon-mdi-star class="cover-icon" />
            <span>Portada</span>
          </div>

          <button type="button" @click="removeImage(idx)" class="btn-remove-image" title="Eliminar imagen"
            aria-label="Remove image">
            <icon-mdi-close />
          </button>
        </div>

        <!-- Empty Slots -->
        <div v-for="i in (3 - images.length)" :key="'empty-' + i" class="empty-slot">
          <div class="empty-content">
            <icon-mdi-camera-plus-outline class="empty-icon" />
            <span class="empty-subtext">Foto {{ images.length + i }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  images: { type: Array, required: true }
})

const emit = defineEmits(['update:images'])

const newUrl = ref('')

const addImage = () => {
  if (!newUrl.value) return

  let finalUrl = newUrl.value.trim()

  // If it's not a full URL, assume it's a Cloudinary Public ID
  if (!finalUrl.startsWith('http')) {
    const cloudName = 'dbhkxf4cm'
    finalUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${finalUrl}`
  }

  const newImages = [...props.images, finalUrl]
  emit('update:images', newImages)
  newUrl.value = ''
}

const removeImage = (index) => {
  const newImages = [...props.images]
  newImages.splice(index, 1)
  emit('update:images', newImages)
}
</script>

<style scoped>
.spot-image-manager {
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
  gap: 0.6rem;
  border-bottom: 1.5px solid var(--clr-border);
  padding-bottom: 0.6rem;
}

.card-header-icon {
  font-size: 1.3rem;
  color: var(--clr-primary);
}

.header-text-group {
  display: flex;
  flex-direction: column;
}

.card-header-title {
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--clr-text);
  letter-spacing: 0.5px;
}

.header-hint {
  font-size: 0.68rem;
  color: var(--clr-text-muted);
  font-weight: 500;
}

/* Add Image Bar */
.add-image-bar {
  display: flex;
  gap: 0.5rem;
}

.input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.url-input {
  width: 100%;
  padding: 0.8rem 1rem 0.8rem 2.3rem;
  border-radius: 12px;
  border: 1.5px solid var(--clr-input-border);
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--clr-input-bg);
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.url-input:focus {
  outline: none;
  border-color: var(--clr-primary);
  background: var(--clr-input-bg-focus);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--clr-primary), transparent 90%);
}

.input-icon {
  position: absolute;
  left: 10px;
  font-size: 1.1rem;
  color: var(--clr-grey);
}

.url-input:focus+.input-icon {
  color: var(--clr-primary);
}

.btn-add-image {
  background: linear-gradient(135deg, var(--clr-sunspot-400) 0%, var(--clr-primary) 100%);
  color: var(--clr-on-brand);
  border: none;
  padding: 0 1.25rem;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(224, 120, 32, 0.2);
  transition: all 0.2s ease;
}

.btn-add-image:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(224, 120, 32, 0.3);
}

.btn-add-image:active {
  transform: scale(0.96);
}

.btn-add-image:disabled {
  opacity: 0.5;
  filter: grayscale(1);
  cursor: not-allowed;
  box-shadow: none;
}

.btn-icon {
  font-size: 1.1rem;
}

/* Limit Banner */
.limit-reached-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--clr-primary-soft);
  color: var(--clr-primary);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(224, 120, 32, 0.15);
}

.banner-icon {
  font-size: 1rem;
}

/* Grid & Slots */
.image-upload-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.image-preview-wrapper {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--clr-border);
  box-shadow: var(--shadow-sm);
  background: var(--clr-neutral-soft);
  cursor: default;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.image-preview-wrapper:hover .image-preview {
  transform: scale(1.06);
}

.cover-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  background: rgba(224, 120, 32, 0.9);
  color: var(--clr-on-brand);
  padding: 3px 6px;
  border-radius: 6px;
  font-size: 0.58rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.cover-icon {
  font-size: 0.7rem;
}

.btn-remove-image {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--clr-on-brand);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.btn-remove-image:hover {
  background: var(--clr-danger);
  border-color: var(--clr-danger);
  transform: scale(1.1);
  box-shadow: 0 4px 10px rgba(250, 82, 82, 0.3);
}

.btn-remove-image:active {
  transform: scale(0.9);
}

.empty-slot {
  aspect-ratio: 1;
  border-radius: 12px;
  border: 2px dashed var(--clr-border);
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--clr-primary), transparent 95%);
  transition: all 0.2s ease;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.2rem;
  padding: 0.5rem;
}

.empty-icon {
  font-size: 1.4rem;
  color: var(--clr-grey);
  transition: color 0.2s;
}

.empty-slot:hover .empty-icon {
  color: var(--clr-primary);
}

.empty-subtext {
  font-size: 0.55rem;
  color: var(--clr-grey);
  font-weight: 600;
}
</style>
