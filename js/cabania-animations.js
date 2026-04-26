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
