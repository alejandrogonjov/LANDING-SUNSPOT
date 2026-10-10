import { ref, onUnmounted } from 'vue'
import { loadFirebase } from '@/firebaseLazy'

export function useSpots() {
  const spots = ref([])
  const loading = ref(true)
  const error = ref(null)

  let unsubscribe = null
  let disposed = false

  // Firebase is loaded on demand (see firebaseLazy.js), so the listener is
  // attached once it arrives rather than during setup. The refs are returned
  // immediately and fill in behind the map, which needs none of this to paint.
  loadFirebase().then(({ db, collection, onSnapshot, query, orderBy }) => {
    // The component can unmount while the chunk is still in flight; attaching
    // then would leak a listener nothing will ever unsubscribe.
    if (disposed) return

    const q = query(collection(db, 'spots'), orderBy('name', 'asc'))

    unsubscribe = onSnapshot(q, (snapshot) => {
      spots.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      loading.value = false
    }, (err) => {
      error.value = err.message
      loading.value = false
    })
  }).catch((err) => {
    error.value = err.message
    loading.value = false
  })

  // Clean up the listener when the component using it is destroyed
  onUnmounted(() => {
    disposed = true
    if (unsubscribe) unsubscribe()
  })

  return { spots, loading, error }
}