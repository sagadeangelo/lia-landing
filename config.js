const FOCUS_APPS_MODE = true;

(function () {
    if (FOCUS_APPS_MODE) {
        document.documentElement.classList.add('focus-apps-mode');

        // Check if current page is a disabled route
        const disabledRoutes = [
            'servicio-branding.html',
            'servicio-epub.html',
            'servicio-kdp.html',
            'servicio-maquetacion.html',
            'explora-saga.html',
            'blog.html',
            'blog-kdp.html',
            'blog-procrastinacion.html',
            'blog/index.html'
        ];

        const pathname = window.location.pathname;
        const isHomepage = pathname.endsWith('index.html') && !pathname.includes('blog/index.html') && !pathname.includes('celestya/index.html') && !pathname.includes('lia-staylo/index.html');
        // Simple heuristic: if we are at root or a known safe path.
        // It's easier to check if we are explicitly on a disabled route.
        const isAppPath = pathname.includes('apps/') || pathname.includes('celestya/');

        let shouldRedirect = false;
        for (const route of disabledRoutes) {
            if (pathname.endsWith(route)) {
                shouldRedirect = true;
                break;
            }
        }

        if (shouldRedirect) {
            // Determine relative path to root based on if we are in a subfolder
            let pathToRoot = './';
            if (pathname.includes('/blog/')) {
                pathToRoot = '../';
            }
            window.location.replace(pathToRoot + 'index.html#apps');
        }
    }
})();
