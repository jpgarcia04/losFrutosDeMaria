document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.product-carousel__track');
    if (!track) return;

    // Desktop arrows
    const prevBtnDesktop = document.querySelector('.product-carousel__nav--prev.product-carousel__nav--desktop');
    const nextBtnDesktop = document.querySelector('.product-carousel__nav--next.product-carousel__nav--desktop');

    // Mobile arrows (inside controls)
    const prevBtnMobile = document.querySelector('.product-carousel__nav--prev.product-carousel__nav--mobile');
    const nextBtnMobile = document.querySelector('.product-carousel__nav--next.product-carousel__nav--mobile');

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
        const { scrollLeft, scrollWidth, clientWidth } = track;
        const atStart = scrollLeft <= 5;
        const atEnd = scrollLeft + clientWidth >= scrollWidth - 5;

        [prevBtnDesktop, prevBtnMobile].forEach(btn => {
            if (btn) btn.disabled = atStart;
        });
        [nextBtnDesktop, nextBtnMobile].forEach(btn => {
            if (btn) btn.disabled = atEnd;
        });
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

    // Scroll handlers
    const scrollPrev = () => {
        track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    };
    const scrollNext = () => {
        track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    };

    // Bind all prev/next buttons
    [prevBtnDesktop, prevBtnMobile].forEach(btn => {
        if (btn) btn.addEventListener('click', scrollPrev);
    });
    [nextBtnDesktop, nextBtnMobile].forEach(btn => {
        if (btn) btn.addEventListener('click', scrollNext);
    });

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
