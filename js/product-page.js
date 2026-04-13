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

            tab.classList.add('is-active');
            const panel = document.getElementById(target);
            if (panel) panel.classList.add('is-active');
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
});
