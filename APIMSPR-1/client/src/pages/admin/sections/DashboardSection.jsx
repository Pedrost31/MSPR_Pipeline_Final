import { useEffect, useState } from 'react'
import { api } from '../../../api'
import { useToast } from '../../../context/ToastContext'
import {
  IconNutrition, IconRun, IconScale, IconBmi,
  IconLink, IconCalendar, IconProtein, IconGrain,
} from '../../../components/Icons'

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
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
  { key: 'api_users',                label: 'Utilisateurs actifs',      cls: 'blue',   icon: '👤' },
  { key: 'utilisateur',              label: 'Profils santé',             cls: 'green',  icon: '🫀' },
  { key: 'nutrition',                label: 'Aliments référencés',       cls: '',       icon: '🥗' },
  { key: 'consommation_alimentaire', label: 'Entrées nutritionnelles',   cls: 'amber',  icon: '📋' },
  { key: 'activite_journaliere',     label: 'Sessions enregistrées',     cls: 'rose',   icon: '🏋️' },
]

const IMC_COLORS    = [C.danger, C.warning, C.success, C.blue, C.purple]
const GENDER_COLORS = [C.blue, C.pink, C.purple]

const avg  = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
const sum  = arr => arr.reduce((a, b) => a + b, 0)
const fmt  = (n, d = 1) => (isNaN(n) || n === null) ? '—' : Number(n).toFixed(d)
const maxOf = arr => Math.max(...arr, 1)

function InsightCard({ icon: Icon, label, value, detail, color, gradient }) {
  return (
    <div className="insight-card" style={{ background: gradient || 'var(--surface)' }}>
      <div className="insight-header">
        <span className="insight-icon" style={{ color }}>
          <Icon size={18} />
        </span>
        <span className="insight-label">{label}</span>
      </div>
      <div className="insight-value" style={{ color }}>{value}</div>
      <div className="insight-detail">{detail}</div>
    </div>
  )
}

