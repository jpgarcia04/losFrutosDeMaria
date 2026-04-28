document.addEventListener('DOMContentLoaded', () => {
    // Select all elements to animate
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    // Create the Intersection Observer
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // Apply class if element is in viewport
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                
                // Stop observing the element once animated (optional: only animate once)
                observer.unobserve(entry.target);
            }
        });
    }, {
        // Trigger animation before it fully enters viewport (e.g., 10%)
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe each element
    animatedElements.forEach(el => observer.observe(el));

    // WhatsApp float trigger observer for home page
    const whatsappFloat = document.getElementById('whatsapp-float');
    const bienestarSection = document.getElementById('bienestar');
    
    if (whatsappFloat && bienestarSection && document.body.classList.contains('home-page')) {
        const waObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    whatsappFloat.classList.add('wa-trigger');
                    waObserver.disconnect(); // Only animate once
                }
            });
        }, {
            threshold: 0.2 // Trigger when 20% of section is visible
        });
        
        waObserver.observe(bienestarSection);
    }
});
