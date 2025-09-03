Plataforma de Convocatorias y Evaluaciones
Este proyecto es una aplicación web robusta construida con Node.js y Express, diseñada para gestionar el ciclo de vida completo de una convocatoria. Permite a las empresas registrarse como participantes, completar y enviar formularios de postulación complejos, y ser evaluadas por un panel de expertos. El sistema soporta múltiples roles con permisos específicos, garantizando un flujo de trabajo seguro y organizado.

✨ Características Principales
El sistema está organizado en tres roles principales, cada uno con su propio panel y funcionalidades:

👤 Rol de Participante (Empresas)
Registro Seguro: Creación de una cuenta de usuario y un perfil de empresa en una única transacción.

Panel de Control Personalizado: Vista general del estado de su postulación y fechas clave de la convocatoria.

Formulario de Postulación Completo: Formulario multi-sección para capturar información detallada del producto, brechas de mercado y motivaciones.

Guardado de Borrador: Posibilidad de guardar el progreso del formulario antes del envío final.

Envío de Postulación: Envío final y bloqueo del formulario para evitar modificaciones post-entrega.

Validación en Tiempo Real: Feedback instantáneo en el frontend para asegurar la calidad de los datos.

⚖️ Rol de Evaluador
Panel de Evaluación: Listado de todas las postulaciones asignadas que están listas para ser revisadas.

Interfaz de Evaluación Detallada: Acceso completo a la información de la empresa y su postulación para una revisión informada.

Registro de Calificaciones: Formulario para registrar el estado de preselección, observaciones y puntuaciones basadas en criterios específicos.

Seguridad y Aislamiento: Los evaluadores solo pueden ver y calificar las postulaciones que les corresponden.

⚙️ Rol de Administrador
Dashboard Global: Vista general de todas las empresas registradas, su estado de postulación y el resultado de las evaluaciones.

Gestión de Convocatorias: Creación y actualización de las fechas de inicio y fin de la convocatoria.

Gestión de Usuarios: Creación de nuevas cuentas para evaluadores.

Evaluación Definitiva: Capacidad para registrar una evaluación final y concluyente que prevalece sobre las demás.

Revisión Completa: Acceso total a los perfiles de empresa, postulaciones y todas las evaluaciones individuales realizadas.

🚀 Stack Tecnológico
Backend
Runtime: Node.js

Framework: Express.js

Base de Datos: PostgreSQL

Driver de BD: node-postgres (pg)

Autenticación y Sesiones: express-session, bcrypt

Variables de Entorno: dotenv

Frontend
Lenguajes: HTML5, CSS3, JavaScript (Vanilla JS)

Librerías: Uso de fetch para la comunicación asíncrona (AJAX) con el backend.

Base de Datos
Motor: PostgreSQL

Extensiones: citext (para correos y nits insensibles a mayúsculas/minúsculas), pgcrypto (para hashing de contraseñas a nivel de BD).

🗄️ Estructura de la Base de Datos
La arquitectura de la base de datos está diseñada para ser relacional y escalable, con las siguientes tablas principales:

empresas: Almacena toda la información estática de las empresas participantes.

usuarios: Contiene las credenciales y datos de todos los usuarios (participantes, evaluadores, administradores).

roles: Define los tres roles del sistema y sus descripciones.

postulaciones: Guarda los formularios de postulación, incluyendo los datos complejos en formato JSONB y el estado ('borrador' o 'enviado').

seleccion: Registra cada evaluación individual realizada por un evaluador o administrador.

convocatoria: Almacena las fechas de inicio y fin del proceso.

Las relaciones están protegidas con claves foráneas para garantizar la integridad de los datos.

🛠️ Instalación y Puesta en Marcha Local
Sigue estos pasos para configurar el proyecto en tu entorno de desarrollo:

Clonar el repositorio:

bash
git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio
Instalar dependencias del backend:

bash
npm install
Configurar la Base de Datos PostgreSQL:

Asegúrate de tener PostgreSQL instalado y en ejecución.

Crea una nueva base de datos. Por ejemplo: convocatoria_db.

Ejecuta el script completo ultimoscript.txt en tu nueva base de datos. Esto creará todas las tablas, tipos, roles y datos iniciales necesarios.

Configurar las variables de entorno:

Crea un archivo .env en la raíz del proyecto.

Copia el contenido de .env.example y ajústalo a tu configuración local.

Iniciar el servidor:

bash
npm start
El servidor se ejecutará en el puerto definido en tu archivo .env (por defecto, el 3000).

Acceder a la aplicación:

Abre tu navegador y ve a http://localhost:3000.

Puedes registrarte como un nuevo participante o usar las credenciales del administrador creadas por el script de la base de datos:

Usuario: admin

Contraseña: admin123

📄 Variables de Entorno
Para que la aplicación funcione correctamente, debes crear un archivo .env en la raíz del proyecto con las siguientes variables:

text
# Archivo: .env.example

# Puerto en el que se ejecutará el servidor de Node.js
PORT=3000

# Secreto para la firma de las cookies de sesión.
# Cámbialo por una cadena de caracteres larga y aleatoria.
SESSION_SECRET='tu_secreto_muy_seguro_aqui'

# Variables para la conexión a la base de datos en entorno de desarrollo.
# (En producción, se usará DATABASE_URL)
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=convocatoria_db
DB_PASSWORD=tu_contraseña_de_postgres
DB_PORT=5432

# URL de conexión a la base de datos para entornos de producción (ej. Render, Heroku)
# DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Define el entorno de la aplicación ('development' o 'production')
NODE_ENV=development
