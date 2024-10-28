document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const gmailInput = document.getElementById('correo');
    const passwordInput = document.getElementById('password');


    const validarFormulario = () => {
        const gmail = gmailInput.value.trim();
        const password = passwordInput.value.trim();


        if (gmail === '' || password === '') {
            alert('Por favor, completa todos los campos.');
            return false; 
        }


        if (!/\S+@\S+\.\S+/.test(gmail)) {
            alert('El correo no tiene un formato válido.');
            return false;
        }


        if (password.length < 5 || password.length > 10) {
            alert('La contraseña debe tener entre 5 y 10 caracteres.');
            return false; 
        }


        if (/\s/.test(password)) {
            alert('La contraseña no puede contener espacios.');
            return false; 
        }

        return true; 
    };


    form.addEventListener('submit', (event) => {
        event.preventDefault(); 


        if (validarFormulario()) {
            form.submit(); 
        }
    });
});
