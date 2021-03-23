//use this for game pls

/* 
Project: uebung06_klassen_balls
Last Author:  Teppan Fabian
Date: 23.03.2021
*/

'use strict';
let cv = document.getElementById('mainCanvas');
let ctx = cv.getContext('2d');
let image = document.getElementById('spaceship');
cv.height = 1000;  //  height for canvas
cv.width = 1000;  //  width for canvas
let canvasHeight = cv.height;
let canvasWidth = cv.width;
let posX = 925;
let posY = 925;
let move = '';

//animation loop
function loop() {
    cv = document.getElementById('mainCanvas');
    ctx = cv.getContext('2d');
    cv.height = 1000;
    cv.width = 1000;
    ctx.drawImage(image, posX, posY, 50, 50); //draws image of choice and scales it
    if (move != 'stop') {
        keepMoving();
    } 
    window.requestAnimationFrame(loop);
}

//adjust position of spaceship according to key events and perform out of border checks
function keepMoving() {
    if (move == 'right') {
        if ( (posX + image.width) < cv.width) {
          posX += 5 
        } else {
          return
        }
    } else if (move == 'left') {
        if ( (posX + image.width) > image.width) {
            posX -= 5 
          } else {
            return
          }
    } else if (move == 'up') {
        if ( (posY + image.height) > image.height) {
            posY -= 5 
          } else {
            return
          }
    } else if (move == 'down') {
        if ( (posY + image.height) < cv.height) {
            posY += 5 
          } else {
            return
          }
    }
}

//if keydown event is triggered, start moving spaceship with keepMoving-function untill keydown event triggers
document.addEventListener('keydown', function (event) {
  if (event.code == 'ArrowUp') {
    move = 'up';
  } else if (event.code == 'ArrowDown') {
    move = 'down';
  } else if (event.code == 'ArrowLeft') {
    move = 'left';
  } else if (event.code == 'ArrowRight') {
    move = 'right';
  }
});

//wait for keyup event, if detected set move to "stop" so keepMoving-function doesnt continue
document.addEventListener('keyup', function (event) {
    if (event.code == 'ArrowUp') {
      move = 'stop';
    } else if (event.code == 'ArrowDown') {
      move = 'stop';
    } else if (event.code == 'ArrowLeft') {
      move = 'stop';
    } else if (event.code == 'ArrowRight') {
      move = 'stop';
    }
});

//start animation loop
loop();