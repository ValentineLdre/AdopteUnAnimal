
import { supabaseAdmin } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        error: 'Connexion requise.'
      });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Session invalide ou expirée.'
      });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, role, display_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({
        error: 'Profil membre introuvable.'
      });
    }

    // Seuls les administrateurs et les membres peuvent accéder au refuge.
    if (!['admin', 'member'].includes(profile.role)) {
      return res.status(403).json({
        error: 'Accès réservé aux membres du refuge.'
      });
    }

    req.user = user;
    req.profile = profile;

    next();
  } catch (error) {
    next(error);
  }
}

// Cette fonction réserve les opérations de gestion des comptes à l'administrateur.
export function requireAdmin(req, res, next) {
  if (req.profile?.role !== 'admin') {
    return res.status(403).json({
      error: 'Action réservée à l’administrateur.'
    });
  }

  next();
}
