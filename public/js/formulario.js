// ===== VARIABLES GLOBALES =====
let convocatoriaCerrada = false;
let timerInterval = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando formulario...');
    initializeCountdown();
    configurarValidacionTiempoReal();
    validarEstadoPostulacion();
    configurarEventListeners();
});

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====
function configurarEventListeners() {
    // Botones principales
    const btnGuardarBorrador = document.getElementById('btn-guardar-borrador');
    const btnEnviar = document.getElementById('btn-enviar');
    
    if (btnGuardarBorrador) {
        btnGuardarBorrador.addEventListener('click', guardarComoBorrador);
    }
    
    if (btnEnviar) {
        btnEnviar.addEventListener('click', enviarPostulacion);
    }

    // Campo "Otro" en estado del producto
    const estadoOtro = document.getElementById('estado_otro');
    if (estadoOtro) {
        estadoOtro.addEventListener('change', function() {
            const campoTexto = document.getElementById('estado_otro_texto');
            if (campoTexto) {
                campoTexto.disabled = !this.checked;
                if (this.checked) {
                    campoTexto.focus();
                }
            }
        });
    }
}

// ===== VALIDACIÓN DE ESTADO DE POSTULACIÓN =====
async function validarEstadoPostulacion() {
    try {
        console.log('Validando estado de postulación...');
        const response = await fetch('/participante/estado-postulacion');
        
        if (!response.ok) {
            throw new Error('Error al consultar estado de postulación');
        }
        
        const data = await response.json();
        console.log('Estado de postulación:', data.estado);
        
        if (data.estado === 'enviado') {
            bloquearFormulario('Ya has enviado tu postulación. No puedes realizar más cambios.');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Error validando estado:', error);
        mostrarMensaje('Error al verificar el estado de la postulación', 'error');
        return false;
    }
}

// ===== CONFIGURACIÓN DE VALIDACIÓN EN TIEMPO REAL =====
function configurarValidacionTiempoReal() {
    console.log('Configurando validación en tiempo real...');
    
    // Campos obligatorios básicos
    const camposObligatorios = [
        'nombre_producto',
        'descripcion_producto',
        'nombre_legal',
        'nit',
        'representante',
        'cedula_representante'
    ];
    
    camposObligatorios.forEach(campoId => {
        const campo = document.getElementById(campoId);
        if (campo) {
            campo.addEventListener('blur', function() {
                validarCampo(this);
            });
            
            campo.addEventListener('input', function() {
                limpiarErrorCampo(this);
            });
        }
    });
    
    // Validación de radio buttons - MEJORADA
    const estadoProductoRadios = document.querySelectorAll('input[name="estado_producto"]');
    estadoProductoRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            validarGrupoRadio('estado_producto');
        });
    });
    
    // Validación de disponibilidad - MEJORADA
    const disponibilidadRadios = document.querySelectorAll('input[name="disponibilidad"]');
    disponibilidadRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            validarGrupoRadio('disponibilidad');
        });
    });
    
    // Validación de checkbox de declaración - CORREGIDA
    const declaracionCheckboxes = [
        document.getElementById('declaracion_veraz'),
        document.getElementById('declaracion_legal'),
        document.querySelector('input[name="declaracion_veraz"]')
    ].filter(Boolean); // Filtrar elementos que existen
    
    declaracionCheckboxes.forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                validarCheckbox(this);
            });
        }
    });
}


// ===== FUNCIONES DE VALIDACIÓN =====
function validarCampo(campo) {
    const valor = campo.value.trim();
    const nombre = campo.name || campo.id;
    
    if (!valor) {
        mostrarErrorCampo(campo, 'Este campo es obligatorio');
        return false;
    }
    
    // Validaciones específicas
    switch (nombre) {
        case 'nit':
            if (!/^\d+(-\d)?$/.test(valor)) {
                mostrarErrorCampo(campo, 'Formato de NIT inválido');
                return false;
            }
            break;
            
        case 'cedula_representante':
        case 'cedula_representante_declaracion':
            if (!/^\d+$/.test(valor)) {
                mostrarErrorCampo(campo, 'La cédula debe contener solo números');
                return false;
            }
            break;
            
        case 'correo_contacto':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
                mostrarErrorCampo(campo, 'Formato de correo electrónico inválido');
                return false;
            }
            break;
    }
    
    mostrarExitoCampo(campo);
    return true;
}

