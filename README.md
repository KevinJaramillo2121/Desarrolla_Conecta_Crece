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
