    // js/register-modern.js
    document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formularioRegistro');
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const progressSteps = Array.from(document.querySelectorAll('.progress-step'));
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const stepTitle = document.getElementById('stepTitle');
    const stepDesc = document.getElementById('stepDescription');
    const messageContainer = document.getElementById('mensaje');

    let currentStep = 0;

    const titles = [
        'Crea tu cuenta',
        'Datos de la Empresa',
        'Confirmación'
    ];
    const descriptions = [
        'Ingresa tus datos personales para comenzar',
        'Completa la información de tu negocio',
        'Revisa y acepta los términos'
    ];

    function updateFormSteps() {
        steps.forEach((step, idx) => {
        step.classList.toggle('active', idx === currentStep);
        progressSteps[idx].classList.toggle('active', idx <= currentStep);
        });
        prevBtn.style.display = currentStep === 0 ? 'none' : 'flex';
        nextBtn.style.display = currentStep === steps.length - 1 ? 'none' : 'flex';
        submitBtn.style.display = currentStep === steps.length - 1 ? 'flex' : 'none';
        stepTitle.textContent = titles[currentStep];
        stepDesc.textContent = descriptions[currentStep];
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    nextBtn.addEventListener('click', () => {
        const activeFields = Array.from(steps[currentStep].querySelectorAll('input, select')).filter(i => i.required);
        const valid = activeFields.every(input => {
        if (input.type === 'checkbox') return input.checked;
        return input.reportValidity();
        });
        if (!valid) return;
        if (currentStep === steps.length - 2) fillConfirmation();
        currentStep++;
        updateFormSteps();
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        updateFormSteps();
    });

    function fillConfirmation() {
        document.getElementById('confirm-nombre_completo').textContent = form.nombre_completo.value;
        document.getElementById('confirm-nombre_usuario').textContent = form.nombre_usuario.value;
        document.getElementById('confirm-correo').textContent = form.correo.value;
        document.getElementById('confirm-nombre_legal').textContent = form.nombre_legal.value;
        document.getElementById('confirm-nit').textContent = form.nit.value;
        document.getElementById('confirm-persona_juridica').textContent = form.persona_juridica.selectedOptions[0].text;
        document.getElementById('confirm-tipo_empresa').textContent = form.tipo_empresa.selectedOptions[0].text;
        document.getElementById('confirm-representante').textContent = form.representante.value;
        document.getElementById('confirm-ubicacion').textContent = form.fuera_valle.checked ? 'Fuera del Valle' : 'Valle de Aburrá';

        const features = [];
        if (form.afiliada_comfama.checked) features.push('Afiliada a Comfama');
        if (form.tiene_trabajador.checked) features.push('Trabajador afiliado');
        const container = document.getElementById('confirm-features');
        container.innerHTML = features.map(f => `<span class="tag">${f}</span>`).join('');
    }

    // Password toggle & strength
    ['togglePassword1','togglePassword2'].forEach(id => {
        const btn = document.getElementById(id);
        const input = btn.previousElementSibling;
        btn.addEventListener('click', () => {
        const open = btn.querySelector('.eye-open');
        const closed = btn.querySelector('.eye-closed');
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        open.style.display = isPwd ? 'none' : 'block';
        closed.style.display = isPwd ? 'block' : 'none';
        });
    });
    form.password.addEventListener('input', () => {
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        const val = form.password.value;
        let score = 0;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;
        if (val.length >= 8) score++;
        const pct = (score / 4) * 100;
        strengthBar.style.width = pct + '%';
        strengthBar.style.background = score <= 1 ? '#ef4444' : score === 2 ? '#f59e0b' : '#10b981';
        strengthText.textContent = ['Muy débil','Débil','Moderada','Fuerte','Muy fuerte'][score];
    });

    // Terms modal
    const termsModal = document.getElementById('termsModal');
    document.getElementById('viewTerms').addEventListener('click', e => {
        e.preventDefault();
        termsModal.style.display = 'flex';
    });
    document.getElementById('closeTermsModal').addEventListener('click', () => {
        termsModal.style.display = 'none';
    });
    document.getElementById('acceptTerms').addEventListener('click', () => {
        form.terms_accepted.checked = true;
        termsModal.style.display = 'none';
    });

    // Form submission
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!form.reportValidity()) return;
        submitBtn.classList.add('loading');
        try {
        const data = new FormData(form);
        const json = Object.fromEntries(data.entries());
        const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(json)
        });
        const result = await res.json();
        messageContainer.style.display = 'flex';
        messageContainer.className = res.ok ? 'message-container success' : 'message-container error';
        messageContainer.querySelector('.message-text').textContent = result.mensaje || result.error;
        if (res.ok) {
            setTimeout(() => window.location.href = '/login.html', 2000);
        } else {
            submitBtn.classList.remove('loading');
        }
        } catch {
        messageContainer.style.display = 'flex';
        messageContainer.className = 'message-container error';
        messageContainer.querySelector('.message-text').textContent = 'Error en el servidor.';
        submitBtn.classList.remove('loading');
        }
    });

    updateFormSteps();
    });



    // En register.js

nextBtn.addEventListener('click', () => {
    // =================================================================
    // ▼ INICIO DEL CÓDIGO DE VALIDACIÓN DE CHECKBOXES ▼
    // =================================================================

    // Primero, oculta cualquier mensaje de error anterior
    const checkboxError = document.getElementById('checkbox-error');
    if (checkboxError) {
        checkboxError.style.display = 'none';
    }

    // Verifica si estamos en el paso 2: "Datos de la Empresa" (cuyo índice es 1)
    if (currentStep === 1) {
        const esAfiliada = form.afiliada_comfama.checked;
        const tieneTrabajador = form.tiene_trabajador.checked;

        // Si NINGUNA de las dos opciones está marcada, muestra el error y detén el proceso.
        if (!esAfiliada && !tieneTrabajador) {
            if (checkboxError) {
                checkboxError.textContent = 'La empresa debe estar afiliada, debe tener al menos un trabajador afiliado y debe estar ubicada en el valle de aburrá.';
                checkboxError.style.display = 'flex'; // Usamos flex para centrar el texto si es necesario
            }
            return; // ¡Importante! Esto detiene la ejecución y no permite avanzar.
        }
    }

    // =================================================================
    // ▲ FIN DEL CÓDIGO DE VALIDACIÓN ▲
    // =================================================================


    // El resto de tu código de validación original continúa aquí...
    const activeFields = Array.from(steps[currentStep].querySelectorAll('input, select')).filter(i => i.required);
    const valid = activeFields.every(input => {
        if (input.type === 'checkbox') return input.checked;
        return input.reportValidity();
    });

    if (!valid) return;

    // ...etc.
});