function validarGrupoRadio(nombre) {
    const radios = document.querySelectorAll(`input[name="${nombre}"]`);
    const seleccionado = document.querySelector(`input[name="${nombre}"]:checked`);
    
    if (!seleccionado) {
        mostrarErrorGrupo(radios[0], 'Debe seleccionar una opción');
        return false;
    }
    
    limpiarErrorGrupo(radios);
    return true;
}

function validarCheckbox(checkbox) {
    if (!checkbox.checked) {
        mostrarErrorCampo(checkbox, 'Debe aceptar este campo');
        return false;
    }
    
    limpiarErrorCampo(checkbox);
    return true;
}

// ===== MANEJO DE ERRORES VISUALES =====
function mostrarErrorCampo(campo, mensaje) {
    campo.classList.add('error');
    campo.classList.remove('success');
    
    // Buscar o crear contenedor de error
    let errorContainer = campo.parentNode.querySelector('.error-message');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        campo.parentNode.appendChild(errorContainer);
    }
    
    errorContainer.textContent = mensaje;
    errorContainer.style.display = 'block';
}

function mostrarExitoCampo(campo) {
    campo.classList.remove('error');
    campo.classList.add('success');
    limpiarErrorCampo(campo);
}

function limpiarErrorCampo(campo) {
    campo.classList.remove('error');
    const errorContainer = campo.parentNode.querySelector('.error-message');
    if (errorContainer) {
        errorContainer.style.display = 'none';
    }
}

function mostrarErrorGrupo(primerElemento, mensaje) {
    // Buscar contenedor parent usando navegación DOM compatible
    let contenedor = primerElemento.parentNode;
    
    // Buscar hacia arriba hasta encontrar .form-group o usar parentNode
    while (contenedor && !contenedor.classList.contains('form-group')) {
        contenedor = contenedor.parentNode;
        // Evitar bucle infinito
        if (contenedor === document.body || !contenedor) {
            contenedor = primerElemento.parentNode;
            break;
        }
    }
    
    let errorContainer = contenedor.querySelector('.error-message');
    
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        contenedor.appendChild(errorContainer);
    }
    
    errorContainer.textContent = mensaje;
    errorContainer.style.display = 'block';
}

// ===== FUNCIÓN CORREGIDA =====
function limpiarErrorGrupo(primerElemento) {
    if (!primerElemento || !primerElemento.parentNode) {
        console.warn('limpiarErrorGrupo: elemento no válido');
        return;
    }
    
    // Buscar contenedor parent usando navegación DOM compatible
    let contenedor = primerElemento.parentNode;
    
    // Buscar hacia arriba hasta encontrar .form-group o usar parentNode
    while (contenedor && !contenedor.classList.contains('form-group')) {
        contenedor = contenedor.parentNode;
        // Evitar bucle infinito
        if (contenedor === document.body || !contenedor) {
            contenedor = primerElemento.parentNode;
            break;
        }
    }
    
    if (contenedor && contenedor.querySelector) {
        const errorContainer = contenedor.querySelector('.error-message');
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }
}


// ===== COUNTDOWN Y FECHAS =====
async function initializeCountdown() {
    try {
        console.log('Inicializando countdown...');
        const fechaCierre = await obtenerFechaCierre();
        if (fechaCierre) {
            iniciarCuentaRegresiva(fechaCierre);
        }
    } catch (error) {
        console.error('Error al inicializar countdown:', error);
        const timerElement = document.getElementById('timer-value');
        if (timerElement) {
            timerElement.textContent = 'No disponible';
        }
    }
}

async function obtenerFechaCierre() {
    try {
        const response = await fetch('/participante/fecha-cierre');
        const data = await response.json();
        
        if (data.fechaFin) {
            return new Date(data.fechaFin);
        }
        
        return null;
    } catch (error) {
        console.error('Error al obtener fecha de cierre:', error);
        return null;
    }
}

// En formulario.js, reemplaza la función iniciarCuentaRegresiva por esta:

