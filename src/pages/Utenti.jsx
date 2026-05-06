import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Search, RefreshCw } from 'lucide-react'

const ADDICTION_LABEL = {
  alcol: 'Alcol', 'crack-cocaina': 'Crack/Cocaina', ludopatia: 'Ludopatia',
  oppiacei: 'Oppiacei', cannabis: 'Cannabis', 'sesso-pornografia': 'Sesso/Porno',
  famiglie: 'Famiglie',
}

const LEVEL_BADGE = {
  lieve: 'badge-green', moderato: 'badge-yellow',
  significativo: 'badge-yellow', intensivo: 'badge-red',
}

export default function Utenti() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      setUsers(data || [])
    } catch {}
    setLoading(false)
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || (u.nickname || '').toLowerCase().includes(q) || (u.id || '').includes(q)
    const matchFilter = filter === 'all' ||
      (filter === 'with_addiction' && u.addiction_type) ||
      (filter === 'no_addiction' && !u.addiction_type)
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title">Utenti & Lead</h1>
          <p className="section-sub">{users.length} utenti registrati — include lead da questionari anonimi</p>
        </div>
        <button onClick={loadUsers} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Aggiorna
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} color="var(--text-3)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input"
            style={{ paddingLeft: '32px' }}
            placeholder="Cerca per nickname o ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ width: 'auto', minWidth: '160px' }}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">Tutti</option>
          <option value="with_addiction">Con percorso selezionato</option>
          <option value="no_addiction">Senza percorso</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>Caricamento...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)' }}>
            {users.length === 0 ? 'Nessun utente ancora' : 'Nessun risultato per questa ricerca'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nickname</th>
                  <th>Percorso</th>
                  <th>Livello</th>
                  <th>Registrato</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.nickname || <span style={{ color: 'var(--text-3)' }}>Anonimo</span>}</td>
                    <td>
                      {u.addiction_type
                        ? <span className="badge badge-purple">{ADDICTION_LABEL[u.addiction_type] || u.addiction_type}</span>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td>
                      {u.questionnaire_level
                        ? <span className={`badge ${LEVEL_BADGE[u.questionnaire_level] || 'badge-gray'}`}>{u.questionnaire_level}</span>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>
                      {new Date(u.created_at).toLocaleDateString('it')}
                    </td>
                    <td style={{ color: 'var(--text-3)', fontSize: '11px', fontFamily: 'monospace' }}>
                      {u.id?.slice(0, 8)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
