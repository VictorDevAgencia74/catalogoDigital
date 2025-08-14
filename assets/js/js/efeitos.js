document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.link_categoria');

    links.forEach(link => {
        link.addEventListener('click', (event) => {
            // Remove a classe 'selected' de todos os links
            links.forEach(l => l.classList.remove('selected'));

            // Adiciona a classe 'selected' ao link clicado
            event.currentTarget.classList.add('selected');
        });
    });
});