import { ref } from 'vue'
import { db } from '@/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'

export function useBattery() {
  const isSaving = ref(false)
  const isLoadingLog = ref(false)

  /**
   * Saves the battery test results to the user's document
   * @param {String} userId 
   * @param {Object} data 
   */
  const saveBatteryLog = async (userId, data) => {
    if (!userId) throw new Error("No user ID provided")
    isSaving.value = true
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        circadian: {
          ...data,
          createdAt: serverTimestamp()
        },
        updated_at: serverTimestamp()
      })
      return true
    } catch (error) {
      console.error("Error saving battery log:", error)
      throw error
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Fetches the battery log from the user's document
   * @param {String} userId 
   * @returns {Object|null} The log or null
   */
  const getLatestBatteryLog = async (userId) => {
    if (!userId) throw new Error("No user ID provided")
    isLoadingLog.value = true
    try {
      const userRef = doc(db, 'users', userId)
      const docSnap = await getDoc(userRef)
      
      if (docSnap.exists() && docSnap.data().circadian) {
        return docSnap.data().circadian
      }
      return null
    } catch (error) {
      console.error("Error fetching latest battery log:", error)
      throw error
    } finally {
      isLoadingLog.value = false
    }
  }

  return {
    isSaving,
    isLoadingLog,
    saveBatteryLog,
    getLatestBatteryLog
  }
}
