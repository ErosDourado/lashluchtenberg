import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

export async function publishUpdate(db, updatedBy = 'admin') {
  try {
    await setDoc(
      doc(db, 'config', 'app'),
      {
        lastUpdated: Date.now().toString(),
        updatedBy,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
    console.log('[publishUpdate] Versão atualizada com sucesso.')
  } catch (error) {
    console.error('[publishUpdate] Falha ao publicar atualização:', error)
    throw error
  }
}
