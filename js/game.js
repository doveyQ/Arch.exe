/*
Last Author: K1llf0rce
Date: 05.06.2021
*/

//exec code in strict mode
'use strict';

//canvas
let cv = document.getElementById('mainCanvas');
let ctx = cv.getContext('2d');
cv.height = 960;
cv.width = 1600;
let canvasHeight = cv.height;
let canvasWidth = cv.width;

//window
let contentWindowH;
//let contentWindowW;

var audioSoundtrack = new Audio('audio/mainSoundtrack.mp3');

//images
let image = document.getElementById('spaceship');
let imageBullet = document.getElementById('bulletArchy');
let imageEnemyBullet = document.getElementById('bulletEnemy');
let imageEnemy = document.getElementById('enemy');
let imageShield = document.getElementById('shield');
let imageFire = document.getElementById('fire');
let imageSpeed = document.getElementById('thunder');

//buttons
let buttonResume = document.getElementById('gameButtonResume');
let buttonExit = document.getElementById('gameButtonExit');

//outputs
let scoreOutput = document.getElementById('playerScoreOut');

//booleans
let moveU = false;
let moveD = false;
let moveL = false;
let moveR = false;
let currentlyShooting = false;
let currentlyRunning = true;
let focused = true;
let isBossStage = false;
let bossLock = false;

//other variables
let currentFramerate;
let mainBulletLoop;
let mainEnemyLoop;
let mainCollectibleLoop;
let mainEnemyShootingLoop;
let typeToSpawn = 'shield';

//counter variables
let currentBulletDamage = 0;
let playerScore = 0;
let globalLevelNumber = 0;

//global speed adjustment
let globalSpeed; //spaceship speed (in px per refresh)
let globalEnemySpeed; //enemy speed (in px per refresh)
let globalBulletSpeed; //bullet speed (in px per refresh)
let globalBulletDelay; //delay between each bullet (in ms)
let globalMovementAdjust; //movement speed adjust based on measured FPS
let globalCollectibleSpeed; //collectible speed (in pc per refresh)

//arrays
let bulletArray = [];
let enemyArray = [];
let collectibleArray = [];
let levelArray = [];

function loop() {
  //canvas
  cv = document.getElementById('mainCanvas');
  ctx = cv.getContext('2d');
  cv.height = 960;
  cv.width = 1600;

  //spaceship movement
  spaceshipMovement();
  //archy.move();

  //level/enemy handler
  levelHandler();

  //keep bullets moving
  bulletMovement();

  //keep collectibles moving
  collectibleMovement();

  //get FPS and adjust multiplier
  getFPS().then(fps => currentFramerate = fps);
  adjustForFramerate();

  contentWindowH = Number(window.innerHeight);
  //contentWindowW = Number(window.innerWidth);
  //resize
  checkWindowSize();

  //check if game is still focused, otherwise pause game
  if (focused == false) {
    gameStop();
    document.getElementById("gameScreen").style.display = 'block';
  }

  if (currentlyRunning == true) {
    window.requestAnimationFrame(loop);
  }
}

//check for focus and unfocus
window.onblur = function() {
  focused = false;
};
window.onfocus = function() {
  focused = true;
};

//movement is adjusted based on the players screen refresh rate
function adjustForFramerate() {
  globalMovementAdjust = ( 100 - ( ( currentFramerate * 88 ) / 100 ) + 100 ) * 0.01; // we calculate the multiplier here
  globalSpeed = archy.speed * globalMovementAdjust;
  globalEnemySpeed = levelArray[globalLevelNumber].levelEnemySpeed * globalMovementAdjust;
  globalBulletSpeed = 16 * globalMovementAdjust;
  globalCollectibleSpeed = levelArray[globalLevelNumber].levelCollectibleSpeed * globalMovementAdjust;
  globalBulletDelay = archy.bulletCooldown;
}

//function to be called when the game needs to be stopped (things to be stopped must be added in here)
function gameStop() {
  currentlyRunning = false;
  clearInterval(mainEnemyLoop);
  clearInterval(mainCollectibleLoop);
  clearInterval(mainEnemyShootingLoop);
}

//function to resume game
function gameStart() {
  currentlyRunning = true
  loop();
  mainOut(0);
  mainEnemyLoop = setInterval(generateEnemy, levelArray[globalLevelNumber].levelEnemyDelay);
  mainEnemyShootingLoop = setInterval(enemyShooting, 1000);
  mainCollectibleLoop = setInterval(generateCollectible, levelArray[globalLevelNumber].levelCollectibleDelay);
}

//function that returns the FPS
let getFPS = () =>
  new Promise(resolve =>
    requestAnimationFrame(t1 =>
      requestAnimationFrame(t2 => resolve(1000 / (t2 - t1)))
    )
  )
getFPS().then(fps => currentFramerate = fps);

function checkWindowSize() {
  let workingWindow = document.getElementById('gameContainer');
  if (contentWindowH < 700) {
    workingWindow.style.transform = "scale(0.4)";
  } else if (contentWindowH < 800) {
    workingWindow.style.transform = "scale(0.5)";
  } else if (contentWindowH < 900) {
    workingWindow.style.transform = "scale(0.6)";
  } else if (contentWindowH < 1000) {
    workingWindow.style.transform = "scale(0.7)";
  } else if (contentWindowH < 1100) {
    workingWindow.style.transform = "scale(0.8)";
  } else if (contentWindowH < 1200 ) {
    workingWindow.style.transform = "scale(0.9)";
  } else {
    workingWindow.style.transform = "scale(1)";
  }
}

//exec audio event, just add if's for extra audio files
function playAudio(audioID) {
  var audio0 = new Audio('audio/bullet.mp3');
  var audio1 = new Audio('audio/shieldCollect.mp3');
  var audio2 = new Audio('audio/shotincCollect.mp3');
  var audio3 = new Audio('audio/pickup.mp3');
  var audio4 = new Audio('audio/speedIncrease.mp3');
  if (audioID == 'shoot') {
    audio0.play();
  } else if (audioID == 'shield') {
    audio1.play();
  } else if (audioID == 'fire') {
    audio2.play();
  } else if (audioID == 'explode') {
    audio3.play();
  } else if (audioID == 'speed') {
    audio4.play();
  } else if (audioID == 'soundtrack') {
    audioSoundtrack = new Audio('audio/mainSoundtrack.mp3');
    audioSoundtrack.play();
  } 
}

