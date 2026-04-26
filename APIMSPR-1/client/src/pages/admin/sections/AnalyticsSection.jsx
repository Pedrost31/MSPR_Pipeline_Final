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
  // Identifiants & dates
  user_id:               'Utilisateur',
  id_activity:           'ID Séance',
  id_intensite:          'ID Intensité',
  id_consumption:        'ID Consommation',
  nutrition_id:          'ID Aliment',
  api_user_id:           'Compte lié',
  date:                  'Date',
  created_at:            'Créé le',
  date_consommation:     'Date de consommation',

  // Profil utilisateur
  age:                   'Âge',
  gender:                'Genre',
  experience_level:      'Niveau d\'expérience',
  weight_kg:             'Poids (kg)',
  height_m:              'Taille (m)',
  bmi_calculated:        'IMC calculé',
  categorie_imc:         'Catégorie IMC',

  // Activité
  workout_type:          'Type d\'activité',
  steps:                 'Nombre de pas',
  calories_burned:       'Calories brûlées',
  session_duration_hours:'Durée séance (h)',
  pct_actif:             '% temps actif',

  // Agrégats par profil
  nb_seances:            'Nombre de séances',
  moy_calories_brulees:  'Cal. brûlées moy.',
  moy_duree_seance_h:    'Durée moy. séance (h)',
  total_steps:           'Pas total cumulé',
  jours_avec_activite:   'Jours avec activité',
  moy_calories_consommees:'Cal. consommées moy.',
  moy_proteines_g:       'Protéines moy. (g)',
  moy_glucides_g:        'Glucides moy. (g)',
  moy_lipides_g:         'Lipides moy. (g)',

  // Bilan calorique
  calories_depensees:    'Calories dépensées',
  calories_consommees:   'Calories consommées',
  solde_calorique:       'Solde calorique',
  statut:                'Statut énergétique',

  // Nutrition / consommation
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

  // Intensité
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

export default function AnalyticsSection() {
  const toast = useToast()

  const [active,   setActive]   = useState('kpi')
  const [data,     setData]     = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [page,     setPage]     = useState(1)

  const view = VIEWS.find(v => v.id === active)

  useEffect(() => {
    setLoading(true)
    setData([])
    setFiltered([])
    setPage(1)

    api('GET', view.endpoint)
      .then(d => { setData(d); setFiltered(d) })
      .catch(e => toast(e.message, 'err'))
      .finally(() => setLoading(false))
  }, [active])

  const cols = filtered.length > 0 ? Object.keys(filtered[0]) : []

  const filter = q => {
    setFiltered(
      data.filter(r =>
        Object.values(r).some(v =>
          String(v).toLowerCase().includes(q.toLowerCase())
        )
      )
    )
    setPage(1)
  }

  const start      = (page - 1) * PAGE_SIZE
  const end        = page * PAGE_SIZE
  const paginated  = filtered.slice(start, end)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

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
          onChange={e => filter(e.target.value)}
        />
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
              <tr>{cols.map(c => <th key={c}>{getLabel(c)}</th>)}</tr>
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
                      <td key={c}>
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
          <button
            className="btn-primary"
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            ⬅
          </button>
          <span style={{ padding: '8px 12px', color: '#475569', fontSize: 13 }}>
            Page {page} / {totalPages}
          </span>
          <button
            className="btn-primary"
            onClick={() => setPage(p => (p < totalPages ? p + 1 : p))}
            disabled={page >= totalPages}
          >
            ➡
          </button>
        </div>
      )}
    </>
  )
}
