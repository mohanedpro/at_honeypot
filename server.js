import express from 'express';
import fs from 'fs';
import { deceptionLayer } from './src/middleware/deceiver.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.js'
import adminRoutes from './src/routes/admin.js';
import apiRoutes from './src/routes/api.js'


const __dirname = path.dirname(fileURLToPath(import.meta.url)) // return the path of the current file
const app = express();

const HOST = '0.0.0.0'
const PORT = 3000;

if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser('at-secret-2025')); // Use a secret for "signed" cookies
app.disable('etag');
app.use(deceptionLayer); // apply the "lie" to every request
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'public/img'))); // express.static tells express if the user ask for a file that exists in /pucblic/img folder just give it to them auto.
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/api/v1', apiRoutes);


app.listen(PORT, HOST, () => {
  console.log(`[SYSTEM] Honeypot live on  http://${HOST}:80`) // we map port 3000 to 80 on docker
})

