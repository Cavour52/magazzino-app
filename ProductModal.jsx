import { useState } from 'react'

export default function ProductModal({ initial, onSave, onDelete, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [qty, setQty] = useState(initial?.qty ?? 0)
  const [threshold, setThreshold] = useState(initial?.threshold ?? 2)
  const [unit, setUnit] = useState(initial?.unit || 'pz')

  function handleSave() {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      qty: Math.max(0, parseInt(qty) || 0),
      threshold: Math.max(0, parseInt(threshold) || 0),
      unit: unit.trim() || 'pz',
    })
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 style={styles.title}>{initial ? 'Modifica prodotto' : 'Nuovo prodotto'}</h3>

        <label style={styles.label}>Nome prodotto</label>
        <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Es. Farina 00 1kg" autoFocus />

        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Quantità</label>
            <input style={styles.input} type="number" min="0" value={qty} onChange={e => setQty(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Soglia minima</label>
            <input style={styles.input} type="number" min="0" value={threshold} onChange={e => setThreshold(e.target.value)} />
          </div>
        </div>

        <label style={styles.label}>Unità</label>
        <input style={styles.input} value={unit} onChange={e => setUnit(e.target.value)} placeholder="pz, kg, lt…" />

        <div style={styles.actions}>
          {onDelete && (
            <button style={styles.deleteBtn} onClick={onDelete}>Elimina</button>
          )}
          <div style={{ flex: 1 }} />
          <button style={styles.cancelBtn} onClick={onClose}>Annulla</button>
          <button style={styles.saveBtn} onClick={handleSave}>Salva</button>
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
    zIndex: 50,
  },
  modal: {
    background: '#FFF',
    borderRadius: 'var(--radius-lg)',
    padding: '22px 20px',
    width: '100%',
    maxWidth: 380,
  },
  title: {
    margin: '0 0 16px',
    fontSize: 19,
  },
  label: {
    display: 'block',
    fontSize: 12.5,
    color: 'var(--ink-faint)',
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    width: '100%',
    border: '1px solid var(--line)',
    borderRadius: 10,
    padding: '10px 12px',
    fontSize: 14,
    color: 'var(--ink)',
    outline: 'none',
  },
  row: {
    display: 'flex',
    gap: 10,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--rust)',
    fontSize: 14,
    fontWeight: 600,
    padding: '8px 4px',
  },
  cancelBtn: {
    background: 'none',
    border: '1px solid var(--line)',
    borderRadius: 10,
    padding: '9px 16px',
    fontSize: 14,
    color: 'var(--ink)',
  },
  saveBtn: {
    background: 'var(--moss-deep)',
    border: 'none',
    borderRadius: 10,
    padding: '9px 18px',
    fontSize: 14,
    fontWeight: 600,
    color: '#FFF',
  },
}
