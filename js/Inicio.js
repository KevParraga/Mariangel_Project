  /* 1. ANIMACIÓN DEL MENÚ SUPERIOR AL HACER SCROLL
           Escucha cuando la ventana se mueve hacia abajo. Si baja más de 50px añade la clase CSS '.scrolled'
           para volver la barra fija y compacta, de lo contrario la regresa a su forma flotante original. */
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });

        /* 2. CONTROL DEL MENÚ DESPLEGABLE EN DISPOSITIVOS MÓVILES
           Busca el botón (=) y el menú interno de la barra. Al hacer clic, añade o quita la clase '.active'
           para que se abra o se cierre en pantallas táctiles, intercambiando el icono (☰) por una cruz (✕). */
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const navMenuContainer = document.getElementById('nav-menu-container');

        mobileMenuBtn.addEventListener('click', () => {
            navMenuContainer.classList.toggle('active');
            
            const icon = mobileMenuBtn.querySelector('i');
            if(navMenuContainer.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark'); // Cambia a cruz
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');  // Cambia a barra original
            }
        });

        /* 3. CIERRE AUTOMÁTICO EN CELULARES AL NAVEGAR
           Para evitar que el menú abierto tape la pantalla tras pulsar secciones de la misma página,
           este ciclo detecta el clic en cualquier enlace interno y oculta el menú automáticamente. */
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenuContainer.classList.remove('active');
                mobileMenuBtn.querySelector('i').classList.remove('fa-xmark');
                mobileMenuBtn.querySelector('i').classList.add('fa-bars');
            });
        });