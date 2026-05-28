/**
 * Maneja la lógica del menú de navegación móvil (hamburger menu).
 * 
 * Permite abrir y cerrar el menú principal al hacer clic en el botón toggle,
 * y cierra automáticamente el menú cuando se hace clic en cualquier enlace interno.
 */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('nav--open');
      toggle.setAttribute('aria-expanded', isOpen);
      toggle.classList.toggle('nav-toggle--open', isOpen);
    });
    
    // Close on link click
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav--open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.classList.remove('nav-toggle--open');
      });
    });
  }
});
