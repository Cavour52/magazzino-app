# Guida: pubblicare l'app Magazzino online (senza esperienza tecnica)

Questa guida ti porta dal codice che hai scaricato fino ad avere un'icona
funzionante sul telefono tuo e dei tuoi due colleghi. Richiede circa
30-40 minuti la prima volta. Non serve scrivere codice: solo copiare
e incollare alcuni valori.

Ti servono due account gratuiti: **Firebase** (il database condiviso)
e **Vercel** (lo spazio dove "vive" l'app online). Entrambi gratuiti per
questo uso.

---

## Parte 1 — Creare il database condiviso (Firebase)

1. Vai su https://console.firebase.google.com e accedi con un account Google.
2. Clicca **"Aggiungi progetto"**. Dagli un nome, es. "magazzino-attivita".
   Puoi disattivare Google Analytics quando richiesto (non serve).
3. Una volta creato il progetto, nel menu a sinistra vai su **Build > Firestore Database**.
4. Clicca **"Crea database"**. Scegli **"Avvia in modalità di produzione"**
   e una località vicina a te (es. eur3, Europa).
5. Sempre nel menu a sinistra, vai su **Build > Authentication**.
6. Clicca **"Inizia"**, poi nella lista dei metodi di accesso scegli
   **"Anonimo"** e attivalo. Questo permette a te e ai colleghi di usare
   l'app senza dover creare username e password separati.
7. Vai su **Impostazioni progetto** (icona ingranaggio in alto a sinistra).
8. Scorri fino a **"Le tue app"** e clicca sull'icona **`</>`** (Web).
9. Dai un nickname all'app (es. "magazzino-web") e clicca **"Registra app"**.
10. Ti apparirà un blocco di codice chiamato `firebaseConfig` con dei valori
    tipo `apiKey`, `projectId`, ecc. **Copia tutto quel blocco.**

### Incolla la configurazione nel progetto

11. Apri il file `src/firebase.js` che trovi nel progetto scaricato.
12. Sostituisci il blocco `firebaseConfig` che trovi lì con quello appena copiato da Firebase.
13. Apri anche il file `scripts-import.js` e fai la stessa identica sostituzione
    (serve per caricare i tuoi 43 prodotti già pronti).

### Applica le regole di sicurezza

14. Torna su Firebase, vai su **Firestore Database > Regole** (tab in alto).
15. Cancella il contenuto e incolla quello del file `firestore.rules`
    incluso nel progetto.
16. Clicca **"Pubblica"**.

---

## Parte 2 — Caricare i tuoi prodotti già pronti

Questo passaggio ti evita di reinserire a mano i 43 prodotti.

1. Apri un terminale nella cartella del progetto (su Windows: tasto destro
   nella cartella > "Apri nel terminale"; su Mac: app Terminale, poi `cd`
   nella cartella).
2. Scrivi: `npm install` e premi Invio (scarica i pezzi necessari, richiede
   qualche minuto, va fatto solo la prima volta).
3. Scrivi: `npm run dev` e premi Invio. Si aprirà un indirizzo tipo
   `http://localhost:5173` — aprilo nel browser una volta, così l'app
   si collega a Firebase. Poi torna al terminale e premi `Ctrl+C` per fermarlo.
4. Scrivi: `node scripts-import.js` e premi Invio. Vedrai scorrere i nomi
   dei prodotti man mano che vengono caricati nel database condiviso.

Da Firebase (Firestore Database > Dati) potrai vedere i 43 prodotti già lì.

---

## Parte 3 — Pubblicare l'app online (Vercel)

1. Vai su https://vercel.com e crea un account gratuito (puoi usare
   lo stesso account Google).
2. Crea un account anche su https://github.com se non ne hai già uno
   (serve per caricare il codice).
3. Su GitHub, crea un nuovo repository (pulsante verde "New"), dagli
   un nome es. "magazzino-app", e segui le istruzioni per caricare
   la cartella del progetto (oppure trascina i file dalla pagina web
   di GitHub, opzione "uploading an existing file").
4. Torna su Vercel, clicca **"Add New… > Project"**, e seleziona il
   repository "magazzino-app" appena creato su GitHub.
5. Vercel riconoscerà automaticamente che è un progetto Vite/React.
   Clicca **"Deploy"** e attendi 1-2 minuti.
6. Al termine, Vercel ti darà un indirizzo tipo
   `https://magazzino-app-tuonome.vercel.app` — è il tuo magazzino online,
   raggiungibile sempre, da chiunque abbia il link.

---

## Parte 4 — Mettere l'icona sul telefono (per te e i 2 colleghi)

Ognuno dei tre, dal proprio smartphone:

**Su iPhone (Safari):**
1. Apri il link dell'app in Safari.
2. Tocca il pulsante di condivisione (il quadrato con la freccia verso l'alto).
3. Scorri e tocca **"Aggiungi a Home"**.
4. Conferma: comparirà un'icona vera sulla schermata principale.

**Su Android (Chrome):**
1. Apri il link dell'app in Chrome.
2. Tocca i tre puntini in alto a destra.
3. Tocca **"Aggiungi a schermata Home"** (o "Installa app").
4. Conferma.

Da quel momento, toccando l'icona, l'app si apre a schermo intero come
una vera app, con i dati sempre sincronizzati fra tutti e tre in tempo reale:
se uno scarica un prodotto, gli altri due lo vedono aggiornarsi all'istante.

---

## Limite di questa versione

Gli avvisi (banner di "prodotto in esaurimento") si vedono **quando apri
l'app**, non come notifica push quando l'app è chiusa. Se in futuro vuoi
anche le notifiche push vere, fammelo sapere: è un secondo passaggio,
tecnicamente più complesso, da aggiungere sopra questa base già funzionante.

## Se qualcosa non funziona

- "Connessione al database non riuscita" nell'app → ricontrolla di aver
  incollato bene i valori di `firebaseConfig` in `src/firebase.js`, e di
  aver attivato l'accesso "Anonimo" in Authentication.
- Il deploy su Vercel fallisce → controlla di aver caricato su GitHub
  tutta la cartella, incluso il file `package.json`.
