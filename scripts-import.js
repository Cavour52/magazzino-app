// Script di importazione: carica i tuoi 43 prodotti già censiti su Firestore.
// Si esegue UNA SOLA VOLTA dopo aver collegato l'app a Firebase, per non reinserirli a mano.
//
// COME USARLO:
// 1. Assicurati di aver già incollato la configurazione in src/firebase.js
// 2. Apri l'app nel browser (npm run dev) almeno una volta, cosi' l'accesso anonimo viene creato
// 3. Esegui: node scripts-import.js
//    (richiede "npm install firebase" già fatto in precedenza dal progetto)

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

// Incolla qui la STESSA configurazione che hai messo in src/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyAnshbQvqqrLRCWGRwbxGs2C3L5blEqveo",
  authDomain: "magazzino-cavour-e80e7.firebaseapp.com",
  projectId: "magazzino-cavour-e80e7",
  storageBucket: "magazzino-cavour-e80e7.firebasestorage.app",
  messagingSenderId: "1044642169870",
  appId: "1:1044642169870:web:beab6a6b464c718f80685f"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

const products = [
  { name: "Tovaglioli Marroni", qty: 5, threshold: 2, unit: "pz" },
  { name: "Tovaglioli neri piccoli", qty: 0, threshold: 2, unit: "pz" },
  { name: "Tovagliette pranzo", qty: 1, threshold: 2, unit: "pz" },
  { name: "Alpha pavimenti", qty: 0, threshold: 2, unit: "pz" },
  { name: "Sacchi neri", qty: 1, threshold: 2, unit: "pz" },
  { name: "Sacchi bio 90 x 120", qty: 1, threshold: 2, unit: "pz" },
  { name: "Sacchi bio 70 x 110", qty: 1, threshold: 2, unit: "pz" },
  { name: "Salviette mani", qty: 0, threshold: 2, unit: "pz" },
  { name: "Bobine carta x 2", qty: 1, threshold: 2, unit: "pz" },
  { name: "Carta igienica", qty: 4, threshold: 2, unit: "pz" },
  { name: "Pellicola ct", qty: 3, threshold: 2, unit: "pz" },
  { name: "Carta forno", qty: 0, threshold: 2, unit: "pz" },
  { name: "Mocio pavimenti", qty: 0, threshold: 2, unit: "pz" },
  { name: "Guanti L e M", qty: 0, threshold: 2, unit: "pz" },
  { name: "Sacchetti sottovuoto 20x30", qty: 1000, threshold: 2, unit: "pz" },
  { name: "Sacchetti sottovuoto 40x30", qty: 0, threshold: 2, unit: "pz" },
  { name: "Olio di servizio piccolo", qty: 0, threshold: 2, unit: "pz" },
  { name: "Sacchetti con logo", qty: 2, threshold: 2, unit: "pz" },
  { name: "Sacchetti 1 bt", qty: 1, threshold: 2, unit: "pz" },
  { name: "Sacchetti 2 bt", qty: 2, threshold: 2, unit: "pz" },
  { name: "Vassoi asporto", qty: 0, threshold: 2, unit: "pz" },
  { name: "Scatola 1bt finestra", qty: 1, threshold: 2, unit: "pz" },
  { name: "Scatola 2 bt con finestra", qty: 1, threshold: 2, unit: "pz" },
  { name: "Sacchetti take away grandi", qty: 1, threshold: 2, unit: "pz" },
  { name: "Bicchieri acqua ct da 12", qty: 8, threshold: 2, unit: "pz" },
  { name: "Bicchieri americano", qty: 0, threshold: 2, unit: "pz" },
  { name: "Mini coppette", qty: 0, threshold: 2, unit: "pz" },
  { name: "Coppette olive pz", qty: 12, threshold: 2, unit: "pz" },
  { name: "Piatti neri cm 22", qty: 24, threshold: 2, unit: "pz" },
  { name: "Piatto nero cm 25", qty: 0, threshold: 2, unit: "pz" },
  { name: "Tegamino quadrato", qty: 0, threshold: 2, unit: "pz" },
  { name: "Insalatiere grandi", qty: 6, threshold: 2, unit: "pz" },
  { name: "Insalatiere piccole", qty: 10, threshold: 2, unit: "pz" },
  { name: "Olio cucina", qty: 7, threshold: 2, unit: "ct" },
  { name: "Taralli 1kg", qty: 8, threshold: 2, unit: "ct" },
  { name: "Coppette grandi pz", qty: 0, threshold: 2, unit: "pz" },
  { name: "Piatto pane piccolo nero", qty: 24, threshold: 2, unit: "pz" },
  { name: "Zucchero bianco", qty: 0, threshold: 2, unit: "pz" },
  { name: "Zucchero canna", qty: 0, threshold: 2, unit: "pz" },
  { name: "Sottobicchieri", qty: 0, threshold: 2, unit: "pz" },
  { name: "Bicchieri rum", qty: 0, threshold: 2, unit: "pz" },
  { name: "Bicchieri alti roma", qty: 0, threshold: 2, unit: "pz" },
  { name: "Bicchieri coppa martini", qty: 0, threshold: 2, unit: "pz" },
]

async function run() {
  await signInAnonymously(auth)
  console.log(`Importo ${products.length} prodotti…`)
  for (const p of products) {
    await addDoc(collection(db, 'prodotti'), { ...p, createdAt: new Date() })
    console.log(`  + ${p.name}`)
  }
  console.log('Importazione completata.')
  process.exit(0)
}

run().catch(err => {
  console.error('Errore importazione:', err)
  process.exit(1)
})
