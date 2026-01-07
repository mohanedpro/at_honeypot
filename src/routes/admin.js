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

router.get('/download-data', (req, res) => {
    // Log that they are attempting to steal the data
    // i will log it later
    console.log(`[ALERTE] Attacker from IP ${req.ip} is downloading the employee database!`);
    
    const filePath = path.join(__dirname, '../../public/AT_Export_Full_PII_Confidential.xlam');
    
    // Set a realistic filename for the download
    res.download(filePath, 'AT_Export_Full_PII_Confidential.xlam', (err) => {
        if (err) {
            console.error("Download Error:", err);
            res.status(500).send("Internal Server Error during exfiltration.");
        }
    });
});

export default router;