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

    // ─── Gather original cards ───
    const originalCards = Array.from(track.querySelectorAll('.product-card'));
    const totalOriginal = originalCards.length;
    if (totalOriginal === 0) return;

    // ─── Clone cards for infinite illusion ───
    // Prepend a full copy BEFORE and append a full copy AFTER.
    // Track order: [clone-set] [originals] [clone-set]
    originalCards.forEach(card => {
        const cloneAfter = card.cloneNode(true);
        cloneAfter.classList.add('product-card--clone');
        cloneAfter.removeAttribute('id');
        track.appendChild(cloneAfter);
    });

    // Clone before (in reverse so the order is preserved)
    for (let i = totalOriginal - 1; i >= 0; i--) {
        const cloneBefore = originalCards[i].cloneNode(true);
        cloneBefore.classList.add('product-card--clone');
        cloneBefore.removeAttribute('id');
        track.insertBefore(cloneBefore, track.firstChild);
    }

    // ─── Measurements ───
    const getCardWidth = () => {
        const card = track.querySelector('.product-card');
        if (!card) return 300;
        return card.offsetWidth;
    };

    const getGap = () => {
        const style = getComputedStyle(track);
        return parseInt(style.gap) || 24;
    };

    const getStepSize = () => getCardWidth() + getGap();

    // ─── Set initial scroll to first original card ───
    const scrollToOriginalStart = () => {
        const step = getStepSize();
        track.scrollLeft = totalOriginal * step;
    };

    // Disable smooth scroll temporarily for instant positioning
    track.style.scrollBehavior = 'auto';
    // Use requestAnimationFrame to ensure layout is computed
    requestAnimationFrame(() => {
        scrollToOriginalStart();
        // Re-enable smooth scroll after positioning
        track.style.scrollBehavior = 'smooth';
    });

    // ─── Infinite scroll repositioning ───
    let isRepositioning = false;

    const handleInfiniteScroll = () => {
        if (isRepositioning) return;

        const step = getStepSize();
        const cloneSetWidth = totalOriginal * step;
        const maxScroll = track.scrollWidth - track.clientWidth;

        // If scrolled into the "after" clone set
        if (track.scrollLeft >= cloneSetWidth + (totalOriginal * step) - step) {
            isRepositioning = true;
            track.style.scrollBehavior = 'auto';
            track.scrollLeft -= cloneSetWidth;
            // Force reflow before re-enabling smooth
            track.offsetHeight;
            track.style.scrollBehavior = 'smooth';
            isRepositioning = false;
        }
        // If scrolled into the "before" clone set
        else if (track.scrollLeft <= step * 0.5) {
            isRepositioning = true;
            track.style.scrollBehavior = 'auto';
            track.scrollLeft += cloneSetWidth;
            // Force reflow
            track.offsetHeight;
            track.style.scrollBehavior = 'smooth';
            isRepositioning = false;
        }
    };

    // ─── Navigation ───
    const scrollNext = () => {
        track.scrollBy({ left: getStepSize(), behavior: 'smooth' });
    };

    const scrollPrev = () => {
        track.scrollBy({ left: -getStepSize(), behavior: 'smooth' });
    };

    // Bind all prev/next buttons — always enabled (infinite)
    [prevBtnDesktop, prevBtnMobile].forEach(btn => {
        if (btn) {
            btn.removeAttribute('disabled');
            btn.addEventListener('click', scrollPrev);
        }
    });
    [nextBtnDesktop, nextBtnMobile].forEach(btn => {
        if (btn) {
            btn.removeAttribute('disabled');
            btn.addEventListener('click', scrollNext);
        }
    });

    // ─── Dots ───
    const buildDots = () => {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        for (let i = 0; i < totalOriginal; i++) {
            const dot = document.createElement('button');
            dot.className = 'product-carousel__dot';
            dot.setAttribute('aria-label', `Ir a slide ${i + 1}`);
            dot.addEventListener('click', () => {
                const step = getStepSize();
                const targetScroll = (totalOriginal + i) * step;
                track.scrollTo({ left: targetScroll, behavior: 'smooth' });
            });
            dotsContainer.appendChild(dot);
        }
        updateActiveDot();
    };

    const updateActiveDot = () => {
        if (!dotsContainer) return;
        const dots = dotsContainer.querySelectorAll('.product-carousel__dot');
        const step = getStepSize();
        // Calculate which original card is current
        const scrollPos = track.scrollLeft;
        const rawIndex = Math.round(scrollPos / step);
        // Map back to original range
        const realIndex = ((rawIndex - totalOriginal) % totalOriginal + totalOriginal) % totalOriginal;
        dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === realIndex);
        });
    };

    // ─── Scroll event: update dots + handle infinite repositioning ───
    let scrollTimeout;
    track.addEventListener('scroll', () => {
        updateActiveDot();

        // Debounce the reposition check to after scroll stops
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleInfiniteScroll, 100);
    }, { passive: true });

    // ─── Initialize ───
    buildDots();

    // ─── Recalculate on resize ───
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            track.style.scrollBehavior = 'auto';
            scrollToOriginalStart();
            track.offsetHeight;
            track.style.scrollBehavior = 'smooth';
            buildDots();
        }, 200);
    });
});