//initial shoot function
function shootInit() {
  if (currentlyShooting == false && currentlyRunning == true) {
    archy.shoot(); //initially call function once to allow for one tapping
    //this also allows the user to continously tap to shoot faster, although not escalate in the function breaking (might be adjusted later)
  }
  if (currentlyShooting == false && currentlyRunning == true) {
    currentlyShooting = true;
    mainBulletLoop = setInterval( function() { archy.shoot(); }, globalBulletDelay); //to avoid bullet spam call a fixed interval once
  }
}

//function for randomization and initiation of enemy shooting
function enemyShooting() {
  for (let i = 0; i < enemyArray.length; i++) {
    let rndm = Number(Math.floor(Math.random()*100));
    if (rndm < 50) {
      enemyArray[i].shoot();
    }
  }
}

//generate bullet
function generateBullet(X, Y, dmg, isUp) {
  if (currentlyRunning == true) {
    let bl1 = new Bullet(X, Y, dmg, isUp);
    bulletArray.push(bl1);
    if (isUp == true) {
      playAudio('shoot');
    }
  }
}

//move spaceship
function spaceshipMovement() {
  if (collision(archy.posX, archy.posY, bulletArray, 60, 20, true, true) == true) {
    archy.hp -= levelArray[globalLevelNumber].levelEnemyDamage;
    mainOut(0);
    if (Number(archy.hp) <= 0) {
      scoreOutput.innerHTML = "Game<br>Over!";
      gameStop();
    }
  } else {
    archy.move();
  }
}

//bullet movement for bullet array
function bulletMovement() {
  for (let i = 0; i < bulletArray.length; i++) {
    if ((bulletArray[i].posY) < 0) {
      bulletArray.splice(i, 1);
    } else if ((bulletArray[i].posY) > canvasHeight && bulletArray[i].isUp == false) {
      bulletArray.splice(i, 1);
    } else {
      bulletArray[i].move();
    }
  }
}

//bullet movement for collectible array
function collectibleMovement() {
  for (let i = 0; i < collectibleArray.length; i++) {
    if (collision(collectibleArray[i].posX, collectibleArray[i].posY, archy, 50, 40, false, false) == true) {
      if (collectibleArray[i].type == 'shield') {
        archy.hp += 10;
        mainOut(0);
        playAudio('shield');
      } else if (collectibleArray[i].type == 'fire') {
        archy.decreaseCooldown(10);
        playAudio('fire');
      } else if (collectibleArray[i].type == 'speedInc') {
        archy.speedIncrease(0.5);
        playAudio('speed');
      }
      collectibleArray.splice(i, 1);
    } 
    else if ((collectibleArray[i].posY) > canvasHeight) {
      collectibleArray.splice(i, 1);
    } else {
      collectibleArray[i].move();
    }
  }
}

//enemy generation
function generateEnemy() {
  if (bossLock != true) {
    let en1
    if (isBossStage == true) {
      bossLock = true;
      en1 = new Enemy(levelArray[globalLevelNumber].bossHP);
    } else {
      en1 = new Enemy(levelArray[globalLevelNumber].levelEnemyHP);
    }
    enemyArray.push(en1);
  }
}

//collectible generation
function generateCollectible() {
  let colType;
  if (typeToSpawn == 'shield') {
    colType = new Collectible('shield');
    typeToSpawn = 'speedInc';
  } else if (typeToSpawn == 'speedInc') {
    colType = new Collectible('speedInc');
    typeToSpawn = 'fire';
  } else {
    colType = new Collectible('fire');
    typeToSpawn = 'shield';
  }
  collectibleArray.push(colType);
}

//enemy movement with collision checks
function enemyMovement() {
  for (let i = 0; i < enemyArray.length; i++) {
    if (collision(enemyArray[i].posX, enemyArray[i].posY, bulletArray, 60, 20, true, true) == true) {
      enemyArray[i].hp -= currentBulletDamage;
      if (Number(enemyArray[i].hp) <= 0) {
        playerScore = playerScore + levelArray[globalLevelNumber].levelScoreLevel;
        mainOut(0);
        enemyArray.splice(i, 1);
        playAudio('explode');
      } else {
        return;
      }
    } else {
      if ((enemyArray[i].posX + imageEnemy.width) > cv.width) {
        enemyArray[i].movementX = -globalEnemySpeed;
        enemyArray[i].posY += 80;
      }
      if ((enemyArray[i].posX) < 0) {
        enemyArray[i].movementX = globalEnemySpeed;
        enemyArray[i].posY += 80;
      }
      if ((enemyArray[i].posY)+60 > cv.height) {
        enemyArray.splice(i, 1);
      }
      enemyArray[i].move();
    }
  }
}

//output codes to stat display
function mainOut(event) {
  if (event == 0) {
    scoreOutput.innerHTML = "Level " + (globalLevelNumber+1) + " | Score: " + playerScore + " | To Reach: " + levelArray[globalLevelNumber].levelScoreLimit  + " | HP: " + archy.hp;
  } else if (event == 1) {
    scoreOutput.innerHTML = "Level " + globalLevelNumber + " cleared!";
  } else if (event == 3) {
    scoreOutput.innerHTML = "Game<br>Paused!";
  } else if (event == 4) {
    scoreOutput.innerHTML = "Game<br>Started!";
  } else if (event == 2) {
    scoreOutput.innerHTML = "Game<br>Over!";
  }
}

//check for collisions with other objects
function collision(X, Y, array, hitboxOffset, hitboxOffset2, multiObject, isAgainstBullet) {
  if (multiObject == true && isAgainstBullet == true) {
    for (let i = 0; i < array.length; i++) {
      if ( ( array[i].posX - hitboxOffset2 ) < ( X + hitboxOffset ) && ( array[i].posX + hitboxOffset2 ) > X && array[i].posY < ( Y + hitboxOffset ) && ( array[i].posY + hitboxOffset2 ) > Y) {
        if (array[i].isUp == true && X != archy.posX) {
          currentBulletDamage = array[i].damage;
          array.splice(i, 1);
          return true;
        } else if (array[i].isUp != true && X == archy.posX){
          archy.hp - levelArray[globalLevelNumber].levelEnemyDamage;
          array.splice(i, 1);
          return true;
        }
      }
    }
  } else {
    if ( ( X - hitboxOffset2 ) < ( array.posX + hitboxOffset ) && ( X + hitboxOffset2 ) > array.posX && Y < ( array.posY + hitboxOffset ) && ( Y + hitboxOffset2 ) > array.posY) {
      return true;
    }
  }
}

