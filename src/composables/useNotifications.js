import { ref, computed, readonly } from 'vue'
import { db } from '@/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { useUser } from '@/composables/useUser'

// ─── Module-level singleton state ────────────────────────────────────────────
const notifications = ref([])
const loading = ref(true)
let unsubscribe = null

function startListening() {
  if (unsubscribe) return

  const q = query(
    collection(db, 'notifications'),
    orderBy('createdAt', 'desc')
  )

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      notifications.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      loading.value = false
    },
    (error) => {
      console.error('[useNotifications] Snapshot error:', error)
      loading.value = false
    }
  )
}

startListening()

// Badge preference removed

// ─── Public composable ────────────────────────────────────────────────────────
export function useNotifications() {
  const { user } = useUser()

  /** The most recent notification */
  const latestNotification = computed(() => notifications.value[0] || null)

  /** How many notifications the user hasn't read yet */
  const unreadCount = computed(() => {
    if (!user.value) return 0
    return notifications.value.filter(
      (n) => !(n.readBy || []).includes(user.value.uid)
    ).length
  })

  /** True if there is at least one unread notification */
  const hasUnread = computed(() => unreadCount.value > 0)

  // showBadge and setBadgesEnabled removed

  /** Mark a single notification as read by the current user */
  async function markAsRead(notificationId) {
    if (!user.value || !notificationId) return
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        readBy: arrayUnion(user.value.uid),
      })
    } catch (error) {
      console.error('[useNotifications] markAsRead error:', error)
    }
  }

  /** Mark ALL unread notifications as read in one batch */
  async function markAllAsRead() {
    if (!user.value) return
    const unread = notifications.value.filter(
      (n) => !(n.readBy || []).includes(user.value.uid)
    )
    if (!unread.length) return
    try {
      const batch = writeBatch(db)
      unread.forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), {
          readBy: arrayUnion(user.value.uid),
        })
      })
      await batch.commit()
    } catch (error) {
      console.error('[useNotifications] markAllAsRead error:', error)
    }
  }

  /** Admin: create a new notification document */
  async function createNotification({ title, body, spotId = null }) {
    if (!user.value) throw new Error('Not authenticated')
    await addDoc(collection(db, 'notifications'), {
      title,
      body,
      spotId,
      createdAt: serverTimestamp(),
      createdBy: user.value.uid,
      readBy: [],
    })
  }

  return {
    notifications: readonly(notifications),
    latestNotification,
    loading: readonly(loading),
    unreadCount,
    hasUnread,
    markAsRead,
    markAllAsRead,
    createNotification,
  }
}
