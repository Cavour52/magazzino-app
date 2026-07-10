import { useState, useEffect, useMemo, useRef } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  setDoc
} from 'firebase/firestore'
import { db, auth, ensureSignedIn } from './firebase'
import ProductCard from './ProductCard'
import ProductModal from './ProductModal'
import OrderModal from './OrderModal'
import HistoryModal from './HistoryModal'

const COLLECTION = 'prodotti'
const DEFAULT_SUPPLIERS = ['RESS MULTISERVICE', 'RM MANOLO', 'METTIFOGO', 'CHIRONI']
const WAREHOUSES = ['Enoteca', 'Cavour']
const DEFAULT_WAREHOUSE = 'Enoteca'

export default function App() {
  const [ready, setReady] = useState(false)
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState(DEFAULT_SUPPLIERS)
  const [managers, setManagers] = useState([])
  const [warehouse, setWarehouse] = useState('Enoteca')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [managerFilter, setManagerFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [orderOpen, setOrderOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyProduct, setHistoryProduct] = useState(null)
  const [currentUser, setCurrentUser] = useState('')
  const [askUser, setAskUser] = useState(false)
  const [editing, setEditing] = useState(null)
  const [connError, setConnError] = useState(false)

  // Raggruppamento movimenti: accumula i +/- ravvicinati per prodotto
  const pendingMoves = useRef({})
  const moveTimers = useRef({})

  useEffect(() => {
    ensureSignedIn(() => setReady(true))
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('magazzino-utente')
      if (saved) setCurrentUser(saved)
      else setAskUser(true)
    } catch (e) {
      setAskUser(true)
    }
  }, [])

  function chooseUser(name) {
    setCurrentUser(name)
    try { localStorage.setItem('magazzino-utente', name) } catch (e) {}
    setAskUser(false)
  }

  useEffect(() => {
    if (!ready) return
    const unsub = onSnapshot(
      collection(db, COLLECTION),
      (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setConnError(false)
      },
      (err) => {
        console.error(err)
        setConnError(true)
      }
    )
    return () => unsub()
  }, [ready])

  useEffect(() => {
    if (!ready) return
    const ref = doc(db, 'config', 'fornitori')
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists() && Array.isArray(snap.data().lista)) {
        setSuppliers(snap.data().lista)
      } else {
        await setDoc(ref, { lista: DEFAULT_SUPPLIERS })
      }
    })
    return () => unsub()
  }, [ready])

  async function addSupplier(name) {
    const trimmed = name.trim()
    if (!trimmed || suppliers.includes(trimmed)) return
    const updated = [...suppliers, trimmed]
    await setDoc(doc(db, 'config', 'fornitori'), { lista: updated })
  }

  useEffect(() => {
    if (!ready) return
    const ref = doc(db, 'config', 'responsabili')
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists() && Array.isArray(snap.data().lista)) {
        setManagers(snap.data().lista)
      }
    })
    return () => unsub()
  }, [ready])

  async function addManager(name) {
    const trimmed = name.trim()
    if (!trimmed || managers.includes(trimmed)) return
    const updated = [...managers, trimmed]
    await setDoc(doc(db, 'config', 'responsabili'), { lista: updated })
  }

  const statusOf = (p) => {
    if (p.qty <= 0) return 'out'
    if (p.qty <= p.threshold) return 'low'
    return 'ok'
  }

  const warehouseOf = (p) => p.warehouse || DEFAULT_WAREHOUSE

  const inWarehouse = useMemo(() => {
    if (warehouse === 'all') return products
    return products.filter(p => warehouseOf(p) === warehouse)
  }, [products, warehouse])

  const filtered = useMemo(() => {
    let list = inWarehouse.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    if (filter !== 'all') list = list.filter(p => statusOf(p) === filter)
    if (supplierFilter !== 'all') list = list.filter(p => p.supplier === supplierFilter)
    if (managerFilter !== 'all') list = list.filter(p => p.manager === managerFilter)
    return list.sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }))
  }, [inWarehouse, query, filter, supplierFilter, managerFilter])

  const counts = useMemo(() => ({
    total: inWarehouse.length,
    low: inWarehouse.filter(p => statusOf(p) === 'low').length,
    out: inWarehouse.filter(p => statusOf(p) === 'out').length,
  }), [inWarehouse])

  async function changeQty(product, delta) {
    const newQty = Math.max(0, product.qty + delta)
    const updates = { qty: newQty, updatedAt: serverTimestamp() }
    if (delta > 0 && product.ordered) {
      updates.ordered = false
      updates.orderedDate = null
    }
    await updateDoc(doc(db, COLLECTION, product.id), updates)

    // Accumula la variazione per registrarla raggruppata dopo una breve pausa
    const realDelta = newQty - product.qty
    if (realDelta !== 0) {
      const id = product.id
      pendingMoves.current[id] = {
        delta: (pendingMoves.current[id]?.delta || 0) + realDelta,
        name: product.name,
        unit: product.unit || 'pz',
        warehouse: warehouseOf(product),
      }
      if (moveTimers.current[id]) clearTimeout(moveTimers.current[id])
      moveTimers.current[id] = setTimeout(() => flushMove(id), 2500)
    }
  }

  async function flushMove(id) {
    const move = pendingMoves.current[id]
    delete pendingMoves.current[id]
    delete moveTimers.current[id]
    if (!move || move.delta === 0) return
    try {
      await addDoc(collection(db, 'movimenti'), {
        productId: id,
        productName: move.name,
        delta: move.delta,
        unit: move.unit,
        warehouse: move.warehouse,
        user: currentUser || 'Sconosciuto',
        createdAt: serverTimestamp(),
      })
    } catch (e) {
      console.error('Errore salvataggio movimento', e)
    }
  }

  async function saveProduct(data) {
    if (editing) {
      await updateDoc(doc(db, COLLECTION, editing.id), { ...data, updatedAt: serverTimestamp() })
    } else {
      await addDoc(collection(db, COLLECTION), { ...data, createdAt: serverTimestamp() })
    }
    setModalOpen(false)
    setEditing(null)
  }

  async function removeProduct(id) {
    await deleteDoc(doc(db, COLLECTION, id))
    setModalOpen(false)
    setEditing(null)
  }

  if (!ready) {
    return (
      <div style={styles.loadingScreen}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: 18, color: 'var(--ink-soft)' }}>
          Apro il magazzino…
        </p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Scorte in tempo reale</p>
          <h1 style={styles.title}>{warehouse === 'all' ? 'Tutti i magazzini' : warehouse}</h1>
        </div>
        <div style={styles.headerBtns}>
          <button style={styles.orderBtn} onClick={() => { setHistoryProduct(null); setHistoryOpen(true) }}>
            Storico
          </button>
          <button style={styles.orderBtn} onClick={() => setOrderOpen(true)}>
            Ordina
          </button>
          <button style={styles.addBtn} onClick={() => { setEditing(null); setModalOpen(true) }}>
            + Prodotto
          </button>
        </div>
      </header>

      <div style={styles.warehouseTabs}>
        {WAREHOUSES.map(w => (
          <button
            key={w}
            style={{ ...styles.warehouseTab, ...(warehouse === w ? styles.warehouseTabActive : {}) }}
            onClick={() => setWarehouse(w)}
          >
            {w}
          </button>
        ))}
        <button
          style={{ ...styles.warehouseTab, ...(warehouse === 'all' ? styles.warehouseTabActive : {}) }}
          onClick={() => setWarehouse('all')}
        >
          Tutti i magazzini
        </button>
      </div>

      {connError && (
        <div style={styles.errorBanner}>
          Connessione al database non riuscita. Controlla la configurazione Firebase in src/firebase.js.
        </div>
      )}

      {currentUser && (
        <div style={styles.userBar}>
          Operatore: <strong>{currentUser}</strong>
          <button style={styles.changeUserBtn} onClick={() => setAskUser(true)}>Cambia</button>
        </div>
      )}

      <div style={styles.statRow}>
        <Stat label="Prodotti" value={counts.total} tone="ink" active={filter === 'all'} onClick={() => setFilter('all')} />
        <Stat label="In esaurimento" value={counts.low} tone="amber" active={filter === 'low'} onClick={() => setFilter(filter === 'low' ? 'all' : 'low')} />
        <Stat label="Esauriti" value={counts.out} tone="rust" active={filter === 'out'} onClick={() => setFilter(filter === 'out' ? 'all' : 'out')} />
      </div>

      <div style={styles.controls}>
        <input
          style={styles.search}
          placeholder="Cerca prodotto…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div style={styles.filterRow}>
        <select style={styles.selectHalf} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">Tutti</option>
          <option value="ok">Disponibili</option>
          <option value="low">In esaurimento</option>
          <option value="out">Esauriti</option>
        </select>
        <select style={styles.selectHalf} value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
          <option value="all">Tutti i fornitori</option>
          {suppliers.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select style={styles.selectHalf} value={managerFilter} onChange={e => setManagerFilter(e.target.value)}>
          <option value="all">Tutti i responsabili</option>
          {managers.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div style={styles.list}>
        {filtered.length === 0 && products.length > 0 && (
          <p style={styles.empty}>Nessun prodotto corrisponde alla ricerca.</p>
        )}
        {products.length === 0 && (
          <div style={styles.emptyState}>
            <p style={{ fontFamily: 'Fraunces, serif', fontSize: 19, margin: '0 0 6px' }}>Il magazzino è vuoto</p>
            <p style={{ color: 'var(--ink-faint)', fontSize: 14, margin: 0 }}>Aggiungi il primo prodotto per iniziare a tracciare le scorte.</p>
          </div>
        )}
        {filtered.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            status={statusOf(p)}
            showWarehouse={warehouse === 'all'}
            warehouseName={warehouseOf(p)}
            onInc={() => changeQty(p, 1)}
            onDec={() => changeQty(p, -1)}
            onEdit={() => { setEditing(p); setModalOpen(true) }}
            onHistory={() => { setHistoryProduct(p); setHistoryOpen(true) }}
          />
        ))}
      </div>

      {orderOpen && (
        <OrderModal
          products={inWarehouse}
          onClose={() => setOrderOpen(false)}
        />
      )}

      {historyOpen && (
        <HistoryModal
          product={historyProduct}
          onClose={() => { setHistoryOpen(false); setHistoryProduct(null) }}
        />
      )}

      {askUser && (
        <div style={styles.overlay}>
          <div style={styles.userModal}>
            <h3 style={{ margin: '0 0 6px', fontSize: 19, fontFamily: 'Fraunces, serif' }}>Chi sei?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--ink-faint)' }}>
              Serve a registrare chi aggiorna le scorte. Puoi cambiarlo quando vuoi.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {managers.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--ink-faint)' }}>
                  Nessun responsabile ancora inserito. Aggiungine uno da un prodotto (campo Responsabile), poi torna qui.
                </p>
              )}
              {managers.map(m => (
                <button key={m} style={styles.userChoice} onClick={() => chooseUser(m)}>{m}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <ProductModal
          initial={editing}
          suppliers={suppliers}
          managers={managers}
          warehouses={WAREHOUSES}
          defaultWarehouse={warehouse === 'all' ? DEFAULT_WAREHOUSE : warehouse}
          onAddSupplier={addSupplier}
          onAddManager={addManager}
          onSave={saveProduct}
          onDelete={editing ? () => removeProduct(editing.id) : null}
          onClose={() => { setModalOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

function Stat({ label, value, tone, active = false, onClick }) {
  const toneColors = {
    ink: { bg: 'var(--card)', fg: 'var(--ink)' },
    amber: { bg: 'var(--amber-pale)', fg: 'var(--amber)' },
    rust: { bg: 'var(--rust-pale)', fg: 'var(--rust)' },
  }
  const c = toneColors[tone]
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.statCard,
        background: c.bg,
        border: tone === 'ink' ? '1px solid var(--line)' : '1px solid transparent',
        cursor: 'pointer',
        outline: active && tone !== 'ink' ? `2px solid ${c.fg}` : 'none',
      }}
    >
      <p style={{ ...styles.statLabel, color: tone === 'ink' ? 'var(--ink-faint)' : c.fg }}>{label}</p>
      <p style={{ ...styles.statValue, color: c.fg }}>{value}</p>
    </div>
  )
}

const styles = {
  page: {
    maxWidth: 560,
    margin: '0 auto',
    padding: '28px 18px 60px',
    minHeight: '100vh',
    boxSizing: 'border-box',
    width: '100%',
  },
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--paper)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  eyebrow: {
    margin: '0 0 2px',
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--moss)',
    fontWeight: 600,
  },
  title: {
    margin: 0,
    fontSize: 30,
    color: 'var(--ink)',
  },
  addBtn: {
    background: 'var(--moss-deep)',
    color: '#FFF',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '11px 16px',
    fontSize: 14,
    fontWeight: 600,
  },
  headerBtns: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  userBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'var(--ink-soft)',
    marginBottom: 14,
  },
  changeUserBtn: {
    border: '1px solid var(--line)',
    background: 'var(--card)',
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: 12,
    color: 'var(--moss-deep)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28, 37, 33, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 60,
  },
  userModal: {
    background: '#FFF',
    borderRadius: 'var(--radius-lg)',
    padding: '22px 20px',
    width: '100%',
    maxWidth: 360,
    boxSizing: 'border-box',
  },
  userChoice: {
    border: '1px solid var(--line)',
    background: 'var(--paper)',
    borderRadius: 10,
    padding: '12px 14px',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--ink)',
    cursor: 'pointer',
    textAlign: 'left',
  },
  orderBtn: {
    background: 'var(--card)',
    color: 'var(--moss-deep)',
    border: '1.5px solid var(--moss-deep)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 600,
  },
  errorBanner: {
    background: 'var(--rust-pale)',
    color: '#7A2E20',
    borderRadius: 'var(--radius-sm)',
    padding: '12px 14px',
    fontSize: 13,
    marginBottom: 16,
  },
  warehouseTabs: {
    display: 'flex',
    gap: 6,
    marginBottom: 18,
    background: 'var(--card)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-md)',
    padding: 4,
  },
  warehouseTab: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    borderRadius: 10,
    padding: '9px 8px',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--ink-soft)',
    minWidth: 0,
  },
  warehouseTabActive: {
    background: 'var(--moss-deep)',
    color: '#FFF',
    fontWeight: 600,
  },
  statRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    borderRadius: 'var(--radius-md)',
    padding: '14px 14px',
  },
  statLabel: {
    margin: '0 0 6px',
    fontSize: 12.5,
    fontWeight: 500,
  },
  statValue: {
    margin: 0,
    fontFamily: 'Fraunces, serif',
    fontSize: 26,
    fontWeight: 600,
  },
  alertBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'var(--amber-pale)',
    color: '#7A4E0F',
    borderRadius: 'var(--radius-md)',
    padding: '13px 16px',
    fontSize: 13.5,
    lineHeight: 1.5,
    marginBottom: 18,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--amber)',
    marginTop: 5,
    flexShrink: 0,
  },
  controls: {
    display: 'flex',
    gap: 8,
    marginBottom: 10,
  },
  filterRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  search: {
    flex: 1,
    minWidth: 0,
    border: '1px solid var(--line)',
    background: 'var(--card)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 13px',
    fontSize: 14,
    color: 'var(--ink)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    border: '1px solid var(--line)',
    background: 'var(--card)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 10px',
    fontSize: 14,
    color: 'var(--ink)',
  },
  selectHalf: {
    flex: '1 1 0',
    minWidth: 0,
    border: '1px solid var(--line)',
    background: 'var(--card)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 8px',
    fontSize: 14,
    color: 'var(--ink)',
    boxSizing: 'border-box',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  empty: {
    textAlign: 'center',
    color: 'var(--ink-faint)',
    fontSize: 14,
    padding: '30px 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px 20px',
    border: '1px dashed var(--line)',
    borderRadius: 'var(--radius-md)',
  },
}
