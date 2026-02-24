document.addEventListener('DOMContentLoaded', () => {
    const defaultInterval = 5000; // 5 seconds
    let intervalId;
    
    // Select all the radio buttons driving the carousel
    const slides = document.querySelectorAll('.carousel-container input[name="slider"]');
    const totalSlides = slides.length;
    
    if (totalSlides === 0) return; // Exit if no carousel on page

    // Find the container to pause on hover
    const carouselContainer = document.querySelector('.carousel-container');

    // Function to go to the next slide
    const nextSlide = () => {
        let currentIndex = -1;
        
        // Find currently checked slide
        slides.forEach((slide, index) => {
            if (slide.checked) {
                currentIndex = index;
            }
        });

        // Calculate next index (wrap around to 0)
        let nextIndex = (currentIndex + 1) % totalSlides;
        
        // Check the next radio button
        slides[nextIndex].checked = true;
    };

    // Start the auto-play
    const startAutoPlay = () => {
        if (!intervalId) {
            intervalId = setInterval(nextSlide, defaultInterval);
        }
    };

    // Stop the auto-play
    const stopAutoPlay = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    // Initialize auto-play
    startAutoPlay();

    // Pause on mouse enter, resume on mouse leave
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopAutoPlay);
        carouselContainer.addEventListener('mouseleave', startAutoPlay);
    }
});
