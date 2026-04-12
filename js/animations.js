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
});
