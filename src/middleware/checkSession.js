export const checkSession = (req, res, next) => {
    const session = req.cookies.AT_SESSION_ID;
    const isAdmin = req.cookies.USER_ROLE;
    
    if (!session || !isAdmin) {
        console.log(`[SECURITY] Unauthorized access attempt to /admin without session cookie.`);
        return res.redirect('/auth/login?error=session_expired');
    }

    if (session !== 'at_hr_7721_secure_session' || isAdmin !== 'admin') {
        console.log(`[ALERT] Session Tampering Detected: ${session}`);
    }

    next();
};