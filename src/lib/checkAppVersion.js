import { doc, getDoc, onSnapshot } from 'firebase/firestore'

const VERSION_STORAGE_KEY = 'app_config_version'
const FIRESTORE_CONFIG_PATH = { collection: 'config', document: 'app' }

export async function checkAppVersion(db, options = {}) {
  const { realtime = false, reloadDelayMs = 800 } = options
  if (typeof window === 'undefined') return

  try {
    const ref = doc(db, FIRESTORE_CONFIG_PATH.collection, FIRESTORE_CONFIG_PATH.document)

    if (realtime) {
      let isFirstSnapshot = true
      const unsubscribe = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) return
          const serverVersion = snap.data()?.lastUpdated
          if (!serverVersion) return
          if (isFirstSnapshot) {
            isFirstSnapshot = false
            localStorage.setItem(VERSION_STORAGE_KEY, serverVersion)
            return
          }
          const localVersion = localStorage.getItem(VERSION_STORAGE_KEY)
          if (serverVersion !== localVersion) {
            console.log('[AppVersion] Nova versão detectada — recarregando...')
            localStorage.setItem(VERSION_STORAGE_KEY, serverVersion)
            clearCachesAndReload(reloadDelayMs)
          }
        },
        (error) => {
          console.warn('[AppVersion] Erro no listener (não crítico):', error)
          unsubscribe()
        }
      )
      return unsubscribe
    } else {
      const snap = await getDoc(ref)
      if (!snap.exists()) return
      const serverVersion = snap.data()?.lastUpdated
      if (!serverVersion) return
      const localVersion = localStorage.getItem(VERSION_STORAGE_KEY)
      if (serverVersion !== localVersion) {
        console.log('[AppVersion] Nova versão detectada — recarregando...')
        localStorage.setItem(VERSION_STORAGE_KEY, serverVersion)
        clearCachesAndReload(reloadDelayMs)
      }
    }
  } catch (error) {
    console.warn('[AppVersion] Verificação falhou (não crítico):', error)
  }
}

async function clearCachesAndReload(delayMs) {
  try {
    // Limpa direto pela Cache API — funciona com vite-plugin-pwa (SW gerenciado pelo Workbox)
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
    // Notifica o SW se disponível (para SWs com handler CLEAR_ALL_CACHES customizado)
    navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_ALL_CACHES' })
  } catch (e) {
    console.warn('[AppVersion] Limpeza de cache falhou (não crítico):', e)
  }
  setTimeout(() => window.location.reload(), delayMs)
}
