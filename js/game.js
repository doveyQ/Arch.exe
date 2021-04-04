/* 
Last Author: K1llf0rce
Date: 01.04.2021
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

//move variables for each individual axis to increase responsiveness
let moveU = '';
let moveD = '';
let moveL = '';
let moveR = '';

//global speed adjustment
let globalSpeed = 7;
let globalBulletSpeed = 5;

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
  
  //keep bullets moving
  bulletMovement();

  window.requestAnimationFrame(loop);
}

//adjust position of spaceship according to key events and perform out of border checks
function keepMoving() {
  if (moveR == 'right') {
    if ((posX + image.width +5) < cv.width) {
      posX += globalSpeed;
    }
  } else if (moveL == 'left') {
    if ((posX + image.width -5) > image.width) {
      posX -= globalSpeed;
    }
  } else if (moveU == 'up') {
    if ((posY + image.height -5) > cv.height / 1.5) { //dont let spaceship move all the way up 
      posY -= globalSpeed;
    }
  } else if (moveD == 'down') {
    if ((posY + image.height +5) < cv.height) {
      posY += globalSpeed;
    }
  }
}

//add bulet movement
function bulletMovement() {
  for (let i=0; i < array.length; i++) {
    ctx.drawImage(imageBullet, array[i].initialPosX, (array[i].initialPosY+array[i].speedY), 20, 20);
    array[i].speedY -= globalBulletSpeed;
    if ( (array[i].initialPosY+array[i].speedY) == 0) {
      array.splice(i, 1); 
    }
  }
}

//class for bullets
class Bullet {
  constructor () {
    this.initialPosX = posX+20; //shift to center
    this.initialPosY = posY;
    this.speedY = 0;
  }
}

//if keydown event is triggered, start moving spaceship with keepMoving-function untill keydown event triggers
document.addEventListener('keydown', function (event) {
  if (event.code == 'ArrowUp') {
    moveU = 'up';
  } else if (event.code == 'ArrowDown') {
    moveD = 'down';
  } else if (event.code == 'ArrowLeft') {
    moveL = 'left';
  } else if (event.code == 'ArrowRight') {
    moveR = 'right';
  }
});

//wait for keyup event, if detected set move to "stop" so keepMoving-function doesnt continue
document.addEventListener('keyup', function (event) {
  if (event.code == 'ArrowUp') {
    moveU = '';
  } else if (event.code == 'ArrowDown') {
    moveD = '';
  } else if (event.code == 'ArrowLeft') {
    moveL = '';
  } else if (event.code == 'ArrowRight') {
    moveR = '';
  }
});

//listen for shoot
document.addEventListener('keyup', function (event) {
  if (event.code == 'Space') {
    let bl1 = new Bullet();
    array.push(bl1);
  }
});

//start animation loop
loop();