class DocsPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
    }

    setupNavigation() {
        // Get current page path
        const currentPath = window.location.pathname;
        
        // Remove active class from all links
        document.querySelectorAll('.docs-nav-link').forEach(link => {
            link.classList.remove('active');
            
            // Add active class to current page link
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });

        // Handle mobile navigation
        this.setupMobileNav();
    }

    setupMobileNav() {
        // Add mobile navigation toggle if needed
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.docs-sidebar');
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn btn-primary d-md-none mb-3';
            toggleBtn.innerHTML = '<i class="bi bi-list"></i> Menu';
            
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('show');
            });

            document.querySelector('.docs-content').insertAdjacentElement('beforebegin', toggleBtn);
        }
    }
}

// Initialize the docs page
document.addEventListener('DOMContentLoaded', () => {
    new DocsPage();
}); 