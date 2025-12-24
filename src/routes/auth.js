import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router();

router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/login.html'));
})

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    console.log(`[ALERT] Login Attempt - User: ${email} | Pass: ${password}`);
    
    // ...
});

export default router