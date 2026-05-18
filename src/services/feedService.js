// ─────────────────────────────────────────────────────────────────
//  feedService.js — CRUD da coleção `feed_posts`
//
//  Documento `feed_posts/{id}`:
//    {
//      imageUrl:    string,
//      title:       string,
//      procedure:   string,    // nome do procedimento (livre)
//      description: string,
//      serviceId:   string,    // referência opcional pra serviço
//      createdAt:   Timestamp,
//      updatedAt:   Timestamp,
//    }
// ─────────────────────────────────────────────────────────────────

import {
  collection, doc,
  addDoc, getDoc, getDocs,
  updateDoc, deleteDoc,
  query, orderBy, onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { publishUpdate } from '../lib/publishUpdate'

const COLLECTION = 'feed_posts'
const colRef = db ? collection(db, COLLECTION) : null

export async function createFeedPost(data) {
  const payload = {
    imageUrl:    '',
    title:       '',
    procedure:   '',
    description: '',
    serviceId:   '',
    ...data,
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  }
  const ref = await addDoc(colRef, payload)
  publishUpdate(db).catch(() => {})
  return ref.id
}

export async function listFeedPosts() {
  const q = query(colRef, orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export function subscribeFeedPosts(onData, onError) {
  const q = query(colRef, orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    err => {
      console.error('[feedService] subscribe error:', err)
      onError?.(err)
    }
  )
}

export async function getFeedPost(id) {
  const ref = doc(db, COLLECTION, id)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateFeedPost(id, patch) {
  const ref = doc(db, COLLECTION, id)
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() })
  publishUpdate(db).catch(() => {})
}

export async function deleteFeedPost(id) {
  const ref = doc(db, COLLECTION, id)
  await deleteDoc(ref)
  publishUpdate(db).catch(() => {})
}
