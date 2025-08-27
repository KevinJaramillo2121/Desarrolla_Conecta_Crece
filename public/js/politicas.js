document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.policy-section');
    const navLinks = document.querySelectorAll('.policy-sidebar nav a');

    if (!sections.length || !navLinks.length) return;

    const onScroll = () => {
        let currentSectionId = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Damos un margen de 150px para que el cambio sea más natural
            if (window.scrollY >= sectionTop - 150) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', onScroll);
    onScroll(); // Llama una vez al cargar para establecer el estado inicial
});
