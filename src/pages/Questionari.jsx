import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

const LEVEL_BADGE = {
  basso: 'badge-green', medio: 'badge-yellow', alto: 'badge-red',
  // legacy keys
  lieve: 'badge-green', moderato: 'badge-yellow',
  significativo: 'badge-yellow', intensivo: 'badge-red',
}

const ADDICTION_LABEL = {
  alcol: 'Alcol', 'crack-cocaina': 'Crack/Cocaina', ludopatia: 'Ludopatia',
  oppiacei: 'Oppiacei', cannabis: 'Cannabis', 'sesso-pornografia': 'Sesso/Porno',
  famiglie: 'Famiglie',
}

// Score thresholds — admin can see and adjust context
const THRESHOLDS = [
  { key: 'basso', label: 'Basso',  range: 'score < 6',  color: '#10b981', desc: 'Dipendenza lieve o iniziale.' },
  { key: 'medio', label: 'Medio',  range: 'score 6–11', color: '#f59e0b', desc: 'Dipendenza moderata. Colloquio consigliato.' },
  { key: 'alto',  label: 'Alto',   range: 'score ≥ 12', color: '#ef4444', desc: 'Dipendenza significativa. Colloquio urgente.' },
]

export default function Questionari() {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [stats, setStats] = useState({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      const rows = data || []
      setResponses(rows)

      // compute stats per level
      const s = {}
      rows.forEach(r => { s[r.result_level] = (s[r.result_level] || 0) + 1 })
      setStats(s)
    } catch {}
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Questionari</h1>
          <p className="section-sub">Risposte compilate, livelli di gravità e soglie di scoring</p>
        </div>
        <button onClick={loadData} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Aggiorna
        </button>
      </div>

      {/* Threshold overview */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
          Soglie di scoring (score / max possibile)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
          {THRESHOLDS.map(t => (
            <div key={t.key} style={{
              padding: '14px', borderRadius: '10px', border: `1px solid ${t.color}30`,
              background: t.color + '08',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className={`badge ${LEVEL_BADGE[t.key]}`}>{t.label}</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: t.color }}>{stats[t.key] || 0}</span>
              </div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: t.color, marginBottom: '4px' }}>{t.range}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.4 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Responses table */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
            Risposte recenti ({responses.length})
          </h3>
        </div>

        {loading ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>Caricamento...</p>
        ) : responses.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>
            Nessun questionario completato ancora
          </p>
        ) : (
          <div>
            {responses.map(r => (
              <div key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <div
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 20px', cursor: 'pointer',
                  }}
                >
                  <span className={`badge ${LEVEL_BADGE[r.result_level] || 'badge-gray'}`}>
                    {r.result_level || '—'}
                  </span>
                  <span className="badge badge-purple">
                    {ADDICTION_LABEL[r.addiction_type] || r.addiction_type || '—'}
                  </span>
                  <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-2)' }}>
                    Score: {r.score}/{r.max_score}
                    {r.max_score > 0 && ` (${Math.round(r.score/r.max_score*100)}%)`}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    {new Date(r.created_at).toLocaleDateString('it')}
                  </span>
                  {expanded === r.id ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
                </div>

                {expanded === r.id && (
                  <div style={{ padding: '14px 20px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', fontSize: '13px' }}>
                      <div><span style={{ color: 'var(--text-3)' }}>ID utente:</span><br /><code style={{ fontSize: '11px' }}>{r.user_id || 'anonimo'}</code></div>
                      <div><span style={{ color: 'var(--text-3)' }}>Percorso:</span><br /><strong>{ADDICTION_LABEL[r.addiction_type] || r.addiction_type}</strong></div>
                      <div><span style={{ color: 'var(--text-3)' }}>Livello:</span><br /><strong>{r.result_level}</strong></div>
                    </div>
                    {r.answers && (
                      <div style={{ marginTop: '14px' }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>RISPOSTE DETTAGLIATE</p>
                        <pre style={{ fontSize: '12px', color: 'var(--text-2)', background: 'var(--card)', padding: '12px', borderRadius: '8px', overflow: 'auto', maxHeight: '200px' }}>
                          {JSON.stringify(r.answers, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          [style*="repeat(3,1fr)"] { grid-template-columns: 1fr 1fr !important; }
          [style*="repeat(3,1fr)"] { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
