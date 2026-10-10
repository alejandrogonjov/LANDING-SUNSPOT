<template>
    <AdminLayout>
        <main class="notification-manager-view">
            <!-- Header Area -->
            <div class="header-main">
                <div class="title-group">
                    <div class="title-left">
                        <p class="subtitle">Gestiona el mensaje y detalles de esta alerta</p>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="fetching" class="loading-state-container">
                <div class="spinner-solar"></div>
                <span class="loading-text">Cargando notificación...</span>
            </div>

            <div v-else class="manager-content">
                <!-- Form -->
                <form @submit.prevent="handleSubmit" class="manager-form">
                    <div class="form-card">
                        <div class="field-group">
                            <label class="field-label" for="notif-title">Título *</label>
                            <input id="notif-title" v-model="form.title" type="text" class="field-input"
                                placeholder="ej. ¡Nuevo spot en Valencia!" maxlength="80" required />
                            <span class="char-count">{{ form.title.length }}/80</span>
                        </div>

                        <div class="field-group">
                            <label class="field-label" for="notif-body">Mensaje *</label>
                            <textarea id="notif-body" v-model="form.body" class="field-input field-textarea"
                                placeholder="Cuéntales a los usuarios qué hay de especial..." rows="4" maxlength="300"
                                required />
                            <span class="char-count">{{ form.body.length }}/300</span>
                        </div>

                        <div class="field-group">
                            <label class="field-label" for="notif-spot">
                                Spot sugerido
                                <span class="field-label-optional">(opcional)</span>
                            </label>
                            <div class="select-wrapper">
                                <select id="notif-spot" v-model="form.spotId" class="field-input field-select">
                                    <option value="">— Sin spot sugerido —</option>
                                    <option v-for="spot in spots" :key="spot.id" :value="spot.id">
                                        {{ spot.name || 'Spot sin nombre' }}
                                    </option>
                                </select>
                                <icon-mdi-chevron-down class="select-chevron" />
                            </div>
                        </div>
                    </div>

                    <!-- Form Actions Footer -->
                    <div class="form-actions">
                        <button type="submit" class="btn-save" :disabled="loading || !isFormValid">
                            <div v-if="loading" class="spinner-inline"></div>
                            <span>
                                {{ loading ? 'Guardando...' : (isEditing ? 'Actualizar notificación' :
                                    'Crear notificación')
                                }}
                            </span>
                        </button>

                        <button v-if="isEditing" type="button" @click="handleDelete" class="btn-delete"
                            :disabled="loading">
                            <icon-mdi-delete-outline class="delete-icon" />
                            <span>Eliminar permanentemente</span>
                        </button>
                    </div>
                </form>
            </div>
        </main>
    </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { db } from '@/firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { useUser } from '@/composables/useUser'
import AdminLayout from '@/layouts/AdminLayout.vue'

const route = useRoute()
const router = useRouter()
const { user } = useUser()

const loading = ref(false)
const fetching = ref(true)
const spots = ref([])

const isEditing = computed(() => route.params.id && route.params.id !== 'nueva')

const form = reactive({
    title: '',
    body: '',
    spotId: ''
})

const isFormValid = computed(() => {
    return form.title.trim().length > 0 && form.body.trim().length > 0
})

const loadData = async () => {
    fetching.value = true
    try {
        // Cargar spots para el select
        const spotsQuery = query(collection(db, 'spots'), orderBy('name', 'asc'))
        const spotsSnap = await getDocs(spotsQuery)
        spots.value = spotsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

        if (isEditing.value) {
            const docSnap = await getDoc(doc(db, 'notifications', route.params.id))
            if (docSnap.exists()) {
                const data = docSnap.data()
                Object.assign(form, {
                    title: data.title || '',
                    body: data.body || '',
                    spotId: data.spotId || ''
                })
            } else {
                alert("Notificación no encontrada")
                router.push('/panel')
            }
        }
    } catch (error) {
        console.error("Error cargando datos:", error)
    } finally {
        fetching.value = false
    }
}

onMounted(() => {
    loadData()
})

const handleSubmit = async () => {
    if (!isFormValid.value) return
    loading.value = true

    try {
        const payload = {
            title: form.title.trim(),
            body: form.body.trim(),
            spotId: form.spotId || null
        }

        if (isEditing.value) {
            await updateDoc(doc(db, 'notifications', route.params.id), payload)
        } else {
            payload.createdAt = serverTimestamp()
            payload.createdBy = user.value.uid
            payload.readBy = [] // Todos la verán como no leída
            await addDoc(collection(db, 'notifications'), payload)
        }
        router.push('/panel')
    } catch (e) {
        console.error(e)
        alert("Error al guardar: " + e.message)
    } finally {
        loading.value = false
    }
}

