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
    // Dynamic Hero Background
    const dynamicHeroBg = document.getElementById('dynamic-hero-bg');
    if (dynamicHeroBg) {
        const heroImages = [
            'images/hero/hero1.webp',
            'images/hero/hero2.webp',
            'images/hero/hero3.webp',
            'images/hero/hero4.webp',
            'images/hero/hero5.webp',
            'images/hero/hero6.webp',
            'images/hero/hero7.webp',
            'images/hero/hero8.webp'
        ];
        // Select a random image from the pool
        const randomImage = heroImages[Math.floor(Math.random() * heroImages.length)];
        // Set it as background
        dynamicHeroBg.style.backgroundImage = `url('${randomImage}')`;
    }
});
