import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { RefreshCw, TrendingUp, Users, MousePointerClick, ArrowRight } from 'lucide-react'
import DateRangeSelector, { resolveRange, applyRange } from '../components/DateRangeSelector'

const PERCORSI_LABEL = {
  alcol: 'Alcol', 'crack-cocaina': 'Crack/Cocaina', ludopatia: 'Ludopatia',
  oppiacei: 'Oppiacei', cannabis: 'Cannabis', 'sesso-pornografia': 'Sesso/Porno',
  famiglie: 'Famiglie',
}

const PLAN_LABEL = {
  individuale: 'Individuale (49€/sett)',
  gruppi: 'Gruppi + Colloquio (297€/mese)',
  completo: 'Completo (597€/mese)',
}

const LEVEL_BADGE = {
  basso: 'badge-green', medio: 'badge-yellow', alto: 'badge-red',
}

/* Helper: count unique sessions from funnel_v2_events */
async function cntUniqV2(event_type, extra = {}, range) {
  let q = supabase.from('funnel_v2_events').select('session_id').eq('event_type', event_type).limit(5000)
  for (const [k, v] of Object.entries(extra)) q = q.eq(k, v)
  const { data } = await applyRange(q, range)
  return { count: new Set((data || []).map(e => e.session_id).filter(Boolean)).size }
}

async function cntStepV2(step, range) {
  return applyRange(
    supabase.from('funnel_v2_events').select('*', { count: 'exact', head: true })
      .eq('event_type', 'funnel_step').eq('metadata->>step', step),
    range
  )
}

