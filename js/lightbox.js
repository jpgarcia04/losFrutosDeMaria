/**
 * Inicializa la funcionalidad de galería Lightbox.
 * 
 * Crea y gestiona el DOM del lightbox de forma dinámica para mostrar imágenes 
 * ampliadas. Soporta navegación mediante botones, eventos táctiles (swipe)
 * para dispositivos móviles y teclado (flechas y Escape).
 */
// ─── Lightbox Gallery ───
document.addEventListener('DOMContentLoaded', () => {
  const galleryItems = document.querySelectorAll('.tour-gallery__item');
  if (galleryItems.length === 0) return;

  // Create lightbox DOM
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
      <div class="lightbox__overlay"></div>
      <div class="lightbox__content">
          <button class="lightbox__close" aria-label="Cerrar"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          <div class="lightbox__image-wrapper">
              <img src="" alt="" class="lightbox__image">
          </div>
          <button class="lightbox__nav lightbox__nav--prev" aria-label="Anterior"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
          <button class="lightbox__nav lightbox__nav--next" aria-label="Siguiente"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
      </div>
  `;
  document.body.appendChild(lightbox);

  const imgEls = Array.from(galleryItems).map(item => item.querySelector('img')).filter(img => img);
  const lbOverlay = lightbox.querySelector('.lightbox__overlay');
  const lbClose = lightbox.querySelector('.lightbox__close');
  const lbPrev = lightbox.querySelector('.lightbox__nav--prev');
  const lbNext = lightbox.querySelector('.lightbox__nav--next');
  const lbImage = lightbox.querySelector('.lightbox__image');
  let currentIndex = 0;

  const openLightbox = (index) => {
    currentIndex = index;
    updateImage();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  const updateImage = () => {
    lbImage.src = imgEls[currentIndex].src;
    lbImage.alt = imgEls[currentIndex].alt;
  };

  const showNext = () => {
    currentIndex = (currentIndex + 1) % imgEls.length;
    updateImage();
  };

  const showPrev = () => {
    currentIndex = (currentIndex - 1 + imgEls.length) % imgEls.length;
    updateImage();
  };

  imgEls.forEach((img, i) => {
    img.addEventListener('click', () => openLightbox(i));
  });

  lbOverlay.addEventListener('click', closeLightbox);
  lbClose.addEventListener('click', closeLightbox);
  lbNext.addEventListener('click', showNext);
  lbPrev.addEventListener('click', showPrev);

  // Swipe navigation
  let touchStartX = 0;
  let touchEndX = 0;
  lightbox.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, { passive: true });
  lightbox.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) diff > 0 ? showNext() : showPrev();
  }, { passive: true });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
  });
});
