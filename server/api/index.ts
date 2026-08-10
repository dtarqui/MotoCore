import { handle } from 'hono/vercel';
import { createApp } from '../src/app.js';

// Vercel Serverless Function (runtime Node). Un `vercel.json` reescribe todas
// las rutas hacia esta funcion, que ejecuta la app Hono completa.
export const config = { runtime: 'nodejs' };

export default handle(createApp());
