        // Función para mostrar mensajes con estilo
        function mostrarMensaje(elementId, mensaje, tipo = 'success') {
            const elemento = document.getElementById(elementId);
            elemento.textContent = mensaje;
            elemento.className = `mensaje ${tipo}`;
            elemento.style.display = 'block';
            
            // Auto-hide después de 5 segundos
            setTimeout(() => {
                elemento.style.display = 'none';
            }, 5000);
        }

        // Función para crear badges de estado
        function crearBadgeEstado(estado, tipo) {
            let claseEstado = '';
            let textoEstado = estado;
            
            if (tipo === 'postulacion') {
                switch(estado) {
                    case 'enviado':
                        claseEstado = 'status-enviado';
                        textoEstado = '✅ Enviado';
                        break;
                    case 'borrador':
                        claseEstado = 'status-borrador';
                        textoEstado = '📝 Borrador';
                        break;
                    default:
                        claseEstado = 'status-sin-iniciar';
                        textoEstado = '⏸️ Sin iniciar';
                }
            } else if (tipo === 'preseleccion') {
                switch(estado) {
                    case 'Preseleccionado':
                        claseEstado = 'status-preseleccionado';
                        textoEstado = '⭐ Preseleccionado';
                        break;
                    case 'No_preseleccionado':
                        claseEstado = 'status-no-preseleccionado';
                        textoEstado = '❌ No preseleccionado';
                        break;
                    default:
                        claseEstado = 'status-sin-evaluar';
                        textoEstado = '⏳ Sin evaluar';
                }
            }
            
            return `<span class="status-badge ${claseEstado}">${textoEstado}</span>`;
        }

        // Formulario de Evaluador
        const formEval = document.getElementById('form-evaluador');
        formEval.addEventListener('submit', async e => {
            e.preventDefault();
            
            // Añadir estado de carga
            formEval.classList.add('loading');
            
            const datos = Object.fromEntries(new FormData(formEval));
            try {
                const res = await fetch('/admin/evaluadores', {
                    method: 'POST',
                    headers: { 'Content-Type':'application/json' },
                    body: JSON.stringify(datos)
                });
                const json = await res.json();
                
                if (res.ok) {
                    mostrarMensaje('resultado-evaluador', json.mensaje, 'success');
                    formEval.reset();
                } else {
                    mostrarMensaje('resultado-evaluador', json.error, 'error');
                }
            } catch (err) {
                mostrarMensaje('resultado-evaluador', 'Error en la petición', 'error');
            } finally {
                formEval.classList.remove('loading');
            }
        });

        // Función para cargar fechas
        async function cargarFechas() {
            try {
                const res = await fetch('/admin/convocatoria');
                const data = await res.json();
                if (data) {
                    document.getElementById('fecha_inicio').value = data.fecha_inicio.split('T')[0];
                    document.getElementById('fecha_fin').value = data.fecha_fin.split('T')[0];
                }
            } catch (err) {
                console.error('Error cargando fechas:', err);
            }
        }

        // Función para cargar postulaciones
        async function cargarPostulaciones() {
            try {
                const res = await fetch('/admin/postulaciones');
                const postulaciones = await res.json();
                const tbody = document.querySelector('#tabla-postulaciones tbody');
                tbody.innerHTML = '';

                if (postulaciones.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 2rem; color: #6B7280;">
                                No hay postulaciones registradas aún
                            </td>
                        </tr>
                    `;
                    return;
                }

                postulaciones.forEach(postulacion => {
                    const tr = document.createElement('tr');
                    const estadoPostulacion = postulacion.estado_postulacion || 'Sin iniciar';
                    const estadoPreseleccion = postulacion.estado_preseleccion || 'Sin evaluar';

                    tr.innerHTML = `
                        <td><strong>${postulacion.nombre_legal}</strong></td>
                        <td>${postulacion.nit}</td>
                        <td><span class="status-badge">${postulacion.tipo_empresa}</span></td>
                        <td>${postulacion.municipio}</td>
                        <td>${crearBadgeEstado(estadoPostulacion, 'postulacion')}</td>
                        <td>${crearBadgeEstado(estadoPreseleccion, 'preseleccion')}</td>
                        <td>
                            <button class="btn-action" onclick="verDetalles(${postulacion.id})">
                                👁️ Ver Detalles
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });

            } catch (err) {
                console.error('Error cargando postulaciones:', err);
            }
        }

        // Función para ver detalles (placeholder)
            async function verDetalles(empresaId) {
        try {
            // Mostrar contenedor de detalle
            document.getElementById('detalle-admin').style.display = 'block';

            // 1. Traer datos principales de la empresa (si tienes endpoint para esto)
            const resInfo = await fetch(`/admin/postulacion/${empresaId}`);
            if (!resInfo.ok) throw new Error('No se pudo obtener la información de la empresa');
            const data = await resInfo.json();

            // 2. Pintar datos en el detalle (ajusta IDs a los que tengas en tu HTML)
            document.getElementById('detalle-nombre').textContent = data.empresa.nombre_legal;
            document.getElementById('detalle-nit').textContent = data.empresa.nit;
            document.getElementById('detalle-tipo').textContent = data.empresa.tipo_empresa;
            document.getElementById('detalle-municipio').textContent = data.empresa.municipio;

            // 3. Cargar evaluaciones
            mostrarEvaluaciones(empresaId);

        } catch (error) {
            console.error('Error mostrando detalles:', error);
            alert('No se pudieron cargar los detalles de la empresa.');
        }
    }


        // Inicialización
        document.addEventListener('DOMContentLoaded', () => {
            cargarFechas();
            cargarPostulaciones();
        });

        // Formulario de fechas
        document.getElementById('form-fechas').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const form = e.target;
            form.classList.add('loading');
            
            const inicio = document.getElementById('fecha_inicio').value;
            const fin = document.getElementById('fecha_fin').value;

            try {
                const res = await fetch('/admin/convocatoria', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fecha_inicio: inicio, fecha_fin: fin })
                });

                const data = await res.json();
                
                if (res.ok) {
                    mostrarMensaje('mensaje-fechas', data.mensaje, 'success');
                } else {
                    mostrarMensaje('mensaje-fechas', data.error, 'error');
                }
            } catch (err) {
                mostrarMensaje('mensaje-fechas', 'Error de conexión', 'error');
            } finally {
                form.classList.remove('loading');
            }
        });

            // Cargar TODAS las evaluaciones de una empresa y mostrarlas en la tabla
        async function mostrarEvaluaciones(empresaId) {
            try {
                const res = await fetch(`/admin/evaluaciones/${empresaId}`);
                if (!res.ok) throw new Error('No se pudo obtener las evaluaciones');

                const evaluaciones = await res.json();
                const tbody = document.querySelector('#tabla-evaluaciones tbody');
                tbody.innerHTML = '';

                if (evaluaciones.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4">No hay evaluaciones registradas</td></tr>';
                    return;
                }

                evaluaciones.forEach(ev => {
                    tbody.innerHTML += `
                        <tr ${ev.es_definitiva ? 'class="fila-definitiva"' : ''}>
                            <td>${ev.nombre_completo}</td>
                            <td>${ev.estado_preseleccion ?? 'No evaluado'}</td>
                            <td>${ev.observaciones ?? ''}</td>
                            <td>${ev.es_definitiva ? '✅ Sí' : 'No'}</td>
                        </tr>
                    `;
                });
            } catch (error) {
                console.error('Error mostrando evaluaciones:', error);
            }
        }
