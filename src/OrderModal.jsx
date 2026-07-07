import { useState, useMemo } from 'react'

export default function OrderModal({ products, onClose }) {
  const [copied, setCopied] = useState(null)

  // Raggruppa i prodotti critici (esauriti o in esaurimento, non già ordinati) per fornitore
  const groups = useMemo(() => {
    const critical = products.filter(p =>
      (p.qty <= 0 || p.qty <= p.threshold) && !p.ordered
    )
    const map = {}
    critical.forEach(p => {
      const key = p.supplier || 'Senza fornitore'
      if (!map[key]) map[key] = []
      map[key].push(p)
    })
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
  }, [products])

  function messageFor(supplier, items) {
    const lines = items.map(p => `- ${p.name}`)
    return `Buongiorno,\nvorremmo ordinare i seguenti prodotti:\n\n${lines.join('\n')}\n\nGrazie`
  }

  async function copyText(supplier, items) {
    const text = messageFor(supplier, items)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(supplier)
      setTimeout(() => setCopied(null), 2000)
    } catch (e) {
      console.error('Copia non riuscita', e)
    }
  }

  function whatsappLink(supplier, items) {
    return `https://wa.me/?text=${encodeURIComponent(messageFor(supplier, items))}`
  }

  function emailLink(supplier, items) {
    const subject = encodeURIComponent(`Ordine merce - ${supplier}`)
    const body = encodeURIComponent(messageFor(supplier, items))
    return `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Ordine fornitori</h3>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Chiudi">✕</button>
        </div>

        {groups.length === 0 && (
          <p style={styles.empty}>
            Nessun prodotto da ordinare: tutto disponibile, oppure gli articoli in esaurimento sono già stati ordinati.
          </p>
        )}

        <div style={styles.groupList}>
          {groups.map(([supplier, items]) => (
            <div key={supplier} style={styles.group}>
              <p style={styles.supplierName}>{supplier}</p>
              <ul style={styles.itemList}>
                {items.map(p => (
                  <li key={p.id} style={styles.item}>
                    {p.name}
                    <span style={styles.itemQty}>
                      {p.qty <= 0 ? 'esaurito' : `${p.qty} ${p.unit} rimasti`}
                    </span>
                  </li>
                ))}
              </ul>
              <div style={styles.btnRow}>
                <button style={styles.actionBtn} onClick={() => copyText(supplier, items)}>
                  {copied === supplier ? 'Copiato ✓' : 'Copia testo'}
                </button>
                <a style={{ ...styles.actionBtn, ...styles.waBtn }} href={whatsappLink(supplier, items)} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
                <a style={{ ...styles.actionBtn, ...styles.mailBtn }} href={emailLink(supplier, items)}>
                  Email
                </a>
              </div>
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
    zIndex: 50,
  },
  modal: {
    background: '#FFF',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 18px',
    width: '100%',
    maxWidth: 420,
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
    fontSize: 19,
  },
  closeBtn: {
    border: 'none',
    background: 'none',
    fontSize: 16,
    color: 'var(--ink-faint)',
    padding: 4,
  },
  empty: {
    color: 'var(--ink-faint)',
    fontSize: 14,
    textAlign: 'center',
    padding: '24px 8px',
  },
  groupList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  group: {
    border: '1px solid var(--line)',
    borderRadius: 12,
    padding: '12px 14px',
  },
  supplierName: {
    margin: '0 0 8px',
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--moss-deep)',
  },
  itemList: {
    margin: '0 0 12px',
    paddingLeft: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  item: {
    fontSize: 14,
    color: 'var(--ink)',
  },
  itemQty: {
    marginLeft: 6,
    fontSize: 12,
    color: 'var(--ink-faint)',
  },
  btnRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: '1 1 0',
    minWidth: 90,
    textAlign: 'center',
    border: '1px solid var(--line)',
    background: 'var(--paper)',
    borderRadius: 10,
    padding: '9px 8px',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ink)',
    textDecoration: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  waBtn: {
    background: '#DCF3E3',
    borderColor: '#B7E2C4',
    color: '#1E6B3A',
  },
  mailBtn: {
    background: '#E2EEF7',
    borderColor: '#C3DCEE',
    color: '#1D5C8A',
  },
}
