import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, ChevronDown, ChevronUp, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react'
import DateRangeSelector, { resolveRange, applyRange } from '../components/DateRangeSelector'

const LEVEL_BADGE = {
  basso: 'badge-green', medio: 'badge-yellow', alto: 'badge-red',
  lieve: 'badge-green', moderato: 'badge-yellow',
  significativo: 'badge-yellow', intensivo: 'badge-red',
}

const ADDICTION_LABEL = {
  alcol: 'Alcol', 'crack-cocaina': 'Crack/Cocaina', ludopatia: 'Ludopatia',
  oppiacei: 'Oppiacei', cannabis: 'Cannabis', 'sesso-pornografia': 'Sesso/Porno',
  famiglie: 'Famiglie',
}

const THRESHOLDS = [
  { key: 'basso', label: 'Basso',  range: 'score < 19',  color: '#10b981', desc: 'Dipendenza lieve o iniziale.' },
  { key: 'medio', label: 'Medio',  range: 'score 19–24', color: '#f59e0b', desc: 'Dipendenza moderata. Colloquio consigliato.' },
  { key: 'alto',  label: 'Alto',   range: 'score ≥ 25',  color: '#ef4444', desc: 'Dipendenza significativa. Colloquio urgente.' },
]

export default function Questionari() {
  const [preset, setPreset] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [stats, setStats] = useState({})
  const [funnel, setFunnel] = useState({ started: 0, completed: 0, abandoned: 0, dropoffs: [], byPercorso: {} })
  const [postFunnel, setPostFunnel] = useState([])

  const handleCustom = (field, val) => {
    if (field === 'from') setCustomFrom(val)
    else setCustomTo(val)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const range = resolveRange(preset, customFrom, customTo)
    const cnt = (step) => applyRange(
      supabase.from('events').select('*', { count: 'exact', head: true })
        .eq('event_type', 'funnel_step').eq('metadata->>step', step),
      range
    )
    // Count unique sessions (deduplicate repeat visits/clicks from same session)
    const cntUniq = async (event_type, extra = {}) => {
      let q = supabase.from('events').select('metadata').eq('event_type', event_type).limit(2000)
      for (const [k, v] of Object.entries(extra)) q = q.eq(k, v)
      const { data } = await applyRange(q, range)
      return { count: new Set((data || []).map(e => e.metadata?.session_id).filter(Boolean)).size }
    }
    const cntEv = (event_type) => cntUniq(event_type)
    const cntScreen = (screen) => cntUniq('screen_view', { screen })
    try {
      // Fire all queries in parallel: 3 KPI counts + 16 per-step counts + 2 event fetches + 6 post-funnel counts
      const results = await Promise.all([
        cnt('start'),    // 0
        cnt('complete'), // 1
        cnt('abandon'),  // 2
        // Complete events for responses table (max 500 — well below any limit)
        applyRange(
          supabase.from('events').select('id, created_at, metadata')
            .eq('event_type', 'funnel_step').eq('metadata->>step', 'complete')
            .order('created_at', { ascending: false }).limit(500),
          range
        ),                // 3
        // Start events for byPercorso breakdown (max 500)
        applyRange(
          supabase.from('events').select('metadata')
            .eq('event_type', 'funnel_step').eq('metadata->>step', 'start')
            .limit(500),
          range
        ),                // 4
        // Per-step counts 0–15 for the funnel chart
        ...Array.from({ length: 16 }, (_, i) => cnt(`step_${i}`)), // 5–20
        // Post-questionario funnel: screen views + CTA clicks
        cntScreen('percorso_risultato'),           // 21
        cntEv('risultato_cta_professionista'),      // 22
        cntScreen('prenota_professionista'),        // 23
        cntEv('prenota_professionista_confermato'), // 24
        cntScreen('prenota_calendario'),           // 25
        cntEv('prenota_calendario_confermato'),     // 26
        cntScreen('prenota_registrazione'),        // 27
        cntEv('prenota_registrazione_completata'), // 28
        cntScreen('prenota_benvenuto'),            // 29
        cntEv('prenota_paga_click'),               // 30
        cntEv('conversione_v1'),                   // 31 — conversione Stripe reale (solo da redirect Stripe V1)
      ])

      const [startRes, completeRes, abandonRes, completeEventsRes, startEventsRes, ...rest] = results
      const stepRess = rest.slice(0, 16)
      const [
        pfRisultatoView, pfRisultatoCta,
        pfProfView, pfProfCta,
        pfCalView, pfCalCta,
        pfRegView, pfRegCta,
        pfBenView, pfBenPaga,
        pfConversione,
      ] = rest.slice(16)

      // Responses list
      const rows = (completeEventsRes.data || []).map(e => ({
        id: e.id,
        created_at: e.created_at,
        addiction_type: e.metadata?.percorso,
        score: e.metadata?.score,
        max_score: null,
        result_level: e.metadata?.level,
        user_id: null,
      }))
      setResponses(rows)

      const s = {}
      rows.forEach(r => { s[r.result_level] = (s[r.result_level] || 0) + 1 })
      setStats(s)

      // byPercorso breakdown
      const byPercorso = {}
      ;(startEventsRes.data || []).forEach(e => {
        const p = e.metadata?.percorso || 'unknown'
        byPercorso[p] = byPercorso[p] || { started: 0, completed: 0 }
        byPercorso[p].started++
      })
      ;(completeEventsRes.data || []).forEach(e => {
        const p = e.metadata?.percorso || 'unknown'
        byPercorso[p] = byPercorso[p] || { started: 0, completed: 0 }
        byPercorso[p].completed = (byPercorso[p].completed || 0) + 1
      })

      // Per-step funnel chart
      const sortedSteps = stepRess
        .map((res, i) => ({ step: i, count: res.count || 0 }))
        .filter(s => s.count > 0)

      const started = startRes.count || 0
      const dropoffs = sortedSteps.slice(0, 10).map((s, i) => {
        const prev = i > 0 ? sortedSteps[i - 1].count : started
        const drop = prev > 0 ? Math.round((1 - s.count / prev) * 100) : 0
        return { ...s, drop }
      })

      setFunnel({ started, completed: completeRes.count || 0, abandoned: abandonRes.count || 0, dropoffs, byPercorso })

      setPostFunnel([
        { label: 'Risultato visualizzato',        count: pfRisultatoView.count || 0, cta: null },
        { label: '→ CTA "Parla con esperto"',      count: pfRisultatoCta.count || 0, cta: true },
        { label: 'Scelta professionista',   count: pfProfView.count || 0, cta: null },
        { label: '→ Professionista confermato', count: pfProfCta.count || 0, cta: true },
        { label: 'Calendario aperto',       count: pfCalView.count || 0, cta: null },
        { label: '→ Slot confermato',        count: pfCalCta.count || 0, cta: true },
        { label: 'Registrazione aperta',    count: pfRegView.count || 0, cta: null },
        { label: '→ Account creato',         count: pfRegCta.count || 0, cta: true },
        { label: 'Pagina benvenuto',         count: pfBenView.count || 0, cta: null },
        { label: '→ Click "Paga ora"',       count: pfBenPaga.count || 0, cta: true },
        { label: '✅ Conversione Stripe',     count: pfConversione.count || 0, cta: true },
      ])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [preset, customFrom, customTo])

  useEffect(() => { loadData() }, [loadData])

  const completionRate = funnel.started > 0 ? Math.round((funnel.completed / funnel.started) * 100) : 0

  const rangeLabel = {
    today: 'Oggi', yesterday: 'Ieri', '7d': 'Ultimi 7 gg',
    '30d': 'Ultimi 30 gg', all: 'Tutto lo storico', custom: 'Periodo personalizzato',
  }

  return (
    <div>
      {/* Header + selettore */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Questionari</h1>
          <p className="section-sub">Funnel · {rangeLabel[preset] || 'Periodo personalizzato'} · {responses.length} risposte</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <DateRangeSelector
            preset={preset}
            onPreset={setPreset}
            customFrom={customFrom}
            customTo={customTo}
            onCustom={handleCustom}
          />
          <button onClick={loadData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Aggiorna
          </button>
        </div>
      </div>

      {/* Funnel metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'Avviati',             value: funnel.started,    icon: Users,        color: '#3b82f6' },
          { label: 'Completati',          value: funnel.completed,  icon: CheckCircle,  color: '#10b981' },
          { label: 'Abbandonati',         value: funnel.abandoned,  icon: XCircle,      color: '#ef4444' },
          { label: 'Tasso completamento', value: `${completionRate}%`, icon: TrendingUp, color: '#f59e0b' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
            </div>
            <div className="stat-value">{loading ? '—' : value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Funnel bar + per-percorso */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>Drop-off per step</h3>
          {loading ? (
            <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Caricamento...</p>
          ) : funnel.dropoffs.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Nessun dato nel periodo</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {funnel.started > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-2)', width: '52px', flexShrink: 0 }}>Start</span>
                  <div style={{ flex: 1, height: '10px', borderRadius: '6px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: '#3b82f6', borderRadius: '6px' }} />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-2)', width: '32px', textAlign: 'right' }}>{funnel.started}</span>
                </div>
              )}
              {funnel.dropoffs.map(({ step, count }) => {
                const pct = funnel.started > 0 ? Math.round((count / funnel.started) * 100) : 0
                return (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)', width: '52px', flexShrink: 0 }}>Step {step + 1}</span>
                    <div style={{ flex: 1, height: '10px', borderRadius: '6px', background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct > 60 ? '#10b981' : pct > 30 ? '#f59e0b' : '#ef4444', borderRadius: '6px', transition: 'width .3s' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)', width: '32px', textAlign: 'right' }}>{count}</span>
                  </div>
                )
              })}
              {funnel.completed > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#10b981', width: '52px', flexShrink: 0, fontWeight: 600 }}>Fine</span>
                  <div style={{ flex: 1, height: '10px', borderRadius: '6px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${funnel.started > 0 ? Math.round(funnel.completed / funnel.started * 100) : 0}%`, height: '100%', background: '#10b981', borderRadius: '6px' }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#10b981', width: '32px', textAlign: 'right', fontWeight: 600 }}>{funnel.completed}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>Completamento per percorso</h3>
          {loading ? (
            <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Caricamento...</p>
          ) : Object.keys(funnel.byPercorso).length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Nessun dato nel periodo</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Percorso</th>
                  <th style={{ textAlign: 'right' }}>Avviati</th>
                  <th style={{ textAlign: 'right' }}>Completati</th>
                  <th style={{ textAlign: 'right' }}>Tasso</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(funnel.byPercorso)
                  .sort((a, b) => b[1].started - a[1].started)
                  .map(([key, val]) => {
                    const rate = val.started > 0 ? Math.round((val.completed || 0) / val.started * 100) : 0
                    return (
                      <tr key={key}>
                        <td><span className="badge badge-purple">{ADDICTION_LABEL[key] || key}</span></td>
                        <td style={{ textAlign: 'right', fontSize: '13px' }}>{val.started}</td>
                        <td style={{ textAlign: 'right', fontSize: '13px' }}>{val.completed || 0}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge ${rate >= 60 ? 'badge-green' : rate >= 30 ? 'badge-yellow' : 'badge-red'}`}>{rate}%</span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Funnel post-questionario */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: 'var(--text)' }}>Funnel post-questionario</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '16px' }}>Sessioni uniche per step · barre su "Risultato visualizzato" come 100%</p>
        {loading ? (
          <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Caricamento...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {postFunnel.map(({ label, count, cta }, i) => {
              const top = postFunnel[0].count || 1
              const pct = Math.round((count / top) * 100)
              const prev = i > 0 ? postFunnel[i - 1].count : null
              const drop = prev ? Math.round((1 - count / prev) * 100) : null
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '12px', color: cta ? 'var(--text-2)' : 'var(--text)',
                    fontWeight: cta ? 400 : 600,
                    width: '220px', flexShrink: 0,
                    paddingLeft: cta ? '12px' : '0',
                  }}>{label}</span>
                  <div style={{ flex: 1, height: '10px', borderRadius: '6px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: '6px', transition: 'width .3s',
                      background: cta ? '#8b5cf6' : (pct > 60 ? '#10b981' : pct > 30 ? '#f59e0b' : '#ef4444'),
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-2)', width: '36px', textAlign: 'right', fontWeight: 600 }}>{count}</span>
                  {drop !== null && drop > 0 && (
                    <span style={{ fontSize: '11px', color: '#ef4444', width: '38px', textAlign: 'right' }}>−{drop}%</span>
                  )}
                  {(drop === null || drop === 0) && (
                    <span style={{ width: '38px' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Threshold overview */}
      <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>Distribuzione livelli di rischio</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
          {THRESHOLDS.map(t => (
            <div key={t.key} style={{ padding: '14px', borderRadius: '10px', border: `1px solid ${t.color}30`, background: t.color + '08' }}>
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

      {/* Risposte */}
      <div className="card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
            Risposte ({responses.length}{preset !== 'all' ? ` nel periodo` : ' totali'})
          </h3>
        </div>
        {loading ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>Caricamento...</p>
        ) : responses.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>Nessun questionario completato nel periodo selezionato</p>
        ) : (
          <div>
            {responses.map(r => (
              <div key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <div
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', cursor: 'pointer' }}
                >
                  <span className={`badge ${LEVEL_BADGE[r.result_level] || 'badge-gray'}`}>{r.result_level || '—'}</span>
                  <span className="badge badge-purple">{ADDICTION_LABEL[r.addiction_type] || r.addiction_type || '—'}</span>
                  <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-2)' }}>
                    Score: {r.score ?? '—'}{r.max_score ? `/${r.max_score}` : ''}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    {new Date(r.created_at).toLocaleDateString('it', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          [style*="repeat(4,1fr)"] { grid-template-columns: repeat(2,1fr) !important; }
          [style*="repeat(3,1fr)"] { grid-template-columns: 1fr 1fr !important; }
          [style*="1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
