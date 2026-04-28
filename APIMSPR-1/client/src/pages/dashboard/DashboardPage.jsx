import { useState, useEffect } from 'react'
import { api } from '../../api'
import { useAuth } from '../../context/AuthContext'
import {
  IconHome, IconActivity, IconBowl,
  IconFood, IconTrend, IconEmpty, IconBmi, IconRun,
} from '../../components/Icons'

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line,
} from 'recharts'

const C = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  blue:    '#3b82f6',
  orange:  '#f97316',
  cyan:    '#06b6d4',
}

const PAGE_SIZE = 20

const COLUMN_LABELS = {
  id_activity:            'ID',
  id_consumption:         'ID',
  date:                   'Date',
  date_consommation:      'Date',
  workout_type:           "Type d'activité",
  steps:                  'Pas',
  calories_burned:        'Cal. brûlées',
  session_duration_hours: 'Durée (h)',
  pct_actif:              '% actif',
  repas_type:             'Repas',
  food_item:              'Aliment',
  quantite_grammes:       'Quantité (g)',
  bmi_calculated:         'IMC',
  categorie_imc:          'Catégorie IMC',
  nb_seances:             'Séances',
  moy_calories_brulees:   'Cal. brûlées moy.',
  total_steps:            'Pas total',
  food_item_name:         'Aliment',
  category:               'Catégorie',
  calories_kcal:          'Calories (kcal)',
  protein_g:              'Protéines (g)',
  carbohydrates_g:        'Glucides (g)',
  fat_g:                  'Lipides (g)',
}
const colLabel = k => COLUMN_LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

const SECTIONS = [
  { id: 'home',     label: 'Accueil',      icon: <IconHome size={16}/>,     group: 'Mon espace' },
  { id: 'bilan',    label: 'Mon bilan',    icon: <IconTrend size={16}/>,    group: 'Mon espace',  endpoint: '/analytics/kpi',        cols: ['bmi_calculated','categorie_imc','nb_seances','moy_calories_brulees','total_steps'] },
  { id: 'activite', label: 'Activité',     icon: <IconActivity size={16}/>, group: 'Mes données', endpoint: '/activite_quotidienne', cols: ['id_activity','date','workout_type','steps','calories_burned','session_duration_hours','pct_actif'] },
  { id: 'conso',    label: 'Consommation', icon: <IconBowl size={16}/>,     group: 'Mes données', endpoint: '/consommation',         cols: ['id_consumption','date_consommation','repas_type','food_item','quantite_grammes'] },
  { id: 'aliment',  label: 'Aliments',     icon: <IconFood size={16}/>,     group: 'Référentiel', endpoint: '/aliment',              cols: ['food_item','category','calories_kcal','protein_g','carbohydrates_g','fat_g'] },
]

function DataTable({ section }) {
  const [data,     setData]     = useState([])
  const [filtered, setFiltered] = useState([])
  const [page,     setPage]     = useState(1)

  useEffect(() => {
    api('GET', section.endpoint)
      .then(d => { setData(d); setFiltered(d); setPage(1) })
      .catch(() => {})
  }, [section.endpoint])

  const cols       = section.cols || (data.length > 0 ? Object.keys(data[0]).slice(0, 6) : [])
  const start      = (page - 1) * PAGE_SIZE
  const paginated  = filtered.slice(start, start + PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const filter = q => {
    setFiltered(data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q.toLowerCase()))))
    setPage(1)
  }

  return (
    <>
      <div className="page-title">{section.label}</div>
      <div className="page-sub">Vos données — lecture seule</div>
      <div className="toolbar">
        <input className="search" placeholder="Rechercher…" onChange={e => filter(e.target.value)} />
        <span className="badge badge-user">{filtered.length} ligne{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr>{cols.map(c => <th key={c}>{colLabel(c)}</th>)}</tr></thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={cols.length} className="empty"><div className="empty-icon"><IconEmpty size={40}/></div>Aucune donnée</td></tr>
            ) : (
              paginated.map((r, i) => (
                <tr key={i}>{cols.map(c => <td key={c}>{r[c] ?? '—'}</td>)}</tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {filtered.length > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 20 }}>
          <button className="btn-primary" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>⬅</button>
          <span style={{ padding: '8px 12px', color: '#475569', fontSize: 13 }}>Page {page} / {totalPages}</span>
          <button className="btn-primary" onClick={() => setPage(p => (p < totalPages ? p + 1 : p))} disabled={page >= totalPages}>➡</button>
        </div>
      )}
    </>
  )
}

