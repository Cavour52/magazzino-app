import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

// --- INCOLLA QUI LA TUA CONFIGURAZIONE FIREBASE ---
// La trovi in: Console Firebase > Impostazioni progetto > Le tue app > Configurazione SDK
const firebaseConfig = {
  apiKey: "AIzaSyAnshbQvqqrLRCWGRwbxGs2C3L5blEqveo",
  authDomain: "magazzino-cavour-e80e7.firebaseapp.com",
  projectId: "magazzino-cavour-e80e7",
  storageBucket: "magazzino-cavour-e80e7.firebasestorage.app",
  messagingSenderId: "1044642169870",
  appId: "1:1044642169870:web:beab6a6b464c718f80685f"
}
// ----------------------------------------------------

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

export function ensureSignedIn(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(user)
    } else {
      signInAnonymously(auth).catch((err) => {
        console.error('Errore accesso anonimo:', err)
      })
    }
  })
}
