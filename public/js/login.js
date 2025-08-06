// ================================
// VARIABLES GLOBALES
// ================================
let isLoading = false;

// ================================
// INICIALIZACIÓN
// ================================
document.addEventListener('DOMContentLoaded', function() {
    initializeLogin();
    setupEventListeners();
    setupValidation();
    checkUrlParams();
});

function initializeLogin() {
    // Limpiar cualquier estado previo
    clearMessages();
    resetForm();
    
    // Focus automático en el primer campo
    document.getElementById('usuario').focus();
}

// ================================
// EVENT LISTENERS
// ================================
function setupEventListeners() {
    // Formulario de login
    document.getElementById('formLogin').addEventListener('submit', handleLogin);
    
    // Toggle de contraseña
    document.getElementById('togglePassword').addEventListener('click', togglePasswordVisibility);
    
    // Modal de recuperación de contraseña
    document.getElementById('forgotPassword').addEventListener('click', showForgotPasswordModal);
    document.getElementById('closeForgotModal').addEventListener('click', hideForgotPasswordModal);
    document.getElementById('cancelForgot').addEventListener('click', hideForgotPasswordModal);
    document.getElementById('sendReset').addEventListener('click', handlePasswordReset);
    
    // Cerrar modal al hacer clic fuera
    document.getElementById('forgotPasswordModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideForgotPasswordModal();
        }
    });
    
    // Teclas de acceso rápido
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

function setupValidation() {
    const inputs = document.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                clearFieldError(this);
            }
        });
    });
}

// ================================
// MANEJO DEL LOGIN
// ================================
async function handleLogin(e) {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Validar formulario
    if (!validateForm()) {
        showMessage('Por favor, completa todos los campos correctamente.', 'error');
        return;
    }
    
    const form = e.target;
    const formData = new FormData(form);
    const loginData = Object.fromEntries(formData.entries());
    
    try {
        setLoading(true);
        showMessage('Verificando credenciales...', 'loading');
        
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('¡Inicio de sesión exitoso!', 'success');
            
            // Efecto de éxito
            document.querySelector('.login-card').style.transform = 'scale(0.98)';
            
            // Guardar preferencia de recordar sesión
            if (document.getElementById('recordar').checked) {
                localStorage.setItem('rememberUser', loginData.nombre_usuario);
            }
            
            // Redireccionar después de una breve pausa
            setTimeout(() => {
                window.location.href = result.redireccion;
            }, 1500);
            
        } else {
            showMessage(result.mensaje || 'Credenciales incorrectas', 'error');
            
            // Efecto de error
            document.querySelector('.login-card').style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                document.querySelector('.login-card').style.animation = '';
            }, 500);
            
            // Focus en el campo de usuario para reintento
            document.getElementById('usuario').focus();
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showMessage('Error de conexión. Por favor, intenta nuevamente.', 'error');
    } finally {
        setLoading(false);
    }
}

// ================================
// VALIDACIÓN
// ================================
function validateForm() {
    const usuario = document.getElementById('usuario');
    const password = document.getElementById('password');
    let isValid = true;
    
    if (!validateField(usuario)) {
        isValid = false;
    }
    
    if (!validateField(password)) {
        isValid = false;
    }
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let isValid = true;
    let errorMessage = '';
    
    // Validar campo requerido
    if (!value) {
        errorMessage = 'Este campo es obligatorio';
        isValid = false;
    } else {
        // Validaciones específicas
        if (fieldName === 'nombre_usuario') {
            if (value.length < 3) {
                errorMessage = 'El usuario debe tener al menos 3 caracteres';
                isValid = false;
            } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
                errorMessage = 'Solo se permiten letras, números y guiones bajos';
                isValid = false;
            }
        } else if (fieldName === 'password') {
            if (value.length < 4) {
                errorMessage = 'La contraseña debe tener al menos 4 caracteres';
                isValid = false;
            }
        }
    }
    
    if (isValid) {
        showFieldSuccess(field);
    } else {
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');
    field.classList.remove('success');
    
    const errorContainer = field.parentNode.parentNode.querySelector('.input-error');
    errorContainer.textContent = message;
    errorContainer.innerHTML = `⚠️ ${message}`;
}

