function safeBtoa(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error('Error encoding Base64:', e);
    return btoa(str);
  }
}

function safeAtob(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.error('Error decoding Base64:', e);
    return atob(str);
  }
}

function loadFragment(path, id) {
  const el = document.getElementById(id);
  if (!el) return;

  fetch(path)
    .then(res => {
      if (!res.ok) throw new Error(path + ' HTTP ' + res.status);
      return res.text();
    })
    .then(data => {
      el.innerHTML = data;

      if (id === 'navbar') {
        const hamburger = document.getElementById('hamburger-menu');
        const navbarMenu = document.getElementById('navbar-menu');
        const navMobile = document.getElementById('nav-mobile');

        if (hamburger && navbarMenu) {
          hamburger.addEventListener('click', function () {
            this.classList.toggle('active');
            navbarMenu.classList.toggle('active');
          });

          if (navMobile) {
            const mobileLinks = navMobile.querySelectorAll('a');
            mobileLinks.forEach(link => {
              link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navbarMenu.classList.remove('active');
              });
            });
          }
        }
      }
    })
    .catch(err => console.error('Error cargando', path, err));
}

document.addEventListener('DOMContentLoaded', () => {
  // --- Procesamiento de parámetros URL para compatibilidad file:// ---
  const urlParams = new URLSearchParams(window.location.search);
  let stateChanged = false;

  // 1. Registro exitoso recibido en login.html
  if (urlParams.has('reg') && urlParams.has('u') && urlParams.has('p') && urlParams.has('e')) {
    const u = urlParams.get('u');
    const p = urlParams.get('p');
    const e = urlParams.get('e');
    localStorage.setItem('adminName', u);
    localStorage.setItem('adminPassword', p);
    localStorage.setItem('adminEmail', e);
    sessionStorage.setItem('adminName', u);
    sessionStorage.setItem('adminPassword', p);
    sessionStorage.setItem('adminEmail', e);
    stateChanged = true;
    console.log('Parámetros de registro leídos e integrados en almacenamiento local.');
  }

  // 2. Cambio de contraseña recibido en login.html
  if (urlParams.has('passUpdate') && urlParams.has('p')) {
    const p = urlParams.get('p');
    localStorage.setItem('adminPassword', p);
    sessionStorage.setItem('adminPassword', p);
    stateChanged = true;
    console.log('Cambio de contraseña leído e integrado en almacenamiento local.');
  }

  // 3. Recepción de código de verificación en verificacion.html
  if (urlParams.has('c') && urlParams.has('e')) {
    const c = urlParams.get('c');
    const e = urlParams.get('e');
    localStorage.setItem('verificationCode', c);
    localStorage.setItem('verificationEmail', e);
    localStorage.setItem('verificationTime', Date.now().toString());
    sessionStorage.setItem('verificationCode', c);
    sessionStorage.setItem('verificationEmail', e);
    sessionStorage.setItem('verificationTime', Date.now().toString());
    stateChanged = true;
    console.log('Código de verificación temporal leído e integrado.');
  }

  // 4. Recepción de autorización para registrarse o cambiar contraseña
  if (urlParams.has('codeVerified') && urlParams.get('codeVerified') === 'true') {
    sessionStorage.setItem('isAdminCodeVerified', 'true');
    stateChanged = true;
    console.log('Acceso de administrador autorizado por parámetro de URL.');
  }

  // Si leímos algún parámetro, limpiamos la barra de direcciones para mantener la estética y seguridad
  if (stateChanged) {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.warn('No se pudo limpiar la barra de direcciones:', err);
    }
  }
  // -------------------------------------------------------------
  loadFragment('navbar.html', 'navbar');
  loadFragment('footer.html', 'footer');

  const EMAILJS_PUBLIC_KEY = 'nT3RJhFUfjBhzDJI8';
  const EMAILJS_SERVICE_ID = 'service_2pchi1s';
  const EMAILJS_TEMPLATE_ID = 'template_h3chgdh';
  const EMAILJS_AVAILABLE = window.emailjs && typeof window.emailjs.send === 'function';

  if (EMAILJS_AVAILABLE) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log('EmailJS inicializado correctamente');
  } else {
    console.warn('EmailJS no está disponible en esta página');
  }

  function createCustomAlert() {
    if (document.getElementById('customAlertOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'customAlertOverlay';
    overlay.className = 'custom-alert-overlay hidden';
    overlay.innerHTML = `
      <div class="custom-alert-box">
        <h2 class="custom-alert-title" id="customAlertTitle"></h2>
        <div class="custom-alert-message" id="customAlertMessage"></div>
        <div class="custom-alert-actions">
          <button type="button" class="custom-alert-button" id="customAlertOk">Aceptar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#customAlertOk').addEventListener('click', () => {
      overlay.classList.add('hidden');
      const callback = overlay.dataset.callback;
      if (callback === 'redirectLogin') {
        window.location.href = 'login.html';
      }
      if (callback === 'redirectLoginFromRegister') {
        const u = localStorage.getItem('adminName') || sessionStorage.getItem('adminName') || '';
        const p = localStorage.getItem('adminPassword') || sessionStorage.getItem('adminPassword') || '';
        const e = localStorage.getItem('adminEmail') || sessionStorage.getItem('adminEmail') || '';
        window.location.href = 'login.html?reg=1&u=' + encodeURIComponent(u) + '&p=' + encodeURIComponent(p) + '&e=' + encodeURIComponent(e);
      }
      if (callback === 'redirectLoginFromPasswordChange') {
        const p = localStorage.getItem('adminPassword') || sessionStorage.getItem('adminPassword') || '';
        window.location.href = 'login.html?passUpdate=1&p=' + encodeURIComponent(p);
      }
      if (callback === 'redirectVerify') {
        const c = localStorage.getItem('verificationCode') || sessionStorage.getItem('verificationCode') || '';
        const e = localStorage.getItem('verificationEmail') || sessionStorage.getItem('verificationEmail') || '';
        window.location.href = 'verificacion.html?c=' + encodeURIComponent(c) + '&e=' + encodeURIComponent(e);
      }
      if (callback === 'redirectChangePassword') {
        window.location.href = 'cambiarcontrase\u00f1a.html?codeVerified=true';
      }
      overlay.dataset.callback = '';
    });
  }

  function showCustomAlert(title, message, action) {
    createCustomAlert();
    const overlay = document.getElementById('customAlertOverlay');
    document.getElementById('customAlertTitle').textContent = title;
    document.getElementById('customAlertMessage').innerHTML = message.replace(/\n/g, '<br>');
    overlay.classList.remove('hidden');
    overlay.dataset.callback = action || '';
  }

  function fallbackSendCode(email, verificationCode) {
    const encCode = safeBtoa(verificationCode);
    const encEmail = safeBtoa(email);
    const timeStr = Date.now().toString();
    localStorage.setItem('verificationCode', encCode);
    localStorage.setItem('verificationEmail', encEmail);
    localStorage.setItem('verificationTime', timeStr);
    sessionStorage.setItem('verificationCode', encCode);
    sessionStorage.setItem('verificationEmail', encEmail);
    sessionStorage.setItem('verificationTime', timeStr);
    showCustomAlert('Envío alternativo', 'No se pudo enviar el email automáticamente.\nCódigo de verificación: ' + verificationCode + '\nCorreo: ' + email, 'redirectVerify');
  }

  const verifyButton = document.getElementById('verifyAdminCodeButton');
  if (verifyButton) {
    verifyButton.addEventListener('click', () => {
      const code = document.getElementById('adminCodeInput').value.trim();
      const error = document.getElementById('adminCodeError');
      const modalEl = document.getElementById('adminCodeModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      const encodedAdminCode = 'UEVMVVFVRVJBMTIz';
      const adminCode = safeAtob(encodedAdminCode);

      if (code === adminCode) {
        error.classList.add('d-none');
        modal.hide();
        sessionStorage.setItem('isAdminCodeVerified', 'true');
        window.location.href = 'register.html?codeVerified=true';
      } else {
        error.classList.remove('d-none');
      }
    });
  }

  // Validación de email para restablecer contraseña
  const resetPasswordButton = document.getElementById('resetPasswordButton');
  if (resetPasswordButton) {
    resetPasswordButton.addEventListener('click', () => {
      const email = document.getElementById('resetEmailInput').value.trim();
      const error = document.getElementById('resetEmailError');
      const encodedEmails = ['cGFyYXRpcGVsdXF1ZXJpYTA0QGdtYWlsLmNvbQ=='];
      const registeredEmails = encodedEmails.map(e => safeAtob(e));

      // Agregar email registrado en localStorage o sessionStorage si existe
      const customEmailEncoded = localStorage.getItem('adminEmail') || sessionStorage.getItem('adminEmail');
      if (customEmailEncoded) {
        registeredEmails.push(safeAtob(customEmailEncoded));
      }

      if (registeredEmails.includes(email)) {
        error.classList.add('d-none');

        // Generar código aleatorio de 6 dígitos
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Guardar en localStorage y sessionStorage de forma codificada
        const encCode = safeBtoa(verificationCode);
        const encEmail = safeBtoa(email);
        const timeStr = Date.now().toString();
        localStorage.setItem('verificationCode', encCode);
        localStorage.setItem('verificationEmail', encEmail);
        localStorage.setItem('verificationTime', timeStr);
        sessionStorage.setItem('verificationCode', encCode);
        sessionStorage.setItem('verificationEmail', encEmail);
        sessionStorage.setItem('verificationTime', timeStr);

        const templateParams = {
          email: email,
          to_email: email,
          verification_code: verificationCode,
          code: verificationCode
        };

        console.log('EmailJS enviar:', EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

        const sendCodePromise = EMAILJS_AVAILABLE
          ? emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
          : Promise.reject(new Error('EmailJS no disponible'));

        sendCodePromise.then(() => {
          showCustomAlert('Código enviado', 'Se envió el código a:\n' + email, 'redirectVerify');

          // Deshabilitar botón por 60 segundos
          resetPasswordButton.disabled = true;
          resetPasswordButton.classList.add('disabled');
          const cooldownTimer = document.getElementById('cooldownTimer');
          cooldownTimer.classList.remove('d-none');

          let remainingTime = 60;
          const countdownSpan = document.getElementById('countdown');
          const interval = setInterval(() => {
            remainingTime--;
            countdownSpan.textContent = remainingTime;

            if (remainingTime <= 0) {
              clearInterval(interval);
              resetPasswordButton.disabled = false;
              resetPasswordButton.classList.remove('disabled');
              cooldownTimer.classList.add('d-none');
            }
          }, 1000);
        }).catch(err => {
          console.error('Error enviando email:', err);
          fallbackSendCode(email, verificationCode);

          // Deshabilitar botón por 60 segundos incluso si el envío falla
          resetPasswordButton.disabled = true;
          resetPasswordButton.classList.add('disabled');
          const cooldownTimer = document.getElementById('cooldownTimer');
          cooldownTimer.classList.remove('d-none');

          let remainingTime = 60;
          const countdownSpan = document.getElementById('countdown');
          const interval = setInterval(() => {
            remainingTime--;
            countdownSpan.textContent = remainingTime;

            if (remainingTime <= 0) {
              clearInterval(interval);
              resetPasswordButton.disabled = false;
              resetPasswordButton.classList.remove('disabled');
              cooldownTimer.classList.add('d-none');
            }
          }, 1000);
        });
      } else {
        error.classList.remove('d-none');
        showCustomAlert('Email no válido', 'El email ingresado no está registrado.');
      }
    });
  }

  // Verificación de código
  const verifyCodeButton = document.getElementById('verifyCodeButton');
  if (verifyCodeButton) {
    verifyCodeButton.addEventListener('click', () => {
      const inputCode = document.getElementById('verificationCodeInput').value.trim();
      const error = document.getElementById('verificationError');
      const storedCodeEncoded = localStorage.getItem('verificationCode') || sessionStorage.getItem('verificationCode');
      const storedTime = localStorage.getItem('verificationTime') || sessionStorage.getItem('verificationTime');
      const storedCode = storedCodeEncoded ? safeAtob(storedCodeEncoded) : null;

      if (!storedCode) {
        showCustomAlert('Código no solicitado', 'No hay ningún código de verificación activo. Por favor solicita uno.');
        return;
      }

      // Validar duración de 10 minutos (10 * 60 * 1000 ms)
      const codeAgeMs = Date.now() - parseInt(storedTime || '0', 10);
      const tenMinutesMs = 10 * 60 * 1000;

      if (storedTime && codeAgeMs > tenMinutesMs) {
        showCustomAlert('Código expirado', 'El código de verificación ha expirado (duración máxima: 10 minutos). Por favor reenvía el código.');
        return;
      }

      if (inputCode === storedCode) {
        error.classList.add('d-none');
        localStorage.removeItem('verificationCode');
        localStorage.removeItem('verificationEmail');
        localStorage.removeItem('verificationTime');
        sessionStorage.removeItem('verificationCode');
        sessionStorage.removeItem('verificationEmail');
        sessionStorage.removeItem('verificationTime');
        showCustomAlert('C\u00f3digo verificado', 'El c\u00f3digo es correcto.', 'redirectChangePassword');
      } else {
        showCustomAlert('Código incorrecto', 'El código que ingresaste no es válido. Por favor intenta de nuevo o reenvía el código.');
      }
    });
  }

  // Reenviar código
  const resendCodeButton = document.getElementById('resendCodeButton');
  if (resendCodeButton) {
    resendCodeButton.addEventListener('click', () => {
      const emailEncoded = localStorage.getItem('verificationEmail') || sessionStorage.getItem('verificationEmail');
      const email = emailEncoded ? safeAtob(emailEncoded) : null;

      if (email) {
        // Generar un código nuevo aleatorio de 6 dígitos para el reenvío
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        const encCode = safeBtoa(newCode);
        const timeStr = Date.now().toString();

        // Guardar el nuevo código y marca de tiempo en localStorage y sessionStorage
        localStorage.setItem('verificationCode', encCode);
        localStorage.setItem('verificationTime', timeStr);
        sessionStorage.setItem('verificationCode', encCode);
        sessionStorage.setItem('verificationTime', timeStr);

        const templateParams = {
          email: email,
          to_email: email,
          verification_code: newCode,
          code: newCode
        };

        console.log('EmailJS reenviar nuevo código:', EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

        const sendCodePromise = EMAILJS_AVAILABLE
          ? emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
          : Promise.reject(new Error('EmailJS no disponible'));

        sendCodePromise.then(() => {
          showCustomAlert('Código reenviado', 'Se ha enviado un nuevo código a:\n' + email);

          // Deshabilitar botón por 60 segundos
          resendCodeButton.disabled = true;
          resendCodeButton.classList.add('disabled');
          const cooldown = document.getElementById('resendCooldown');
          cooldown.classList.remove('d-none');

          let remainingTime = 60;
          const countdownSpan = document.getElementById('resendCountdown');
          const interval = setInterval(() => {
            remainingTime--;
            countdownSpan.textContent = remainingTime;

            if (remainingTime <= 0) {
              clearInterval(interval);
              resendCodeButton.disabled = false;
              resendCodeButton.classList.remove('disabled');
              cooldown.classList.add('d-none');
            }
          }, 1000);
        }).catch(err => {
          console.error('Error reenviando código:', err);
          fallbackSendCode(email, newCode);

          resendCodeButton.disabled = true;
          resendCodeButton.classList.add('disabled');
          const cooldown = document.getElementById('resendCooldown');
          cooldown.classList.remove('d-none');

          let remainingTime = 60;
          const countdownSpan = document.getElementById('resendCountdown');
          const interval = setInterval(() => {
            remainingTime--;
            countdownSpan.textContent = remainingTime;

            if (remainingTime <= 0) {
              clearInterval(interval);
              resendCodeButton.disabled = false;
              resendCodeButton.classList.remove('disabled');
              cooldown.classList.add('d-none');
            }
          }, 1000);
        });
      }
    });
  }

  // Cambiar contrase\u00f1a
  const changePasswordForm = document.getElementById('changePasswordButton')?.closest('form');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('newPasswordInput').value.trim();
      const confirmPassword = document.getElementById('confirmPasswordInput').value.trim();
      const error = document.getElementById('changePasswordError');

      if (!newPassword || !confirmPassword) {
        showCustomAlert('Campos incompletos', 'Por favor, completa ambos campos.');
        return;
      }

      if (newPassword === confirmPassword) {
        error.classList.add('d-none');
        // Limpiamos los datos de verificaci\u00f3n ya que complet\u00f3 el proceso
        localStorage.removeItem('verificationCode');
        localStorage.removeItem('verificationEmail');
        localStorage.removeItem('verificationTime');
        sessionStorage.removeItem('verificationCode');
        sessionStorage.removeItem('verificationEmail');
        sessionStorage.removeItem('verificationTime');

        // Actualizamos la contraseña de administrador registrada (codificada)
        const encPass = safeBtoa(newPassword);
        localStorage.setItem('adminPassword', encPass);
        sessionStorage.setItem('adminPassword', encPass);

        showCustomAlert('Contrase\u00f1a cambiada', 'Tu contrase\u00f1a ha sido restablecida con \u00e9xito.', 'redirectLoginFromPasswordChange');
      } else {
        error.classList.remove('d-none');
        showCustomAlert('Las contrase\u00f1as no coinciden', 'Las contrase\u00f1as que ingresaste no son iguales. Por favor intenta de nuevo.');
      }
    });
  }

  // Registro de administrador
  const registerForm = document.getElementById('registerButton')?.closest('form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('registerNameInput').value.trim();
      const email = document.getElementById('registerEmailInput').value.trim();
      const password = document.getElementById('registerPasswordInput').value.trim();
      const confirmPassword = document.getElementById('registerConfirmPasswordInput').value.trim();
      const error = document.getElementById('registerError');

      if (!name || !email || !password || !confirmPassword) {
        showCustomAlert('Campos incompletos', 'Por favor, completa todos los campos.');
        return;
      }

      if (password !== confirmPassword) {
        error.classList.remove('d-none');
        showCustomAlert('Las contrase\u00f1as no coinciden', 'Por favor, aseg\u00farate de que ambas contrase\u00f1as sean iguales.');
        return;
      }

      error.classList.add('d-none');
      const encEmail = safeBtoa(email);
      const encPassword = safeBtoa(password);
      const encName = safeBtoa(name);
      localStorage.setItem('adminEmail', encEmail);
      localStorage.setItem('adminPassword', encPassword);
      localStorage.setItem('adminName', encName);
      sessionStorage.setItem('adminEmail', encEmail);
      sessionStorage.setItem('adminPassword', encPassword);
      sessionStorage.setItem('adminName', encName);
      sessionStorage.removeItem('isAdminCodeVerified');

      console.log('Registro exitoso. Guardado en localStorage. adminName:', name);

      showCustomAlert('Cuenta creada', 'La cuenta de administradora ha sido creada con \u00e9xito.', 'redirectLoginFromRegister');
    });
  }

  // Inicio de sesión de administrador
  const loginForm = document.getElementById('loginButton')?.closest('form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUserInput').value.trim();
      const password = document.getElementById('loginPasswordInput').value.trim();
      const error = document.getElementById('loginError');

      if (!username || !password) {
        showCustomAlert('Campos incompletos', 'Por favor, introduce tu usuario y contrase\u00f1a.');
        return;
      }

      const defaultUserEncoded = 'cGVsdXF1ZXJhMTIz'; // 'peluquera123'
      const defaultPasswordEncoded = 'cGVsdXF1ZXJhMTIz'; // 'peluquera123'

      const storedUserEncoded = localStorage.getItem('adminName') || sessionStorage.getItem('adminName') || defaultUserEncoded;
      const storedPasswordEncoded = localStorage.getItem('adminPassword') || sessionStorage.getItem('adminPassword') || defaultPasswordEncoded;

      const storedUser = safeAtob(storedUserEncoded);
      const storedPassword = safeAtob(storedPasswordEncoded);

      console.log('Intento de login. Usuario ingresado:', username);
      console.log('Usuario esperado recuperado:', storedUser);

      if (username === storedUser && password === storedPassword) {
        error.classList.add('d-none');
        window.location.href = 'admin.html';
      } else {
        error.classList.remove('d-none');
        showCustomAlert('Error de acceso', 'Usuario o contrase\u00f1a incorrectos. Por favor intenta de nuevo.');
      }
    });
  }
});