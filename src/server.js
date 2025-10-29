
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));

const API_KEY = process.env.API_KEY || '';
function apiWall(req, res, next) {
  if (!API_KEY) return next();
  if (req.headers['x-api-key'] === API_KEY) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

import leadsRouter from './routes/leads.js';
import templatesRouter from './routes/templates.js';
import settingsRouter from './routes/settings.js';
import inboundRouter from './routes/inbound.js';
import smsRouter from './routes/sms.js';
import activitiesRouter from './routes/activities.js';
import chatRouter from './routes/chat.js';
import aiRouter from './routes/ai.js';

app.use('/api', apiWall);
app.use('/api/leads', leadsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/inbound', inboundRouter);
app.use('/api/sms', smsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/ai', aiRouter);

app.use('/', express.static(path.join(__dirname, '..', 'public')));
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on :${PORT}`));
