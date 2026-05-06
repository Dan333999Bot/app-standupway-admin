import { useState } from 'react'
import { Save } from 'lucide-react'

const FLAGS_DEFAULT = [
  { key: 'chat_enabled',           label: 'Chat di supporto',         desc: 'Abilita la chat AI nella tab Supporto',                    group: 'App' },
  { key: 'community_enabled',      label: 'Comunità',                  desc: 'Mostra la sezione Community agli utenti',                  group: 'App' },
  { key: 'daily_check_enabled',    label: 'Check-in giornaliero',      desc: 'Questionario mood quotidiano in Home',                     group: 'App' },
  { key: 'token_system_enabled',   label: 'Sistema Token',             desc: 'Token e paywall per contenuti premium',                    group: 'App' },
  { key: 'installa_enabled',       label: 'Pagina Installa PWA',       desc: 'Mostra il prompt di installazione PWA',                    group: 'App' },
  { key: 'invita_enabled',         label: 'Referral / Invita',         desc: 'Abilita il programma invita un amico',                     group: 'App' },

  { key: 'cta_hero_enabled',       label: 'CTA Hero (Home)',           desc: 'Banner principale con "Prenota colloquio gratuito"',        group: 'CTA' },
  { key: 'cta_chat_strip_enabled', label: 'CTA strip in Chat',         desc: 'Pulsante colloquio sopra l\'input della chat',             group: 'CTA' },
  { key: 'cta_questionnaire_enabled', label: 'CTA Questionario',       desc: 'Pulsante colloquio nella schermata risultato',             group: 'CTA' },
  { key: 'cta_percorsi_enabled',   label: 'CTA Percorsi',              desc: 'Pulsante colloquio nella lista percorsi',                  group: 'CTA' },

  { key: 'percorsi_alcol',         label: 'Percorso Alcol',            desc: 'Visibilità del percorso Alcol',                            group: 'Percorsi' },
  { key: 'percorsi_cannabis',      label: 'Percorso Cannabis',         desc: 'Visibilità del percorso Cannabis',                         group: 'Percorsi' },
  { key: 'percorsi_cocaina',       label: 'Percorso Crack/Cocaina',    desc: 'Visibilità del percorso Cocaina',                          group: 'Percorsi' },
  { key: 'percorsi_ludopatia',     label: 'Percorso Ludopatia',        desc: 'Visibilità del percorso Ludopatia',                        group: 'Percorsi' },
  { key: 'percorsi_oppiacei',      label: 'Percorso Oppiacei',         desc: 'Visibilità del percorso Oppiacei',                         group: 'Percorsi' },
  { key: 'percorsi_sesso',         label: 'Percorso Sesso/Porno',      desc: 'Visibilità del percorso dipendenza sessuale',              group: 'Percorsi' },
  { key: 'percorsi_famiglie',      label: 'Supporto Famiglie',         desc: 'Visibilità del percorso famiglie',                         group: 'Percorsi' },

  { key: 'maintenance_mode',       label: '🔧 Manutenzione',           desc: 'Mostra splash di manutenzione a tutti gli utenti',         group: 'Sistema' },
  { key: 'registration_open',      label: 'Registrazioni aperte',      desc: 'Permette la creazione di nuovi account',                   group: 'Sistema' },
]

const STORAGE_KEY = 'sw_admin_flags'

const GROUPS = ['App', 'CTA', 'Percorsi', 'Sistema']

function loadFlags() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const out = {}
    FLAGS_DEFAULT.forEach(f => {
      out[f.key] = f.key in saved ? saved[f.key] : (f.key !== 'maintenance_mode')
    })
    return out
  } catch {
    const out = {}
    FLAGS_DEFAULT.forEach(f => { out[f.key] = f.key !== 'maintenance_mode' })
    return out
  }
}

export default function FeatureFlags() {
  const [flags, setFlags] = useState(loadFlags)
  const [saved, setSaved] = useState(false)

  function toggle(key) {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Feature Flags</h1>
          <p className="section-sub">Accendi e spegni sezioni dell'app istantaneamente, senza deploy</p>
        </div>
        <button onClick={save} className="btn btn-primary btn-sm">
          <Save size={14} /> {saved ? '✓ Salvato!' : 'Salva modifiche'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {GROUPS.map(group => {
          const groupFlags = FLAGS_DEFAULT.filter(f => f.group === group)
          return (
            <div key={group} className="card">
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{group}</h3>
              </div>
              <div style={{ padding: '8px 0' }}>
                {groupFlags.map(flag => (
                  <div
                    key={flag.key}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border)',
                      background: flag.key === 'maintenance_mode' && flags[flag.key] ? '#fff5f5' : undefined,
                    }}
                  >
                    <div style={{ flex: 1, marginRight: '20px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>
                        {flag.label}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>{flag.desc}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: flags[flag.key] ? 'var(--success)' : 'var(--text-3)' }}>
                        {flags[flag.key] ? 'ON' : 'OFF'}
                      </span>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={flags[flag.key]}
                          onChange={() => toggle(flag.key)}
                        />
                        <span className="toggle-slider" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
