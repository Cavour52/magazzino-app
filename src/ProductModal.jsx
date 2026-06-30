import { useState } from 'react'

export default function ProductModal({ initial, suppliers = [], onAddSupplier, onSave, onDelete, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [qty, setQty] = useState(initial?.qty ?? 0)
  const [threshold, setThreshold] = useState(initial?.threshold ?? 2)
  const [unit, setUnit] = useState(initial?.unit || 'pz')
  const [supplier, setSupplier] = useState(initial?.supplier || '')
  const [addingSupplier, setAddingSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')

  function handleSupplierChange(e) {
    const value = e.target.value
    if (value === '__add_new__') {
      setAddingSupplier(true)
    } else {
      setSupplier(value)
    }
  }

  async function confirmNewSupplier() {
    const trimmed = newSupplierName.trim()
    if (!trimmed) return
    if (onAddSupplier) await onAddSupplier(trimmed)
    setSupplier(trimmed)
    setNewSupplierName('')
    setAddingSupplier(false)
  }

  function handleSave() {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      qty: Math.max(0, parseInt(qty) || 0),
      threshold: Math.max(0, parseInt(threshold) || 0),
      unit: unit.trim() || 'pz',
      supplier: supplier || '',
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

        <label style={styles.label}>Fornitore</label>
        {!addingSupplier ? (
          <select style={styles.input} value={supplier} onChange={handleSupplierChange}>
            <option value="">Nessuno</option>
            {suppliers.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="__add_new__">+ Aggiungi nuovo fornitore</option>
          </select>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...styles.input, flex: 1 }}
              value={newSupplierName}
              onChange={e => setNewSupplierName(e.target.value)}
              placeholder="Nome nuovo fornitore"
              autoFocus
            />
            <button style={styles.cancelBtn} onClick={() => { setAddingSupplier(false); setNewSupplierName('') }}>Annulla</button>
            <button style={styles.saveBtn} onClick={confirmNewSupplier}>Aggiungi</button>
          </div>
        )}

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
