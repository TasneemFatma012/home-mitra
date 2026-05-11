const priceRange =
    document.getElementById("priceRange");

const priceOutput =
    document.getElementById("priceOutput");

if(priceRange && priceOutput){

    priceRange.addEventListener("input", () => {

        priceOutput.innerText =
            priceRange.value;

    });

}