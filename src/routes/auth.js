import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateFakeCredentials } from '../services/authService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const router = Router();

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/login.html'));
})

router.post('/login', async (req, res) => {
    const { email, password, middle_name } = req.body;

    console.log(`[ALERT] Login Attempt - User: ${email} | Pass: ${password}`);
    
    // artificial latency (feels like a real legacy server)
    await new Promise(resolve => setTimeout(resolve, 1800));

    // BOT DETECTION: Humans can't see or fill 'middle_name'
    if (middle_name && middle_name.length > 0) {
        console.log(`[BOT DETECTED] IP: ${req.ip} filled the honeypot field with: ${middle_name}`);
        
        // Trap them in a loop or send a fake "Server Busy" error
        return res.status(429).send(`
            <script>
                alert("Technical Error: Connection unstable. Retrying...");
                window.location.href = '/auth/login';
            </script>
        `);
    }

    const result = validateFakeCredentials(email, password);

    if (!result.success) {

        // LOGIN FAILED: Send a "Script Inject" to show the error on the UI
        res.status(401).send(`
            <script>
                localStorage.setItem('login_error', '${result.message}. Please try again.');
                window.location.href = '/auth/login';
            </script>
        `);
    } else {
        res.cookie('AT_SESSION_ID', 'at_hr_7721_secure_session', {
            httpOnly: false,
            secure: false,
            maxAge: 3600000 // 1 hour
        });

        res.cookie('USER_ROLE', 'admin', { httpOnly: false });

        res.redirect('/admin/dashboard')
    }

});

export default router