const handleDelete = async () => {
    if (confirm('¿Borrar esta notificación de forma permanente? Esta acción no se puede deshacer.')) {
        loading.value = true
        try {
            await deleteDoc(doc(db, 'notifications', route.params.id))
            router.push('/panel')
        } catch (e) {
            console.error(e)
            alert("Error al eliminar: " + e.message)
        } finally {
            loading.value = false
        }
    }
}
</script>

<style scoped>
.notification-manager-view {
    padding: 1rem 1rem 6rem 1rem;
    background: var(--clr-background);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

/* Header Styling */
.header-main {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 0.25rem 1rem 0.25rem;
    border-bottom: 1px solid var(--clr-border);
}

.title-group {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.title-left {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.title-left h2 {
    font-size: 1.4rem;
    font-weight: 900;
    color: var(--clr-dark);
    letter-spacing: -0.2px;
}

.subtitle {
    font-size: 0.78rem;
    color: var(--clr-text-muted);
    font-weight: 500;
    margin: 0;
}

/* Loading Solar Spinner */
.loading-state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 5rem 1rem;
}

.spinner-solar {
    width: 48px;
    height: 48px;
    border: 4px solid var(--clr-primary-soft);
    border-top-color: var(--clr-primary);
    border-radius: 50%;
    animation: spin 1s cubic-bezier(0.55, 0.085, 0.68, 0.53) infinite;
}

.loading-text {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--clr-text-muted);
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Form Styles */
.manager-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.manager-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-card {
    background: var(--clr-white);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid var(--clr-border);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    position: relative;
}

.field-label {
    font-size: 0.8rem;
    font-weight: 750;
    color: var(--clr-dark);
}

.field-label-optional {
    font-weight: 500;
    color: var(--clr-text-muted);
    font-size: 0.75rem;
}

.field-input {
    width: 100%;
    padding: 0.8rem 1rem;
    background: var(--clr-background);
    border: 1.5px solid var(--clr-border);
    border-radius: 14px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--clr-dark);
    transition: border-color var(--transition), box-shadow var(--transition);
    box-sizing: border-box;
}

.field-input:focus {
    outline: none;
    border-color: var(--clr-primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--clr-primary), transparent 90%);
}

.field-textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.5;
}

.select-wrapper {
    position: relative;
}

.field-select {
    appearance: none;
    -webkit-appearance: none;
    padding-right: 2.5rem;
    cursor: pointer;
    background: var(--clr-background);
}

.select-chevron {
    position: absolute;
    right: 0.9rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--clr-text-muted);
    font-size: 1.1rem;
    pointer-events: none;
}

.char-count {
    align-self: flex-end;
    font-size: 0.7rem;
    color: var(--clr-grey);
    font-weight: 500;
    margin-top: -0.2rem;
}

/* Actions Footer styling */
.form-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
}

.btn-save {
    background: linear-gradient(135deg, var(--clr-sunspot-400) 0%, var(--clr-primary) 100%);
    color: var(--clr-white);
    border: none;
    padding: 1.05rem;
    border-radius: var(--radius-md);
    font-weight: 800;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--clr-primary), transparent 75%);
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-save:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(224, 120, 32, 0.35);
}

.btn-save:active {
    transform: translateY(0) scale(0.97);
    box-shadow: 0 4px 10px color-mix(in srgb, var(--clr-primary), transparent 85%);
}

.btn-save:disabled {
    opacity: 0.5;
    filter: grayscale(1);
    cursor: not-allowed;
    box-shadow: none;
}

.spinner-inline {
    width: 18px;
    height: 18px;
    border: 2.5px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--clr-on-brand);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

.btn-delete {
    background: none;
    border: 1.5px solid color-mix(in srgb, var(--clr-danger), transparent 75%);
    color: var(--clr-danger);
    margin-top: 0.5rem;
    font-weight: 800;
    font-size: 0.85rem;
    width: 100%;
    padding: 0.9rem;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    transition: all 0.2s ease;
}

.btn-delete:hover:not(:disabled) {
    background: var(--clr-danger-soft);
    border-color: var(--clr-danger);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--clr-danger), transparent 92%);
}

.btn-delete:active {
    transform: scale(0.98);
}

.btn-delete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.delete-icon {
    font-size: 1.1rem;
}
</style>
