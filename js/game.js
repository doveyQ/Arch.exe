/*
Last Author: K1llf0rce
Date: 05.04.2021
*/

//exec code in strict mode
'use strict';

//canvas stuff
let cv = document.getElementById('mainCanvas');
let ctx = cv.getContext('2d');
cv.height = 960; //  height for canvas
cv.width = 1600; //  width for canvas
let canvasHeight = cv.height;
let canvasWidth = cv.width;

//define images
let image = document.getElementById('spaceship');
let imageBullet = document.getElementById('bullet1');

//initial position
let posX = 800;
let posY = 700;

//move/shoot booleans
let moveU = false;
let moveD = false;
let moveL = false;
let moveR = false;
let shoot = false;
let shootInit = true;

//global speed adjustment
let globalSpeed = 6; //spaceship speed (in px per refresh)
let globalBulletSpeed = 8; //bullet speed (in px per refresh)
let globalBulletDelay = 100; //delay between each bullet (in ms)

//bullet array
let array = [];

//animation loop
function loop() {
  cv = document.getElementById('mainCanvas');
  ctx = cv.getContext('2d');
  cv.height = 960;
  cv.width = 1600;

  //spaceship movement
  ctx.drawImage(image, posX, posY, 60, 60); //draws image of choice and scales it
  keepMoving();

  //listen for inital shoot trigger
  shootCheck();

  //keep bullets moving
  bulletMovement();

  window.requestAnimationFrame(loop);
}

// adjust position of spaceship according to key events and perform out of
// border checks
function keepMoving() {
  if (moveR == true) {
    if ((posX + image.width + 5) < cv.width) {
      posX += globalSpeed;
    }
  } else if (moveL == true) {
    if ((posX + image.width - 5) > image.width) {
      posX -= globalSpeed;
    }
  } else if (moveU == true) {
    if ((posY + image.height - 5) > cv.height / 1.5) { //dont let spaceship move all the way up
      posY -= globalSpeed;
    }
  } else if (moveD == true) {
    if ((posY + image.height + 5) < cv.height) {
      posY += globalSpeed;
    }
  }
}

function playAudio(audioID){
  if (audioID == 'shoot') {
    var audio = new Audio('audio/bullet.mp3');
    audio.play();
  }
}

function shootCheck() {
  if (shoot == true && shootInit == true) {
    generateBullet();
    shootInit = false;
  }
}

//generate bullet
function generateBullet() {
  if (shoot == true) {
    let bl1 = new Bullet();
    array.push(bl1);
    setTimeout(generateBullet, globalBulletDelay);
    playAudio('shoot');
  }
}

//add bulet movement
function bulletMovement() {
  for (let i = 0; i < array.length; i++) {
    ctx.drawImage(
      imageBullet,
      array[i].initialPosX,
      (array[i].initialPosY + array[i].speedY),
      20,
      20
    );
    array[i].speedY -= globalBulletSpeed;
    if ((array[i].initialPosY + array[i].speedY) == 0) {
      array.splice(i, 1);
    }
  }
}

//class for bullets
class Bullet {
  constructor() {
    this.initialPosX = posX + 20; //shift to center
    this.initialPosY = posY;
    this.speedY = 0;
  }
}

//if keydown event is triggered
document.addEventListener('keydown', function (event) {
  if (event.code == 'ArrowUp') {
    moveU = true;
  } else if (event.code == 'ArrowDown') {
    moveD = true;
  } else if (event.code == 'ArrowLeft') {
    moveL = true;
  } else if (event.code == 'ArrowRight') {
    moveR = true;
  }
});

//wait for keyup event
document.addEventListener('keyup', function (event) {
  if (event.code == 'ArrowUp') {
    moveU = false;
  } else if (event.code == 'ArrowDown') {
    moveD = false;
  } else if (event.code == 'ArrowLeft') {
    moveL = false;
  } else if (event.code == 'ArrowRight') {
    moveR = false;
  }
});

//if keydown event is triggered
document.addEventListener('keydown', function (event) {
  if (event.code == 'Space') {
    shoot = true;
  }
});

//wait for keyup event
document.addEventListener('keyup', function (event) {
  if (event.code == 'Space') {
    shoot = false;
    shootInit = true;
  }
});

//start animation loop
loop();