  $(document).ready(function() {

    // ================= MENU RESPONSIVE =================
    $('.menu-toggle').click(function() {
      $('.nav-menu').toggleClass('active');
    });

    // ================= SCROLL SUAVE =================
    $("a[href^='#']").click(function(e) {
      e.preventDefault();
      var target = $(this.hash);
      if(target.length) {
        $('html, body').animate({ scrollTop: target.offset().top }, 800);
      }
    });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log("Service Worker registrado:", reg))
      .catch(err => console.error("Error al registrar el Service Worker:", err));
  }

    // ================= RESERVACIONES =================
    if ($('#formReservacion').length) {
      $('#formReservacion').submit(function(e) {
        e.preventDefault();

        const nombre = $('#nombre').val();
        const publico = $('#publico').val();
        const fiesta = $('#fiesta').val();
        const bebida = $('#bebida').val();
        const botana = $('#botana').val();
        const personas = $('#personas').val();
        const lugar = $('#lugar').val();
        const fecha = $('#fecha').val();
        const hora = $('#hora').val();

        console.log('--- Nueva Reservación ---');
        console.log('Nombre:', nombre);
        console.log('Tipo de Público:', publico);
        console.log('Tipo de Fiesta:', fiesta);
        console.log('Tipo de Bebida:', bebida);
        console.log('Tipo de Botana/Snack:', botana);
        console.log('Cantidad de Personas:', personas);
        console.log('Lugar del Evento:', lugar);
        console.log('Fecha:', fecha);
        console.log('Hora:', hora);
        console.log('------------------------');

        alert('¡Reservación enviada! Revisa la consola para los detalles.');
        $(this).trigger('reset');
      });
    }

  });

  let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  document.getElementById("btnInstalar").style.display = "block";

  document.getElementById("btnInstalar").addEventListener("click", () => {
    deferredPrompt.prompt();
    deferredPrompt = null;
  });
});