function levelHandler() {
  if (playerScore < levelArray[globalLevelNumber].levelScoreLimit) {
    //keep enemies moving
    enemyMovement();
  } else {
    levelCleared();
  }
}

function levelCleared() {
  currentlyRunning = false
  clearInterval(mainEnemyLoop);
  clearInterval(mainCollectibleLoop);
  clearInterval(mainEnemyShootingLoop);
  enemyArray = [];
  bulletArray = [];
  globalLevelNumber++;
  playerScore = 0;
  mainOut(1);
  setTimeout(gameStart, 1000);
}

//mr sowa would scream at this bc too many variables but fuck it
function levelGenHandler(stageDef, amountOfLevels) {
  let level;
  //adjustifiers (sensible Defaults: 10, 6, 3000, 500, 3000, 8, imageEnemy, 10, 500, 10, 10, 50)
  let adjenemyHp = 10;
  let adjenemySpeed = 6;
  let adjenemyDelay = 2500;
  let adjbossHP = 500;
  let adjcltDelay = 3000;
  let adjcltSpeed = 8;
  let adjenemyImg = imageEnemy;
  let adjenemyDmg = 10;
  let adjenemyShtFreq = 500;
  let adjarchyDmg = 10;
  let adjscrLevel = 10;
  let adjscrLimit = 50;
  //#
  for (let i=1; i < amountOfLevels+1; i++) {
    if ( i != 0 && (i % 10) == 0 ) {
      adjenemyImg = imageEnemy;
    }
    if ( i != 0 && (i % stageDef) == 0 ) {
      adjenemyHp += 5;
      adjenemySpeed += 0.5;
      adjenemyDelay *= 0.95;
      adjenemyDmg += 2;
      adjenemyShtFreq *= 0.95;
      adjarchyDmg += 2;
      adjscrLevel += 20;
      adjscrLimit += 500;
    }
    level = new Level(adjenemyHp, adjenemySpeed, adjenemyDelay, adjbossHP, adjcltDelay, adjcltSpeed, adjenemyImg, adjenemyDmg, adjenemyShtFreq, adjarchyDmg, adjscrLevel, adjscrLimit);
    levelArray.push(level);
    adjscrLimit += 50;
  }
}

//class for level generation
class Level {
  constructor(enemyHp, enemySpeed, enemyDelay, bossHP, cltDelay, cltSpeed, enemyImg, enemyDmg, enemyShtFreq, archyDmg, scrLevel, scrLimit) {
    this.levelEnemyHP = enemyHp;
    this.levelEnemySpeed = enemySpeed;
    this.levelEnemyDelay = enemyDelay;
    this.levelEnemyImg = enemyImg;
    this.levelEnemyDamage = enemyDmg;
    this.levelEnemyShootFrequency = enemyShtFreq;
    this.levelArchyDamage = archyDmg;
    this.bossHP = bossHP;
    this.levelCollectibleDelay = cltDelay;
    this.levelCollectibleSpeed = cltSpeed;
    this.levelScoreLevel = scrLevel;
    this.levelScoreLimit = scrLimit;
  }
}

//class for bullets
class Bullet {
  constructor(X, Y, damage, isUp) {
    this.posX = X;
    this.posY = Y;
    this.damage = damage;
    this.isUp = isUp;
  }
  move() {
    let img;
    if (this.isUp == true) {
      img = imageBullet;
    } else {
      img = imageEnemyBullet;
    }
    ctx.drawImage(
      img,
      this.posX,
      this.posY,
      20,
      20
    );
    if (this.isUp == true) {
      this.posY -= globalBulletSpeed;
    } else {
      this.posY += globalBulletSpeed;
    }
  }
}

//class for enemies
class Enemy {
  constructor(hp) {
    this.posX = Number(Math.floor(Math.random()*1400));
    this.posY = Number(Math.floor(Math.random()*400));
    this.hp = hp;
    if (Number( ((Math.floor(Math.random()*10)))%2) == 0) {
      this.movementX = -globalEnemySpeed;
    } else {
      this.movementX = globalEnemySpeed;
    }
    this.movementY = globalEnemySpeed;
  }
  move() {
    let img = levelArray[globalLevelNumber].levelEnemyImg;
    ctx.drawImage(
      img,
      this.posX,
      this.posY,
      60,
      60
    );
    this.posX += this.movementX;
  }
  shoot() {
    generateBullet(this.posX, this.posY + 40, levelArray[globalLevelNumber].levelEnemyDamage, false);
  }
}

//class for collectibles
class Collectible {
  constructor(type) {
    this.posX = Math.floor(Math.random()*1500);
    this.posY = 0;
    this.type = type;
  }
  move() {
    if (this.type == 'fire') {
      ctx.drawImage(
        imageFire,
        this.posX,
        this.posY,
        40,
        40
      );
      this.posY += globalCollectibleSpeed;
    } else if (this.type == 'shield') {
      ctx.drawImage(
        imageShield,
        this.posX,
        this.posY,
        40,
        40
      );
      this.posY += globalCollectibleSpeed;
    } else if (this.type == 'speedInc') {
      ctx.drawImage(
        imageSpeed,
        this.posX,
        this.posY,
        40,
        40
      );
      this.posY += globalCollectibleSpeed;
    }
  }
}

