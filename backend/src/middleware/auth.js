import { supabaseAdmin } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Connexion requise.' });

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Session invalide ou expirée.' });

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles').select('id, username, role, display_name').eq('id', user.id).single();
    if (profileError || !profile) return res.status(403).json({ error: 'Profil membre introuvable.' });

    req.user = user;
    req.profile = profile;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.profile?.role !== 'admin') return res.status(403).json({ error: 'Action réservée à l’administrateur.' });
  next();
}
