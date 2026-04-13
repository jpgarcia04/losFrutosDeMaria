document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.product-carousel__track');
    if (!track) return;

    const prevBtn = document.querySelector('.product-carousel__nav--prev');
    const nextBtn = document.querySelector('.product-carousel__nav--next');
    const dotsContainer = document.querySelector('.product-carousel__dots');

    // Calculate scroll amount (one card width + gap)
    const getScrollAmount = () => {
        const card = track.querySelector('.product-card');
        if (!card) return 300;
        const style = getComputedStyle(track);
        const gap = parseInt(style.gap) || 20;
        return card.offsetWidth + gap;
    };

    // Update nav button visibility
    const updateNav = () => {
        if (!prevBtn || !nextBtn) return;
        const { scrollLeft, scrollWidth, clientWidth } = track;
        prevBtn.disabled = scrollLeft <= 5;
        nextBtn.disabled = scrollLeft + clientWidth >= scrollWidth - 5;
    };

    // Build dots
    const buildDots = () => {
        if (!dotsContainer) return;
        const cards = track.querySelectorAll('.product-card');
        const visibleCards = Math.round(track.clientWidth / getScrollAmount());
        const totalDots = Math.max(1, cards.length - visibleCards + 1);

        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('button');
            dot.className = 'product-carousel__dot';
            dot.setAttribute('aria-label', `Ir a slide ${i + 1}`);
            dot.addEventListener('click', () => {
                track.scrollTo({ left: i * getScrollAmount(), behavior: 'smooth' });
            });
            dotsContainer.appendChild(dot);
        }
        updateActiveDot();
    };

    // Update active dot
    const updateActiveDot = () => {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.product-carousel__dot');
        const scrollAmount = getScrollAmount();
        const activeIndex = Math.round(track.scrollLeft / scrollAmount);

        dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === activeIndex);
        });
    };

    // Navigation
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });
    }

    // Track events
    track.addEventListener('scroll', () => {
        updateNav();
        updateActiveDot();
    }, { passive: true });

    // Initialize
    updateNav();
    buildDots();

    // Rebuild dots on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            buildDots();
            updateNav();
        }, 200);
    });
});