//class for spaceship, namely "archy"
class Spaceship {
  constructor() {
    this.posX = (canvasWidth/2) - 30;
    this.posY = canvasHeight - 60;
    this.hp = 100;
    this.bulletCooldown = 300;
    this.speed = 10;
  }
  move() {
    ctx.drawImage(
      image,
      this.posX,
      this.posY,
      60,
      60
    );
    if (moveR == true && (this.posX + image.width + 5) < cv.width) {
      this.posX += globalSpeed;
    }
    if (moveL == true && (this.posX + image.width - 5) > image.width) {
      this.posX -= globalSpeed;
    }
    if (moveU == true && (this.posY + image.height - 5) > cv.height / 1.4) { //dont let spaceship move all the way up
      this.posY -= globalSpeed;
    }
    if (moveD == true && (this.posY + image.height + 5) < cv.height) {
      this.posY += globalSpeed;
    }
  }
  shoot() {
    generateBullet(this.posX + 20, this.posY - 20, levelArray[globalLevelNumber].levelArchyDamage, true); 
  }
  decreaseCooldown(value) {
    if (this.bulletCooldown >= 100 && (this.bulletCooldown-value) >= 100) {
      this.bulletCooldown -= Number(value);
      currentlyShooting = false;
      clearInterval(mainBulletLoop); // clears the interval that was previously called to generate bullets
    } else {
      return true;
    }
  }
  speedIncrease(value) {
    if (this.speed <= 30 && (this.speed+value) <= 30) {
      this.speed += Number(value);
    } else {
      return true;
    }
  }
}

//event listener to switch move variables on keydown
if (currentlyRunning == true) {  //only allow moving when the game actually runs
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
}

//event listener to trigger shooting
if (currentlyRunning == true) {
  if (currentlyShooting == false) {
    document.addEventListener('keydown', function (event) {
      if (event.code == 'Space') {
        shootInit();
      }
    });
  }
  document.addEventListener('keyup', function (event) {
    if (event.code == 'Space') {
      currentlyShooting = false;
      clearInterval(mainBulletLoop); // clears the interval that was previously called to generate bullets
    }
  });
}

//button event listener to stop game
if (currentlyRunning == true) {
  document.addEventListener('keydown', function (event) {
    if (event.code == 'Escape') {
      gameStop();
      document.getElementById("gameScreen").style.display = 'block';
      audioSoundtrack.pause();
    }
  });
}

//listener for exit button
buttonExit.onclick = function() {
  location.href = 'index.html';
}

//listener for resume button
buttonResume.onclick = function() {
  document.getElementById("gameScreen").style.display = 'none';
  gameStart();
  audioSoundtrack.play();
}

//generate new Archy (spaceship)
let archy = new Spaceship();

//gen levels
levelGenHandler(2, 50);

//main loop
loop();

//show stat screen once
scoreOutput.innerHTML = "Level " + (globalLevelNumber+1) + " | Score: " + playerScore + " | To Reach: " + levelArray[globalLevelNumber].levelScoreLimit  + " | HP: " + archy.hp;

//enemy gen
mainEnemyLoop = setInterval(generateEnemy, levelArray[globalLevelNumber].levelEnemyDelay);

//enemy shooting gen
mainEnemyShootingLoop = setInterval(enemyShooting, levelArray[globalLevelNumber].levelEnemyShootFrequency);

//collectible gen
mainCollectibleLoop = setInterval(generateCollectible, levelArray[globalLevelNumber].levelCollectibleDelay);


























































































































































































