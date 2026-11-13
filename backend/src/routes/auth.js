import { Router } from 'express';
import { supabaseAdmin, supabaseAuth } from '../config/supabase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncRoute } from '../utils/http.js';

const router = Router();

// Le navigateur envoie un username. Le serveur retrouve l'adresse liée sans exposer la table profiles.
router.post('/login', asyncRoute(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!/^[a-z0-9._-]{3,32}$/.test(username) || password.length < 8) {
    return res.status(400).json({ error: 'Nom d’utilisateur ou mot de passe invalide.' });
  }

  const { data: profile, error: lookupError } = await supabaseAdmin
    .from('profiles').select('id, username').eq('username', username).maybeSingle();
  if (lookupError) throw lookupError;
  if (!profile) return res.status(401).json({ error: 'Identifiants incorrects.' });

  const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
  if (userError || !authUser.user?.email) return res.status(401).json({ error: 'Identifiants incorrects.' });

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email: authUser.user.email, password });
  if (error || !data.session) return res.status(401).json({ error: 'Identifiants incorrects.' });
  return res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    user: { id: profile.id, username: profile.username }
  });
}));

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { id: req.profile.id, username: req.profile.username, display_name: req.profile.display_name, role: req.profile.role } });
});

// Aucun endpoint d'inscription publique. Seul l'administrateur peut créer les comptes membres.
router.post('/members', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const display_name = String(req.body.display_name || '').trim();
  if (!/^[a-z0-9._-]{3,32}$/.test(username) || !email || password.length < 12) {
    return res.status(400).json({ error: 'Username invalide, e-mail requis et mot de passe de 12 caractères minimum.' });
  }

  const { data: existing } = await supabaseAdmin.from('profiles').select('id').eq('username', username).maybeSingle();
  if (existing) return res.status(409).json({ error: 'Ce nom d’utilisateur existe déjà.' });

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { username }
  });
  if (createError) throw createError;

  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: created.user.id, username, display_name, role: 'member'
  });
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(created.user.id);
    throw profileError;
  }
  res.status(201).json({ message: 'Compte membre créé.', user: { id: created.user.id, username, display_name, role: 'member' } });
}));

router.get('/members', requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('id, username, display_name, role, created_at').order('created_at');
  if (error) throw error;
  res.json({ members: data });
}));

export default router;
