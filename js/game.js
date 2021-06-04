/*
Last Author: K1llf0rce
Date: 01.06.2021
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

//other variables
let currentFramerate;
let mainBulletLoop;
let mainEnemyLoop;
let mainCollectibleLoop;
let typeToSpawn = 'shield';

//counter variables
let DogeCoins = 0;
let currentBulletDamage = 0;
let playerScore = 0;
let globalScoreLevel = 10; //amount of points to be gained from enemies
let globalLevelNumber = 0;

//global speed adjustment
let globalSpeed; //spaceship speed (in px per refresh)
let globalEnemySpeed; //enemy speed (in px per refresh)
let globalBulletSpeed; //bullet speed (in px per refresh)
let globalBulletDelay; //delay between each bullet (in ms)
let globalEnemyDelay; //delay between enemy generation (in ms)
let globalMovementAdjust; //movement speed adjust based on measured FPS
let globalCollectibleSpeed; //collectible speed (in pc per refresh)
let globalCollectibleDelay; //delay between collectible generation (in ms)

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
  archy.move();

  //level/enemy handler
  levelHandler()

  //keep bullets moving
  bulletMovement();

  //keep collectibles moving
  collectibleMovement();

  //get FPS and adjust multiplier
  getFPS().then(fps => currentFramerate = fps);
  adjustForFramerate();

  scoreOutput.innerHTML = "Scr: " + playerScore;

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
  globalEnemyDelay = levelArray[globalLevelNumber].levelEnemyDelay;
  globalCollectibleDelay = levelArray[globalLevelNumber].levelCollectibleDelay;
}

//function to be called when the game needs to be stopped (things to be stopped must be added in here)
function gameStop() {
  currentlyRunning = false;
  clearInterval(mainEnemyLoop);
  clearInterval(mainCollectibleLoop);
}

//function to resume game
function gameStart() {
  currentlyRunning = true
  loop();
  mainEnemyLoop = setInterval(generateEnemy, globalEnemyDelay);
  mainCollectibleLoop = setInterval(generateCollectible, globalEnemyDelay);
}

//function that returns the FPS
let getFPS = () =>
  new Promise(resolve =>
    requestAnimationFrame(t1 =>
      requestAnimationFrame(t2 => resolve(1000 / (t2 - t1)))
    )
  )
getFPS().then(fps => currentFramerate = fps);

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
    generateBullet(); //initially call function once to allow for one tapping
    //this also allows the user to continously tap to shoot faster, although not escalate in the function breaking (might be adjusted later)
  }
  if (currentlyShooting == false && currentlyRunning == true) {
    currentlyShooting = true;
    mainBulletLoop = setInterval(generateBullet, globalBulletDelay); //to avoid bullet spam call a fixed interval once
  }
}

//generate bullet
function generateBullet() {
  if (currentlyRunning == true) {
    playAudio('shoot');
    let bl1 = new Bullet(10);
    bulletArray.push(bl1);
  }
}

//bullet movement for bullet array
function bulletMovement() {
  for (let i = 0; i < bulletArray.length; i++) {
    if ((bulletArray[i].posY) < 0) {
      bulletArray.splice(i, 1);
    } else {
      bulletArray[i].move();
    }
  }
}

//bullet movement for collectible array
function collectibleMovement() {
  for (let i = 0; i < collectibleArray.length; i++) {
    if ((collectibleArray[i].posY) > canvasHeight) {
      collectibleArray.splice(i, 1);
    } else if (collision(collectibleArray[i].posX, collectibleArray[i].posY, archy, 50, 40, false, false) == true) {
      if (collectibleArray[i].type == 'shield') {
        archy.hp += 10;
        playAudio('lvlup');
      } else if (collectibleArray[i].type == 'coin') {
        DogeCoins = DogeCoins + 10;
        playAudio('pickup');
      }
      collectibleArray.splice(i, 1);
    } else {
      collectibleArray[i].move();
    }
  }
}

//enemy generation
function generateEnemy() {
  let en1 = new Enemy();
  enemyArray.push(en1);
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
        playerScore = playerScore + globalScoreLevel;
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

//check for collisions with other objects
function collision(X, Y, array, hitboxOffset, hitboxOffset2, multiObject, isAgainstBullet) {
  if (multiObject == true && isAgainstBullet == true) {
    for (let i = 0; i < array.length; i++) {
      if ( ( array[i].posX - hitboxOffset2 ) < ( X + hitboxOffset ) && ( array[i].posX + hitboxOffset2 ) > X && array[i].posY < ( Y + hitboxOffset ) && ( array[i].posY + hitboxOffset2 ) > Y) {
        currentBulletDamage = array[i].damage;
        array.splice(i, 1);
        return true;
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
  enemyArray = [];
  bulletArray = [];
  globalLevelNumber++;
}

//class for level generation
class Level {
  constructor(enemyDmg, enemySpeed, enemyDelay, bossHP, cltDelay, cltSpeed, enemyImg, scrLevel, scrLimit) {
    this.levelEnemyHP = enemyDmg;
    this.levelEnemySpeed = enemySpeed;
    this.levelEnemyDelay = enemyDelay;
    this.levelEnemyImg = enemyImg;
    this.bossHP = bossHP;
    this.levelCollectibleDelay = cltDelay;
    this.levelCollectibleSpeed = cltSpeed;
    this.levelScoreLevel = scrLevel;
    this.levelScoreLimit = scrLimit;
  }
}

//class for bullets
class Bullet {
  constructor(damage) {
    this.posX = archy.posX + 20;
    this.posY = archy.posY;
    this.damage = damage;
  }
  move() {
    ctx.drawImage(
      imageBullet,
      this.posX,
      this.posY,
      20,
      20
    );
    this.posY -= globalBulletSpeed;
  }
}

//class for enemies
class Enemy {
  constructor() {
    this.posX = 80;
    this.posY = Math.floor(Math.random()*800);
    this.hp = levelArray[globalLevelNumber].levelEnemyHP;
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

let level1 = new Level(10, 6, 3000, 500, 3000, 8, imageEnemy, 10, 50);
levelArray.push(level1);

//start loop
loop();

//enemy function for testing
mainEnemyLoop = setInterval(generateEnemy, globalEnemyDelay);

//collectible generation
mainCollectibleLoop = setInterval(generateCollectible, globalCollectibleDelay);





































































































































































































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
*/