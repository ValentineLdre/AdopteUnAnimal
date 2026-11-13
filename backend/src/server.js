import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import animalRoutes from './routes/animals.js';
import documentRoutes from './routes/documents.js';

const app = express();
const origins = (process.env.FRONTEND_ORIGIN || '').split(',').map(x => x.trim()).filter(Boolean);
app.use(helmet());
app.use(cors({ origin(origin, callback) {
  if (!origin || origins.includes(origin) || process.env.NODE_ENV !== 'production') return callback(null, true);
  return callback(new Error('Origine non autorisée par CORS.'));
}, allowedHeaders: ['Content-Type', 'Authorization'], methods: ['GET','POST','PATCH','DELETE','OPTIONS'] }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'adopte-un-animal-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/documents', documentRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route introuvable.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Fichier trop volumineux.' });
  if (error?.message?.includes('Origine non autorisée')) return res.status(403).json({ error: error.message });
  res.status(500).json({ error: 'Une erreur serveur est survenue.' });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API AdopteUnAnimal démarrée sur http://localhost:${port}`));
