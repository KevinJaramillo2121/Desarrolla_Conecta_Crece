    function protegerRuta(rolEsperado) {
    return function (req, res, next) {
        if (!req.session.usuario) {
        return res.status(401).send('No ha iniciado sesión');
        }
        if (req.session.usuario.rol !== rolEsperado) {
        return res.status(403).send('No tiene permisos');
        }
        next();
    };
    }

    module.exports = protegerRuta;
