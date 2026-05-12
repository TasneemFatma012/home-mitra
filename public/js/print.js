document.addEventListener("DOMContentLoaded", function () {

    const btn = document.getElementById("printBtn");

    if (btn) {
        btn.addEventListener("click", function () {
            window.print();
        });
    }

});