function iniciarCuentaRegresiva(deadline) {
    // Referencias a los nuevos elementos del reloj
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const clockEl = document.querySelector('.digital-clock');

    // Verificación para asegurar que todos los elementos existen
    if (!daysEl || !hoursEl || !minutesEl || !secondsEl || !clockEl) {
        console.error('Error: No se encontraron los elementos del reloj digital en el HTML.');
        const container = document.querySelector('.countdown-container');
        if (container) container.innerHTML = '<p>Error al cargar el contador.</p>';
        return;
    }

    // Limpiar cualquier intervalo anterior para evitar múltiples contadores
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    function updateTimer() {
        const now = new Date().getTime();
        const distance = deadline.getTime() - now;

        // Si el tiempo se ha acabado
        if (distance < 0) {
            clearInterval(timerInterval);
            // Muestra el mensaje de convocatoria cerrada dentro del reloj
            clockEl.innerHTML = '<div class="countdown-title" style="font-size: 1.8rem; margin: 0;">Convocatoria Cerrada</div>';
            clockEl.classList.add('danger');
            bloquearFormulario('El tiempo para enviar postulaciones ha terminado.');
            return;
        }

        // Cálculos de tiempo
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Actualizar el contenido de cada número
        // .padStart(2, '0') asegura que siempre haya dos dígitos (ej. 09, 08, 07)
        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minutesEl.textContent = String(minutes).padStart(2, '0');
        secondsEl.textContent = String(seconds).padStart(2, '0');

        // Lógica para cambiar el color del reloj según el tiempo restante
        clockEl.classList.remove('warning', 'danger');
        if (days < 1) { // Menos de 1 día
            clockEl.classList.add('danger');
        } else if (days < 3) { // Menos de 3 días
            clockEl.classList.add('warning');
        }
    }

    updateTimer(); // Llamada inicial para que el reloj aparezca inmediatamente
    timerInterval = setInterval(updateTimer, 1000); // Actualiza el reloj cada segundo
}


function bloquearFormulario(mensaje) {
    convocatoriaCerrada = true;
    
    // Deshabilitar todos los inputs
    const form = document.getElementById('inscripcionForm') || document.getElementById('multi-step-form');
    if (form) {
        const inputs = form.querySelectorAll('input, textarea, select, button');
        inputs.forEach(input => {
            input.disabled = true;
        });
        
        // Mostrar mensaje de bloqueo
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = 'alert alert-error';
        mensajeDiv.innerHTML = `
            <strong>⚠️ Formulario bloqueado</strong><br>
            ${mensaje}
        `;
        
        form.insertBefore(mensajeDiv, form.firstChild);
    }
}

// ===== VALIDACIÓN COMPLETA DEL FORMULARIO =====
function validarFormularioCompleto() {
    const errores = [];
    
    if (convocatoriaCerrada) {
        errores.push('La convocatoria ha cerrado');
        return { valido: false, errores };
    }
    
    // Validar campos básicos de producto
    const nombreProducto = document.getElementById('nombre_producto')?.value?.trim();
    if (!nombreProducto) {
        errores.push('El nombre del producto es obligatorio');
    }
    
    const descripcionProducto = document.getElementById('descripcion_producto')?.value?.trim();
    if (!descripcionProducto) {
        errores.push('La descripción del producto es obligatoria');
    }
    
    const estadoProducto = document.querySelector('input[name="estado_producto"]:checked');
    if (!estadoProducto) {
        errores.push('Debe seleccionar el estado del producto');
    }
    
    // Validar campos de empresa
    const nombreLegal = document.getElementById('nombre_legal')?.value?.trim();
    const nit = document.getElementById('nit')?.value?.trim();
    const representante = document.getElementById('representante')?.value?.trim();
    const cedulaRepresentante = document.getElementById('cedula_representante')?.value?.trim();
    
    if (!nombreLegal) errores.push('El nombre legal de la empresa es obligatorio');
    if (!nit) errores.push('El NIT es obligatorio');
    if (!representante) errores.push('El representante legal es obligatorio');
    if (!cedulaRepresentante) errores.push('La cédula del representante es obligatoria');
    
    // Validar disponibilidad
    const disponibilidad = document.querySelector('input[name="disponibilidad"]:checked');
    if (!disponibilidad) {
        errores.push('Debe indicar su disponibilidad para el programa');
    }
    
    // Validar declaración - MEJORADA
    const declaracionVeraz = encontrarCheckboxDeclaracion();
    if (!declaracionVeraz || !declaracionVeraz.checked) {
        errores.push('Debe aceptar la declaración de veracidad');
        
        // Debug para ayudar a identificar el problema
        console.log('❌ Checkbox de declaración:', {
            encontrado: !!declaracionVeraz,
            checked: declaracionVeraz ? declaracionVeraz.checked : 'N/A',
            id: declaracionVeraz ? declaracionVeraz.id : 'No encontrado'
        });
    }
    
    return {
        valido: errores.length === 0,
        errores: errores
    };
}

