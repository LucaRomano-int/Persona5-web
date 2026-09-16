/* ==================== ESTADO DEL CARRUSEL ==================== */

const carouselPositions = {
    protagonistas: 0,
    secundarios: 0,
    villanos: 0
};

/* ==================== HELPER MÁSCARA DINÁMICA ==================== */

function updateCarouselMasks(carouselId, currentPos, maxScroll) {
    const track = document.getElementById(carouselId);
    if (!track) return;

    const container = track.parentElement;
    if (!container) return;

    // Remover clases previas
    container.classList.remove('at-start', 'at-end');

    // Umbral de tolerancia de 2px por diferencias de redondeo
    if (currentPos <= 2) {
        container.classList.add('at-start');
    } else if (currentPos >= maxScroll - 2) {
        container.classList.add('at-end');
    }
}

/* ==================== LÓGICA DE MOVIMIENTO ==================== */

function moveCarousel(carouselId, direction) {
    const track = document.getElementById(carouselId);
    if (!track) return;

    const container = track.parentElement;
    const progressBar = document.getElementById(`progress-${carouselId}`);
    const cards = track.querySelectorAll('.character-card');

    if (!container || cards.length === 0) return;

    // Medida exacta de tarjeta + gap
    const cardStyle = window.getComputedStyle(cards[0]);
    const cardMarginRight = parseFloat(cardStyle.marginRight) || 0;
    const gap = parseFloat(window.getComputedStyle(track).gap) || 0;
    const step = cards[0].offsetWidth + Math.max(cardMarginRight, gap);

    // Scroll máximo real sumando el aire extra para el skew y la sombra roja
    const extraSpace = 40; 
    const maxScroll = (track.scrollWidth - container.clientWidth) + extraSpace;

    let currentPos = carouselPositions[carouselId] || 0;
    
    // Posición teórica del siguiente salto
    let nextPos = currentPos + (direction * step);

    // Umbral de ajuste: si el tramo restante es menor a un paso, encajar directo
    if (direction === 1 && (maxScroll - nextPos) < step) {
        nextPos = maxScroll;
    } else if (direction === -1 && nextPos < step) {
        nextPos = 0;
    }

    // Asegurar límites strictly
    if (nextPos < 0) nextPos = 0;
    if (nextPos > maxScroll) nextPos = maxScroll;

    carouselPositions[carouselId] = nextPos;

    // Desplazar el track
    track.style.transform = `translateX(-${nextPos}px)`;

    // Actualizar estados de máscara (inicio / final)
    updateCarouselMasks(carouselId, nextPos, maxScroll);

    // Actualizar barra de progreso al 100%
    if (progressBar && maxScroll > 0) {
        const percentage = (nextPos / maxScroll) * 100;
        progressBar.style.width = `${Math.min(Math.max(percentage, 0), 100)}%`;
    }
}

/* ==================== INICIALIZACIÓN ==================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar barras de progreso del carrusel principal
    ['protagonistas', 'secundarios', 'villanos'].forEach((id) => {
        const progressBar = document.getElementById(`progress-${id}`);
        if (progressBar) {
            progressBar.style.width = '0%';
        }

        const track = document.getElementById(id);
        if (track && track.parentElement) {
            track.parentElement.classList.add('at-start');
        }
    });

    // 2. Referencias del Modal
    const modal = document.getElementById('modal-personaje');
    const btnCerrar = document.querySelector('.modal-cerrar');

    const modalImg = document.getElementById('modal-img');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalDescripcion = document.getElementById('modal-descripcion');

    // Mantenemos compatibilidad con tus nuevos IDs en el HTML
    const btnPrevImg = document.getElementById('modal-prev-galleria') || document.getElementById('modal-prev-img');
    const btnNextImg = document.getElementById('modal-next-galleria') || document.getElementById('modal-next-img');

    const cards = document.querySelectorAll('.character-card');

    // Variables de la galería
    let imagenesModal = [];
    let imagenActualIndex = 0;

function actualizarImagenModal() {
        if (imagenesModal.length > 0 && modalImg) {
            modalImg.src = imagenesModal[imagenActualIndex];
        }

        // Mostrar u ocultar flechas dependiendo de la cantidad de imágenes
        if (imagenesModal.length > 1) {
            if (btnPrevImg) btnPrevImg.classList.remove('oculto');
            if (btnNextImg) btnNextImg.classList.remove('oculto');
        } else {
            if (btnPrevImg) btnPrevImg.classList.add('oculto');
            if (btnNextImg) btnNextImg.classList.add('oculto');
        }
    }

    // Eventos de los botones de navegación del modal
    if (btnPrevImg) {
        btnPrevImg.addEventListener('click', (e) => {
            e.stopPropagation();
            if (imagenesModal.length > 0) {
                imagenActualIndex = (imagenActualIndex - 1 + imagenesModal.length) % imagenesModal.length;
                actualizarImagenModal();
            }
        });
    }

    if (btnNextImg) {
        btnNextImg.addEventListener('click', (e) => {
            e.stopPropagation();
            if (imagenesModal.length > 0) {
                imagenActualIndex = (imagenActualIndex + 1) % imagenesModal.length;
                actualizarImagenModal();
            }
        });
    }

    // Evento para abrir el modal al hacer clic en cualquier tarjeta
    cards.forEach(card => {
        card.style.cursor = 'pointer';

        card.addEventListener('click', () => {
            // Extraer título
            const tituloElement = card.querySelector('.card-info h3');
            if (tituloElement && modalTitulo) {
                modalTitulo.textContent = tituloElement.textContent;
            }

            // Extraer Arcana y Persona para inyectar las especificaciones con barrita roja
            const arcana = card.getAttribute('data-modal-arcana');
            const persona = card.getAttribute('data-modal-persona');
            const containerSpecs = document.getElementById('modal-specs');

            if (containerSpecs) {
                let specsHTML = '';

                if (arcana) {
                    specsHTML += `
                        <div class="spec-item">
                            <div class="spec-bar"></div>
                            <div class="spec-text"><span>ARCANA:</span> ${arcana}</div>
                        </div>`;
                }

                if (persona) {
                    specsHTML += `
                        <div class="spec-item">
                            <div class="spec-bar"></div>
                            <div class="spec-text"><span>PERSONA:</span> ${persona}</div>
                        </div>`;
                }

                containerSpecs.innerHTML = specsHTML;
            }

            // Extraer descripción personalizada o por defecto
            const customDesc = card.getAttribute('data-modal-desc');
            const fallbackDesc = card.querySelector('.card-info p');
            if (modalDescripcion) {
                modalDescripcion.textContent = customDesc ? customDesc : (fallbackDesc ? fallbackDesc.textContent : '');
            }

            // Extraer imágenes
            const customImgs = card.getAttribute('data-modal-img');
            const fallbackImg = card.querySelector('.char-single-rectangular img') || card.querySelector('img');

            if (customImgs) {
                imagenesModal = customImgs.split(',').map(ruta => ruta.trim());
            } else if (fallbackImg) {
                imagenesModal = [fallbackImg.src];
            } else {
                imagenesModal = [];
            }

            imagenActualIndex = 0;
            actualizarImagenModal();

            if (modal) {
                modal.classList.add('activo');
            }
        });
    });

    // Eventos de cierre
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            if (modal) modal.classList.remove('activo');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('activo');
        }
    });
});