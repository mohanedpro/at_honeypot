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
app.use('/img', express.static(path.join(__dirname, 'public/img'))); // express.static tells express if the user ask for a file that exists in /pucblic/img folder just give it to them auto.
app.use('/auth', authRoutes)


// --- routes ---
app.get('/', (req, res) => {
  res.send('<h1>algeria telecom HR logistics - Portal V2.1</h1> <p> Internal Use Only.</p>')
})

app.listen(PORT, HOST, () => {
  console.log(`[SYSTEM] Honeypot live on  http://${HOST}:${PORT}`)
})