function HomeDashboard({ user }) {
  const [kpiUser,    setKpiUser]    = useState(null)
  const [actData,    setActData]    = useState([])
  const [apportData, setApportData] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    api('GET', '/analytics/kpi')
      .then(d => setKpiUser(Array.isArray(d) ? d[0] : d))
      .catch(() => {})
      .finally(() => setLoading(false))
    api('GET', '/activite_quotidienne').then(setActData).catch(() => {})
    api('GET', '/analytics/apport').then(setApportData).catch(() => {})
  }, [])

  const activityChart = [...actData]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30)
    .map(d => ({
      date:     String(d.date || '').slice(0, 10),
      calories: Number(d.calories_burned)         || 0,
      pas:      Number(d.steps)                   || 0,
      duree:    Number(d.session_duration_hours)  || 0,
    }))

  const byDate = {}
  apportData.forEach(d => {
    const date = String(d.date_consommation || d.date || '').slice(0, 10)
    if (!byDate[date]) byDate[date] = { date, proteines: 0, glucides: 0, lipides: 0, calories: 0 }
    byDate[date].proteines += Number(d.proteines_g)     || 0
    byDate[date].glucides  += Number(d.glucides_g)      || 0
    byDate[date].lipides   += Number(d.lipides_g)       || 0
    byDate[date].calories  += Number(d.calories_apport) || 0
  })
  const nutritionChart = Object.values(byDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-20)

  const fmt      = (n, d = 1) => (n == null || isNaN(n)) ? '—' : Number(n).toFixed(d)
  const imc      = Number(kpiUser?.bmi_calculated)
  const imcColor = imc < 18.5 ? C.warning : imc <= 25 ? C.success : imc <= 30 ? C.warning : C.danger

  if (loading) {
    return <div className="dashboard-loading"><div className="spinner" /><span>Chargement...</span></div>
  }

  return (
    <>
      <div className="welcome-card">
        <h2>Bonjour, {user?.email?.split('@')[0]} 👋</h2>
        <p>Voici votre tableau de bord personnel HealthAI.</p>
      </div>

      {kpiUser && (
        <div className="kpi-grid-4" style={{ marginTop: 20 }}>
          <div className="stat-card kpi-secondary" style={{ borderTop: `3px solid ${imcColor}` }}>
            <div className="lbl">IMC</div>
            <div className="val" style={{ color: imcColor }}>{fmt(kpiUser.bmi_calculated)}</div>
            <div className="kpi-sub">{kpiUser.categorie_imc || '—'}</div>
          </div>
          <div className="stat-card kpi-secondary" style={{ borderTop: `3px solid ${C.blue}` }}>
            <div className="lbl">Séances</div>
            <div className="val" style={{ color: C.blue }}>{kpiUser.nb_seances || '—'}</div>
            <div className="kpi-sub">Sessions enregistrées</div>
          </div>
          <div className="stat-card kpi-secondary" style={{ borderTop: `3px solid ${C.success}` }}>
            <div className="lbl">Total pas</div>
            <div className="val" style={{ color: C.success }}>{Number(kpiUser.total_steps || 0).toLocaleString('fr-FR')}</div>
            <div className="kpi-sub">Pas cumulés</div>
          </div>
          <div className="stat-card kpi-secondary" style={{ borderTop: `3px solid ${C.warning}` }}>
            <div className="lbl">Cal. brûlées moy.</div>
            <div className="val" style={{ color: C.warning }}>{Math.round(Number(kpiUser.moy_calories_brulees) || 0)} kcal</div>
            <div className="kpi-sub">Par séance</div>
          </div>
        </div>
      )}

      {activityChart.length > 0 ? (
        <>
          <div className="section-title" style={{ marginTop: 28 }}>
            <IconRun size={16} /> Suivi d&apos;activité
          </div>
          <div className="charts-grid-2">
            <div className="chart-card">
              <h3>Calories brûlées par séance</h3>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={activityChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="grad-cal-user" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.danger} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.danger} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="calories" stroke={C.danger} fill="url(#grad-cal-user)" name="Calories brûlées" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Pas par séance</h3>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={activityChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="pas" fill={C.success} radius={[4, 4, 0, 0]} name="Pas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="chart-card" style={{ marginTop: 20 }}>
            <h3>Durée des séances (h)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={activityChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="duree" stroke={C.primary} dot={false} name="Durée (h)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="empty" style={{ marginTop: 24 }}>
          <div className="empty-icon"><IconEmpty size={40}/></div>
          Aucune donnée d&apos;activité enregistrée
        </div>
      )}

      {nutritionChart.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 28 }}>
            <IconBmi size={16} /> Suivi nutritionnel
          </div>
          <div className="charts-grid-2">
            <div className="chart-card">
              <h3>Macronutriments par jour (g)</h3>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={nutritionChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="proteines" stackId="a" fill={C.blue}    name="Protéines" />
                  <Bar dataKey="glucides"  stackId="a" fill={C.warning} name="Glucides" />
                  <Bar dataKey="lipides"   stackId="a" fill={C.orange}  radius={[4, 4, 0, 0]} name="Lipides" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Apport calorique par jour (kcal)</h3>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={nutritionChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="grad-nut-user" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.cyan} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={C.cyan} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="calories" stroke={C.cyan} fill="url(#grad-nut-user)" name="Calories consommées" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [active, setActive] = useState('home')

  const groups        = [...new Set(SECTIONS.map(s => s.group))]
  const activeSection = SECTIONS.find(s => s.id === active)

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Health<span>AI</span></div>
        {groups.map(g => (
          <div key={g}>
            <div className="sidebar-group">{g}</div>
            {SECTIONS.filter(s => s.group === g).map(s => (
              <div
                key={s.id}
                className={`sidebar-item${active === s.id ? ' active' : ''}`}
                onClick={() => setActive(s.id)}
              >
                <span className="icon">{s.icon}</span> {s.label}
              </div>
            ))}
          </div>
        ))}
        <div className="sidebar-footer">
          <strong>{user?.email}</strong>
          <span className="sidebar-user-badge">user</span>
          <button className="btn-logout-muted" onClick={logout}>Déconnexion</button>
        </div>
      </aside>
      <main className="main">
        {active === 'home' ? (
          <HomeDashboard user={user} />
        ) : activeSection?.endpoint ? (
          <DataTable section={activeSection} />
        ) : null}
      </main>
    </div>
  )
}
