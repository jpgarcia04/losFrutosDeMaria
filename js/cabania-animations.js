/**
 * Maneja las animaciones específicas para la página de la cabaña.
 * 
 * Utiliza IntersectionObserver para detectar cuándo los elementos con
 * la clase '.cabana-fade-in' entran en el viewport y les aplica la
 * clase '.is-visible' para realizar una transición suave.
 */
// Scroll animations for cabana-specific elements
document.addEventListener('DOMContentLoaded', () => {
  const fadeEls = document.querySelectorAll('.cabana-fade-in');
  if (fadeEls.length > 0) {
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
