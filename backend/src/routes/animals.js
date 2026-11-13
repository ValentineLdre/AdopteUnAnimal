import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, safeFileName } from '../utils/http.js';

const router = Router();
const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 8 }, fileFilter: (_req, file, cb) => {
  cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
} });
const fields = 'id, name, species, breed, age_label, age_category, character, social_compatibility, description, sex, weight, health_notes, status, photos, created_at, updated_at';

router.get('/', asyncRoute(async (req, res) => {
  const status = req.query.status === 'archived' ? 'archived' : 'available';
  if (status === 'archived') return res.status(401).json({ error: 'Connexion requise pour consulter les archives.' });
  const { data, error } = await supabaseAdmin.from('animals').select(fields).eq('status', 'available').order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ animals: data });
}));

router.get('/archive', requireAuth, asyncRoute(async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('animals').select(fields).eq('status', 'archived').order('updated_at', { ascending: false });
  if (error) throw error;
  res.json({ animals: data });
}));

router.post('/', requireAuth, asyncRoute(async (req, res) => {
  const payload = validateAnimal(req.body);
  if (!payload) return res.status(400).json({ error: 'Le nom, l’espèce et la description sont obligatoires.' });
  const { data, error } = await supabaseAdmin.from('animals').insert({ ...payload, created_by: req.user.id }).select(fields).single();
  if (error) throw error;
  res.status(201).json({ animal: data });
}));

router.patch('/:id', requireAuth, asyncRoute(async (req, res) => {
  const payload = validateAnimal(req.body, true);
  if (!payload) return res.status(400).json({ error: 'Données de fiche invalides.' });
  const { data, error } = await supabaseAdmin.from('animals').update(payload).eq('id', req.params.id).select(fields).single();
  if (error) throw error;
  res.json({ animal: data });
}));

router.patch('/:id/archive', requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await supabaseAdmin.from('animals').update({ status: 'archived' }).eq('id', req.params.id).select(fields).single();
  if (error) throw error;
  res.json({ animal: data, message: 'Animal déplacé dans les archives.' });
}));

router.patch('/:id/restore', requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await supabaseAdmin.from('animals').update({ status: 'available' }).eq('id', req.params.id).select(fields).single();
  if (error) throw error;
  res.json({ animal: data, message: 'Annonce republiée.' });
}));

router.delete('/:id', requireAuth, asyncRoute(async (req, res) => {
  const { data: animal, error: readError } = await supabaseAdmin.from('animals').select('photos').eq('id', req.params.id).single();
  if (readError) throw readError;
  const { error } = await supabaseAdmin.from('animals').delete().eq('id', req.params.id);
  if (error) throw error;
  const paths = (animal.photos || []).map(p => p.path).filter(Boolean);
  if (paths.length) await supabaseAdmin.storage.from('animal-photos').remove(paths);
  res.json({ message: 'Annonce supprimée.' });
}));

router.post('/:id/photos', requireAuth, photoUpload.array('photos', 8), asyncRoute(async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ error: 'Sélectionnez au moins une image JPEG, PNG ou WebP (8 Mo maximum chacune).' });
  const { data: animal, error: readError } = await supabaseAdmin.from('animals').select('photos').eq('id', req.params.id).single();
  if (readError) throw readError;
  const uploaded = [];
  for (const file of req.files) {
    const path = `${req.params.id}/${randomUUID()}-${safeFileName(file.originalname)}`;
    const { error } = await supabaseAdmin.storage.from('animal-photos').upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw error;
    const { data: urlData } = supabaseAdmin.storage.from('animal-photos').getPublicUrl(path);
    uploaded.push({ path, url: urlData.publicUrl, alt: file.originalname });
  }
  const photos = [...(animal.photos || []), ...uploaded];
  const { data, error } = await supabaseAdmin.from('animals').update({ photos }).eq('id', req.params.id).select(fields).single();
  if (error) throw error;
  res.status(201).json({ animal: data });
}));

function validateAnimal(body, partial = false) {
  const value = {};
  const allowed = ['name','species','breed','age_label','age_category','character','social_compatibility','description','sex','weight','health_notes'];
  for (const key of allowed) if (body[key] !== undefined) value[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
  if (!partial && (!value.name || !value.species || !value.description)) return null;
  if (value.name !== undefined && (!value.name || value.name.length > 100)) return null;
  if (value.description !== undefined && value.description.length > 5000) return null;
  return value;
}

export default router;
