// public/js/administracion.js

document.addEventListener('DOMContentLoaded', () => {
    cargarPostulacionesAdmin();
});

async function cargarPostulacionesAdmin() {
    const tbody = document.querySelector('#tabla-postulaciones tbody');
    tbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

    try {
        const res = await fetch('/admin/postulaciones');
        if (!res.ok) throw new Error(res.statusText);
        const datos = await res.json();

        tbody.innerHTML = datos.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.nombre_legal}</td>
                <td>${p.tipo_empresa}</td>
                <td>${p.municipio}</td>
                <td>${p.estado_postulacion || '—'}</td>
                <td>${p.estado_preseleccion || '—'}</td>
                <td>
                    <button class="btn btn-ver" onclick="verDetalleAdmin(${p.id})">
                        Ver Detalle
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="7">Error al cargar: ${e.message}</td></tr>`;
    }
}

async function verDetalleAdmin(empresaId) {
    const cont = document.getElementById('detalle-admin');
    cont.style.display = 'block';
    cont.innerHTML = '<p>Cargando detalle...</p>';

    try {
        const [r1, r2] = await Promise.all([
            fetch(`/evaluador/evaluador/postulacion/${empresaId}`),
            fetch(`/evaluador/documentos/${empresaId}`)
        ]);
        if (!r1.ok) throw new Error('Error al cargar postulación');
        if (!r2.ok) throw new Error('Error al cargar documentos');

        const { empresa, postulacion } = await r1.json();
        const docs = await r2.json();

        cont.innerHTML = `
            <h3>Detalle de ${empresa.nombre_legal}</h3>
            <p><strong>NIT:</strong> ${empresa.nit}</p>
            <p><strong>Tipo:</strong> ${empresa.tipo_empresa}</p>
            <p><strong>Municipio:</strong> ${empresa.municipio}</p>

            <h4>Producto</h4>
            <p><strong>Nombre:</strong> ${postulacion.producto_info?.nombre}</p>
            <p><strong>Descripción:</strong> ${postulacion.producto_info?.descripcion}</p>

            <h4>Brechas</h4>
            <pre>${JSON.stringify(postulacion.brechas, null, 2)}</pre>

            <h4>Motivación</h4>
            <pre>${JSON.stringify(postulacion.motivacion, null, 2)}</pre>

            <h4>Documentos (${docs.length})</h4>
            <ul>
                ${docs.map(d => `
                    <li>
                        <a href="/evaluador/descargar-documento/${d.id}" target="_blank">
                            ${d.nombre_original}
                        </a>
                    </li>
                `).join('')}
            </ul>

            <button class="btn" onclick="ocultarDetalleAdmin()">Cerrar</button>
        `;
        cont.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
        cont.innerHTML = `<p class="error">Error al cargar detalle: ${e.message}</p>`;
    }
}

function ocultarDetalleAdmin() {
    const cont = document.getElementById('detalle-admin');
    cont.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// En public/js/admin.js

async function eliminarConvocatoria() {
  if (!confirm('¿Eliminar la convocatoria actual?')) return;
  const res = await fetch('/admin/convocatoria', { method: 'DELETE' });
  const body = await res.json();
  if (res.ok) {
    alert(body.mensaje);
    fechaInicioInput.value = '';
    fechaFinInput.value = '';
  } else {
    alert(body.error || body.mensaje);
  }
}

// Al inicializar, ligar el botón
document.getElementById('btn-eliminar-convocatoria').onclick = eliminarConvocatoria;
