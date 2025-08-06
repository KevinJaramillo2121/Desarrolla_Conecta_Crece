        // ===== VARIABLES GLOBALES =====
        let applicationStatus = null;
        let convocatoriaData = null;
        let documentsCount = { uploaded: 0, pending: 0 };

        // ===== INICIALIZACIÓN =====
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Iniciando Panel de Participante...');
            initializeDashboard();
        });

        // ===== FUNCIONES PRINCIPALES =====
        async function initializeDashboard() {
            try {
                showToast('Cargando información del dashboard...', 'info');
                
                // Cargar datos en paralelo
                await Promise.all([
                    loadUserInfo(),
                    checkApplicationStatus(),
                    loadConvocatoriaInfo(),
                    loadDocumentsStatus()
                ]);

                showToast('Dashboard cargado correctamente', 'success');
                
            } catch (error) {
                console.error('Error inicializando dashboard:', error);
                showToast('Error al cargar la información. Intenta recargar la página.', 'error');
            }
        }

        // ===== GESTIÓN DE ESTADO DE POSTULACIÓN =====
        async function checkApplicationStatus() {
            try {
                const response = await fetch('/participante/estado-postulacion');
                if (!response.ok) throw new Error('Error al consultar estado');
                
                const data = await response.json();
                applicationStatus = data.estado;
                
                updateStatusDisplay(data.estado);
                updateApplicationCard(data.estado);
                
            } catch (error) {
                console.error('Error consultando estado:', error);
                updateStatusDisplay('error');
            }
        }

        function updateStatusDisplay(estado) {
            const indicator = document.getElementById('statusIndicator');
            const title = document.getElementById('statusTitle');
            const description = document.getElementById('statusDescription');
            const progress = document.getElementById('progressFill');
            
            let statusConfig = getStatusConfig(estado);
            
            // Actualizar indicador visual
            indicator.innerHTML = `
                <div class="status-icon ${statusConfig.class}">${statusConfig.icon}</div>
                <div class="status-info">
                    <div class="status-title">${statusConfig.title}</div>
                    <div class="status-description">${statusConfig.description}</div>
                </div>
            `;
            
            // Actualizar progreso
            progress.style.width = statusConfig.progress + '%';
            updateProgressSteps(statusConfig.step);
        }

        function getStatusConfig(estado) {
            const configs = {
                'sin_empresa': {
                    icon: '⚠️',
                    class: 'warning',
                    title: 'Registro Incompleto',
                    description: 'Debes completar el registro de tu empresa antes de continuar.',
                    progress: 25,
                    step: 1
                },
                'nueva': {
                    icon: '📝',
                    class: 'pending',
                    title: 'Lista para Postular',
                    description: 'Tu empresa está registrada. Ahora puedes completar tu postulación.',
                    progress: 25,
                    step: 1
                },
                'borrador': {
                    icon: '📄',
                    class: 'draft',
                    title: 'Borrador Guardado',
                    description: 'Tienes una postulación guardada como borrador. Complétala y envíala.',
                    progress: 50,
                    step: 2
                },
                'enviado': {
                    icon: '✅',
                    class: 'submitted',
                    title: 'Postulación Enviada',
                    description: 'Tu postulación fue enviada exitosamente. Está en proceso de evaluación.',
                    progress: 75,
                    step: 3
                },
                'error': {
                    icon: '❌',
                    class: 'error',
                    title: 'Error de Conexión',
                    description: 'No pudimos verificar el estado. Intenta recargar la página.',
                    progress: 0,
                    step: 1
                }
            };
            
            return configs[estado] || configs['nueva'];
        }

        function updateProgressSteps(currentStep) {
            const steps = document.querySelectorAll('.step');
            steps.forEach((step, index) => {
                if (index < currentStep) {
                    step.classList.add('completed');
                    step.classList.remove('active');
                } else if (index === currentStep - 1) {
                    step.classList.add('active');
                    step.classList.remove('completed');
                } else {
                    step.classList.remove('active', 'completed');
                }
            });
        }

        function updateApplicationCard(estado) {
            const statusBadge = document.getElementById('applicationStatus');
            const btn = document.getElementById('applicationBtn');
            const btnText = btn.querySelector('.btn-text');
            const btnIcon = btn.querySelector('.btn-icon');
            
            let badgeConfig = {
                'sin_empresa': { text: '⚠️ Registro Incompleto', class: 'warning' },
                'nueva': { text: '🆕 Disponible', class: 'available' },
                'borrador': { text: '📝 Borrador', class: 'draft' },
                'enviado': { text: '✅ Enviada', class: 'submitted' },
                'error': { text: '❌ Error', class: 'error' }
            };
            
            let btnConfig = {
                'sin_empresa': { text: 'Completar Registro', icon: '⚠️', disabled: false },
                'nueva': { text: 'Diligenciar Formulario', icon: '🚀', disabled: false },
                'borrador': { text: 'Continuar Borrador', icon: '📝', disabled: false },
                'enviado': { text: 'Ver Postulación', icon: '👁️', disabled: false },
                'error': { text: 'Reintentar', icon: '🔄', disabled: false }
            };
            
            // Actualizar badge
            const config = badgeConfig[estado] || badgeConfig['nueva'];
            statusBadge.innerHTML = `<span class="status-badge ${config.class}">${config.text}</span>`;
            
            // Actualizar botón
            const btnConf = btnConfig[estado] || btnConfig['nueva'];
            btnText.textContent = btnConf.text;
            btnIcon.textContent = btnConf.icon;
            btn.disabled = btnConf.disabled;
        }

        // ===== INFORMACIÓN DE CONVOCATORIA =====
        async function loadConvocatoriaInfo() {
            try {
                const response = await fetch('/participante/fecha-cierre');
                if (!response.ok) throw new Error('Error al cargar fecha de cierre');
                
                const data = await response.json();
                convocatoriaData = data;
                
                updateConvocatoriaDisplay(data.fechaFin);
                startCountdown(data.fechaFin);
                
            } catch (error) {
                console.error('Error cargando convocatoria:', error);
                document.getElementById('fechaCierre').textContent = 'No disponible';
                document.getElementById('diasRestantes').textContent = '-';
            }
        }

        function updateConvocatoriaDisplay(fechaFin) {
            const fechaCierreEl = document.getElementById('fechaCierre');
            const diasRestantesEl = document.getElementById('diasRestantes');
            
            if (fechaFin) {
                const fecha = new Date(fechaFin);
                fechaCierreEl.textContent = fecha.toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                const now = new Date();
                const diffTime = fecha - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                diasRestantesEl.textContent = diffDays > 0 ? `${diffDays} días` : 'Cerrada';
                diasRestantesEl.className = diffDays > 7 ? 'info-value countdown' : 'info-value countdown urgent';
            }
        }

        function startCountdown(fechaFin) {
            if (!fechaFin) return;
            
            setInterval(() => {
                updateConvocatoriaDisplay(fechaFin);
            }, 60000); // Actualizar cada minuto
        }

        // ===== GESTIÓN DE DOCUMENTOS =====
        async function loadDocumentsStatus() {
            // Esta función se conectará con el backend cuando esté disponible
            // Por ahora simularemos los datos
            documentsCount = { uploaded: 3, pending: 2 };
            updateDocumentsDisplay();
        }

        function updateDocumentsDisplay() {
            document.getElementById('uploadedDocs').textContent = documentsCount.uploaded;
            document.getElementById('pendingDocs').textContent = documentsCount.pending;
        }

        // ===== INFORMACIÓN DE USUARIO =====
        async function loadUserInfo() {
            // Esta función cargaría la información del usuario desde la sesión
            // Por ahora usaremos datos de ejemplo
            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = 'Usuario Participante'; // Se actualizará con datos reales
            }
        }

        // ===== NAVEGACIÓN Y ACCIONES =====
        function goToApplication() {
            if (applicationStatus === 'enviado') {
                showToast('Tu postulación ya fue enviada y no puede modificarse.', 'warning');
                return;
            }
            
            // Redirigir al formulario
            window.location.href = '/participante/formulario';
        }

        function checkDocuments() {
            showModal('Mis Documentos', `
                <div class="documents-list">
                    <div class="doc-item">
                        <span class="doc-icon">📄</span>
                        <span class="doc-name">Cámara de Comercio</span>
                        <span class="doc-status uploaded">✅ Subido</span>
                    </div>
                    <div class="doc-item">
                        <span class="doc-icon">📄</span>
                        <span class="doc-name">RUT</span>
                        <span class="doc-status uploaded">✅ Subido</span>
                    </div>
                    <div class="doc-item">
                        <span class="doc-icon">📄</span>
                        <span class="doc-name">Certificado de Tamaño</span>
                        <span class="doc-status pending">⏳ Pendiente</span>
                    </div>
                </div>
                <p>Para subir más documentos, ve al formulario de postulación.</p>
            `);
        }

        function showConvocatoriaDetails() {
            showModal('Información de la Convocatoria', `
                <div class="convocatoria-details">
                    <div class="detail-item">
                        <strong>Objetivo:</strong>
                        <p>Apoyar empresas en el desarrollo de productos innovadores a través del programa de fortalecimiento empresarial.</p>
                    </div>
                    <div class="detail-item">
                        <strong>Requisitos principales:</strong>
                        <ul>
                            <li>Empresa legalmente constituida</li>
                            <li>Afiliación vigente a Comfama (opcional pero valorado)</li>
                            <li>Producto o servicio en fase de desarrollo o mejora</li>
                            <li>Documentación empresarial completa</li>
                        </ul>
                    </div>
                    <div class="detail-item">
                        <strong>Beneficios:</strong>
                        <ul>
                            <li>Acompañamiento técnico especializado</li>
                            <li>Acceso a laboratorios de calidad</li>
                            <li>Asesoría en desarrollo de producto</li>
                            <li>Networking con otras empresas</li>
                        </ul>
                    </div>
                </div>
            `);
        }

        function showFAQ() {
            showModal('Preguntas Frecuentes', `
                <div class="faq-list">
                    <div class="faq-item">
                        <div class="faq-question">¿Puedo modificar mi postulación después de enviarla?</div>
                        <div class="faq-answer">No, una vez enviada la postulación no se puede modificar. Asegúrate de revisar toda la información antes del envío.</div>
                    </div>
                    <div class="faq-item">
                        <div class="faq-question">¿Qué documentos son obligatorios?</div>
                        <div class="faq-answer">Los documentos obligatorios incluyen: Cámara de Comercio, RUT, y certificados que acrediten el tamaño de la empresa.</div>
                    </div>
                    <div class="faq-item">
                        <div class="faq-question">¿Cuándo conoceré los resultados?</div>
                        <div class="faq-answer">Los resultados se publicarán de acuerdo al cronograma establecido. Recibirás una notificación por correo electrónico.</div>
                    </div>
                </div>
            `);
        }

        function contactSupport() {
            showModal('Contactar Soporte', `
                <div class="contact-info">
                    <div class="contact-method">
                        <span class="contact-icon">📞</span>
                        <div class="contact-details">
                            <strong>Teléfono:</strong>
                            <p>(604) 444-0000</p>
                        </div>
                    </div>
                    <div class="contact-method">
                        <span class="contact-icon">📧</span>
                        <div class="contact-details">
                            <strong>Email:</strong>
                            <p>convocatorias@comfama.com</p>
                        </div>
                    </div>
                    <div class="contact-method">
                        <span class="contact-icon">💬</span>
                        <div class="contact-details">
                            <strong>Chat en línea:</strong>
                            <p>Disponible de lunes a viernes de 8:00 AM a 6:00 PM</p>
                        </div>
                    </div>
                </div>
            `);
        }

        function downloadGuide() {
            showToast('Descargando guía del participante...', 'info');
            // Aquí se implementaría la descarga real
            setTimeout(() => {
                showToast('Guía descargada exitosamente', 'success');
            }, 2000);
        }

        function loadNews() {
            showToast('Cargando todas las noticias...', 'info');
        }

        function logout() {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                window.location.href = '/';
            }
        }

        // ===== SISTEMA DE MODALS =====
        function showModal(title, content) {
            const modal = document.getElementById('infoModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalBody = document.getElementById('modalBody');
            
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
            modal.style.display = 'flex';
            
            // Cerrar con ESC
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') closeModal();
            });
        }

        function closeModal() {
            document.getElementById('infoModal').style.display = 'none';
        }

        // ===== SISTEMA DE TOAST =====
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            
            toast.innerHTML = `
                <div class="toast-content">
                    <span class="toast-icon">${icons[type] || icons.info}</span>
                    <span class="toast-message">${message}</span>
                    <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
            
            container.appendChild(toast);
            
            // Auto-remove
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 5000);
            
            // Animate in
            setTimeout(() => {
                toast.classList.add('toast-show');
            }, 100);
        }

        // ===== EVENT LISTENERS =====
        
        // Cerrar modal al hacer clic fuera
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('infoModal');
            if (e.target === modal) {
                closeModal();
            }
        });

        // Manejar errores globales
        window.addEventListener('error', function(e) {
            console.error('Error JavaScript:', e.error);
            showToast('Se produjo un error inesperado', 'error');
        });
        
        window.addEventListener('unhandledrejection', function(e) {
            console.error('Promise rechazada:', e.reason);
            showToast('Error de conexión con el servidor', 'error');
        });