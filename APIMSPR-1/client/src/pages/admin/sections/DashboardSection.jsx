import { useEffect, useState } from 'react'
import { api } from '../../../api'
import { useToast } from '../../../context/ToastContext'
import {
  IconNutrition, IconRun, IconScale, IconBmi, IconCalendar,
} from '../../../components/Icons'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'

const C = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger:  '#ef4444',
  blue:    '#3b82f6',
  pink:    '#ec4899',
  purple:  '#8b5cf6',
  cyan:    '#06b6d4',
  orange:  '#f97316',
}

const CARDS = [
  { key: 'api_users',                label: 'Utilisateurs actifs',    cls: 'blue',  icon: '👤' },
  { key: 'utilisateur',              label: 'Profils santé',           cls: 'green', icon: '🫀' },
  { key: 'nutrition',                label: 'Aliments référencés',     cls: '',      icon: '🥗' },
  { key: 'consommation_alimentaire', label: 'Entrées nutritionnelles', cls: 'amber', icon: '📋' },
  { key: 'activite_journaliere',     label: 'Sessions enregistrées',   cls: 'rose',  icon: '🏋️' },
]

const IMC_COLORS    = [C.danger, C.warning, C.success, C.blue, C.purple]
const GENDER_COLORS = [C.blue, C.pink, C.purple]

const avg   = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
const sum   = arr => arr.reduce((a, b) => a + b, 0)
const fmt   = (n, d = 1) => (isNaN(n) || n === null) ? '—' : Number(n).toFixed(d)
const maxOf = arr => Math.max(...arr, 1)

function InsightCard({ icon: Icon, label, value, detail, color }) {
  return (
    <div className="insight-card">
      <div className="insight-header">
        <span className="insight-icon" style={{ color }}><Icon size={18} /></span>
        <span className="insight-label">{label}</span>
      </div>
      <div className="insight-value" style={{ color }}>{value}</div>
      <div className="insight-detail">{detail}</div>
    </div>
  )
}

