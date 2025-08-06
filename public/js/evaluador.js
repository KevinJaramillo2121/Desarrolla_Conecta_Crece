 // Función para cargar estadísticas de evaluación
        async function cargarEstadisticas() {
            try {
                const response = await fetch('/evaluador/postulaciones');
                const postulaciones = await response.json();
                
                const pendientes = postulaciones.filter(p => !p.estado_preseleccion || p.estado_preseleccion === 'Sin evaluar').length;
                const completadas = postulaciones.filter(p => p.estado_preseleccion && p.estado_preseleccion !== 'Sin evaluar').length;
                
                document.getElementById('total-postulaciones').textContent = pendientes;
                document.getElementById('evaluaciones-completadas').textContent = completadas;
                
                // Animar los números
                animarContadores();
                
            } catch (error) {
                console.error('Error cargando estadísticas:', error);
                document.getElementById('total-postulaciones').textContent = '0';
                document.getElementById('evaluaciones-completadas').textContent = '0';
            }
        }

        // Función para animar los contadores
        function animarContadores() {
            const contadores = document.querySelectorAll('.stat-number');
            contadores.forEach((contador, index) => {
                const valor = parseInt(contador.textContent) || 0;
                contador.textContent = '0';
                
                setTimeout(() => {
                    let actual = 0;
                    const incremento = valor / 20;
                    
                    const intervalo = setInterval(() => {
                        actual += incremento;
                        if (actual >= valor) {
                            contador.textContent = valor;
                            clearInterval(intervalo);
                        } else {
                            contador.textContent = Math.floor(actual);
                        }
                    }, 50);
                }, index * 200);
            });
        }

        // Cargar estadísticas al cargar la página
        document.addEventListener('DOMContentLoaded', cargarEstadisticas);