import { Calendar } from 'lucide-react'

export const PRESETS = [
  { label: 'Oggi',    key: 'today' },
  { label: 'Ieri',    key: 'yesterday' },
  { label: '7 gg',   key: '7d' },
  { label: '30 gg',  key: '30d' },
  { label: 'Tutto',  key: 'all' },
]

/** Returns { from: ISO string | null, to: ISO string | null } */
export function resolveRange(preset, customFrom, customTo) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  switch (preset) {
    case 'today':
      return { from: todayStr + 'T00:00:00.000Z', to: null }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      const yStr = y.toISOString().split('T')[0]
      return { from: yStr + 'T00:00:00.000Z', to: todayStr + 'T00:00:00.000Z' }
    }
    case '7d': {
      const d = new Date(now); d.setDate(d.getDate() - 7)
      return { from: d.toISOString(), to: null }
    }
    case '30d': {
      const d = new Date(now); d.setDate(d.getDate() - 30)
      return { from: d.toISOString(), to: null }
    }
    case 'custom':
      return {
        from: customFrom ? customFrom + 'T00:00:00.000Z' : null,
        to:   customTo   ? customTo   + 'T23:59:59.999Z' : null,
      }
    default: // 'all'
      return { from: null, to: null }
  }
}

/** Apply from/to filters to a Supabase query builder */
export function applyRange(query, range) {
  if (range.from) query = query.gte('created_at', range.from)
  if (range.to)   query = query.lte('created_at', range.to)
  return query
}

export default function DateRangeSelector({ preset, onPreset, customFrom, customTo, onCustom }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <Calendar size={14} color="var(--text-3)" style={{ marginRight: '2px' }} />
      {PRESETS.map(p => (
        <button
          key={p.key}
          onClick={() => onPreset(p.key)}
          className={`btn btn-sm ${preset === p.key ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '4px 10px', fontSize: '12px' }}
        >
          {p.label}
        </button>
      ))}
      <button
        onClick={() => onPreset('custom')}
        className={`btn btn-sm ${preset === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
        style={{ padding: '4px 10px', fontSize: '12px' }}
      >
        Personalizzato
      </button>
      {preset === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
          <input
            type="date"
            value={customFrom}
            onChange={e => onCustom('from', e.target.value)}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', background: 'var(--card)', color: 'var(--text)' }}
          />
          <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>→</span>
          <input
            type="date"
            value={customTo}
            onChange={e => onCustom('to', e.target.value)}
            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '12px', background: 'var(--card)', color: 'var(--text)' }}
          />
        </div>
      )}
    </div>
  )
}
