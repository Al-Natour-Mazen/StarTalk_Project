const express = require('express');
const AuthController = require('../controllers/AuthController');
const authenticateToken = require('../middlewares/authTokenjwt');

const routerAuth = express.Router();
const allowedRolesForRouteAuth = ['ROLE_USER','ROLE_ADMIN'];
routerAuth.get('/login', (req, res) => {
    const url = AuthController.getDiscordAuthUrl();
    res.redirect(url);
});

routerAuth.get('/logout', authenticateToken(allowedRolesForRouteAuth), async (req, res) => {
    try {
        const result = await AuthController.handleLogout(req.client.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

routerAuth.get('/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const result = await AuthController.handleOAuthCallback(code);
        res.cookie('accessToken', result.token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: result.expires_in,
        });
        res.redirect("/");
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = routerAuth;