function showFieldSuccess(field) {
    field.classList.remove('error');
    field.classList.add('success');
    
    const errorContainer = field.parentNode.parentNode.querySelector('.input-error');
    errorContainer.textContent = '';
}

function clearFieldError(field) {
    field.classList.remove('error');
    
    const errorContainer = field.parentNode.parentNode.querySelector('.input-error');
    errorContainer.textContent = '';
}

// ================================
// UTILIDADES UI
// ================================
function showMessage(text, type = 'info') {
    const messageContainer = document.getElementById('mensaje');
    const messageText = messageContainer.querySelector('.message-text');
    
    messageText.textContent = text;
    messageContainer.className = `message-container ${type}`;
    messageContainer.style.display = 'flex';
    
    // Auto-hide para mensajes de éxito y error
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            hideMessage();
        }, 5000);
    }
}

function hideMessage() {
    const messageContainer = document.getElementById('mensaje');
    messageContainer.style.display = 'none';
}

function clearMessages() {
    hideMessage();
}

function setLoading(loading) {
    isLoading = loading;
    const btn = document.getElementById('btnLogin');
    const form = document.getElementById('formLogin');
    
    if (loading) {
        btn.classList.add('loading');
        btn.disabled = true;
        form.classList.add('loading');
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
        form.classList.remove('loading');
    }
}

function resetForm() {
    document.getElementById('formLogin').reset();
    document.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('error', 'success');
    });
    document.querySelectorAll('.input-error').forEach(error => {
        error.textContent = '';
    });
}

// ================================
// FUNCIONALIDADES ADICIONALES
// ================================
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePassword');
    const eyeOpen = toggleBtn.querySelector('.eye-open');
    const eyeClosed = toggleBtn.querySelector('.eye-closed');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
    } else {
        passwordInput.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
    }
}

function showForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').style.display = 'flex';
    document.getElementById('emailRecuperar').focus();
}

function hideForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').style.display = 'none';
    document.getElementById('emailRecuperar').value = '';
}

async function handlePasswordReset() {
    const email = document.getElementById('emailRecuperar').value.trim();
    
    if (!email) {
        alert('Por favor, ingresa tu correo electrónico.');
        return;
    }
    
    if (!validateEmail(email)) {
        alert('Por favor, ingresa un correo electrónico válido.');
        return;
    }
    
    try {
        // Simular envío (aquí iría la lógica real)
        const btn = document.getElementById('sendReset');
        btn.textContent = 'Enviando...';
        btn.disabled = true;
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        alert('Se han enviado las instrucciones a tu correo electrónico.');
        hideForgotPasswordModal();
        
    } catch (error) {
        alert('Error al enviar las instrucciones. Intenta nuevamente.');
    } finally {
        const btn = document.getElementById('sendReset');
        btn.textContent = 'Enviar instrucciones';
        btn.disabled = false;
    }
}

function handleKeyboardShortcuts(e) {
    // Enter para enviar formulario cuando el focus esté en cualquier campo
    if (e.key === 'Enter' && !isLoading) {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('form-input')) {
            e.preventDefault();
            document.getElementById('formLogin').dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape para cerrar modales
    if (e.key === 'Escape') {
        hideForgotPasswordModal();
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const type = urlParams.get('type');
    
    if (message) {
        showMessage(decodeURIComponent(message), type || 'info');
        
        // Limpiar URL sin recargar la página
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
    
    // Cargar usuario recordado
    const rememberedUser = localStorage.getItem('rememberUser');
    if (rememberedUser) {
        document.getElementById('usuario').value = rememberedUser;
        document.getElementById('recordar').checked = true;
        document.getElementById('password').focus();
    }
}

// ================================
// ANIMACIONES CSS ADICIONALES
// ================================
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
        20%, 40%, 60%, 80% { transform: translateX(8px); }
    }
    
    .form-input.success {
        border-color: var(--success);
        background-image: url("data:image/svg+xml,%3csvg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='m13.854 3.646-7.5 7.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6 10.293l7.146-7.147a.5.5 0 0 1 .708.708z' fill='%2310b981'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px;
        padding-right: 48px;
    }
    
    .login-card {
        transform-origin: center;
        transition: transform 0.2s ease;
    }
    
    .form.loading {
        pointer-events: none;
        opacity: 0.7;
    }
`;
document.head.appendChild(additionalStyles);