export default function FunnelV2() {
  const [preset, setPreset] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [funnel, setFunnel] = useState([])
  const [kpi, setKpi] = useState({ sessioni: 0, completati: 0, piani: 0, stripe: 0 })
  const [byPercorso, setByPercorso] = useState([])
  const [byPlan, setByPlan] = useState([])
  const [recentCompletes, setRecentCompletes] = useState([])

  const handleCustom = (field, val) => {
    if (field === 'from') setCustomFrom(val)
    else setCustomTo(val)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    const range = resolveRange(preset, customFrom, customTo)

    try {
      const [
        percorsiView,
        qStart,
        qComplete,
        risultatoView,
        pianoView,
        stripeClick,
        appClick,
        conversione,
        // Recenti
        completeEvents,
        // By percorso start events
        startEvents,
        // By plan clicks
        stripeEvents,
      ] = await Promise.all([
        cntUniqV2('screen_view', { screen: 'percorsi_v2' }, range),           // 0
        cntStepV2('start', range),                                              // 1
        cntStepV2('complete', range),                                           // 2
        cntUniqV2('screen_view', { screen: 'risultato_v2' }, range),           // 3
        cntUniqV2('screen_view', { screen: 'piano_v2' }, range),               // 4
        cntUniqV2('piano_v2_stripe_click', {}, range),                         // 5
        cntUniqV2('piano_v2_app_click', {}, range),                            // 6
        cntUniqV2('conversione_stripe', {}, range),                            // 7
        // Complete events for recent table
        applyRange(
          supabase.from('funnel_v2_events').select('session_id, created_at, metadata')
            .eq('event_type', 'funnel_step').eq('metadata->>step', 'complete')
            .order('created_at', { ascending: false }).limit(100),
          range
        ),                                                                       // 7
        // Start events for by-percorso breakdown
        applyRange(
          supabase.from('funnel_v2_events').select('metadata')
            .eq('event_type', 'funnel_step').eq('metadata->>step', 'start')
            .limit(2000),
          range
        ),                                                                       // 8
        // Stripe click events for by-plan breakdown
        applyRange(
          supabase.from('funnel_v2_events').select('metadata')
            .eq('event_type', 'piano_v2_stripe_click')
            .limit(2000),
          range
        ),                                                                       // 9
      ])

      // KPI
      setKpi({
        sessioni:   percorsiView.count || 0,
        completati: qComplete.count    || 0,
        piani:      pianoView.count    || 0,
        stripe:     stripeClick.count  || 0,
      })

      // Main funnel
      const steps = [
        { label: 'Percorsi V2 visitati',      count: percorsiView.count    || 0 },
        { label: 'Questionario iniziato',      count: qStart.count          || 0 },
        { label: 'Questionario completato',    count: qComplete.count       || 0 },
        { label: 'Risultato visualizzato',     count: risultatoView.count   || 0 },
        { label: 'Piano visualizzato',         count: pianoView.count       || 0 },
        { label: 'Click "Inizia ora" (Stripe)', count: stripeClick.count   || 0 },
        { label: 'Click "Entra in app"',       count: appClick.count        || 0 },
        { label: '✅ Conversione (Thankyou)',   count: conversione.count     || 0 },
      ]
      const topCount = steps[0]?.count || 1
      setFunnel(steps.map(s => ({
        ...s,
        pct: topCount > 0 ? Math.round((s.count / topCount) * 100) : 0,
      })))

      // By percorso
      const percorsoMap = {}
      for (const e of (startEvents.data || [])) {
        const p = e.metadata?.percorso || 'unknown'
        percorsoMap[p] = (percorsoMap[p] || 0) + 1
      }
      setByPercorso(
        Object.entries(percorsoMap)
          .map(([id, count]) => ({ id, label: PERCORSI_LABEL[id] || id, count }))
          .sort((a, b) => b.count - a.count)
      )

      // By plan
      const planMap = {}
      for (const e of (stripeEvents.data || [])) {
        const plan = e.metadata?.plan || 'unknown'
        const billing = e.metadata?.billing || 'mensile'
        const key = `${plan}_${billing}`
        planMap[key] = (planMap[key] || 0) + 1
      }
      setByPlan(
        Object.entries(planMap)
          .map(([key, count]) => {
            const [plan, billing] = key.split('_')
            return { key, plan, billing, label: PLAN_LABEL[plan] || plan, count }
          })
          .sort((a, b) => b.count - a.count)
      )

      // Recent completes
      setRecentCompletes((completeEvents.data || []).slice(0, 50))

    } catch (err) {
      console.error('FunnelV2 loadData error:', err)
    } finally {
      setLoading(false)
    }
  }, [preset, customFrom, customTo])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)' }}>Funnel V2</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '2px' }}>
            Percorsi → Questionario → Risultato → Piano → Acquisto
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <DateRangeSelector
            preset={preset} onPreset={setPreset}
            customFrom={customFrom} customTo={customTo} onCustom={handleCustom}
          />
          <button onClick={loadData} className="btn-ghost" title="Aggiorna" style={{ padding: '8px' }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {[
          { icon: Users,             label: 'Sessioni',           value: kpi.sessioni,   color: 'var(--primary)' },
          { icon: TrendingUp,        label: 'Test completati',    value: kpi.completati, color: '#10b981' },
          { icon: MousePointerClick, label: 'Piano visualizzato', value: kpi.piani,      color: '#f59e0b' },
          { icon: ArrowRight,        label: 'Click Stripe',       value: kpi.stripe,     color: '#ef4444' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={17} style={{ color }} />
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
              {loading ? '…' : value.toLocaleString('it-IT')}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>

        {/* Main funnel */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px', color: 'var(--text)' }}>Funnel principale</h2>
          {loading ? (
            <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Caricamento…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {funnel.map((step, idx) => (
                <div key={step.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{step.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
                      {step.count.toLocaleString('it-IT')}
                      {idx > 0 && funnel[idx-1].count > 0 && (
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', marginLeft: '6px' }}>
                          ({Math.round((step.count / funnel[idx-1].count) * 100)}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '3px',
                      background: step.pct > 60 ? 'var(--primary)' : step.pct > 30 ? '#f59e0b' : '#ef4444',
                      width: `${step.pct}%`, transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* By percorso */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text)' }}>Per percorso</h2>
            {loading ? <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Caricamento…</p> : (
              byPercorso.length === 0 ? (
                <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Nessun dato</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {byPercorso.map(({ id, label, count }) => (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{label}</span>
                      <span className="badge" style={{ fontSize: '12px' }}>{count}</span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* By plan */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text)' }}>Click Stripe per piano</h2>
            {loading ? <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Caricamento…</p> : (
              byPlan.length === 0 ? (
                <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Nessun click ancora</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {byPlan.map(({ key, label, billing, count }) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{label}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)', marginLeft: '6px' }}>{billing}</span>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: '12px' }}>{count}</span>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

        </div>
      </div>

      {/* Recent completes */}
      <div className="card" style={{ padding: '22px 24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px', color: 'var(--text)' }}>
          Ultime sessioni completate
        </h2>
        {loading ? (
          <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Caricamento…</p>
        ) : recentCompletes.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Nessuna sessione completata nel periodo</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Data', 'Sessione', 'Percorso', 'Score', 'Livello'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentCompletes.map((e) => {
                  const m = e.metadata || {}
                  const level = m.level || '—'
                  return (
                    <tr key={`${e.session_id}_${e.created_at}`} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }} className="hover-row">
                      <td style={{ padding: '9px 12px', color: 'var(--text-3)' }}>
                        {new Date(e.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-3)', fontFamily: 'monospace', fontSize: '11px' }}>
                        {e.session_id?.slice(0, 16) || '—'}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <span className="badge">{PERCORSI_LABEL[m.percorso] || m.percorso || '—'}</span>
                      </td>
                      <td style={{ padding: '9px 12px', fontWeight: 700, color: 'var(--text)' }}>
                        {m.score ?? '—'}
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        {level !== '—' ? (
                          <span className={`badge ${LEVEL_BADGE[level] || ''}`}>{level}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
