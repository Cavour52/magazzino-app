const statusMeta = {
  ok: { label: 'Disponibile', fg: '#2F5D4F', bg: '#E3ECE7' },
  low: { label: 'In esaurimento', fg: '#C77F1E', bg: '#FBEDDA' },
  out: { label: 'Esaurito', fg: '#B14B3A', bg: '#F8E4E0' },
}

export default function ProductCard({ product, status, onInc, onDec, onEdit }) {
  const meta = statusMeta[status]
  return (
    <div style={styles.card}>
      <div style={styles.main} onClick={onEdit}>
        <p style={styles.name}>{product.name}</p>
        <p style={styles.threshold}>
          Soglia minima: {product.threshold} {product.unit}
          {product.supplier ? ` · ${product.supplier}` : ''}
        </p>
      </div>
      <span style={{ ...styles.badge, background: meta.bg, color: meta.fg }}>{meta.label}</span>
      <div style={styles.qtyControl}>
        <button style={styles.qtyBtn} onClick={onDec} aria-label="Diminuisci">–</button>
        <span style={styles.qtyValue}>{product.qty} {product.unit}</span>
        <button style={styles.qtyBtn} onClick={onInc} aria-label="Aumenta">+</button>
      </div>
    </div>
  )
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--card)',
    border: '1px solid var(--line)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
  },
  main: {
    flex: 1,
    minWidth: 0,
    cursor: 'pointer',
  },
  name: {
    margin: '0 0 2px',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--ink)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  threshold: {
    margin: 0,
    fontSize: 12.5,
    color: 'var(--ink-faint)',
  },
  badge: {
    fontSize: 11.5,
    fontWeight: 600,
    padding: '5px 10px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  qtyControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: '1px solid var(--line)',
    background: 'var(--paper)',
    fontSize: 16,
    lineHeight: 1,
    color: 'var(--ink)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: 600,
    minWidth: 52,
    textAlign: 'center',
  },
}
