// ================================
// VARIABLES GLOBALES
// ================================
let currentStep = 1;
const totalSteps = 5;
let formData = {};

// ================================
// INICIALIZACIÓN
// ================================
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    setupEventListeners();
    initializeCountdown();
    checkApplicationStatus();
});

function initializeForm() {
    // Establecer fecha actual en el campo de declaración
    const fechaDeclaracion = document.getElementById('fecha_declaracion');
    if (fechaDeclaracion) {
        const today = new Date().toISOString().split('T')[0];
        fechaDeclaracion.value = today;
    }
    
    // Activar primer paso
    updateStepDisplay();
}

// ================================
// NAVEGACIÓN ENTRE PASOS
// ================================
function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            updateStepDisplay();
            scrollToTop();
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
        scrollToTop();
    }
}

function updateStepDisplay() {
    // Actualizar stepper
    document.querySelectorAll('.step-item').forEach((item, index) => {
        const stepNumber = index + 1;
        item.classList.remove('active', 'completed');
        
        if (stepNumber < currentStep) {
            item.classList.add('completed');
        } else if (stepNumber === currentStep) {
            item.classList.add('active');
        }
    });
    
    // Actualizar panels
    document.querySelectorAll('.step-panel').forEach((panel, index) => {
        const stepNumber = index + 1;
        panel.classList.remove('active');
        
        if (stepNumber === currentStep) {
            panel.classList.add('active');
        }
    });
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================
// VALIDACIÓN
// ================================
function validateCurrentStep() {
    const currentPanel = document.querySelector(`.step-panel[data-panel="${currentStep}"]`);
    const requiredFields = currentPanel.querySelectorAll('[required]');
    let isValid = true;
    
    // Limpiar errores previos
    clearValidationErrors(currentPanel);
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Validaciones específicas por paso
    if (currentStep === 1) {
        isValid = validateStep1() && isValid;
    } else if (currentStep === 5) {
        isValid = validateStep5() && isValid;
    }
    
    return isValid;
}

function validateField(field) {
    const value = field.type === 'radio' ? 
        document.querySelector(`input[name="${field.name}"]:checked`)?.value : 
        field.value;
        
    if (!value || value.trim() === '') {
        showFieldError(field, 'Este campo es obligatorio');
        return false;
    }
    
    // Validaciones específicas
    if (field.type === 'email' && !validateEmail(value)) {
        showFieldError(field, 'Ingresa un correo válido');
        return false;
    }
    
    if (field.name === 'nit' && !validateNIT(value)) {
        showFieldError(field, 'Ingresa un NIT válido');
        return false;
    }
    
    showFieldSuccess(field);
    return true;
}

function validateStep1() {
    // Validar que las cédulas coincidan
    const cedula1 = document.getElementById('cedula_representante').value;
    const cedula2 = document.getElementById('cedula_representante_declaracion')?.value;
    
    // Si estamos en el paso 5 y las cédulas no coinciden
    if (currentStep === 5 && cedula2 && cedula1 !== cedula2) {
        showFieldError(
            document.getElementById('cedula_representante_declaracion'),
            'Las cédulas deben coincidir'
        );
        return false;
    }
    
    return true;
}

function validateStep5() {
    // Validar documentos obligatorios
    const requiredDocs = ['camara_comercio', 'rut'];
    let isValid = true;
    
    requiredDocs.forEach(docName => {
        const input = document.getElementById(docName);
        if (!input.files.length) {
            showUploadError(input, 'Documento obligatorio');
            isValid = false;
        }
    });
    
    return isValid;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateNIT(nit) {
    // Validación básica de NIT colombiano
    const cleaned = nit.replace(/[^0-9]/g, '');
    return cleaned.length >= 9 && cleaned.length <= 10;
}

function showFieldError(field, message) {
    field.classList.add('error');
    field.classList.remove('success');
    
    // Remover mensaje de error previo
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Agregar nuevo mensaje de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<span>⚠️</span> ${message}`;
    field.parentNode.appendChild(errorDiv);
}

function showFieldSuccess(field) {
    field.classList.remove('error');
    field.classList.add('success');
    
    // Remover mensaje de error
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

function showUploadError(input, message) {
    const uploadCard = input.closest('.upload-card');
    uploadCard.classList.add('error');
    
    // Mostrar mensaje de error en la zona de upload
    const uploadZone = uploadCard.querySelector('.upload-zone');
    uploadZone.innerHTML = `
        <div class="upload-visual">❌</div>
        <p class="upload-text" style="color: var(--error);">${message}</p>
        <p class="upload-subtext">Haz clic para seleccionar archivo</p>
    `;
}

function clearValidationErrors(container) {
    container.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error', 'success');
    });
    
    container.querySelectorAll('.error-message').forEach(error => {
        error.remove();
    });
}

// ================================
// EVENT LISTENERS
// ================================
function setupEventListeners() {
    // Radio button "Otro" para estado del producto
    const estadoOtro = document.getElementById('estado_otro');
    const estadoOtroContainer = document.getElementById('estado_otro_container');
    
    if (estadoOtro && estadoOtroContainer) {
        document.querySelectorAll('input[name="estado_producto"]').forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'Otro') {
                    estadoOtroContainer.style.display = 'block';
                    document.getElementById('estado_otro_texto').required = true;
                } else {
                    estadoOtroContainer.style.display = 'none';
                    document.getElementById('estado_otro_texto').required = false;
                }
            });
        });
    }
    
    // Toggle switches para brechas
    setupBrechaToggles();
    
    // File uploads
    setupFileUploads();
    
    // Validación en tiempo real
    setupRealTimeValidation();
}

function setupBrechaToggles() {
    const toggles = [
        'brecha_tecnica',
        'brecha_normativa', 
        'brecha_calidad',
        'brecha_empaque',
        'brecha_mercado'
    ];
    
    toggles.forEach(toggleId => {
        const checkbox = document.getElementById(toggleId);
        const content = document.getElementById(toggleId + '_content');
        
        if (checkbox && content) {
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    content.classList.add('active');
                    content.style.display = 'block';
                } else {
                    content.classList.remove('active');
                    content.style.display = 'none';
                    // Limpiar el textarea
                    const textarea = content.querySelector('textarea');
                    if (textarea) textarea.value = '';
                }
            });
        }
    });
}

function setupFileUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function() {
            handleFileUpload(this);
        });
    });
    
    // Drag and drop
    setupDragAndDrop();
}

function setupRealTimeValidation() {
    const inputs = document.querySelectorAll('.form-input, .form-textarea, .form-select');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.hasAttribute('required')) {
                validateField(this);
            }
        });
        
        input.addEventListener('input', function() {
            // Remover errores mientras escribe
            this.classList.remove('error');
            const errorMsg = this.parentNode.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        });
    });
}

// ================================
// MANEJO DE ARCHIVOS
// ================================
function triggerFileInput(inputId) {
    document.getElementById(inputId).click();
}

function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
        showUploadError(input, 'El archivo es demasiado grande (máx. 2MB)');
        input.value = '';
        return;
    }
    
    // Validar tipo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        showUploadError(input, 'Tipo de archivo no válido');
        input.value = '';
        return;
    }
    
    // Mostrar preview
    showFilePreview(input, file);
}

function showFilePreview(input, file) {
    const uploadCard = input.closest('.upload-card');
    const uploadZone = uploadCard.querySelector('.upload-zone');
    const preview = uploadCard.querySelector('.file-preview');
    
    uploadCard.classList.remove('error');
    uploadZone.innerHTML = `
        <div class="upload-visual">✅</div>
        <p class="upload-text" style="color: var(--success);">Archivo cargado</p>
        <p class="upload-subtext">${file.name}</p>
    `;
    
    if (preview) {
        preview.style.display = 'flex';
        preview.innerHTML = `
            <div class="file-icon">📄</div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${(file.size / 1024).toFixed(1)} KB</div>
            </div>
            <button type="button" class="remove-file" onclick="removeFile('${input.id}')">✖️</button>
        `;
    }
}

function removeFile(inputId) {
    const input = document.getElementById(inputId);
    const uploadCard = input.closest('.upload-card');
    const uploadZone = uploadCard.querySelector('.upload-zone');
    const preview = uploadCard.querySelector('.file-preview');
    
    input.value = '';
    
    // Restaurar estado original
    const uploadInfo = uploadCard.querySelector('.upload-info');
    const title = uploadInfo.querySelector('h4').textContent;
    
    uploadZone.innerHTML = `
        <div class="upload-visual">📄</div>
        <p class="upload-text">Haz clic o arrastra tu archivo aquí</p>
        <p class="upload-subtext">Seleccionar archivo</p>
    `;
    
    if (preview) {
        preview.style.display = 'none';
        preview.innerHTML = '';
    }
}

function setupDragAndDrop() {
    const uploadZones = document.querySelectorAll('.upload-zone');
    
    uploadZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        zone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });
        
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            
            const input = this.querySelector('input[type="file"]');
            const files = e.dataTransfer.files;
            
            if (files.length > 0) {
                input.files = files;
                handleFileUpload(input);
            }
        });
    });
}

// ================================
// COUNTDOWN TIMER
// ================================
async function initializeCountdown() {
    try {
        const response = await fetch('/participante/fecha-cierre');
        const data = await response.json();
        
        if (data.fechaFin) {
            const deadline = new Date(data.fechaFin);
            startCountdown(deadline);
        }
    } catch (error) {
        console.error('Error al obtener fecha de cierre:', error);
        document.getElementById('timer-value').textContent = 'No disponible';
    }
}

function startCountdown(deadline) {
    const timerElement = document.getElementById('timer-value');
    
    function updateTimer() {
        const now = new Date().getTime();
        const distance = deadline.getTime() - now;
        
        if (distance < 0) {
            timerElement.textContent = 'Convocatoria cerrada';
            timerElement.style.color = 'var(--error)';
            disableForm();
            clearInterval(interval);
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        timerElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        
        // Cambiar color si queda poco tiempo
        if (days <= 1) {
            timerElement.style.color = 'var(--error)';
        } else if (days <= 3) {
            timerElement.style.color = 'var(--warning)';
        }
    }
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
}

function disableForm() {
    const form = document.getElementById('multi-step-form');
    const inputs = form.querySelectorAll('input, textarea, select, button');
    
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // Mostrar mensaje de convocatoria cerrada
    const message = document.createElement('div');
    message.className = 'alert alert-error';
    message.innerHTML = `
        <h3>⛔ Convocatoria Cerrada</h3>
        <p>El tiempo para enviar postulaciones ha terminado.</p>
    `;
    form.insertBefore(message, form.firstChild);
}

// ================================
// ESTADO DE LA APLICACIÓN
// ================================
async function checkApplicationStatus() {
    try {
        const response = await fetch('/participante/estado-postulacion');
        const data = await response.json();
        
        if (data.estado === 'enviado') {
            showApplicationSent();
        } else if (data.estado === 'borrador') {
            // Cargar datos del borrador
            loadDraftData();
        }
    } catch (error) {
        console.error('Error al verificar estado:', error);
    }
}

function showApplicationSent() {
    const form = document.getElementById('multi-step-form');
    const inputs = form.querySelectorAll('input, textarea, select, button');
    
    inputs.forEach(input => {
        input.disabled = true;
    });
    
    // Mostrar mensaje de éxito
    const message = document.createElement('div');
    message.className = 'alert alert-success';
    message.innerHTML = `
        <h3>✅ Postulación Enviada</h3>
        <p>Tu postulación ha sido enviada exitosamente. Recibirás notificaciones sobre el proceso de evaluación.</p>
    `;
    form.insertBefore(message, form.firstChild);
}

async function loadDraftData() {
    // Implementar carga de datos guardados como borrador
    console.log('Cargando datos de borrador...');
}

// ================================
// GUARDAR BORRADOR
// ================================
async function saveDraft() {
    try {
        const data = collectFormData();
        
        const response = await fetch('/participante/guardar-borrador', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('💾 Borrador guardado exitosamente', 'success');
        } else {
            showNotification(`❌ Error: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Error al guardar borrador:', error);
        showNotification('❌ Error al guardar borrador', 'error');
    }
}

// ================================
// ENVÍO FINAL
// ================================
function submitForm() {
    if (!validateCurrentStep()) {
        showNotification('❌ Por favor, completa todos los campos obligatorios', 'error');
        return;
    }
    
    // Mostrar modal de confirmación
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

async function confirmSubmit() {
    closeModal();
    
    try {
        showLoading();
        
        const formData = new FormData();
        const data = collectFormData();
        
        // Agregar datos JSON
        formData.append('producto_info', JSON.stringify(data.producto_info));
        formData.append('brechas', JSON.stringify(data.brechas));
        formData.append('motivacion', JSON.stringify(data.motivacion));
        
        // Agregar datos simples
        Object.keys(data).forEach(key => {
            if (!['producto_info', 'brechas', 'motivacion'].includes(key)) {
                formData.append(key, data[key]);
            }
        });
        
        // Agregar archivos
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            if (input.files.length > 0) {
                formData.append(input.name, input.files[0]);
            }
        });
        
        const response = await fetch('/participante/enviar-postulacion', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        hideLoading();
        
        if (response.ok) {
            showSuccessModal();
        } else {
            showNotification(`❌ Error: ${result.error}`, 'error');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Error al enviar postulación:', error);
        showNotification('❌ Error al enviar la postulación', 'error');
    }
}

// ================================
// RECOLECCIÓN DE DATOS
// ================================
function collectFormData() {
    const form = document.getElementById('multi-step-form');
    const formData = new FormData(form);
    const data = {};
    
    // Datos básicos
    for (let [key, value] of formData.entries()) {
        if (!key.includes('[]') && !['producto_info', 'brechas', 'motivacion'].includes(key)) {
            data[key] = value;
        }
    }
    
    // Producto info
    data.producto_info = {
        nombre: document.getElementById('nombre_producto')?.value || '',
        descripcion: document.getElementById('descripcion_producto')?.value || '',
        estado_producto: document.querySelector('input[name="estado_producto"]:checked')?.value || '',
        estado_otro_texto: document.getElementById('estado_otro_texto')?.value || '',
        mercado_objetivo: document.getElementById('mercado_objetivo')?.value || ''
    };
    
    // Brechas
    data.brechas = {
        tecnicas: document.getElementById('brecha_tecnica_desc')?.value || '',
        normativas: document.getElementById('brecha_normativa_desc')?.value || '',
        calidad: document.getElementById('brecha_calidad_desc')?.value || '',
        empaque: document.getElementById('brecha_empaque_desc')?.value || '',
        mercado: document.getElementById('brecha_mercado_desc')?.value || '',
        otras: document.getElementById('otras_brechas')?.value || ''
    };
    
    // Motivación y expectativas
    data.motivacion = {
        vision: document.getElementById('vision_producto')?.value || '',
        impacto: document.getElementById('impacto_empresa')?.value || '',
        compromisos: document.getElementById('compromisos')?.value || '',
        motivo: document.getElementById('motivacion')?.value || '',
        expectativa: document.getElementById('expectativas')?.value || '',
        disponible: document.querySelector('input[name="disponibilidad"]:checked')?.value === 'true'
    };
    
    return data;
}

// ================================
// UTILIDADES UI
// ================================
function showNotification(message, type = 'info') {
    // Crear notificación toast
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;
    
    // Estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--error)' : 'var(--primary-blue)'};
        color: white;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        font-weight: 500;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        ">
            <div style="
                background: white;
                padding: 40px;
                border-radius: 12px;
                text-align: center;
                box-shadow: var(--shadow-xl);
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid var(--primary-orange);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p style="color: var(--text-dark); font-weight: 500;">Enviando postulación...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.remove();
    }
}

function showSuccessModal() {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
        ">
            <div style="
                background: white;
                padding: 60px 40px;
                border-radius: 16px;
                text-align: center;
                max-width: 500px;
                box-shadow: var(--shadow-xl);
            ">
                <div style="font-size: 64px; margin-bottom: 20px;">🎉</div>
                <h2 style="color: var(--success); margin-bottom: 16px; font-size: 24px;">¡Postulación Enviada!</h2>
                <p style="color: var(--text-gray); margin-bottom: 32px; line-height: 1.6;">
                    Tu postulación ha sido enviada exitosamente. Recibirás notificaciones sobre el proceso de evaluación en el correo registrado.
                </p>
                <button onclick="window.location.href='/participante'" style="
                    background: var(--success);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 16px;
                ">Ir al Panel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ================================
// ESTILOS DINÁMICOS
// ================================
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .drag-over {
        border-color: var(--primary-orange) !important;
        background: rgba(243, 119, 40, 0.1) !important;
    }
    
    .alert {
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        text-align: center;
    }
    
    .alert-success {
        background: #ecfdf5;
        border: 1px solid #a7f3d0;
        color: #065f46;
    }
    
    .alert-error {
        background: #fef2f2;
        border: 1px solid #fca5a5;
        color: #991b1b;
    }
`;
document.head.appendChild(style);
