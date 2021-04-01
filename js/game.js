//use this for game pls

/* 
Last Author: Mercy:3
Date: 01.04.2021
*/

'use strict';
let cv = document.getElementById('mainCanvas');
let ctx = cv.getContext('2d');
let image = document.getElementById('spaceship');
cv.height = 925;  //  height for canvas
cv.width = 1600;  //  width for canvas
let canvasHeight = cv.height;
let canvasWidth = cv.width;
let posX = 800;
let posY = 700;

//move variables for each individual axis to increase responsiveness
let moveU = '';
let moveD = '';
let moveL = '';
let moveR = '';

//global speed adjustment
let globalSpeed = 10;

//animation loop
function loop() {
    cv = document.getElementById('mainCanvas');
    ctx = cv.getContext('2d');
    cv.height = 925;
    cv.width = 1600;
    ctx.drawImage(image, posX, posY, 50, 50); //draws image of choice and scales it
    keepMoving();
    window.requestAnimationFrame(loop);
}

//adjust position of spaceship according to key events and perform out of border checks
function keepMoving() {
    if (moveR == 'right') {
        if ( (posX + image.width) < cv.width) {
          posX += globalSpeed;
        }
    } else if (moveL == 'left') {
        if ( (posX + image.width) > image.width) {
          posX -= globalSpeed;
        }
    } else if (moveU == 'up') {
        if ( (posY + image.height) > cv.height/1.5) { //dont let spaceship move all the way up 
          posY -= globalSpeed;
        }
    } else if (moveD == 'down') {
        if ( (posY + image.height) < cv.height) {
          posY += globalSpeed;
        }
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

//start animation loop
loop();
