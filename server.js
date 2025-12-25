import express from 'express';
import fs from 'fs';
import { deceptionLayer } from './src/middleware/deceiver.js';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url)) // return the path of the current file
const app = express();
const HOST = '0.0.0.0'
const PORT = 80;

if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(deceptionLayer); // apply the "lie" to every request
app.use(express.static(path.join(__dirname, 'public')));
app.use('/auth', authRoutes)


// --- routes ---
app.get('/', (req, res) => {
  res.send('<h1>algeria telecom HR logistics - Portal V2.1</h1> <p> Internal Use Only.</p>')
})

app.listen(PORT, HOST, () => {
  console.log(`[SYSTEM] Honeypot live on  http://${HOST}:${PORT}`)
})