// ===== CONSTRUCCIÓN DE OBJETOS =====
function construirProductoInfo() {
    return {
        nombre: document.getElementById('nombre_producto')?.value?.trim() || '',
        descripcion: document.getElementById('descripcion_producto')?.value?.trim() || '',
        estado_producto: document.querySelector('input[name="estado_producto"]:checked')?.value || '',
        mercado_objetivo: document.getElementById('mercado_objetivo')?.value?.trim() || ''
    };
}

function construirBrechas() {
    return {
        tecnicas: document.getElementById('brecha_tecnica_desc')?.value?.trim() || '',
        normativas: document.getElementById('brecha_normativa_desc')?.value?.trim() || '',
        calidad: document.getElementById('brecha_calidad_desc')?.value?.trim() || '',
        empaque: document.getElementById('brecha_empaque_desc')?.value?.trim() || '',
        mercado: document.getElementById('brecha_mercado_desc')?.value?.trim() || '',
        otras: document.getElementById('otras_brechas')?.value?.trim() || ''
    };
}

function construirMotivacion() {
    return {
        vision: document.getElementById('vision_producto')?.value?.trim() || '',
        impacto: document.getElementById('impacto_empresa')?.value?.trim() || '',
        compromisos: document.getElementById('compromisos')?.value?.trim() || '',
        motivo: document.getElementById('motivacion')?.value?.trim() || '',
        expectativa: document.getElementById('expectativas')?.value?.trim() || '',
        disponible: document.querySelector('input[name="disponibilidad"]:checked')?.value === 'true'
    };
}

// ===== GUARDAR BORRADOR =====
async function guardarComoBorrador() {
    try {
        console.log('Guardando borrador...');
        
        const producto_info = construirProductoInfo();
        const brechas = construirBrechas();
        const motivacion = construirMotivacion();
        
        const datos = {
            producto_info: JSON.stringify(producto_info),
            brechas: JSON.stringify(brechas),
            motivacion: JSON.stringify(motivacion)
        };
        
        console.log('Datos del borrador:', datos);
        
        const response = await fetch('/participante/guardar-borrador', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje(data.mensaje || 'Borrador guardado exitosamente', 'success');
        } else {
            mostrarMensaje(data.error || 'Error al guardar borrador', 'error');
        }
        
    } catch (error) {
        console.error('Error guardando borrador:', error);
        mostrarMensaje('Error al guardar borrador', 'error');
    }
}

// ===== ENVIAR POSTULACIÓN =====
async function enviarPostulacion() {
    console.log('=== INICIO ENVÍO POSTULACIÓN ===');
    
    if (convocatoriaCerrada) {
        mostrarMensaje('La convocatoria ha cerrado. No se pueden enviar postulaciones.', 'error');
        return;
    }
    
    // Verificar que el botón no esté deshabilitado
    const btnEnviar = document.getElementById('btn-enviar');
    if (btnEnviar?.disabled) {
        console.log('Botón deshabilitado, cancelando envío');
        return;
    }
    
    const confirmacion = confirm('¿Estás seguro de enviar tu postulación? Ya no podrás modificarla.');
    if (!confirmacion) return;
    
    // Deshabilitar botón para evitar doble envío
    if (btnEnviar) {
        btnEnviar.disabled = true;
        btnEnviar.textContent = 'Enviando...';
        btnEnviar.classList.add('loading');
    }
    
    try {
        // 1. VALIDACIÓN COMPLETA DEL FORMULARIO
        console.log('Validando formulario...');
        const validationResult = validarFormularioCompleto();
        if (!validationResult.valido) {
            mostrarMensaje('Errores de validación:\n' + validationResult.errores.join('\n'), 'error');
            return;
        }
        
        // 2. VALIDAR CÉDULAS COINCIDENTES
        const cedula1 = document.getElementById('cedula_representante')?.value?.trim();
        const cedula2 = document.getElementById('cedula_representante_declaracion')?.value?.trim();
        
        if (cedula1 && cedula2 && cedula1 !== cedula2) {
            mostrarMensaje('El número de cédula en la declaración no coincide con el proporcionado anteriormente.', 'error');
            return;
        }
        
        // 3. OBTENER EL FORMULARIO Y CREAR FORMDATA
        const form = document.getElementById('inscripcionForm');
        if (!form) {
            throw new Error('No se encontró el formulario inscripcionForm');
        }
        
        const formData = new FormData(form);
        console.log('FormData inicial creado');
        
        // 4. CONSTRUIR OBJETOS COMPLEJOS CON VALIDACIÓN
        const producto_info = construirProductoInfo();
        const brechas = construirBrechas();
        const motivacion = construirMotivacion();
        
        console.log('Objetos construidos:', { producto_info, brechas, motivacion });
        
        // 5. LIMPIAR Y AGREGAR CAMPOS JSON
        formData.delete('producto_info');
        formData.delete('brechas');
        formData.delete('motivacion');
        
        formData.append('producto_info', JSON.stringify(producto_info));
        formData.append('brechas', JSON.stringify(brechas));
        formData.append('motivacion', JSON.stringify(motivacion));
        
        // 6. DEBUG DEL FORMDATA
        console.log('=== CONTENIDO FINAL DEL FORMDATA ===');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, typeof value === 'object' && value.constructor.name === 'File' ? `[File: ${value.name}]` : value);
        }
        
        // 7. ENVIAR PETICIÓN
        console.log('Enviando petición...');
        const response = await fetch('/participante/enviar-postulacion', {
            method: 'POST',
            body: formData
        });
        
        console.log('Respuesta recibida:', response.status, response.statusText);
        
        // 8. PROCESAR RESPUESTA
        if (!response.ok) {
        let errorMessage;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.mensaje || 'Error desconocido';
        } catch (e) {
            try {
                const errorText = await res.text();
                errorMessage = errorText;
            } catch (e2) {
                errorMessage = `Error ${res.status}: ${res.statusText}`;
            }
        }
        console.error('Error response:', errorMessage);
        alert(`Error ${res.status}: ${errorMessage}`);
        return;
    }

        
        const data = await response.json();
        console.log('Respuesta exitosa:', data);
        
        mostrarMensaje(data.mensaje || '¡Postulación enviada exitosamente!', 'success');
        
        // Recargar la página después de un breve delay
        setTimeout(() => {
            location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('ERROR EN ENVÍO:', error);
        mostrarMensaje(`Error al enviar la postulación: ${error.message}`, 'error');
    } finally {
        // Rehabilitar botón
        if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Enviar Postulación';
            btnEnviar.classList.remove('loading');
        }
    }
}

