const reloadParam = '?_ijt=l53oo78oipcls6ajtvms0auov5&_ij_reload=RELOAD_ON_SAVE';


function login(button) {
    let nameInput = document.querySelector('input[name="name"]');

    if (!nameInput.value) {
        nameInput.parentElement.classList.add('de-signup__input--error');
        return;
    }

    nameInput.parentElement.classList.remove('de-signup__input--error');

    button.disabled = true;
    window.location.href = `../index.html${reloadParam}&name=${nameInput.value}`;
}

document.addEventListener('keyup', function (event) {
    if (event.keyCode !== 13) return;

    event.preventDefault();
    login(document.querySelector('.de-button'));
});