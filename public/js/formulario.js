document.addEventListener('DOMContentLoaded', function() {
    initializeCountdown();
});


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


    function recolectarDatosDelFormulario() {
        return {
            producto_info: {
                nombre: document.getElementById('nombre_producto').value,
                descripcion: document.getElementById('descripcion_producto').value,
                estado_producto: document.querySelector('input[name="estado_producto"]:checked')?.value || '',
                mercado_objetivo: document.getElementById('mercado_objetivo').value
            },
            brechas: {
                tecnicas: document.getElementById('brecha_tecnica_desc').value,
                normativas: document.getElementById('brecha_normativa_desc').value,
                calidad: document.getElementById('brecha_calidad_desc').value,
                empaque: document.getElementById('brecha_empaque_desc').value,
                mercado: document.getElementById('brecha_mercado_desc').value,
                otras: document.getElementById('otras_brechas').value
            },
            motivacion: {
                vision: document.getElementById('vision_producto').value,
                impacto: document.getElementById('impacto_empresa').value,
                compromisos: document.getElementById('compromisos').value,
                motivo: document.getElementById('motivacion').value,
                expectativa: document.getElementById('expectativas').value,
                disponible: document.querySelector('input[name="disponibilidad"]:checked')?.value === 'true'
            }
        };
    }

    async function guardarComoBorrador() {
    try {
        const producto_info = {
            nombre: document.getElementById('nombre_producto').value || '',
            descripcion: document.getElementById('descripcion_producto').value || '',
            estado_producto: document.querySelector('input[name="estado_producto"]:checked')?.value || '',
            mercado_objetivo: document.getElementById('mercado_objetivo').value || ''
        };

        const brechas = {
            tecnicas: document.getElementById('brecha_tecnica_desc').value || '',
            normativas: document.getElementById('brecha_normativa_desc').value || '',
            calidad: document.getElementById('brecha_calidad_desc').value || '',
            empaque: document.getElementById('brecha_empaque_desc').value || '',
            mercado: document.getElementById('brecha_mercado_desc').value || '',
            otras: document.getElementById('otras_brechas').value || ''
        };

        const motivacion = {
            vision: document.getElementById('vision_producto').value || '',
            impacto: document.getElementById('impacto_empresa').value || '',
            compromisos: document.getElementById('compromisos').value || '',
            motivo: document.getElementById('motivacion').value || '',
            expectativa: document.getElementById('expectativas').value || '',
            disponible: document.querySelector('input[name="disponibilidad"]:checked')?.value === 'true'
        };

        const datos = {
            producto_info: JSON.stringify(producto_info),
            brechas: JSON.stringify(brechas),
            motivacion: JSON.stringify(motivacion)
        };

        console.log('Guardando borrador:', datos);

        const res = await fetch('/participante/guardar-borrador', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const data = await res.json();
        alert(data.mensaje || data.error);
    } catch (error) {
        alert('Error al guardar borrador.');
        console.error(error);
    }
}


    async function enviarPostulacion() {
    const confirmacion = confirm('¿Estás seguro de enviar tu postulación? Ya no podrás modificarla.');
    if (!confirmacion) return;

    // Validar cédulas coincidentes
    const cedula1 = document.getElementById('cedula_representante').value;
    const cedula2 = document.getElementById('cedula_representante_declaracion').value;
    if (cedula1 !== cedula2) {
        alert('El número de cédula en la declaración no coincide con el proporcionado anteriormente.');
        return;
    }

    try {
        const form = document.getElementById('inscripcionForm');
        const formData = new FormData(form);

        // Construir los objetos complejos
        const producto_info = {
            nombre: document.getElementById('nombre_producto').value || '',
            descripcion: document.getElementById('descripcion_producto').value || '',
            estado_producto: document.querySelector('input[name="estado_producto"]:checked')?.value || '',
            mercado_objetivo: document.getElementById('mercado_objetivo').value || ''
        };

        const brechas = {
            tecnicas: document.getElementById('brecha_tecnica_desc').value || '',
            normativas: document.getElementById('brecha_normativa_desc').value || '',
            calidad: document.getElementById('brecha_calidad_desc').value || '',
            empaque: document.getElementById('brecha_empaque_desc').value || '',
            mercado: document.getElementById('brecha_mercado_desc').value || '',
            otras: document.getElementById('otras_brechas').value || ''
        };

        const motivacion = {
            vision: document.getElementById('vision_producto').value || '',
            impacto: document.getElementById('impacto_empresa').value || '',
            compromisos: document.getElementById('compromisos').value || '',
            motivo: document.getElementById('motivacion').value || '',
            expectativa: document.getElementById('expectativas').value || '',
            disponible: document.querySelector('input[name="disponibilidad"]:checked')?.value === 'true'
        };

        // Limpiar campos del FormData
        formData.delete('producto_info');
        formData.delete('brechas');
        formData.delete('motivacion');

        // Agregar objetos como strings JSON válidos
        formData.append('producto_info', JSON.stringify(producto_info));
        formData.append('brechas', JSON.stringify(brechas));
        formData.append('motivacion', JSON.stringify(motivacion));

        console.log('=== DEBUG ENVÍO ===');
        console.log('producto_info:', JSON.stringify(producto_info));
        console.log('brechas:', JSON.stringify(brechas));
        console.log('motivacion:', JSON.stringify(motivacion));
        
        // Ver todos los datos del FormData
        console.log('=== FormData completo ===');
        for (let [key, value] of formData.entries()) {
            console.log(key, ':', typeof value === 'object' ? '[File]' : value);
        }

        const res = await fetch('/participante/enviar-postulacion', {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', res.status);
        console.log('Response headers:', res.headers);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error response:', errorText);
            alert(`Error ${res.status}: ${errorText}`);
            return;
        }

        const data = await res.json();
        console.log('Success response:', data);
        alert(data.mensaje || data.error);
        if (res.ok) location.reload();
    } catch (error) {
        console.error('Catch error:', error);
        alert('Error al enviar la postulación: ' + error.message);
    }
}


    // Habilitar campo "Otro" cuando se selecciona
    document.getElementById('estado_otro').addEventListener('change', function() {
        document.getElementById('estado_otro_texto').disabled = !this.checked;
    });

    document.addEventListener('DOMContentLoaded', async () => {
        await validarEstadoPostulacion();

        const fechaCierre = await obtenerFechaCierre();
        if (fechaCierre) iniciarCuentaRegresiva(fechaCierre);

        document.getElementById('btn-guardar-borrador').addEventListener('click', guardarComoBorrador);
        document.getElementById('btn-enviar').addEventListener('click', enviarPostulacion);
    });
    document.addEventListener('DOMContentLoaded', async () => {
    // Configurar validación en tiempo real
    configurarValidacionTiempoReal();
    
    await validarEstadoPostulacion();
    const fechaCierre = await obtenerFechaCierre();
    if (fechaCierre) iniciarCuentaRegresiva(fechaCierre);
    
    document.getElementById('btn-guardar-borrador').addEventListener('click', guardarComoBorrador);
    document.getElementById('btn-enviar').addEventListener('click', enviarPostulacion);
});