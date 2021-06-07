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
let contentWindowW;

//images
let image = document.getElementById('spaceship');
let imageBullet = document.getElementById('bullet1');
let imageEnemy = document.getElementById('enemy');
let imageShield = document.getElementById('shield');
let imageCoin = document.getElementById('coin');

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
let DogeCoins = 0;
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
  contentWindowW = Number(window.innerWidth);
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
  globalSpeed = 10 * globalMovementAdjust;
  globalEnemySpeed = levelArray[globalLevelNumber].levelEnemySpeed * globalMovementAdjust;
  globalBulletSpeed = 18 * globalMovementAdjust;
  globalCollectibleSpeed = levelArray[globalLevelNumber].levelCollectibleSpeed * globalMovementAdjust;
  globalBulletDelay = 300;
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
  if (contentWindowH < 1200) {
    if (contentWindowH < 1100) {
      if (contentWindowH < 1000) {
        workingWindow.style.transform = "scale(0.7)";
        return;
      } else {
        workingWindow.style.transform = "scale(0.8)";
        return;
      }
    } else {
      workingWindow.style.transform = "scale(0.9)";
      return;
    }
  } else {
    workingWindow.style.transform = "scale(1)";
    return;
  }
}

//exec audio event, just add if's for extra audio files
function playAudio(audioID) {
  if (audioID == 'shoot') {
    var audio0 = new Audio('audio/bullet.mp3');
    audio0.play();
  } else if (audioID == 'lvlup') {
    var audio1 = new Audio('audio/lvlup.mp3');
    audio1.play();
  } else if (audioID == 'pickup') {
    var audio2 = new Audio('audio/pickup.mp3');
    audio2.play();
  }
}

//initial shoot function
function shootInit() {
  if (currentlyShooting == false && currentlyRunning == true) {
    generateBullet(archy.posX + 20, archy.posY, levelArray[globalLevelNumber].levelArchyDamage, true); //initially call function once to allow for one tapping
    //this also allows the user to continously tap to shoot faster, although not escalate in the function breaking (might be adjusted later)
  }
  if (currentlyShooting == false && currentlyRunning == true) {
    currentlyShooting = true;
    mainBulletLoop = setInterval( function() { generateBullet(archy.posX + 20, archy.posY, levelArray[globalLevelNumber].levelArchyDamage, true); }, globalBulletDelay); //to avoid bullet spam call a fixed interval once
  }
}

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
        playAudio('lvlup');
      } else if (collectibleArray[i].type == 'coin') {
        DogeCoins = DogeCoins + 10;
        playAudio('pickup');
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
    typeToSpawn = 'coin';
  } else {
    colType = new Collectible('coin');
    typeToSpawn = 'shield';
  }
  collectibleArray.push(colType);
}

//enemy movement with collision checks
function enemyMovement() {
  for (let i = 0; i < enemyArray.length; i++) {
    if (collision(enemyArray[i].posX, enemyArray[i].posY, bulletArray, 60, 20, true, true) == true) {
      enemyArray[i].hp -= currentBulletDamage;
      if (Number(enemyArray[i].hp) == 0) {
        playerScore = playerScore + levelArray[globalLevelNumber].levelScoreLevel;
        mainOut(0);
        enemyArray.splice(i, 1);
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
      enemyArray[i].move();
    }
  }
}

function mainOut(event) {
  if (event == 0) {
    scoreOutput.innerHTML = "Score: " + playerScore + "<br>To Reach: " + levelArray[globalLevelNumber].levelScoreLimit  + "<br>HP: " + archy.hp;
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
  if (globalLevelNumber != 9) {
    bossLock = false;
    isBossStage = false;
    if (playerScore != levelArray[globalLevelNumber].levelScoreLimit) {
      //keep enemies moving
      enemyMovement();
    } else {
      levelCleared();
    }
  } else {
    isBossStage = true;
    if (enemyArray[0].hp != 0) {
      //keep enemies moving
      enemyMovement();
    } else {
      levelCleared();
    }
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
      img = imageBullet;
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
    this.posX = 80;
    this.posY = Number(Math.floor(Math.random()*600));
    this.hp = hp;
    this.movementX = globalEnemySpeed;
    this.movementY = globalEnemySpeed;
  }
  move() {
    ctx.drawImage(
      levelArray[globalLevelNumber].levelEnemyImg,
      this.posX,
      this.posY,
      60,
      60
    );
    this.posX += this.movementX;
  }
  shoot() {
    generateBullet(this.posX, this.posY, levelArray[globalLevelNumber].levelEnemyDamage, false);
  }
}

//class for collectibles
class Collectible {
  constructor(type) {
    this.posX = Math.floor(Math.random()*1500);
    this.posY = 10;
    this.type = type;
  }
  move() {
    if (this.type == 'coin') {
      ctx.drawImage(
        imageCoin,
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
    }
  }
}

//class for spaceship, namely "archy"
class Spaceship {
  constructor() {
    this.posX = (canvasWidth/2) - 30;
    this.posY = canvasHeight - 60;
    this.hp = 100;
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
}

//generate new Archy (spaceship)
let archy = new Spaceship();

let level1 = new Level(10, 6, 3000, 500, 3000, 8, imageEnemy, 10, 500, 10, 10, 50);
levelArray.push(level1);
let level2 = new Level(10, 8, 3000, 500, 3000, 8, imageEnemy, 10, 400, 10, 10, 100);
levelArray.push(level2);

//main loop
loop();

//show stat screen once
scoreOutput.innerHTML = "Score: " + playerScore + "<br>To Reach: " + levelArray[globalLevelNumber].levelScoreLimit  + "<br>HP: " + archy.hp;

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
*/