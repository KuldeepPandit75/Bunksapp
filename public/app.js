// signup page working

document.addEventListener('DOMContentLoaded', function() {
    const studentRadio = document.querySelector("#stuPorp");
    const projectViewerRadio = document.querySelector('#projPorp');
    const rollInput = document.querySelector('#signRoll');

    console.log(studentRadio,projectViewerRadio,rollInput)

    function toggleRollInput() {
        if (projectViewerRadio.checked) {
            rollInput.style.display = 'none';
            rollInput.removeAttribute('required');
        } else {
            rollInput.style.display = 'block';
            rollInput.setAttribute('required', 'required');
        }
    }

    studentRadio.addEventListener('change', toggleRollInput);
    projectViewerRadio.addEventListener('change', toggleRollInput);

    // Initialize the state based on the currently checked radio button
    toggleRollInput();
});