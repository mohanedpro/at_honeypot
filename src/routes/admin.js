import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkSession } from '../middleware/checkSession.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

router.use(checkSession);

router.get('/dashboard',  (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/admin_dashboard.html'));
});

router.get('/employees', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/employees.html'));
});

router.get('/hiring', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/hiring.html'));
});

router.get('/policy', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/policy.html'));
});

router.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/settings.html'));
});

export default router;