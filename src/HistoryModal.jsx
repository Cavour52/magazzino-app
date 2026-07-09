import { useState, useEffect } from 'react'
import { collection, onSnapshot, query as fsQuery, orderBy, limit } from 'firebase/firestore'
import { db } from './firebase'

export default function HistoryModal({ product, onClose }) {
  const [moves, setMoves] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = fsQuery(collection(db, 'movimenti'), orderBy('createdAt', 'desc'), limit(300))
    const unsub = onSnapshot(q, (snap) => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      if (product) list = list.filter(m => m.productId === product.id)
      setMoves(list)
      setLoading(false)
    }, (err) => {
      console.error(err)
      setLoading(false)
    })
    return () => unsub()
  }, [product])

  function formatDate(ts) {
    if (!ts || !ts.toDate) return ''
    const d = ts.toDate()
    return d.toLocaleDateString('it-IT') + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            {product ? `Storico · ${product.name}` : 'Storico movimenti'}
          </h3>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Chiudi">✕</button>
        </div>

        {loading && <p style={styles.info}>Caricamento…</p>}
        {!loading && moves.length === 0 && (
          <p style={styles.info}>Nessun movimento registrato ancora.</p>
        )}

        <div style={styles.list}>
          {moves.map(m => (
            <div key={m.id} style={styles.row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {!product && <p style={styles.rowName}>{m.productName}</p>}
                <p style={styles.rowMeta}>
                  {m.user || 'Sconosciuto'} · {formatDate(m.createdAt)}
                  {m.warehouse ? ` · ${m.warehouse}` : ''}
                </p>
              </div>
              <span style={{ ...styles.delta, color: m.delta > 0 ? '#1E6B3A' : '#B14B3A' }}>
                {m.delta > 0 ? '+' : ''}{m.delta} {m.unit || ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(28, 37, 33, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 55,
  },
  modal: {
    background: '#FFF',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 18px',
    width: '100%',
    maxWidth: 440,
    maxHeight: '85vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 18,
  },
  closeBtn: {
    border: 'none',
    background: 'none',
    fontSize: 16,
    color: 'var(--ink-faint)',
    padding: 4,
    cursor: 'pointer',
  },
  info: {
    color: 'var(--ink-faint)',
    fontSize: 14,
    textAlign: 'center',
    padding: '20px 8px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid var(--line)',
  },
  rowName: {
    margin: '0 0 2px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--ink)',
  },
  rowMeta: {
    margin: 0,
    fontSize: 12.5,
    color: 'var(--ink-faint)',
  },
  delta: {
    fontSize: 15,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
}
