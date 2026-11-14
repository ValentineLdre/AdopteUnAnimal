
import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, safeFileName } from '../utils/http.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 1
  },
  fileFilter: (_req, file, cb) =>
    cb(null, file.mimetype === 'application/pdf')
});

// Déposer un document PDF
router.post('/', requireAuth, upload.single('document'), asyncRoute(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'Sélectionnez un fichier PDF (15 Mo maximum).'
    });
  }

  const path = `${randomUUID()}-${safeFileName(req.file.originalname)}`;

  const { error } = await supabaseAdmin.storage
    .from('association-documents')
    .upload(path, req.file.buffer, {
      contentType: 'application/pdf'
    });

  if (error) throw error;

  const { data, error: insertError } = await supabaseAdmin
    .from('documents')
    .insert({
      path,
      file_name: req.file.originalname,
      uploaded_by: req.user.id
    })
    .select('id, path, file_name, created_at')
    .single();

  if (insertError) throw insertError;

  res.status(201).json({ document: data });
}));

// Récupérer la liste des documents
router.get('/', requireAuth, asyncRoute(async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('documents')
    .select('id, path, file_name, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  res.json({ documents: data });
}));

// Obtenir un lien temporaire pour ouvrir un PDF
router.get('/:id', requireAuth, asyncRoute(async (req, res) => {
  const { data: doc, error } = await supabaseAdmin
    .from('documents')
    .select('path')
    .eq('id', req.params.id)
    .single();

  if (error) throw error;

  const { data, error: urlError } = await supabaseAdmin
    .storage
    .from('association-documents')
    .createSignedUrl(doc.path, 60);

  if (urlError) throw urlError;

  res.json({ url: data.signedUrl });
}));

// Supprimer un document PDF
router.delete('/:id', requireAuth, asyncRoute(async (req, res) => {
  // Retrouver le chemin du fichier dans la base de données
  const { data: doc, error: findError } = await supabaseAdmin
    .from('documents')
    .select('id, path')
    .eq('id', req.params.id)
    .single();

  if (findError) throw findError;

  // Supprimer le fichier du stockage Supabase
  const { error: storageError } = await supabaseAdmin
    .storage
    .from('association-documents')
    .remove([doc.path]);

  if (storageError) throw storageError;

  // Supprimer ensuite son enregistrement dans la base de données
  const { error: deleteError } = await supabaseAdmin
    .from('documents')
    .delete()
    .eq('id', req.params.id);

  if (deleteError) throw deleteError;

  res.json({
    message: 'Document supprimé avec succès.'
  });
}));

export default router;
