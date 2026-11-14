
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncRoute, safeFileName } from '../utils/http.js';

const router = Router();

const PHOTO_BUCKET = 'animal-photos';
const DOCUMENT_BUCKET = 'association-documents';

const MAX_PHOTO_SIZE = 8 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024;
const UPLOAD_EXPIRY_HOURS = 2;

const PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

function tusEndpoint() {
  const projectUrl = new URL(process.env.SUPABASE_URL);
  const projectRef = projectUrl.hostname.split('.')[0];

  return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable/sign`;
}

function validFileName(name) {
  return typeof name === 'string'
    && name.trim().length > 0
    && name.length <= 255;
}

function uploadExpiration() {
  return new Date(
    Date.now() + UPLOAD_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();
}

// Enregistre une autorisation temporaire liée à l'utilisateur.
async function createPendingUpload({
  userId,
  bucket,
  path,
  name,
  type,
  size
}) {
  const { data, error } = await supabaseAdmin
    .from('pending_uploads')
    .insert({
      user_id: userId,
      bucket,
      object_path: path,
      file_name: name,
      expected_mime: type,
      expected_size: size,
      expires_at: uploadExpiration()
    })
    .select('id')
    .single();

  if (error) throw error;

  return data.id;
}

// Vérifie les caractéristiques réelles du fichier dans Storage.
async function verifyStoredFile(
  bucket,
  path,
  expectedType,
  expectedSize,
  maxSize
) {
  const parts = path.split('/');

  const folder = parts.length > 1
    ? parts.slice(0, -1).join('/')
    : '';

  const name = parts.at(-1);

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(folder, {
      search: name,
      limit: 100
    });

  if (error) throw error;

  const file = data?.find(item => item.name === name);

  if (!file?.metadata) return false;

  const size = Number(file.metadata.size);
  const mime = file.metadata.mimetype;

  return Number.isFinite(size)
    && size > 0
    && size <= maxSize
    && size === Number(expectedSize)
    && mime === expectedType;
}

// Consomme les autorisations en une seule opération.
// Une autorisation ne peut donc pas être réutilisée.
async function consumePendingUploads(ids, userId, bucket) {
  const uniqueIds = [...new Set(ids)];

  if (uniqueIds.length !== ids.length) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from('pending_uploads')
    .delete()
    .in('id', uniqueIds)
    .eq('user_id', userId)
    .eq('bucket', bucket)
    .gt('expires_at', new Date().toISOString())
    .select('id');

  if (error) throw error;

  return data?.length === uniqueIds.length;
}

// SIGNATURE DES PHOTOS
router.post(
  '/animals/:id/photos/sign',
  requireAuth,
  asyncRoute(async (req, res) => {
    const files = req.body?.files;

    if (
      !Array.isArray(files)
      || files.length < 1
      || files.length > 8
    ) {
      return res.status(400).json({
        error: 'Sélectionnez entre 1 et 8 photos.'
      });
    }

    const { data: animal, error: animalError } = await supabaseAdmin
      .from('animals')
      .select('id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (animalError) throw animalError;

    if (!animal) {
      return res.status(404).json({
        error: 'Animal introuvable.'
      });
    }

    for (const file of files) {
      if (
        !validFileName(file.name)
        || !PHOTO_TYPES.includes(file.type)
        || !Number.isInteger(file.size)
        || file.size <= 0
        || file.size > MAX_PHOTO_SIZE
      ) {
        return res.status(400).json({
          error: 'Photo invalide : JPEG, PNG ou WebP de 8 Mo maximum.'
        });
      }
    }

    const uploads = [];

    for (const file of files) {
      const path = `${req.params.id}/${randomUUID()}-${safeFileName(file.name)}`;

      const { data, error } = await supabaseAdmin.storage
        .from(PHOTO_BUCKET)
        .createSignedUploadUrl(path);

      if (error) throw error;

      if (
        typeof data?.token !== 'string'
        || data.token.split('.').length !== 3
      ) {
        throw new Error(
          'Supabase a renvoyé une signature invalide pour cette photo.'
        );
      }

      const uploadId = await createPendingUpload({
        userId: req.user.id,
        bucket: PHOTO_BUCKET,
        path,
        name: file.name,
        type: file.type,
        size: file.size
      });

      uploads.push({
        uploadId,
        path,
        token: data.token,
        name: file.name,
        type: file.type,
        size: file.size
      });
    }

    res.json({
      endpoint: tusEndpoint(),
      uploads
    });
  })
);

// CONFIRMATION DES PHOTOS
router.post(
  '/animals/:id/photos/confirm',
  requireAuth,
  asyncRoute(async (req, res) => {
    const files = req.body?.files;

    if (
      !Array.isArray(files)
      || files.length < 1
      || files.length > 8
    ) {
      return res.status(400).json({
        error: 'Liste de photos invalide.'
      });
    }

    const { data: animal, error: animalError } = await supabaseAdmin
      .from('animals')
      .select('photos')
      .eq('id', req.params.id)
      .maybeSingle();

    if (animalError) throw animalError;

    if (!animal) {
      return res.status(404).json({
        error: 'Animal introuvable.'
      });
    }

    const uploaded = [];
    const pendingIds = [];

    for (const file of files) {
      const path = file?.path;
      const uploadId = file?.uploadId;

      if (
        typeof uploadId !== 'string'
        || typeof path !== 'string'
        || !path.startsWith(`${req.params.id}/`)
        || !PHOTO_TYPES.includes(file.type)
        || !validFileName(file.name)
      ) {
        return res.status(400).json({
          error: 'Informations de photo invalides.'
        });
      }

      const { data: pending, error: pendingError } = await supabaseAdmin
        .from('pending_uploads')
        .select('id, object_path, file_name, expected_mime, expected_size')
        .eq('id', uploadId)
        .eq('user_id', req.user.id)
        .eq('bucket', PHOTO_BUCKET)
        .eq('object_path', path)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (pendingError) throw pendingError;

      if (
        !pending
        || pending.file_name !== file.name
        || pending.expected_mime !== file.type
      ) {
        return res.status(403).json({
          error: 'Autorisation de transfert invalide ou expirée.'
        });
      }

      const valid = await verifyStoredFile(
        PHOTO_BUCKET,
        path,
        pending.expected_mime,
        pending.expected_size,
        MAX_PHOTO_SIZE
      );

      if (!valid) {
        return res.status(400).json({
          error: 'Une photo est absente ou ne respecte pas les limites autorisées.'
        });
      }

      const { data } = supabaseAdmin.storage
        .from(PHOTO_BUCKET)
        .getPublicUrl(path);

      uploaded.push({
        path,
        url: data.publicUrl,
        alt: file.name.slice(0, 255)
      });

      pendingIds.push(uploadId);
    }

    const consumed = await consumePendingUploads(
      pendingIds,
      req.user.id,
      PHOTO_BUCKET
    );

    if (!consumed) {
      return res.status(403).json({
        error: 'Une autorisation de transfert a expiré ou a déjà été utilisée.'
      });
    }

    const photos = [...(animal.photos || []), ...uploaded];

    const { data, error } = await supabaseAdmin
      .from('animals')
      .update({ photos })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      await supabaseAdmin.storage
        .from(PHOTO_BUCKET)
        .remove(uploaded.map(file => file.path));

      throw error;
    }

    res.status(201).json({
      animal: data
    });
  })
);

// SIGNATURE DU PDF
router.post(
  '/documents/sign',
  requireAuth,
  asyncRoute(async (req, res) => {
    const { name, type, size } = req.body || {};

    if (
      !validFileName(name)
      || type !== 'application/pdf'
      || !Number.isInteger(size)
      || size <= 0
      || size > MAX_DOCUMENT_SIZE
    ) {
      return res.status(400).json({
        error: 'Sélectionnez un PDF de 15 Mo maximum.'
      });
    }

    const path = `${randomUUID()}-${safeFileName(name)}`;

    const { data, error } = await supabaseAdmin.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUploadUrl(path);

    if (error) throw error;

    if (
      typeof data?.token !== 'string'
      || data.token.split('.').length !== 3
    ) {
      throw new Error(
        'Supabase a renvoyé une signature invalide pour ce PDF.'
      );
    }

    const uploadId = await createPendingUpload({
      userId: req.user.id,
      bucket: DOCUMENT_BUCKET,
      path,
      name,
      type,
      size
    });

    res.json({
      endpoint: tusEndpoint(),
      uploadId,
      path,
      token: data.token,
      name,
      type
    });
  })
);

// CONFIRMATION DU PDF
router.post(
  '/documents/confirm',
  requireAuth,
  asyncRoute(async (req, res) => {
    const { uploadId, path, name, type } = req.body || {};

    if (
      typeof uploadId !== 'string'
      || typeof path !== 'string'
      || path.includes('/')
      || !validFileName(name)
      || type !== 'application/pdf'
    ) {
      return res.status(400).json({
        error: 'Informations du PDF invalides.'
      });
    }

    const { data: pending, error: pendingError } = await supabaseAdmin
      .from('pending_uploads')
      .select('id, object_path, file_name, expected_mime, expected_size')
      .eq('id', uploadId)
      .eq('user_id', req.user.id)
      .eq('bucket', DOCUMENT_BUCKET)
      .eq('object_path', path)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (pendingError) throw pendingError;

    if (
      !pending
      || pending.file_name !== name
      || pending.expected_mime !== type
    ) {
      return res.status(403).json({
        error: 'Autorisation de transfert invalide ou expirée.'
      });
    }

    const valid = await verifyStoredFile(
      DOCUMENT_BUCKET,
      path,
      'application/pdf',
      pending.expected_size,
      MAX_DOCUMENT_SIZE
    );

    if (!valid) {
      return res.status(400).json({
        error: 'Le PDF est absent ou ne respecte pas les limites autorisées.'
      });
    }

    const consumed = await consumePendingUploads(
      [uploadId],
      req.user.id,
      DOCUMENT_BUCKET
    );

    if (!consumed) {
      return res.status(403).json({
        error: 'Cette autorisation a expiré ou a déjà été utilisée.'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        path,
        file_name: name.slice(0, 255),
        uploaded_by: req.user.id
      })
      .select('id, path, file_name, created_at')
      .single();

    if (error) {
      await supabaseAdmin.storage
        .from(DOCUMENT_BUCKET)
        .remove([path]);

      throw error;
    }

    res.status(201).json({
      document: data
    });
  })
);

export default router;
