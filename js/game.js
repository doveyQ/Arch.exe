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
let currentlyShooting = false;
let reloaded = true;

//global speed adjustment
let globalSpeed = 6; //spaceship speed (in px per refresh)
let globalBulletSpeed = 8; //bullet speed (in px per refresh)
let globalBulletDelay = 100; //delay between each bullet (in ms)

//bullet array
let array = [];

//dont allow key spamming
let keyupRun = false;

//animation loop
function loop() {
  cv = document.getElementById('mainCanvas');
  ctx = cv.getContext('2d');
  cv.height = 960;
  cv.width = 1600;

  //spaceship movement
  ctx.drawImage(image, posX, posY, 60, 60); //draws image of choice and scales it
  keepMoving();

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
  }
  if (moveL == true) {
    if ((posX + image.width - 5) > image.width) {
      posX -= globalSpeed;
    }
  }
  if (moveU == true) {
    if ((posY + image.height - 5) > cv.height / 1.5) { //dont let spaceship move all the way up
      posY -= globalSpeed;
    }
  }
  if (moveD == true) {
    if ((posY + image.height + 5) < cv.height) {
      posY += globalSpeed;
    }
  }
}

function playAudio(audioID) {
  if (audioID == 'shoot') {
    var audio = new Audio('audio/bullet.mp3');
    audio.play();
  }
}

function shootCheck() {
  if (shoot == true && currentlyShooting == false) {
    currentlyShooting = true;
    generateBullet();
  }
}

//generate bullet
function generateBullet() {
  if (shoot == true && currentlyShooting == true) {
    let bl1 = new Bullet();
    array.push(bl1);
    playAudio('shoot');
    setTimeout(generateBullet, globalBulletDelay);
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
  }
  if (event.code == 'ArrowDown') {
    moveD = true;
  }
  if (event.code == 'ArrowLeft') {
    moveL = true;
  }
  if (event.code == 'ArrowRight') {
    moveR = true;
  }
});

//wait for keyup event
document.addEventListener('keyup', function (event) {
  if (event.code == 'ArrowUp') {
    moveU = false;
  }
  if (event.code == 'ArrowDown') {
    moveD = false;
  }
  if (event.code == 'ArrowLeft') {
    moveL = false;
  }
  if (event.code == 'ArrowRight') {
    moveR = false;
  }
});

//if keydown event is triggered
if (currentlyShooting == false) {
  document.addEventListener('keydown', function (event) {
    if (event.code == 'Space') {
      shoot = true;
      shootCheck();
    }
  });
}

//wait for keyup event
document.addEventListener('keyup', function (event) {
  if (event.code == 'Space') {
    shoot = false;
    setTimeout(function () {  //dont allow for key spamming
      currentlyShooting = false;
    }, 100);
  }
});

//start animation loop
loop();