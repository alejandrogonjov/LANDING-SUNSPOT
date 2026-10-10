import { ref } from 'vue'
import { db } from '@/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { downloadJson } from '@/utils/download'

/**
 * Admin-only export of every stored onboarding questionnaire, keyed by email.
 *
 * A one-shot `getDocs` rather than a listener: this is a snapshot the admin
 * asked for at a moment in time, not live state, and the collection should not
 * stay subscribed after the file is saved.
 *
 * The export carries personal data — email, name, and the Fitzpatrick
 * phototype from question 5 — so it is deliberately admin-triggered and lands
 * only on the admin's own device.
 */
export function useOnboardingExport() {
  const isExporting = ref(false)
  const error = ref(null)
  const lastCount = ref(null)

  const exportAnswers = async () => {
    if (isExporting.value) return

    isExporting.value = true
    error.value = null

    try {
      const snapshot = await getDocs(collection(db, 'users'))

      const users = {}
      let completed = 0
      let skipped = 0
      let withoutOnboarding = 0

      snapshot.forEach((docSnap) => {
        const data = docSnap.data()
        const payload = data.onboarding

        // No status means the user has neither answered nor dismissed it —
        // counted, but there is nothing to export for them.
        if (!payload?.status) {
          withoutOnboarding++
          return
        }

        if (payload.status === 'completed') completed++
        else skipped++

        // Email is the requested key. Two accounts sharing one (different auth
        // providers) would otherwise overwrite each other silently, so a
        // collision falls back to a uid-qualified key. `uid` is recorded on
        // every row regardless, so any entry stays traceable to its document.
        const base = data.email || docSnap.id
        const key = base in users ? `${base} (${docSnap.id})` : base

        users[key] = {
          uid: docSnap.id,
          name: data.name ?? null,
          status: payload.status,
          version: payload.version ?? null,
          completed_at: payload.completed_at ?? null,
          answers: payload.answers ?? {},
        }
      })

      const stamp = new Date()

      downloadJson(
        {
          generated_at: stamp.toISOString(),
          totals: {
            users: snapshot.size,
            completed,
            skipped,
            without_onboarding: withoutOnboarding,
          },
          users,
        },
        `sunspot-onboarding-${stamp.toISOString().slice(0, 10)}.json`
      )

      lastCount.value = completed + skipped
    } catch (err) {
      console.error('Onboarding export error:', err)
      error.value = 'No se pudieron recopilar las respuestas. Inténtalo de nuevo.'
    } finally {
      isExporting.value = false
    }
  }

  return { isExporting, error, lastCount, exportAnswers }
}