export default function DashboardSection() {
  const [stats, setStats] = useState({})
  const [kpi,   setKpi]   = useState([])
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

  /* ── Distributions ─────────────────────────────────────────── */
  const imcMap    = {}
  const genderMap = {}
  kpi.forEach(d => {
    imcMap[d.categorie_imc]  = (imcMap[d.categorie_imc]  || 0) + 1
    genderMap[d.gender]      = (genderMap[d.gender]       || 0) + 1
  })
  const imcData    = Object.entries(imcMap).map(([k, v]) => ({ name: k, value: v }))
  const genderData = Object.entries(genderMap).map(([k, v]) => ({ name: k, value: v }))

  /* ── Séries numériques ─────────────────────────────────────── */
  const nbSeances   = kpi.map(d => Number(d.nb_seances)              || 0)
  const totalSteps  = kpi.map(d => Number(d.total_steps)             || 0)
  const durees      = kpi.map(d => Number(d.moy_duree_seance_h)      || 0)
  const calBrulees  = kpi.map(d => Number(d.moy_calories_brulees)    || 0)
  const joursActifs = kpi.map(d => Number(d.jours_avec_activite)     || 0)
  const bmis        = kpi.map(d => Number(d.bmi_calculated)          || 0).filter(b => b > 0)
  const proteines   = kpi.map(d => Number(d.moy_proteines_g)         || 0)
  const glucides    = kpi.map(d => Number(d.moy_glucides_g)          || 0)
  const lipides     = kpi.map(d => Number(d.moy_lipides_g)           || 0)

  /* ── Agrégats ──────────────────────────────────────────────── */
  const totalSeances = sum(nbSeances)
  const totalPas     = sum(totalSteps)
  const avgBMI       = avg(bmis)
  const avgCalBrul   = avg(calBrulees)
  const avgJours     = avg(joursActifs)

  /* ── Cohérence ─────────────────────────────────────────────── */
  const inactifs       = kpi.filter(d => Number(d.nb_seances) === 0).length
  const sansConso      = kpi.filter(d => !Number(d.moy_calories_consommees)).length
  const enDeficit      = kpi.filter(d => Number(d.moy_calories_consommees) > 0 && Number(d.moy_calories_brulees) > Number(d.moy_calories_consommees)).length
  const enExcedent     = kpi.filter(d => Number(d.moy_calories_consommees) > 0 && Number(d.moy_calories_consommees) > Number(d.moy_calories_brulees)).length
  const couverture     = Math.round((1 - sansConso / kpi.length) * 100)
  const tauxActivite   = Math.round((1 - inactifs  / kpi.length) * 100)
  const imcNormal      = imcMap['Normal'] || 0
  const comptesOrphans = Math.max(0, (stats.api_users || 0) - (stats.utilisateur || 0))

  /* ── Données graphiques ────────────────────────────────────── */
  const seanceData = kpi.map(d => ({ user: `U${d.user_id}`, seances: Number(d.nb_seances) || 0 }))
  const dureeData  = kpi.map(d => ({ user: `U${d.user_id}`, duree:   Number(d.moy_duree_seance_h) || 0 }))
  const stepsData  = kpi.map(d => ({ user: `U${d.user_id}`, steps:   Number(d.total_steps) || 0 }))
  const joursData  = kpi.map(d => ({ user: `U${d.user_id}`, jours:   Number(d.jours_avec_activite) || 0 }))

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

  const radarData = [
    { metric: 'Séances',      valeur: Math.round(avg(nbSeances)   / maxOf(nbSeances)   * 100) },
    { metric: 'Pas',          valeur: Math.round(avg(totalSteps)  / maxOf(totalSteps)  * 100) },
    { metric: 'Durée',        valeur: Math.round(avg(durees)      / maxOf(durees)      * 100) },
    { metric: 'Calories',     valeur: Math.round(avg(calBrulees)  / maxOf(calBrulees)  * 100) },
    { metric: 'Jours actifs', valeur: Math.round(avg(joursActifs) / maxOf(joursActifs) * 100) },
  ]

  return (
    <>
      <div className="page-title">Tableau de bord</div>

      {/* ─── KPI PRIMAIRES ────────────────────────────────────── */}
      <div className="kpi-grid-5">
        {CARDS.map(c => (
          <div key={c.key} className={`stat-card kpi-primary ${c.cls}`}>
            <div className="lbl">{c.label}</div>
            <div className="val">{stats[c.key] ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* ─── KPI SECONDAIRES ──────────────────────────────────── */}
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

      {/* ─── BILAN GLOBAL ─────────────────────────────────────── */}
      <div className="section-title">
        <IconBmi size={16} /> Bilan global du projet
      </div>
      <div className="insights-grid">
        <InsightCard
          icon={IconNutrition}
          label="Couverture nutritionnelle"
          value={`${couverture}%`}
          detail={`${kpi.length - sansConso}/${kpi.length} profils avec données nutritionnelles`}
          color={couverture >= 80 ? C.success : couverture >= 50 ? C.warning : C.danger}
        />
        <InsightCard
          icon={IconRun}
          label="Taux d'activité"
          value={`${tauxActivite}%`}
          detail={inactifs === 0 ? 'Tous les profils ont des sessions' : `${inactifs} profil(s) sans activité enregistrée`}
          color={inactifs === 0 ? C.success : C.warning}
        />
        <InsightCard
          icon={IconScale}
          label="Équilibre calorique"
          value={`${enDeficit + enExcedent}/${kpi.length}`}
          detail={`${enDeficit} en déficit  ·  ${enExcedent} en excédent`}
          color={C.primary}
        />
        <InsightCard
          icon={IconBmi}
          label="IMC dans la norme"
          value={`${Math.round(imcNormal / kpi.length * 100)}%`}
          detail={`${imcNormal}/${kpi.length} profils avec IMC normal (18.5–25)`}
          color={C.success}
        />
        <InsightCard
          icon={IconLink}
          label="Comptes sans profil santé"
          value={comptesOrphans}
          detail={comptesOrphans === 0 ? 'Tous les comptes ont un profil associé' : `${comptesOrphans} compte(s) non reliés à un profil`}
          color={comptesOrphans === 0 ? C.success : C.danger}
        />
        <InsightCard
          icon={IconCalendar}
          label="Jours d'activité moyens"
          value={fmt(avgJours, 0)}
          detail="Nombre moyen de jours actifs par profil"
          color={C.cyan}
        />
        <InsightCard
          icon={IconProtein}
          label="Protéines moyennes"
          value={`${fmt(avg(proteines), 0)} g`}
          detail="Apport protéique moyen par utilisateur"
          color={C.orange}
        />
        <InsightCard
          icon={IconGrain}
          label="Glucides / Lipides moy."
          value={`${fmt(avg(glucides), 0)} / ${fmt(avg(lipides), 0)} g`}
          detail="Glucides et lipides moyens par utilisateur"
          color={C.pink}
        />
      </div>

      {/* ─── GRAPHIQUES ───────────────────────────────────────── */}
      <div className="section-title">
        <IconScale size={16} /> Analyses graphiques
      </div>

      {/* Ligne 1 : 3 colonnes */}
      <div className="charts-grid-3">
        <div className="chart-card">
          <h3>Répartition IMC</h3>
          <ResponsiveContainer width="100%" height={270}>
            <PieChart>
              <Pie
                data={imcData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
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
              <Pie
                data={genderData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                innerRadius={40}
                label
              >
                {genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Profil de performance moyen</h3>
          <ResponsiveContainer width="100%" height={270}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
              <Radar
                name="Moyenne normalisée"
                dataKey="valeur"
                stroke={C.primary}
                fill={C.primary}
                fillOpacity={0.25}
              />
              <Tooltip formatter={v => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ligne 2 : 2 colonnes */}
      <div className="charts-grid-2" style={{ marginTop: 20 }}>
        <div className="chart-card">
          <h3>Bilan calorique moyen — Dépenses vs Apports (kcal)</h3>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={bilanData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
            <BarChart data={macrosData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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

      {/* Ligne 3 : 4 colonnes */}
      <div className="charts-grid-4" style={{ marginTop: 20 }}>
        <div className="chart-card">
          <h3>Séances par utilisateur</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={seanceData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="user" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="seances" fill={C.primary} radius={[4, 4, 0, 0]} name="Séances" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Jours d&apos;activité enregistrés</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={joursData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="grad-jours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.cyan} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={C.cyan} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="user" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="jours" stroke={C.cyan} fill="url(#grad-jours)" name="Jours actifs" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Total des pas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stepsData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="user" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="steps" fill={C.success} radius={[4, 4, 0, 0]} name="Pas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Durée moy. séances (h)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dureeData} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="user" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="duree" fill={C.warning} radius={[4, 4, 0, 0]} name="Durée (h)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
