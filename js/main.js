//movement
const objecttomove = document.getElementById("objecttomove");
const movementSpeed = 20;
//press functions
function arrowUp(){
    objecttomove.style.top = parseInt(objecttomove.style.top) -  movementSpeed + 'px';
}
function arrowDown(){
    objecttomove.style.top = parseInt(objecttomove.style.top) +  movementSpeed + 'px';
}
function arrowLeft(){
    objecttomove.style.left = parseInt(objecttomove.style.left) -  movementSpeed + 'px';
}
function arrowRight(){
    objecttomove.style.left = parseInt(objecttomove.style.left) +  movementSpeed + 'px';
}

//chose the function

function selectDirection(event){
    switch (event.keyCode){
        case 38:
            arrowUp();
        break;
        case 40:
            arrowDown();
        break;
        case 37:
            arrowLeft();
        break;
        case 39:
            arrowRight();
        break;
    }
}
//waits for keys to be pressed
window.addEventListener("keydown", selectDirection);