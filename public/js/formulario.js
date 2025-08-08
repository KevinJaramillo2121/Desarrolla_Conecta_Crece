    async function obtenerFechaCierre() {
        try {
            const response = await fetch('/participante/fecha-cierre');
            const data = await response.json();
            return new Date(data.fechaFin);
        } catch (error) {
            console.error('Error al obtener fecha de cierre:', error);
            return null;
        }
    }

    function iniciarCuentaRegresiva(fechaCierre) {
        const reloj = document.getElementById('reloj-convocatoria');
        const formulario = document.getElementById('inscripcionForm');

        function actualizarReloj() {
            const ahora = new Date();
            const diferencia = fechaCierre - ahora;

            if (diferencia <= 0) {
                reloj.textContent = '⛔ La convocatoria ha cerrado.';
                if (formulario) {
                    formulario.querySelectorAll('input, textarea, select, button').forEach(elem => {
                        elem.disabled = true;
                    });
                }
                clearInterval(intervalo);
                return;
            }

            const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
            const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
            const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
            const segundos = Math.floor((diferencia / 1000) % 60);

            reloj.textContent = `⏳ Tiempo restante: ${dias}d ${horas}h ${minutos}m ${segundos}s`;
        }

        actualizarReloj();
        const intervalo = setInterval(actualizarReloj, 1000);
    }

    async function validarEstadoPostulacion() {
        try {
            const res = await fetch('/participante/estado-postulacion');
            const data = await res.json();
            if (data.estado === 'enviado') {
                document.getElementById('reloj-convocatoria').textContent = '✅ Ya enviaste tu postulación.';
                const formulario = document.getElementById('inscripcionForm');
                formulario.querySelectorAll('input, textarea, select, button').forEach(elem => {
                    elem.disabled = true;
                });
            }
        } catch (error) {
            console.error('Error al validar estado:', error);
        }
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