// ===== UTILIDADES =====
function mostrarMensaje(mensaje, tipo = 'info') {
    // Buscar contenedor de mensajes existente
    let mensajeContainer = document.getElementById('mensaje-formulario');
    
    if (!mensajeContainer) {
        // Crear contenedor si no existe
        mensajeContainer = document.createElement('div');
        mensajeContainer.id = 'mensaje-formulario';
        mensajeContainer.className = 'mensaje-container';
        
        // Insertar al inicio del formulario
        const form = document.getElementById('inscripcionForm') || document.querySelector('form');
        if (form) {
            form.insertBefore(mensajeContainer, form.firstChild);
        } else {
            document.body.appendChild(mensajeContainer);
        }
    }
    
    mensajeContainer.innerHTML = `
        <div class="mensaje ${tipo}">
            <strong>${tipo === 'error' ? '❌' : tipo === 'success' ? '✅' : 'ℹ️'}</strong>
            ${mensaje}
        </div>
    `;
    
    mensajeContainer.style.display = 'block';
    
    // Auto-hide después de 5 segundos para mensajes de éxito
    if (tipo === 'success') {
        setTimeout(() => {
            mensajeContainer.style.display = 'none';
        }, 5000);
    }
    
    // Scroll al mensaje
    mensajeContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===== FUNCIONES LEGACY (por compatibilidad) =====
function recolectarDatosDelFormulario() {
    return {
        producto_info: construirProductoInfo(),
        brechas: construirBrechas(),
        motivacion: construirMotivacion()
    };
}

function startCountdown(deadline) {
    iniciarCuentaRegresiva(deadline);
}

function disableForm() {
    bloquearFormulario('El formulario ha sido deshabilitado.');
}
// ===== NUEVA FUNCIÓN HELPER =====
function encontrarCheckboxDeclaracion() {
    // Intentar múltiples formas de encontrar el checkbox
    const posiblesIds = [
        'declaracion_veraz',
        'declaracion_legal',
        'terms_accepted',
        'acepto_terminos'
    ];
    
    for (const id of posiblesIds) {
        const elemento = document.getElementById(id);
        if (elemento && elemento.type === 'checkbox') {
            return elemento;
        }
    }
    
    // Como último recurso, buscar cualquier checkbox requerido
    const checkboxRequerido = document.querySelector('input[type="checkbox"][required]');
    if (checkboxRequerido) {
        return checkboxRequerido;
    }
    
    return null;
}
