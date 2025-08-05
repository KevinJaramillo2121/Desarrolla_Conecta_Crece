// authMiddleware.js - VERSIÓN CORREGIDA
function protegerRuta(rolEsperado) {
    return function (req, res, next) {
        if (!req.session.usuario) {
            return res.status(401).send('No ha iniciado sesión');
        } // ✅ FALTABA ESTA LLAVE
        
        if (req.session.usuario.rol !== rolEsperado) {
            return res.status(403).send('No tiene permisos');
        } // ✅ FALTABA ESTA LLAVE
        
        next();
    };
}

module.exports = protegerRuta;