/*
                                          ....                                                      
                                     ...    .....                                                   
                                   ....'.    ....    ..  ..                                         
                ..               ........      ...  ...... ...                                      
                 .     ................        ....................   ...                           
                 ...  ............   .     ..      .......        .... ....                         
                 ..........  ...     ......... .........     ...   ...   ...                        
                  ........     ................''',,''..........     ...                            
                 ...............',,;;;;::::cc:cc::::::;;;,,''....    ....                           
                .........',;;;:::cccccclllllllcccccc::::::;;;,''..........                          
              ......'',,;;:::cccclllccclllllllllllccccc:::::;;,,'.........                          
              ....'',,,;;::cccccllllllllllllooooollllccccc:::;;,'.........     .                    
             ...'''',,;::ccclllllllllooooooooooooooolllccccc::;;,,'.......                          
             ..'''',,;:cccllooloooooooooooooooooooooollllllcc::::;,'......    ...                   
            ..''',,;;:cclllooooooooollooooooooooooolllllllllcccc::;,'..... ......                   
            ...',,;::cclllooooooollllllllllllllllllllllllllllccccc:;,'.... ......                   
            ...',;;::ccllllllllllllllooooolllllllllllcccccccccccccc::;,'.........                   
            ...',;:::cccccclllllloooooooooooooooooooolcc::;;:::cccc:::;'..........                  
            ..',;;:::::ccccllloooddodddddxdddddddoolcc:::;;;;;;;;:c:::;;'.........                  
            ..',;;::::cclllooodddddddxxxxxxddoll:;,,;;::cccllc:;,,;:::;;,..........                 
             .',,,,;;::ccccclooodddddxxxxdolc:;,,;;::ccccllooollc:;;::;;;'. .........               
             ..'.'',,,,''',,;:cloooodxxddolccccccccccllccc::cloollc:;:::;'........':c,.             
             ....',;;;,,,;;;;;:clloodddddoolllllcccc;;;;,;:;:cllollc:::;;'....'',:cclo:.            
             ...,:cccccccclcccc:::cloddoollllllccloo:'''.,c:;:llllllcc::;,...,:clddoclo;.           
             ..':ccc:;;;;;;;;ccc::::clllcccllllcclool:;;;:c::ccllllllcc:;,'.,:clldddlcoc.           
             ..';cc:,,::'.'.'cdlc:;:ccccc::ccccccccccclllcccccccclllllc::;,,,:cloddxdllc'.          
             ...,::,',cl:,,;:cc::;;:cclccc:::cccccccccclccclclllllllllc::;;,;:cldxdxxol:..          
            ....,::;,;::::cccc:;;,;:ccccccccccclllllllllollllloooooollcc::;,;ldoodddool,.           
            ,:,',;;;;::ccccccc::;,,:cllccccccllloooooooodddooodddoooolcc::;;:oddooolll:..           
            ,c;',;::::cccccclcc:;,;clllcc:ccccloooooddooddddddddddooolc:::;;cdxocllcll;.            
            '::,,;:::cccccllccc:;;coooollcc:::codddddddddddddddddoooolcc::;;cdxddolll:'..           
            .,c:;;::cclllllllll:;coddxxddoooolccoxxxxxxdxddddddddoooolcc:;,;lddooool:'.. ..         
             .:l:;:cclllllllooc::lddxxxdol::lodlldxxxxxxxxdddddddooolllc:;,;oddlclc,......          
              'cc;;:clllllloddllllllooolcc:;:looodxxxxxxxxdddddddoooollc:;,;ccloo;..................
               ':;;:cclllooddddllolccloooddoooooodddddxxddddddddooooollc:;,;:;;:cc::::::::;;;;::::;;
               .,:;;:cclloodddollccccloooooollllloooooodddddddddooollllc:;,,;,,,;::;;,,,,,,,,;;;;;;;
                .;;,;:cclloooolccc:::lllllllllllllllllloooooddooooolllllc:,,,;:::::;''''''',,;;;;::c
                ..',;::cclllcc::::::cllllllooooloooooooollooooooooolllllc:;,;cllcccc:::::::::::::ccc
                ...';:::ccc::::::ccccllllooodooddddddddooooooooooooollllc:,,:llclllc:ccccccccc:cclc:
                .,,',;:::::;::cccccccc:cllcccclllllloooddooooooooooooolcc:,,:lllllccclllclccc::cllc:
               .,:c;,;;;::;;:clc:::::;;;:;:::::::;;;:clodooooooooooooolcc:,:clllolcloolccccccccllccc
              .;:ccc;,,;;;;:clc;,,;;;;::::ccccc:::::clooddoooooooooolllc:;,:cloolccloollllcccclooccc
             .;::cllc;,;;;;:cc:;;;::::ccccllllllooooooooddoooooooollllc:;,,:cooollloolllllcccloollll
            .;;:cclllc:;;;;:cc::ccccccc::::cccccloooooodddoooollllllccc:;;lllooollooolllllcclloollll
           .;::ccclllll:;,;;:cccclllc:;;;;,,;::loddddddddooollllllccccc;;cooooooooodollllccclooololl
          .,::cclllllllc:;,;;:ccclllc:;,,;;;;::lodddddddooollllccclllcc;;looooooooddoloollcloddollll
         .';::ccllllllllcc:;,;:ccllllc;,;cc::::loooddddooollc::cllollc:;;looodooodddolooollldxdlllcc
         .;::ccllllllollccc:;;;:ccccc;,,:ccc::clllloollllccc::loooollc:;:lloddoodxxdolooolooddolllll
        .,;::cccllllllllccccc:,;:::::;;;::cc:::::llllc:::;;:lodddoollc:;;clodddddxxdoodolllloollloll
        .;:::cclllloollllllllc;'',,,;;;;;;;:;;:;;:::::;;::coddddooollc:;;:odddddxxxdoooccccloolllooo
       .';:::ccllllooollllllllc'.'.',,,,,,,,,,,,,,,,;:clooddddddooolcc:;;:odddddxxxdolc:::cloolllooo
       .;::cccclllloooooooolllc,';;,',,,..',;;;;clloddddddddddddoolllcc:;:lddxxxkkxdlc:;;:clllcllooo
       .;::ccclllloooooooooolol,';:;,:ccccloddddxxxxxdxxdddddddooollllc:;;lddddxkkxooc:;;::clccclllo
      .'::cclllllooooooooooolol;';:;;:loddxxxxxxxxxxxxxxxxxddddooollllc:;;:odddxkkxoddoc;::cc::clooo
      .,::ccccccccclllllllcccc:,';::;;coddxxxxxxxxxxxxxxxxxxxdddooolllcc:;;lxdodxkxddxdl:::c:;:coooo
.......'''',,,,,,,;::ccccc:ccclc;;::;;:lodxxxxxxxxxxxxxxxxxxxdddooollllc:cdkOkxdoollodolc:;;;;cooooo
lllc:::cllllllllllllllooollodxxo:;c::::loodxxxxxxxxxxxxxxxxxxxdddooolllldkOO00Okoloodddoollc::clccll
oooolllclodddddddxxddoollollloooc::c::cloddxxxxxxxxxxxxxxxxxxxddddooooxkO00OOOOOxooodxxxxoooollccccc
dddxkkkxddooollloddxkkkxxxooooodl::c::cloddxxxxxxxxxxxxxxxxxxxxdddddxO0000000OOOkxdooooolclloodxxxxx
xkkOOOOO00Okxxdolllodddxkxlcclodc;:cccclodxxxxxxxxxxxxxxxkxxxxxxxxkO00000000OOkkxxxxxdollllodxkkkkkx
ddxkO000OOOOOOOOkxdoollodxxocodl;,:ccccloddxxxxxxxxxxxxxxxkxxxxkO0000000000Okxxdocldkkxxxxxdddxxkkxx
looddxxkkkOOOOOOOOOkxoodkkxdodo:;;:clclloddddxxxxxxxxxxxxxxxkOO0000000000Okkxxkkxocldxxxxkxxdooooddd
xdoolllooddxkO00Okxdoodddxdoddc;:;:clllooddddddxxddxxxxxxkOO0000000000Okxddxkkkkkxdoloolloddddddolll
00Okxdooollodxxkxollllccllldxl;:c::clooodddddddddddddxxkO000000000OOkkxollloodddddddddxdoodxxdddoddd
000OOOOOOkdooollooddxxdllcoxo::cc::codddddddddddoddxkOO000000OOOOOkxxOOOxdooollcclooooddolooxxkO00OO
0OOOOOO0000Okxddxxkkkxxdooxdc::cc::codxxddddooddxkOO000000OOOOOOOOOO000OOOOkkkxxdoollccldxkO000000Ok
xxxxkO0000OOOkkkxxkxxxdooddl:::::::cdxxxddoddxOO00000000OOOOOOOxdxO0000OOOOOOOOOOOkkxdddkOO000000Oxo
olloddxkOOOkkkxdddddolclddoc:::::;;coddxxxkOO000000000OOOkOOOxooodxxxxxxkkkOOOOOOOOOOOkxkkkOOkkkxddd
kxdooolodddddolllllloccddlc::::cclodxkOOOOOO00000OOOOOkkxxxxkkdooooolllooodddxxkkOOkOOxooooodddoodkO
OO0OxdooooooooooddxdddxxddddxxkkOOOOOOOOOOOO00OOOOOOkxddddxO00000Okxdddddooollloddddxdddoodddddddxkk
OO0OOOkkkkkkkkkxkkxxxxkOOOOOOO0OOOOOOOOOOOOOO0OO000000OOkkO00000000000000OkxolcclllllodkOOO00000kkkx
MMMWWWMMMWWWMMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMMMMMMMMMMM
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMMMMMMMMMMM
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMMMMMMMMMM
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMMMMMM
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMMMMMM
WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWNWWWWNNNNNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMMMM
WWWWWWWWWWWWWWWWWWWWWNNNNNNNWWWWNNNNNNNNNNXXXXXXXKKKKKKKXXNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMMM
WWWWWWWWWWWWWWWWWWWNNNNNNNNNNNNNNXK0OO00KKKK00OkkkkxxxxkkOKXXNNNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMMM
WWWWWWWWWWWWNNNNNNNNNNNNNNNNXXXK0kxddxxxkkOOkkkkkxddodxkkkkO00KKXNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMM
WWWWWWWWNNNNNNNNNNNNNNNNNX0OkkxdlcclodddxxxxdxkkdoooodkkxddxkOOOOKNWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMWWM
WNNNNNNNNNNNNNNNNNNNNNNXKkooolc:;::cllloolccloollodooooooodxxxdxxk0KKKXNNWWWWWWWWWWWWWWWWWWWWWWMMWMM
WNNNNNNNNNNNNNNNNNNNX0OOxdolc:;,,,;::c::::::ccccccclllllodxddddddddxkOO0KNNWWWWWWWWWWWWWWWWWWWWWWWWM
NNNNNNNNNNNNNNNNNNNKOxxolllolc;'''',,;;;;;,;cccccloooooooddddxxddddddxkkO0XNWWWWWWWWWWWWWWWWWWWWWWWW
NNNNNNNNNNNNNNNNNXKkol:;;;;;;;,'..'',,;;;,,;;;;:looolcllooooddddddoollloodk0XNNWWWWWWWWWWWWWWWWWWWWW
NNNNNNNNNNNNNNNNKOdc;,,,,,,''''''''',,;::;:;;,,;:::::cloddddxdoodoooooooodddx0XNNWWWWWWWWWWWWWWWWWWW
NNNNNNNNNNNNNNNXOdl:,'..''''''''''''''':c:::;;,,,;;;cloodxdxxolooooolooddxkdoxOXNWWWWWWWWWWWWWWWWWWW
NNNNNNNNNNNNNNNKOxl:'.................',:c:::;::ccccoddddddddolloolllooooddddxkOXNWWWWWWWWWWWWWWWWWW
NNNNNNNNNNNNNNXKOkd:,'............'''',,;:ccccloddooloodddxxkxdolllllllllodddxxk0XNWWWWWWWWWWWWWWWWW
NNNNNNNNNNNNNNXKOxo:,'........',;:cccllcccllooddxxxxxxkOO0KKK0kxdolcccc:::cclodkOKNWWWWWWWWWWWWWWWWW
NNNNNNNNNNNNNNX0xl:;,'......',cloodxkkkkxxxxkO00KKKKKXXXNNNNXXK0kdoc::;;;;;:cloxk0NWWNWWNWWWWWWWWWWW
NNNNNNNNNNNNNNX0kl,.........':lodxxkkOO00000KKXXXNNNNNNNWWWWWNNXKOxoc:;;,,;:clodxOXNNNNNWWWWWWWWWWWW
NNNNNNNNNNNNNNXXOl'.........,:lodxxkkO000KKKXXXXNNNNNNNWWWWWWWNNXKOdlc:;,;;:ccloox0XNWNNWWWWWWWWWWWW
NNNNXXNNNNNNNNNXOoc:;'......,:lodxxkkO0KKKKKXXXXXNNNNNNNNNNNNNNNNX0xol:;;:ccccc:cox0NNNNNWWWWWWWWWWW
NNNNNNNNNNNNNNNXXKOkdc,.....,:lodxxkO00KKKKKKXXXXXNNNNNNNNNNNNNNNX0kolc::::lcc:;;cd0NNNNNNWWWWWWWWWW
NNNNNNNNNNNNNNNNXXXXKkl,...';:lodxxkkO0KKKKKKKKXXXXNNNNNNNNNNNNNNX0kdl::;;;:::;;:lONNNNWNWWWWWWWWWWW
NNNNNNNNNNNNNNNNXXNNXKxc'..';cloddddxkOO00K0000KKKXXXXXNNNNNNNNNNX0kxlc:;,;:cc:clxKNNNNNWWWWWWWWWWWW
NNNNNNNNNNNNXXXXXNNNXKko;..,::;;:::cclodxkOOkkxxxdddxxkkOKXNNNNNNXKOxoc:;;:clllodOXNNNNNNWWWWWWWWWWW
NNNNNNNNNNNNXXXNNNNNXX0xo:',::,,,'',,,,;coxOxoc:;,,,,;:codk0XXNNNNX0koc;;;:lllok0KNNNNNNNNWWWWWWWWWW
NNNNNNNNNNNXXXXNNNNNNXK0Oxc;c:;,,,,',;'',cx00xl:,,,,,,:llcoxOKXNNNX0kdl:::ccllokKNNNNNNWWWWWWWWWWWWW
NNNNNNNNNNNNNNNNNNNNNNXXK0xlcc:::cclloc:;lOXX0xdolclloxkOOkO0KXNNNX0kdollloooox0XNNNNWWWNWWWWNWWWWWW
NNNNNNNNNNNNNNNNNNNNXXXXXXKxlllllllllllcco0NNXKK0kxdddxO0KKXXXXNNXX0xddlclolldk0XNNNNWWWWWWWWWWWWWWW
NNNNNNNNNNNNNXXNNNXXXXXXXXXklodddddoooolld0NNNNNNXXK0000KKXNNNNNNXX0OOOdcldllkKNNNNNNNWWWWWWWWWWWWWW
NNNNNNNNNNNNNXXNNXXXXXXXXXXkllodxxxxdollokKNNNNNNNXNNXXXXXNNNNNXXXXXXK0kdkkoo0NWWNNNNWWWWWNNWWWWWWWW
NNNNNNNNNNNNNXXNXXXXXXXXXXXOoloodxxdollox0XNWNNNXK00KKXXXXNNNNNNNNXXXK00KKkxOXNNNNNWWWWWWWWWNNNNWWWW
NNNNNNNNNNNNNNNXXXXXXXXXXXX0dlloooolc;;cdOKXXKOOO0OOkkO00KXXNNXXNNNNXXXXKOk0NNNNNWWWWWWWWWWWWWWWWWWW
NNNNNNNNNNNNNXXXXXXXXXXXXXXXklccclc::,..,:lollldk000kxdxxk0KXXXXNNNNXXX0xlo0NNNNNNNWNNWWWWNNWWWWWNNW
NNNNNNNNNXXXXXXXXXXXXXXXXXXKkl:;;;,,''.....',;:cloddolclldxO0KXXNNX0xdolclxKNNNNNNNNNNNWWWWWWWWWNNNN
NNNNNNNNXXXXXXXXXXXXXXXXXXXKxc,,'.......'''',,,,;ccclllllodkO0KXXXKd;,:cox0XNNNNNNNNNNNWWNNNNNNNNNNN
NNNNNNNXXXXXXXXXXXXXXXXXXXXX0o;'.......'',,,,,,,,;::cccllccldOKXXXOc,,;cox0XNNNNNNNNNNNNNNNNNNNNNNNN
NNNNNNXXXXXXXXXXXXXXXXXXXXXXX0o;''...',,;:clcc:::cccclccccldk0KKXKd:codkKXXNNNNNNNNNNNNNNNNNNNNNNNNN
NXXNNNXXXXXXXXXXXXXXXXXXXXXXXXOo:;,;::coodxxxxxxxxxxxxxxxxkO0KKKK0kk0XXXNNNNNNNNNNNNNNNNNNNNNNNNNNNN
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX0dc:cloddxkkOO0000OOOO0OOOOO0KKKKK0KXXNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX0xlccloddxxkOOOO000000OOOOO0KKKK0kOXNXXXNXNNNNNNNNNNNNNNNNNNNNNNNNNN
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXKkxdolllloodxxkOOOOOO0OOOOO0KKXXK00NNNNNXXNXNNNNNNNNNNNNNNNNNNNNNNNNN
XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXOc,;ldxxdollodxkkkOOOO0OOO00KXXXXKKNWNNXXXXXNNNNNNNNNXXXNNNNNNNNNNNNNN
XNXXXXXXXXXXXXXXXXXXXXXXXXXXKk:.','cdxkxdlccloddxkOO00000KKXXXXXNWWXKXXXXXXXXXNNNNNNNNNNNNNNNNNNNNNN
XNNNXXNXXXXXXXXXXXXXXXXXXXXOl'..,:,';ldxxxdolloooddxO0KXXXXXXXNWWWNKkx0KXXXXXXXXXNNNNNNNNNNNNNNNNNNN
XNNXXXXXXXXXXXXXXXXXXXXXX0d;....,loc,,:odxk00OkxxxkkO0KKXXXXNWWWWWNKxloxOKXNXXXXXXXXNNNNNNNNNNNNNNNN
XXXXXXXXXXXXXXXXXXXXXXKko;.......,lddc,,cdk0NNNKOOOO0KXXXXXNWWWWWWNX0c;coxk0KXXXNNXNNNNNNNNNNNNNNNNN
XXXXXXXXXXXXXXXXXXXXKxc'..........'cdxdc:oOKNWWWNXXK00KXXXNWWWWWWWWWXd;;:lodxk0KKXXXNNNNNNNNNNNNNNNN
XXXXXXXXXXXXXXXKOxoc;'...........',,;lxkkKNNNNWWWWWWNXKKXNWWWWWWWWWWN0xc;;cooodddddxkO0KXNNNNNNNNNNN
KXXXXXXXXXXKOdc;'................,oo;,:d0NWWWWWWWWWWWWWWWWWWWWWWWWWWWWNKOkdllooodoolcccloxk00KXNNNNN
KXXXXXXK0ko:'..................'''l0Ol;;dXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKoclooddddolc:::cccloxk0KX
0KK0Oxl:,......................''';kK0OkOXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKo:coooddoooolccc::::cllod
lc;,..........................'',''l0NNWNNNNNNNNWWWWWWWWWWWNNNNWWWWWWWWWWW0c;:loooooooooolccc::ccccl
..............................'',;',xKXNWWWWWWWWWWWWWWWWWNNXOOKK0KXWWWWWWWKl,;cloodooooooollcccccccc
.............................'',;:,'cO00XWWWWWWWWWWWWN0kdxKKkxxxk0XNWWWWWWNk;,:looooooooooollccccccc
.............................',;;;;',xKKO0NWWWWWNNXXK00OkkO0OO0XNNWWWWWWWWWKo,;cloddddooooooolcccllc
............................',,'';;,'lKXKOOKNNXXXXNXXXNNXKOKXNWWWWWWWWWWWWWNOc,;lodddddoooolccccccc:
.............   ............''..',:;.;kNNX0O0XNNWWWWWNXKKXNXXXNWWWWWWWWWWWWWXd;,clodddddoddolloooc:;
..............       ...........';:;''oKNNNXKXNWWWWWWWNXXXXXXXNWWWWWWWWWWWWWNOc,;codddddddddddddolc;
.................    ...........';::,'cONWWWNXNWWWWWWWNNNNXXNNWWWWWWWWWWWWWWWXo;;:loddddddddxddddolc
......    .......    ...........';cc;,;xXWWWWWNNNWWWWWNNNNNXXNWWWWWWWWWWWWWWWNk:,;codddddddddddxdool
...       .......    ...........';cc:,,l0WWWWWWNNNNWWWNNXXXNNNWWNWWWWWWWWWWWWWKl,,:loddddddddddddooo
...        .....    ...........',;:cc;,:xNWWWWWWNNNNNWNXKKKKXNWNNNNWWWWWWWWWWWXd;,;coddddddddddddooo
...         ...       .........',;:cc:;,l0NWWWWWWNNNNNXXK0000XXNNNNWWWWWWWWWWWWOc,;:lodddddddddddodd
...                    ........',;;:cc;,;dXWWWWWWWWWNXXXKKKKKKXNNWWWWWWWWWWWWWWNx;,:cooddddddddddodk
..                       ......',,;:cc;,;cONWWWWWWWWWNNNXXNNXXNNWWWWWWWWWWWWWWWW0l,;cloodddddddddodk
..                       ......'',;:cc:;,;dKNWNWWWWWWWWNNXXNWWWNWWWWWWWWWWWWWWWWXd;,:looodddddddolok
..                      .......'',,;:::;;,cONWNWWWWWWWWWWNNWWWNNNWWWWWWWWWWWWWWWNOc;:cloooddoddoolok
.                     .........''',;:c::;;:dXWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWKo;;ccloooooooolldk
                        .......''',,:::;;;;ckNWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWXd;;:cclloooooolldx
                       .......'''',,;:;;;,;:o0WWWWWWWWWWWWWWWWWWWWWNNWWWWWWWWWWWWNO:,;:clloooooolldk
                        .....'''',,,;:;;,,,;ckXWWWNNNWWWWWWNNWWWWWWWWNNNWWWWWWWWWWKl,;:cllloloolcldx
                        MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWNWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMKxdxxk0XNMMMMMMMMMNOdllox0NMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMKl;;;;;:ldk0NMMMXkl;;;:;;;lOXNWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMKo;;::::;;:ldOxc;;:::::;;;;::ldxOO000KXWMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMNx:;:::::::;,',;,;;;::;;:;;;,,,,;;;;;:ld0NMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMWKxl:::::;:;;,',;,:clc:::;:::::;::;;;,',dNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMWNOdc::::::;,,,,codol:;;;;::;;::;::;'.,OMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMWKxc,,,;::::;;;:cc:;''',;;;;;::;::;'.'kMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMNKkdddl;''',:::::;;,'',;;,,''';;;,,,'..;OMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMWKko;,oNNOc':xO0Okdlc:;;;;,,'',;,''.',,..oNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMW0Ox:..lNMXxkKd,:0WWNOl::::;;;;;;,,',,'..cXMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMKoxkc;c0MW0OWO:'.:XMNx::c::::::::::;;;;,,cxOKNMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMK:';coxkOxclXXd:.'OMKl,:cccccccc::::::;,''',:ldOXWMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMM0:'.'',,,'',cxkxodOkl,,::;;:ccc:;;;:::::,'....',:dKWMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMk:;::;;'.,;::;;:::,''',;,,;:c:;,,;;;;;:cc:;'.....':0MMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMNx:;;::;:ccc:cc:::;;;;;;:::;;,,;;'.,;;:cccc:,.',;;;ok0NNWWMMMMMMMMMMMMMMMMMMM
MWNNWMMMMWXXXXXXNNX0KWMMWKo;,,,;;;;:::::::::::;;;;;,,,''.',;;:ccccc;';:::::::lllodxkKNMMMMMMMMMMMMMM
KooxkOOOOkdoooooodxokWMMMMXd:,;loollc;'',,,,,,,,,''',;;'',;;;:cccc:''::cccc::::::::;:o0WMMMMMMMMMMMM
KxkOOOOOkxdoooooooolokk0XNKK0xooodxkko;''..'...',;::cc:;;;;:cccc:;',:cccc:;;::::::::::cxkONMMMMMMMMM
MMMMMMMMWKkkko:;:;;:;,,,;:'cKX0o;,;;:cc:;'...'',;:;;;;;;;::ccc:;,';ccc::,,;::::::ccccccc;;kWMMMMMMMM
MMMMMMMMMMMMMXl.',,;;;;;'''cxkxl,,;;;;;,,,,;;;;;;;;;;::::::;;,,,;:cc:;,,',:::::ccccc::cc:;xWMMMMMMMM
MMMMMMMMMMMMMWd',;;,',:;,,:xKK0Ol'';:c::;;;;;;;;;;;;;;;;;;;;;;:cc::;,,,,,;:::cccllcc::cc:ckWMMMMMMMM
MMMMMMMMMMMMMMKc';;,;::;;;ckKKKKk:'',;::::cccc:::::::::::::ccccllooc;,;;,;:cclloddolcc::ccxXMMMMMMMM
MMMMMMMMMMMMMMWOllllccloc,:dkOOOxc;;,'',;:ccccccc:cc:ccc:::cloxkkdol;,,;;;:ccc:lolc:::;;;:cxNMMMMMMM
MMMMMMMMMMMMMMMMWWWWNXNWKxx0000Oxllodol,',:loolc::::cccccllodxxxoc;''';;;:cc:;;::::::ccccc::kWMWWWMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWNWMMMWk;,;lxdollllloddddddddddoc,',:loc::cc:::,;;;;,;ccll:;cdxdxk0N
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNd;,,;;:oddodxxxdddddddkkdllooooc::c:;;,',,,;:,,:c;:cc:;:cooK
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMKl;,;:coddoddxxddxxxxdxxdoollllc:cc:;''''.':c::coo:cl:c:;cxN
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWOooc;:ccccloooodxkkxddlc:;;;,,';ccc;;;;,;oKXx:;co::clO0xONM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWXd,''',,',:looodkkdddc,''''',;;cc:locokKWW0o::cc::l0WMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNOl:''',,,,,,;cloodxxoooc,,,,',;;,:cckNNWMMMWkoodkOOOXWMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWx,.',:::c::cc:;:cc:ccc:::;;;:;''''cdkNMMMMMMMWWWWMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWk;',;:::::::::;,,;,'''',;:::::;,'.'xWWMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM0:.,::::;::;;c:,,:;'''.',:::::::;,.,kWMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWk,'',,,;;::;,,',xXKo;'.';::;;;;::,,dNMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMKc.''''..,;;;'.'dWMMNKd;,;::;;;:::;:OMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMWNXXKx:'....''''''..,kMMMMWx;;;:::;;;::;;xNMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMNkc::;;;;;;;;,'..,lxONMMMM0c,;;;;,,,,,;;;:dXMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMWOoodxdl,',,;;;;,,''..,oKWMMMMMWx;,,,,'''''''',,,dNMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMNd'''''''''''''.....'::;dKNMMMMM0l'''''''..''''''dNMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMXxc;,,,',,','';;'',lkkdxO0000000xc;'........',;ckXNNNNNNWWWWMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMNXK00000000KXNKKXNNXXXXXXXXXXXNNX0OkxdddxO0KXXNNNNNNNNNNWWWMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
*/