fetch("navbar.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("navbar").innerHTML = data;
    
    //  menú hamburguesa
    const hamburger = document.getElementById('hamburger-menu');
    const navbarMenu = document.getElementById('navbar-menu');
    const navMobile = document.getElementById('nav-mobile');
    
    if (hamburger && navbarMenu) {
      hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        navbarMenu.classList.toggle('active');
      });

      // cierra el menu alk hacer click en un link
      if (navMobile) {
        const mobileLinks = navMobile.querySelectorAll('a');
        mobileLinks.forEach(link => {
          link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navbarMenu.classList.remove('active');
          });
        });
      }
    }
  });

fetch("footer.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;
  });