/**
 * Script específico para las páginas de productos individuales.
 * 
 * Este archivo agrupa las funcionalidades principales de la vista de producto:
 * - Acordeón para Preguntas Frecuentes (FAQ).
 * - Pestañas (tabs) para las variantes de productos (ej. gotas).
 * - Animaciones de entrada por scroll.
 * - Galería de imágenes estilo Lightbox integrada a la vista de producto.
 */
document.addEventListener('DOMContentLoaded', () => {

    // ─── FAQ Accordion ───
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const wasOpen = item.classList.contains('is-open');
            // Close all
            faqItems.forEach(i => i.classList.remove('is-open'));
            // Toggle current
            if (!wasOpen) item.classList.add('is-open');
        });
    });

    // ─── Variant Tabs (gotas page) ───
    const variantTabs = document.querySelectorAll('.variant-tab');
    const variantPanels = document.querySelectorAll('.variant-panel');

    variantTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.variant;

            variantTabs.forEach(t => t.classList.remove('is-active'));
            variantPanels.forEach(p => p.classList.remove('is-active'));
            document.querySelectorAll('.link-panel').forEach(p => p.classList.remove('is-active'));

            document.querySelectorAll(`.variant-tab[data-variant="${target}"]`).forEach(t => t.classList.add('is-active'));
            const panel = document.getElementById(target);
            if (panel) panel.classList.add('is-active');
            
            document.querySelectorAll('.link-' + target).forEach(p => p.classList.add('is-active'));
        });
    });

    // ─── Scroll Animations ───
    const fadeEls = document.querySelectorAll('.product-fade-in');
    if (fadeEls.length) {
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        fadeEls.forEach(el => obs.observe(el));
    }

    // ─── Lightbox Gallery ───
    const galleryItems = document.querySelectorAll('.product-gallery__item');
    if (galleryItems.length > 0) {
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
            
            if (imgEls.length <= 1) {
                lbPrev.style.display = 'none';
                lbNext.style.display = 'none';
            }
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
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', () => openLightbox(i));
        });

        lbOverlay.addEventListener('click', closeLightbox);
        lbClose.addEventListener('click', closeLightbox);
        lbNext.addEventListener('click', showNext);
        lbPrev.addEventListener('click', showPrev);

        // Touch swipe navigation for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        const handleSwipe = () => {
            if (!lightbox.classList.contains('is-open')) return;
            const swipeDistance = touchStartX - touchEndX;
            // 50px threshold for a valid swipe
            if (swipeDistance > 50) {
                showNext();
            } else if (swipeDistance < -50) {
                showPrev();
            }
        };

        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        lightbox.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('is-open')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') showNext();
            if (e.key === 'ArrowLeft') showPrev();
        });
    }
});

window.toggleGotasSize = function(size) {
    document.querySelectorAll('.gotas-size-group').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.gotas-size-group.size-' + size).forEach(el => el.style.display = 'flex');
    document.querySelectorAll('.gotas-size-select').forEach(el => el.value = size);
};
