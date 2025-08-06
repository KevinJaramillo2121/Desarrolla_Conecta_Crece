        // ✅ VARIABLES GLOBALES
        let postulacionesData = [];
        let filteredData = [];
        
        // ✅ CARGAR POSTULACIONES AL INICIAR LA PÁGINA
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Página cargada, iniciando carga de postulaciones...');
            cargarPostulaciones();
            setupFilters();
        });
        
        // ✅ CONFIGURAR FILTROS
        function setupFilters() {
            const searchInput = document.getElementById('search-filter');
            const statusFilter = document.getElementById('status-filter');
            const typeFilter = document.getElementById('type-filter');
            
            if (searchInput) {
                searchInput.addEventListener('input', filtrarPostulaciones);
            }
            if (statusFilter) {
                statusFilter.addEventListener('change', filtrarPostulaciones);
            }
            if (typeFilter) {
                typeFilter.addEventListener('change', filtrarPostulaciones);
            }
        }
        
        // ✅ FUNCIÓN PARA FILTRAR POSTULACIONES
        function filtrarPostulaciones() {
            const searchTerm = document.getElementById('search-filter')?.value.toLowerCase() || '';
            const statusFilter = document.getElementById('status-filter')?.value || '';
            const typeFilter = document.getElementById('type-filter')?.value || '';
            
            filteredData = postulacionesData.filter(post => {
                const matchesSearch = post.nombre_legal?.toLowerCase().includes(searchTerm);
                
                let matchesStatus = true;
                if (statusFilter) {
                    if (statusFilter === 'pendiente') {
                        matchesStatus = !post.estado_preseleccion || post.estado_preseleccion === '';
                    } else {
                        matchesStatus = post.estado_preseleccion === statusFilter;
                    }
                }
                
                const matchesType = !typeFilter || post.tipo_empresa === typeFilter;
                
                return matchesSearch && matchesStatus && matchesType;
            });
            
            mostrarPostulaciones(filteredData);
            updateStats();
        }
        
        // ✅ FUNCIÓN PARA CARGAR LISTA DE POSTULACIONES
        async function cargarPostulaciones() {
            try {
                console.log('Cargando postulaciones...');
                
                const response = await fetch('/evaluador/postulaciones');
                
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }
                
                const postulaciones = await response.json();
                console.log('Postulaciones cargadas:', postulaciones);
                
                postulacionesData = postulaciones;
                filteredData = postulaciones;
                mostrarPostulaciones(postulaciones);
                updateStats();
                
            } catch (error) {
                console.error('Error al cargar postulaciones:', error);
                const lista = document.getElementById('postulaciones-lista');
                if (lista) {
                    lista.innerHTML = `
                        <div class="error-card">
                            <div class="error-icon">❌</div>
                            <h3>Error al cargar postulaciones</h3>
                            <p>${error.message}</p>
                            <button class="btn btn-primary" onclick="cargarPostulaciones()">
                                🔄 Reintentar
                            </button>
                        </div>
                    `;
                }
            }
        }
        
        // ✅ ACTUALIZAR ESTADÍSTICAS
        function updateStats() {
            const total = postulacionesData.length;
            const pendientes = postulacionesData.filter(p => !p.estado_preseleccion || p.estado_preseleccion === '').length;
            const completadas = total - pendientes;
            
            const totalEl = document.getElementById('total-postulaciones');
            const pendientesEl = document.getElementById('pendientes-evaluacion');
            const completadasEl = document.getElementById('evaluaciones-completadas');
            
            if (totalEl) totalEl.textContent = total;
            if (pendientesEl) pendientesEl.textContent = pendientes;
            if (completadasEl) completadasEl.textContent = completadas;
        }
        
        // ✅ FUNCIÓN PARA MOSTRAR POSTULACIONES EN LA LISTA (MEJORADA)
        function mostrarPostulaciones(postulaciones) {
            const lista = document.getElementById('postulaciones-lista');
            
            if (!lista) {
                console.error('Elemento postulaciones-lista no encontrado');
                return;
            }
            
            if (!postulaciones || postulaciones.length === 0) {
                lista.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <h3>No hay postulaciones</h3>
                        <p>No se encontraron postulaciones que coincidan con los filtros aplicados.</p>
                    </div>
                `;
                return;
            }
            
            lista.innerHTML = postulaciones.map(post => {
                const statusClass = getStatusClass(post.estado_preseleccion);
                const statusIcon = getStatusIcon(post.estado_preseleccion);
                const statusText = getStatusText(post.estado_preseleccion);
                
                return `
                    <div class="postulacion-card ${statusClass}">
                        <div class="card-header">
                            <h3 class="company-name">🏢 ${post.nombre_legal}</h3>
                            <div class="status-badge ${statusClass}">
                                ${statusIcon} ${statusText}
                            </div>
                        </div>
                        
                        <div class="card-body">
                            <div class="company-info">
                                <div class="info-item">
                                    <span class="info-icon">🏭</span>
                                    <span>Empresa ${post.tipo_empresa || 'No especificado'}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-icon">📍</span>
                                    <span>${post.municipio || 'No especificado'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card-footer">
                            <button class="btn btn-primary btn-evaluate" onclick="verDetalle(${post.id})">
                                <span class="btn-icon">👁️</span>
                                Ver Detalle y Evaluar
                                <span class="btn-arrow">→</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // ✅ FUNCIONES AUXILIARES PARA ESTADOS
        function getStatusClass(estado) {
            if (!estado) return 'status-pending';
            if (estado === 'Preseleccionado') return 'status-approved';
            if (estado === 'No_preseleccionado') return 'status-rejected';
            return 'status-pending';
        }
        
        function getStatusIcon(estado) {
            if (!estado) return '⏳';
            if (estado === 'Preseleccionado') return '✅';
            if (estado === 'No_preseleccionado') return '❌';
            return '⏳';
        }
        
        function getStatusText(estado) {
            if (!estado) return 'Pendiente';
            if (estado === 'Preseleccionado') return 'Preseleccionada';
            if (estado === 'No_preseleccionado') return 'No preseleccionada';
            return 'Pendiente';
        }
        
        // ✅ FUNCIÓN PRINCIPAL PARA VER DETALLE (MEJORADA)
        async function verDetalle(empresaId) {
            try {
                console.log('Cargando detalle para empresa:', empresaId);
                
                const detalleModal = document.getElementById('detalle-postulacion');
                const documentosContainer = document.getElementById('documentos-lista');
                
                if (!detalleModal) {
                    showToast('Error: Elemento detalle-postulacion no encontrado', 'error');
                    return;
                }
                
                // Mostrar modal
                detalleModal.style.display = 'flex';
                
                // Mostrar loading
                const detailBody = detalleModal.querySelector('.detail-body');
                detailBody.innerHTML = `
                    <div class="loading-section">
                        <div class="loading-spinner"></div>
                        <p>Cargando detalle de postulación...</p>
                    </div>
                `;
                
                // ✅ CARGAR DETALLE DE POSTULACIÓN
                const responsePostulacion = await fetch(`/evaluador/evaluador/postulacion/${empresaId}`);
                
                if (!responsePostulacion.ok) {
                    throw new Error(`Error HTTP: ${responsePostulacion.status} - ${responsePostulacion.statusText}`);
                }
                
                const data = await responsePostulacion.json();
                console.log('✅ Datos de postulación recibidos:', data);
                
                if (!data || !data.empresa || !data.postulacion) {
                    throw new Error('Datos incompletos recibidos del servidor');
                }
                
                // ✅ MOSTRAR DETALLE DE LA EMPRESA Y POSTULACIÓN
                await mostrarDetallePostulacion(data, empresaId);
                
                // ✅ CARGAR DOCUMENTOS
                await cargarDocumentos(empresaId);
                
            } catch (error) {
                console.error('❌ Error al cargar detalle:', error);
                showToast('Error al cargar el detalle: ' + error.message, 'error');
                
                const detalleModal = document.getElementById('detalle-postulacion');
                const detailBody = detalleModal?.querySelector('.detail-body');
                if (detailBody) {
                    detailBody.innerHTML = `
                        <div class="error-section">
                            <div class="error-icon">❌</div>
                            <h3>Error al cargar el detalle</h3>
                            <p>${error.message}</p>
                            <button class="btn btn-primary" onclick="verDetalle(${empresaId})">
                                🔄 Reintentar
                            </button>
                        </div>
                    `;
                }
            }
        }
        
        // ✅ FUNCIÓN PARA MOSTRAR EL DETALLE DE LA POSTULACIÓN (MEJORADA)
        async function mostrarDetallePostulacion(data, empresaId) {
            const detalleModal = document.getElementById('detalle-postulacion');
            const detailBody = detalleModal?.querySelector('.detail-body');
            
            if (!detailBody) {
                console.error('No se puede mostrar detalle - elemento no encontrado');
                return;
            }
            
            const empresa = data.empresa;
            const postulacion = data.postulacion;
            
            detailBody.innerHTML = `
                <div class="detail-sections">
                    <!-- Información de la Empresa -->
                    <div class="detail-section empresa-section">
                        <div class="section-header">
                            <h3><span class="section-icon">🏢</span>Información de la Empresa</h3>
                        </div>
                        <div class="section-content">
                            <div class="info-grid">
                                <div class="info-card">
                                    <strong>Nombre Legal:</strong>
                                    <span>${empresa.nombre_legal || 'No especificado'}</span>
                                </div>
                                <div class="info-card">
                                    <strong>NIT:</strong>
                                    <span>${empresa.nit || 'No especificado'}</span>
                                </div>
                                <div class="info-card">
                                    <strong>Tipo de Empresa:</strong>
                                    <span>${empresa.tipo_empresa || 'No especificado'}</span>
                                </div>
                                <div class="info-card">
                                    <strong>Municipio:</strong>
                                    <span>${empresa.municipio || 'No especificado'}</span>
                                </div>
                                <div class="info-card">
                                    <strong>Representante Legal:</strong>
                                    <span>${empresa.representante || 'No especificado'}</span>
                                </div>
                                <div class="info-card">
                                    <strong>Teléfono:</strong>
                                    <span>${empresa.telefono_contacto || 'No especificado'}</span>
                                </div>
                                <div class="info-card">
                                    <strong>Correo:</strong>
                                    <span>${empresa.correo_contacto || 'No especificado'}</span>
                                </div>
                                <div class="info-card">
                                    <strong>Afiliada a Comfama:</strong>
                                    <span class="badge ${empresa.afiliada_comfama ? 'badge-success' : 'badge-secondary'}">
                                        ${empresa.afiliada_comfama ? 'Sí' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información del Producto -->
                    <div class="detail-section producto-section">
                        <div class="section-header">
                            <h3><span class="section-icon">📦</span>Información del Producto</h3>
                        </div>
                        <div class="section-content">
                            <div class="subsection">
                                <h4>Producto/Servicio</h4>
                                <div class="info-grid">
                                    <div class="info-card full-width">
                                        <strong>Nombre:</strong>
                                        <span>${postulacion.producto_info?.nombre || 'No especificado'}</span>
                                    </div>
                                    <div class="info-card full-width">
                                        <strong>Descripción:</strong>
                                        <span>${postulacion.producto_info?.descripcion || 'No especificado'}</span>
                                    </div>
                                    <div class="info-card">
                                        <strong>Estado del Producto:</strong>
                                        <span>${postulacion.producto_info?.estado_producto || 'No especificado'}</span>
                                    </div>
                                    <div class="info-card">
                                        <strong>Mercado Objetivo:</strong>
                                        <span>${postulacion.producto_info?.mercado_objetivo || 'No especificado'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Brechas Identificadas -->
                    <div class="detail-section brechas-section">
                        <div class="section-header">
                            <h3><span class="section-icon">🔧</span>Brechas Identificadas</h3>
                        </div>
                        <div class="section-content">
                            <div class="brechas-grid">
                                <div class="brecha-card">
                                    <h5>Brechas Técnicas</h5>
                                    <p>${postulacion.brechas?.tecnicas || 'No especificado'}</p>
                                </div>
                                <div class="brecha-card">
                                    <h5>Brechas Normativas</h5>
                                    <p>${postulacion.brechas?.normativas || 'No especificado'}</p>
                                </div>
                                <div class="brecha-card">
                                    <h5>Brechas de Calidad</h5>
                                    <p>${postulacion.brechas?.calidad || 'No especificado'}</p>
                                </div>
                                <div class="brecha-card">
                                    <h5>Brechas de Empaque</h5>
                                    <p>${postulacion.brechas?.empaque || 'No especificado'}</p>
                                </div>
                                <div class="brecha-card">
                                    <h5>Brechas de Mercado</h5>
                                    <p>${postulacion.brechas?.mercado || 'No especificado'}</p>
                                </div>
                                <div class="brecha-card">
                                    <h5>Otras Brechas</h5>
                                    <p>${postulacion.brechas?.otras || 'No especificado'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Motivación y Expectativas -->
                    <div class="detail-section motivacion-section">
                        <div class="section-header">
                            <h3><span class="section-icon">💡</span>Motivación y Expectativas</h3>
                        </div>
                        <div class="section-content">
                            <div class="info-grid">
                                <div class="info-card full-width">
                                    <strong>Visión del Producto:</strong>
                                    <span>${postulacion.motivacion?.vision || 'No especificado'}</span>
                                </div>
                                <div class="info-card full-width">
                                    <strong>Impacto en la Empresa:</strong>
                                    <span>${postulacion.motivacion?.impacto || 'No especificado'}</span>
                                </div>
                                <div class="info-card full-width">
                                    <strong>Compromisos:</strong>
                                    <span>${postulacion.motivacion?.compromisos || 'No especificado'}</span>
                                </div>
                                <div class="info-card full-width">
                                    <strong>Expectativas:</strong>
                                    <span>${postulacion.motivacion?.expectativa || 'No especificado'}</span>
                                </div>
                                <div class="info-card">
                                    <strong>Disponibilidad:</strong>
                                    <span class="badge ${postulacion.motivacion?.disponible ? 'badge-success' : 'badge-secondary'}">
                                        ${postulacion.motivacion?.disponible ? 'Disponible' : 'No disponible'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Documentos (se cargará separadamente) -->
                    <div id="documentos-section">
                        <!-- Se cargará desde cargarDocumentos() -->
                    </div>
                    
                    <!-- Formulario de Evaluación -->
                    <div class="detail-section evaluacion-section">
                        <div class="section-header">
                            <h3><span class="section-icon">📝</span>Evaluar Postulación</h3>
                        </div>
                        <div class="section-content">
                            <form onsubmit="guardarEvaluacion(event, ${empresaId})" class="evaluation-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="estado_preseleccion">
                                            <span class="label-icon">⚖️</span>
                                            Estado de Preselección
                                        </label>
                                        <select id="estado_preseleccion" name="estado_preseleccion" required class="form-select">
                                            <option value="">-- Seleccionar Estado --</option>
                                            <option value="Preseleccionado">✅ Preseleccionado</option>
                                            <option value="No_preseleccionado">❌ No Preseleccionado</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group full-width">
                                        <label for="observaciones">
                                            <span class="label-icon">💭</span>
                                            Observaciones
                                        </label>
                                        <textarea id="observaciones" name="observaciones" 
                                                  placeholder="Escriba sus observaciones sobre la postulación..."
                                                  class="form-textarea"></textarea>
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group full-width">
                                        <label for="criterios">
                                            <span class="label-icon">📊</span>
                                            Criterios de Evaluación (JSON opcional)
                                        </label>
                                        <textarea id="criterios" name="criterios" 
                                                  placeholder='Ejemplo: {"innovacion": 8, "viabilidad": 7, "impacto": 9, "factibilidad": 6}'
                                                  class="form-textarea small"></textarea>
                                        <small class="form-hint">
                                            Formato JSON opcional. Deje en blanco si no desea especificar criterios numéricos.
                                        </small>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-success btn-large">
                                        <span class="btn-icon">💾</span>
                                        Guardar Evaluación
                                    </button>
                                    
                                    <button type="button" class="btn btn-secondary btn-large" onclick="ocultarDetalle()">
                                        <span class="btn-icon">↩️</span>
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // ✅ FUNCIÓN PARA CARGAR DOCUMENTOS (MEJORADA)
        async function cargarDocumentos(empresaId) {
            try {
                const documentosSection = document.getElementById('documentos-section');
                
                if (!documentosSection) {
                    console.error('❌ Elemento documentos-section no encontrado');
                    return;
                }
                
                console.log('📄 Cargando documentos para empresa:', empresaId);
                
                // Mostrar loading
                documentosSection.innerHTML = `
                    <div class="detail-section documentos-section">
                        <div class="section-header">
                            <h3><span class="section-icon">📎</span>Documentos Adjuntos</h3>
                        </div>
                        <div class="section-content">
                            <div class="loading-section small">
                                <div class="loading-spinner"></div>
                                <p>Cargando documentos...</p>
                            </div>
                        </div>
                    </div>
                `;
                
                const responseDocumentos = await fetch(`/evaluador/documentos/${empresaId}`);
                
                if (!responseDocumentos.ok) {
                    throw new Error(`Error HTTP: ${responseDocumentos.status}`);
                }
                
                const documentos = await responseDocumentos.json();
                console.log('✅ Documentos cargados:', documentos);
                
                if (documentos && documentos.length > 0) {
                    documentosSection.innerHTML = `
                        <div class="detail-section documentos-section">
                            <div class="section-header">
                                <h3><span class="section-icon">📎</span>Documentos Adjuntos (${documentos.length})</h3>
                            </div>
                            <div class="section-content">
                                <div class="documentos-grid">
                                    ${documentos.map(doc => `
                                        <div class="documento-card">
                                            <div class="documento-icon">📄</div>
                                            <div class="documento-info">
                                                <div class="documento-name">${doc.nombre_original}</div>
                                                <a href="/evaluador/descargar-documento/${doc.id}" 
                                                   target="_blank" 
                                                   class="documento-link">
                                                    <span class="link-icon">⬇️</span>
                                                    Descargar
                                                </a>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    documentosSection.innerHTML = `
                        <div class="detail-section documentos-section">
                            <div class="section-header">
                                <h3><span class="section-icon">📎</span>Documentos Adjuntos</h3>
                            </div>
                            <div class="section-content">
                                <div class="empty-state small">
                                    <div class="empty-icon">📭</div>
                                    <p>No se encontraron documentos adjuntos para esta postulación</p>
                                </div>
                            </div>
                        </div>
                    `;
                }
                
            } catch (error) {
                console.error('❌ Error al cargar documentos:', error);
                const documentosSection = document.getElementById('documentos-section');
                if (documentosSection) {
                    documentosSection.innerHTML = `
                        <div class="detail-section documentos-section">
                            <div class="section-header">
                                <h3><span class="section-icon">📎</span>Documentos Adjuntos</h3>
                            </div>
                            <div class="section-content">
                                <div class="error-section small">
                                    <div class="error-icon">❌</div>
                                    <p>Error al cargar documentos: ${error.message}</p>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        }
        
        // ✅ FUNCIÓN PARA GUARDAR EVALUACIÓN (MEJORADA)
        async function guardarEvaluacion(event, empresaId) {
            event.preventDefault();
            
            try {
                const formData = new FormData(event.target);
                const criteriosText = formData.get('criterios');
                
                let criterios = null;
                if (criteriosText && criteriosText.trim()) {
                    try {
                        criterios = JSON.parse(criteriosText);
                    } catch (e) {
                        showToast('❌ Los criterios deben ser un JSON válido. Ejemplo: {"innovacion": 8, "viabilidad": 7}', 'error');
                        return;
                    }
                }
                
                const evaluacionData = {
                    empresa_id: empresaId,
                    estado_preseleccion: formData.get('estado_preseleccion'),
                    observaciones: formData.get('observaciones') || '',
                    criterios: criterios
                };
                
                console.log('💾 Enviando evaluación:', evaluacionData);
                
                // Mostrar loading en el botón
                const submitBtn = event.target.querySelector('button[type="submit"]');
                const originalHTML = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="btn-icon">⏳</span>Guardando...';
                submitBtn.disabled = true;
                
                const response = await fetch('/evaluador/evaluador/evaluar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(evaluacionData)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    showToast('✅ Evaluación guardada exitosamente', 'success');
                    
                    // Recargar la lista de postulaciones
                    await cargarPostulaciones();
                    
                    // Ocultar el detalle
                    ocultarDetalle();
                } else {
                    throw new Error(result.error || 'Error desconocido');
                }
                
            } catch (error) {
                console.error('❌ Error al guardar evaluación:', error);
                showToast('❌ Error al guardar la evaluación: ' + error.message, 'error');
            } finally {
                // Restaurar botón
                const submitBtn = event.target.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.innerHTML = '<span class="btn-icon">💾</span>Guardar Evaluación';
                    submitBtn.disabled = false;
                }
            }
        }
        
        // ✅ FUNCIÓN PARA OCULTAR DETALLE (MEJORADA)
        function ocultarDetalle() {
            const detalleModal = document.getElementById('detalle-postulacion');
            
            if (detalleModal) {
                detalleModal.style.display = 'none';
            }
        }
        
        // ✅ SISTEMA DE TOAST NOTIFICATIONS
        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            if (!container) return;
            
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <div class="toast-content">
                    <span class="toast-message">${message}</span>
                    <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
            
            container.appendChild(toast);
            
            // Auto-remove after 5 seconds
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
        
        // ✅ CERRAR MODAL AL HACER CLICK EN EL FONDO
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('detalle-postulacion');
            if (e.target === modal) {
                ocultarDetalle();
            }
        });
        
        // ✅ CERRAR MODAL CON ESCAPE
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                ocultarDetalle();
            }
        });
        
        // ✅ MANEJAR ERRORES GLOBALES
        window.addEventListener('error', function(e) {
            console.error('❌ Error JavaScript global:', e.error);
            showToast('Se produjo un error inesperado', 'error');
        });
        
        window.addEventListener('unhandledrejection', function(e) {
            console.error('❌ Promise rechazada no manejada:', e.reason);
            showToast('Error de conexión o servidor', 'error');
        });