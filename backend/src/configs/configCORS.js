const isAllowedOrigin = (origin) => {
    if (!origin) return false;

    const fixedOrigin = process.env.REACT_APP_API_URL;
    if (fixedOrigin && origin === fixedOrigin) {
        return true;
    }

    // Allow local frontend dev servers with dynamic ports.
    return /^https?:\/\/localhost:\d+$/.test(origin);
};

const configCORS = (app) => {
    app.use(function (req, res, next) {
        const origin = req.headers.origin;

        if (isAllowedOrigin(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
        }

        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        if (req.method === 'OPTIONS') {
            return res.status(204).end();
        }

        next();
    });
}
module.exports = configCORS;
