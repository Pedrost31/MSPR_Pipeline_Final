import { useEffect, useState } from 'react'
import { api } from '../../../api'
import { useToast } from '../../../context/ToastContext'
import { IconEmpty } from '../../../components/Icons'

const PAGE_SIZE = 20

const VIEWS = [
  {
    id: 'kpi',
    label: 'Indicateurs clés',
    endpoint: '/analytics/kpi',
    desc: 'KPI globaux de santé et d\'activité par utilisateur (séances, calories, pas, macros)',
  },
  {
    id: 'profil',
    label: 'Profils de santé',
    endpoint: '/analytics/profil',
    desc: 'Profil complet avec catégorie IMC, poids, taille et statistiques agrégées d\'activité',
  },
  {
    id: 'resume',
    label: 'Résumé journalier',
    endpoint: '/analytics/resume',
    desc: 'Vue combinée activité + apport nutritionnel par journée',
  },
  {
    id: 'bilan',
    label: 'Bilan calorique',
    endpoint: '/analytics/bilan',
    desc: 'Comparaison entre calories dépensées à l\'effort et calories consommées',
  },
  {
    id: 'apport',
    label: 'Apport nutritionnel',
    endpoint: '/analytics/apport',
    desc: 'Détail des apports en macronutriments par repas et par date',
  },
  {
    id: 'intensite',
    label: 'Intensité des séances',
    endpoint: '/analytics/intensite',
    desc: 'Répartition des niveaux d\'intensité (faible / modéré / élevé) par séance',
  },
]

const COLUMN_LABELS = {
  user_id:               'Utilisateur',
  id_activity:           'ID Séance',
  id_intensite:          'ID Intensité',
  id_consumption:        'ID Consommation',
  nutrition_id:          'ID Aliment',
  api_user_id:           'Compte lié',
  date:                  'Date',
  created_at:            'Créé le',
  date_consommation:     'Date de consommation',
  age:                   'Âge',
  gender:                'Genre',
  experience_level:      'Niveau d\'expérience',
  weight_kg:             'Poids (kg)',
  height_m:              'Taille (m)',
  bmi_calculated:        'IMC calculé',
  categorie_imc:         'Catégorie IMC',
  workout_type:          'Type d\'activité',
  steps:                 'Nombre de pas',
  calories_burned:       'Calories brûlées',
  session_duration_hours:'Durée séance (h)',
  pct_actif:             '% temps actif',
  nb_seances:            'Nombre de séances',
  moy_calories_brulees:  'Cal. brûlées moy.',
  moy_duree_seance_h:    'Durée moy. séance (h)',
  total_steps:           'Pas total cumulé',
  jours_avec_activite:   'Jours avec activité',
  moy_calories_consommees:'Cal. consommées moy.',
  moy_proteines_g:       'Protéines moy. (g)',
  moy_glucides_g:        'Glucides moy. (g)',
  moy_lipides_g:         'Lipides moy. (g)',
  calories_depensees:    'Calories dépensées',
  calories_consommees:   'Calories consommées',
  solde_calorique:       'Solde calorique',
  statut:                'Statut énergétique',
  repas_type:            'Type de repas',
  food_item:             'Aliment',
  quantite_grammes:      'Quantité (g)',
  quantite_g:            'Quantité (g)',
  calories_kcal:         'Calories (kcal)',
  calories_apport:       'Calories apport',
  protein_g:             'Protéines (g)',
  proteines_g:           'Protéines (g)',
  carbohydrates_g:       'Glucides (g)',
  glucides_g:            'Glucides (g)',
  fat_g:                 'Lipides (g)',
  lipides_g:             'Lipides (g)',
  fiber_g:               'Fibres (g)',
  sugars_g:              'Sucres (g)',
  sodium_mg:             'Sodium (mg)',
  cholesterol_mg:        'Cholestérol (mg)',
  meal_type:             'Type de repas',
  water_intake_ml:       'Eau (ml)',
  category:              'Catégorie',
  nb_niveaux:            'Nb niveaux d\'intensité',
  distance_totale:       'Distance totale',
  minutes_totales:       'Durée totale (min)',
  niveau_intensite:      'Niveau d\'intensité',
  distance:              'Distance',
  minutes:               'Minutes',
}

const getLabel = col =>
  COLUMN_LABELS[col] ||
  col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

