<div align="center">
🚀 Plataforma de Convocatorias y Evaluaciones 🚀
Un sistema integral para la gestión de postulaciones, desde el registro del participante hasta la evaluación final del administrador.
</div> <!-- Puedes añadir un screenshot o un GIF de la aplicación aquí para un mayor impacto visual --> <!-- <div align="center"> <img src="URL_DEL_SCREENSHOT_O_GIF" alt="Dashboard de la aplicación" width="80%"> </div> -->
Este proyecto es una aplicación web full-stack que resuelve de manera eficiente el proceso de convocatorias empresariales. Construida con una arquitectura robusta basada en roles, la plataforma ofrece una experiencia de usuario clara y segura para cada tipo de actor involucrado: empresas que se postulan, evaluadores que califican y administradores que supervisan todo el proceso.

✨ Características por Rol
La funcionalidad del sistema está segmentada por roles, garantizando que cada usuario tenga acceso únicamente a las herramientas que necesita.

Característica	👤 Participante	⚖️ Evaluador	⚙️ Administrador
Ver Panel Principal	✅	✅	✅
Registrar Empresa/Usuario	✅	❌	❌
Crear/Editar Postulación	✅ (antes de enviar)	❌	❌
Ver Postulaciones Asignadas	❌	✅	✅ (todas)
Realizar Evaluaciones	❌	✅	✅ (definitiva)
Ver Todas las Evaluaciones	❌	❌	✅
Gestionar Fechas de Convocatoria	❌	❌	✅
Crear Cuentas de Evaluador	❌	❌	✅
🛠️ Stack Tecnológico
Categoría	Tecnologías y Librerías
Backend	Node.js, Express.js
Base de Datos	PostgreSQL, node-postgres (pg)
Seguridad	bcrypt (Hashing de contraseñas), express-session (Sesiones)
Frontend	HTML5, CSS3, JavaScript (Vanilla JS, Fetch API)
Utilidades	dotenv, multer (Manejo de archivos), pgcrypto
🗄️ Estructura del Proyecto
La organización del código está pensada para ser modular y escalable.

text
/
├── public/                 # Archivos estáticos (HTML, CSS, JS del cliente)
│   ├── login.html
│   ├── register.html
│   └── js/
│       ├── login.js
│       ├── register.js
│       └── ...
├── routes/                 # Definición de las rutas de la API
│   ├── auth.js             # Rutas de autenticación (login, register)
│   ├── admin.js            # Rutas para el rol de Administrador
│   ├── evaluador.js        # Rutas para el rol de Evaluador
│   └── participante.js     # Rutas para el rol de Participante
├── views_protegidas/       # Vistas HTML que requieren autenticación
│   ├── admin.html
│   ├── evaluador.html
│   └── participante.html
├── middlewares/            # Middlewares personalizados
│   └── authMiddleware.js   # Middleware para proteger rutas por rol
├── .env                    # Variables de entorno (NO subir a Git)
├── .gitignore
├── db.js                   # Configuración centralizada de la conexión a la BD
├── package.json
├── package-lock.json
├── server.js               # Punto de entrada principal de la aplicación
└── ultimoscript.txt        # Script SQL para la creación de la BD
🚀 Guía de Inicio Rápido (Local)
Para levantar el proyecto en tu máquina local, sigue estos pasos:

Clona el Repositorio

text
git clone direccion del repo
cd tu-repositorio
Instala las Dependencias

text
npm install
Configura la Base de Datos

Asegúrate de tener PostgreSQL instalado y corriendo.

Crea una base de datos (p. ej., convocatoria_db).

Ejecuta el script ultimoscript.txt en tu base de datos para crear todas las tablas, vistas y datos iniciales.

Configura las Variables de Entorno

Crea un archivo llamado .env en la raíz del proyecto.

Copia y pega el siguiente contenido, ajustando los valores de la base de datos a tu configuración local.

text
# Archivo: .env

# Entorno ('development' o 'production')
NODE_ENV=development

# Puerto del servidor
PORT=3000

# Secreto para la sesión (cámbialo por algo seguro)
SESSION_SECRET='un_secreto_muy_largo_y_dificil_de_adivinar'

# URL de conexión a PostgreSQL (ignorado si NODE_ENV es 'development')
# DATABASE_URL="postgresql://user:pass@host:port/database?sslmode=require"
Nota: En desarrollo, la conexión se configura automáticamente desde db.js con los valores estándar de PostgreSQL (postgres/postgresql en localhost:5432).

Inicia el Servidor

text
npm start
¡Listo!

Abre tu navegador en http://localhost:3000.

Regístrate como un nuevo participante o usa la cuenta de administrador por defecto:

Usuario: admin

Contraseña: admin123