export default function DashboardSection() {
  const [stats,        setStats]        = useState({})
  const [kpi,          setKpi]          = useState([])
  const [userFilter,   setUserFilter]   = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const toast = useToast()

  useEffect(() => {
    api('GET', '/auth/stats').then(setStats).catch(e => toast(e.message, 'err'))
    api('GET', '/analytics/kpi').then(setKpi).catch(e => toast(e.message, 'err'))
  }, [])

  if (!kpi || kpi.length === 0) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <span>Chargement du tableau de bord...</span>
      </div>
    )
  }

  /* ── Distributions ──────────────────────────────────────── */
  const allGenders  = [...new Set(kpi.map(d => d.gender).filter(Boolean))]
  const kpiFiltered = genderFilter === 'all' ? kpi : kpi.filter(d => d.gender === genderFilter)

  const imcMap    = {}
  const genderMap = {}
  kpi.forEach(d => { genderMap[d.gender] = (genderMap[d.gender] || 0) + 1 })
  kpiFiltered.forEach(d => { imcMap[d.categorie_imc] = (imcMap[d.categorie_imc] || 0) + 1 })
  const imcData    = Object.entries(imcMap).map(([k, v]) => ({ name: k, value: v }))
  const genderData = Object.entries(genderMap).map(([k, v]) => ({ name: k, value: v }))

  /* ── Séries numériques (globales) ───────────────────────── */
  const nbSeances   = kpi.map(d => Number(d.nb_seances)           || 0)
  const totalSteps  = kpi.map(d => Number(d.total_steps)          || 0)
  const durees      = kpi.map(d => Number(d.moy_duree_seance_h)   || 0)
  const calBrulees  = kpi.map(d => Number(d.moy_calories_brulees) || 0)
  const joursActifs = kpi.map(d => Number(d.jours_avec_activite)  || 0)
  const bmis        = kpi.map(d => Number(d.bmi_calculated)       || 0).filter(b => b > 0)

  /* ── Séries filtrées par genre ──────────────────────────── */
  const nbSeancesF   = kpiFiltered.map(d => Number(d.nb_seances)           || 0)
  const totalStepsF  = kpiFiltered.map(d => Number(d.total_steps)          || 0)
  const dureesF      = kpiFiltered.map(d => Number(d.moy_duree_seance_h)   || 0)
  const calBruleesF  = kpiFiltered.map(d => Number(d.moy_calories_brulees) || 0)
  const joursActifsF = kpiFiltered.map(d => Number(d.jours_avec_activite)  || 0)

  /* ── Agrégats ───────────────────────────────────────────── */
  const totalSeances = sum(nbSeances)
  const totalPas     = sum(totalSteps)
  const avgBMI       = avg(bmis)
  const avgCalBrul   = avg(calBrulees)
  const avgJours     = avg(joursActifs)

  /* ── Cohérence ──────────────────────────────────────────── */
  const inactifs     = kpi.filter(d => Number(d.nb_seances) === 0).length
  const sansConso    = kpi.filter(d => !Number(d.moy_calories_consommees)).length
  const couverture   = Math.round((1 - sansConso / kpi.length) * 100)
  const tauxActivite = Math.round((1 - inactifs  / kpi.length) * 100)
  const imcNormal    = imcMap['Normal'] || 0

  /* ── Données graphiques ─────────────────────────────────── */
  const allUserIds = kpi.map(d => `U${d.user_id}`)

  const bilanData = kpi.map(d => ({
    user:       `U${d.user_id}`,
    brulees:    Number(d.moy_calories_brulees)    || 0,
    consommees: Number(d.moy_calories_consommees) || 0,
  }))

  const macrosData = kpi.map(d => ({
    user:      `U${d.user_id}`,
    proteines: Number(d.moy_proteines_g) || 0,
    glucides:  Number(d.moy_glucides_g)  || 0,
    lipides:   Number(d.moy_lipides_g)   || 0,
  }))

  const bilanFiltered  = userFilter === 'all' ? bilanData  : bilanData.filter(d => d.user === userFilter)
  const macrosFiltered = userFilter === 'all' ? macrosData : macrosData.filter(d => d.user === userFilter)

  const radarData = [
    { metric: 'Séances',  valeur: Math.round(avg(nbSeancesF)   / maxOf(nbSeances)   * 100) },
    { metric: 'Pas',      valeur: Math.round(avg(totalStepsF)  / maxOf(totalSteps)  * 100) },
    { metric: 'Durée',    valeur: Math.round(avg(dureesF)      / maxOf(durees)      * 100) },
    { metric: 'Calories', valeur: Math.round(avg(calBruleesF)  / maxOf(calBrulees)  * 100) },
    { metric: 'Jours',    valeur: Math.round(avg(joursActifsF) / maxOf(joursActifs) * 100) },
  ]

  const filterSelect = (value, onChange, opts, placeholder) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#334155', background: '#f8fafc', cursor: 'pointer' }}
      >
        <option value="all">{placeholder}</option>
        {opts}
      </select>
      {value !== 'all' && (
        <button onClick={() => onChange('all')} style={{ fontSize: 12, color: C.primary, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Réinitialiser
        </button>
      )}
    </div>
  )

  return (
    <>
      <div className="page-title">Tableau de bord</div>

      {/* ── KPI PRIMAIRES ─────────────────────────────────── */}
      <div className="kpi-grid-5">
        {CARDS.map(c => (
          <div key={c.key} className={`stat-card kpi-primary ${c.cls}`}>
            <div className="lbl">{c.label}</div>
            <div className="val">{stats[c.key] ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* ── KPI SECONDAIRES ───────────────────────────────── */}
      <div className="kpi-grid-4">
        <div className="stat-card kpi-secondary" style={{ borderTop: `3px solid ${C.purple}` }}>
          <div className="lbl">IMC moyen</div>
          <div className="val" style={{ color: C.purple }}>{fmt(avgBMI)}</div>
          <div className="kpi-sub">Moyenne des profils</div>
        </div>
        <div className="stat-card kpi-secondary" style={{ borderTop: `3px solid ${C.blue}` }}>
          <div className="lbl">Total séances</div>
          <div className="val" style={{ color: C.blue }}>{totalSeances}</div>
          <div className="kpi-sub">Toutes activités cumulées</div>
        </div>
        <div className="stat-card kpi-secondary" style={{ borderTop: `3px solid ${C.success}` }}>
          <div className="lbl">Total pas cumulés</div>
          <div className="val" style={{ color: C.success }}>{totalPas.toLocaleString('fr-FR')}</div>
          <div className="kpi-sub">Somme de tous les utilisateurs</div>
        </div>
        <div className="stat-card kpi-secondary" style={{ borderTop: `3px solid ${C.warning}` }}>
          <div className="lbl">Cal. brûlées moy.</div>
          <div className="val" style={{ color: C.warning }}>{Math.round(avgCalBrul)} kcal</div>
          <div className="kpi-sub">Moyenne par utilisateur</div>
        </div>
      </div>

      {/* ── BILAN GLOBAL ──────────────────────────────────── */}
      <div className="section-title">
        <IconBmi size={16} /> Bilan global du projet
      </div>
      <div className="insights-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <InsightCard
          icon={IconNutrition}
          label="Couverture nutritionnelle"
          value={`${couverture}%`}
          detail={`${kpi.length - sansConso}/${kpi.length} profils avec données`}
          color={couverture >= 80 ? C.success : couverture >= 50 ? C.warning : C.danger}
        />
        <InsightCard
          icon={IconRun}
          label="Taux d'activité"
          value={`${tauxActivite}%`}
          detail={inactifs === 0 ? 'Tous les profils ont des sessions' : `${inactifs} profil(s) sans activité`}
          color={inactifs === 0 ? C.success : C.warning}
        />
        <InsightCard
          icon={IconBmi}
          label="IMC dans la norme"
          value={`${Math.round(imcNormal / kpi.length * 100)}%`}
          detail={`${imcNormal}/${kpi.length} profils avec IMC normal (18.5–25)`}
          color={C.success}
        />
        <InsightCard
          icon={IconCalendar}
          label="Jours d'activité moyens"
          value={fmt(avgJours, 0)}
          detail="Moyenne de jours actifs par profil"
          color={C.cyan}
        />
      </div>

      {/* ── GRAPHIQUES ────────────────────────────────────── */}
      <div className="section-title">
        <IconScale size={16} /> Analyses graphiques
      </div>

      {/* Filtre genre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Filtrer par genre :</span>
        {filterSelect(
          genderFilter, setGenderFilter,
          allGenders.map(g => <option key={g} value={g}>{g} ({kpi.filter(d => d.gender === g).length})</option>),
          `Tous (${kpi.length})`
        )}
      </div>

      {/* Ligne 1 : distributions + radar */}
      <div className="charts-grid-3">
        <div className="chart-card">
          <h3>Répartition IMC{genderFilter !== 'all' ? ` — ${genderFilter}` : ''}</h3>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie data={imcData} dataKey="value" nameKey="name" outerRadius={85}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine
              >
                {imcData.map((_, i) => <Cell key={i} fill={IMC_COLORS[i % IMC_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Genre des profils</h3>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie data={genderData} dataKey="value" nameKey="name" outerRadius={85} innerRadius={40}
                label={({ name, value }) => `${name} (${value})`} labelLine
              >
                {genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Performance moyenne{genderFilter !== 'all' ? ` — ${genderFilter}` : ''}</h3>
          <ResponsiveContainer width="100%" height={270}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar name="% normalisé" dataKey="valeur" stroke={C.primary} fill={C.primary} fillOpacity={0.25} />
              <Tooltip formatter={v => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filtre utilisateur */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 14px' }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Filtrer par utilisateur :</span>
        {filterSelect(
          userFilter, setUserFilter,
          allUserIds.map(uid => <option key={uid} value={uid}>{uid}</option>),
          `Tous les utilisateurs (${allUserIds.length})`
        )}
      </div>

      {/* Ligne 2 : bilan + macros filtrés */}
      <div className="charts-grid-2">
        <div className="chart-card">
          <h3>Bilan calorique — Dépenses vs Apports (kcal)</h3>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={bilanFiltered} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="user" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="brulees"    fill={C.danger}  radius={[4, 4, 0, 0]} name="Cal. brûlées" />
              <Bar dataKey="consommees" fill={C.success} radius={[4, 4, 0, 0]} name="Cal. consommées" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Macronutriments moyens par utilisateur (g)</h3>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={macrosFiltered} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="user" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="proteines" stackId="a" fill={C.blue}    name="Protéines" />
              <Bar dataKey="glucides"  stackId="a" fill={C.warning} name="Glucides" />
              <Bar dataKey="lipides"   stackId="a" fill={C.orange}  radius={[4, 4, 0, 0]} name="Lipides" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