const NUMERIC_COLS = new Set([
  'age','weight_kg','height_m','bmi_calculated','nb_seances','moy_calories_brulees',
  'moy_duree_seance_h','total_steps','jours_avec_activite','moy_calories_consommees',
  'moy_proteines_g','moy_glucides_g','moy_lipides_g','calories_burned','steps',
  'session_duration_hours','pct_actif','calories_depensees','calories_consommees',
  'solde_calorique','quantite_grammes','quantite_g','calories_kcal','protein_g',
  'carbohydrates_g','fat_g','fiber_g','sugars_g','sodium_mg','cholesterol_mg',
  'water_intake_ml','distance','minutes','distance_totale','minutes_totales',
  'nb_niveaux','calories_apport','proteines_g','glucides_g','lipides_g',
])

function sortRows(rows, col, dir) {
  if (!col) return rows
  return [...rows].sort((a, b) => {
    const av = a[col], bv = b[col]
    if (av === null || av === undefined) return 1
    if (bv === null || bv === undefined) return -1
    const cmp = NUMERIC_COLS.has(col)
      ? Number(av) - Number(bv)
      : String(av).localeCompare(String(bv))
    return dir === 'asc' ? cmp : -cmp
  })
}

export default function AnalyticsSection() {
  const toast = useToast()

  const [active,   setActive]   = useState('kpi')
  const [data,     setData]     = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [page,     setPage]     = useState(1)
  const [sortCol,  setSortCol]  = useState(null)
  const [sortDir,  setSortDir]  = useState('asc')
  const [searchQ,  setSearchQ]  = useState('')

  const view = VIEWS.find(v => v.id === active)

  useEffect(() => {
    setLoading(true)
    setData([])
    setFiltered([])
    setPage(1)
    setSortCol(null)
    setSortDir('asc')
    setSearchQ('')

    api('GET', view.endpoint)
      .then(d => { setData(d); setFiltered(d) })
      .catch(e => toast(e.message, 'err'))
      .finally(() => setLoading(false))
  }, [active])

  const handleSearch = q => {
    setSearchQ(q)
    setFiltered(q
      ? data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q.toLowerCase())))
      : data
    )
    setPage(1)
  }

  const handleSort = col => {
    const newDir = sortCol === col && sortDir === 'asc' ? 'desc' : 'asc'
    setSortCol(col)
    setSortDir(newDir)
    setPage(1)
  }

  const resetSort = () => { setSortCol(null); setSortDir('asc'); setPage(1) }

  const cols       = filtered.length > 0 ? Object.keys(filtered[0]) : []
  const sorted     = sortRows(filtered, sortCol, sortDir)
  const start      = (page - 1) * PAGE_SIZE
  const paginated  = sorted.slice(start, start + PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const SortIcon = ({ col }) => {
    if (sortCol !== col) return <span style={{ color: '#cbd5e1', marginLeft: 4 }}>⇅</span>
    return <span style={{ color: '#6366f1', marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <>
      <div className="page-title">Analytiques</div>

      <div className="analytics-tabs">
        {VIEWS.map(v => (
          <button
            key={v.id}
            className={`analytics-tab${active === v.id ? ' active' : ''}`}
            onClick={() => setActive(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="page-sub">{view.desc}</div>

      <div className="toolbar">
        <input
          className="search"
          placeholder="Rechercher…"
          value={searchQ}
          onChange={e => handleSearch(e.target.value)}
        />
        {sortCol && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#ede9fe', borderRadius: 20, fontSize: 12, color: '#6366f1' }}>
            <span>Trié par <strong>{getLabel(sortCol)}</strong> {sortDir === 'asc' ? '↑' : '↓'}</span>
            <button
              onClick={resetSort}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 700, padding: 0 }}
              title="Supprimer le tri"
            >✕</button>
          </div>
        )}
        <span className="badge badge-user">
          {filtered.length} ligne{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">Chargement…</div>
        ) : (
          <table>
            <thead>
              <tr>
                {cols.map(c => (
                  <th
                    key={c}
                    onClick={() => handleSort(c)}
                    style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    title={`Trier par ${getLabel(c)}`}
                  >
                    {getLabel(c)}<SortIcon col={c} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={cols.length || 1} className="empty">
                    <div className="empty-icon"><IconEmpty size={40} /></div>
                    Aucune donnée
                  </td>
                </tr>
              ) : (
                paginated.map((r, i) => (
                  <tr key={i}>
                    {cols.map(c => (
                      <td key={c} style={sortCol === c ? { background: '#f5f3ff' } : {}}>
                        {r[c] !== null && r[c] !== undefined ? String(r[c]) : '—'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 20 }}>
          <button className="btn-primary" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>⬅</button>
          <span style={{ padding: '8px 12px', color: '#475569', fontSize: 13 }}>
            Page {page} / {totalPages}
          </span>
          <button className="btn-primary" onClick={() => setPage(p => (p < totalPages ? p + 1 : p))} disabled={page >= totalPages}>➡</button>
        </div>
      )}
    </>
  )
}
