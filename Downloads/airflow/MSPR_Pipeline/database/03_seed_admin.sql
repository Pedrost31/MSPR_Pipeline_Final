-- ============================================================
-- HealthAI — Compte administrateur par défaut
-- Créé automatiquement au premier démarrage du conteneur
-- Email : admin@gmail.com  |  Mot de passe : admin
-- ============================================================

SET search_path = healthai, public;

INSERT INTO api_users (email, password_hash, role)
VALUES (
  'admin@gmail.com',
  '$2b$10$sA55Yd6kXXdmplgFVj3kX.lwH8Qhab6CkWY1HuBuSH/jr3B04zxzu',
  'admin'
)
ON CONFLICT (email) DO NOTHING;
