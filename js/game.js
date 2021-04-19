/*
Last Author: K1llf0rce
Date: 10.04.2021
*/

//exec code in strict mode
'use strict';

//canvas
let cv = document.getElementById('mainCanvas');
let ctx = cv.getContext('2d');
cv.height = 960; //  height for canvas
cv.width = 1600; //  width for canvas
let canvasHeight = cv.height;
let canvasWidth = cv.width;

//images
let image = document.getElementById('spaceship');
let imageBullet = document.getElementById('bullet1');
let imageEnemy = document.getElementById('enemy');

//booleans
let moveU = false;
let moveD = false;
let moveL = false;
let moveR = false;
let currentlyShooting = false;
let addEnemy = true;
let mainBulletLoop;
let currentlyRunning = true;
let currentFramerate;

//global speed adjustment
let globalSpeed; //spaceship speed (in px per refresh)
let globalEnemySpeed; //enemy speed (in px per refresh)
let globalBulletSpeed; //bullet speed (in px per refresh)
let globalBulletDelay; //delay between each bullet (in ms)
let globalEnemyDelay; //delay between enemy generation (in ms)
let globalMovementAdjust; //movement speed adjust based on measured FPS

//arrays
let bulletArray = [];
let enemyArray = [];

function loop() {
  //canvas
  cv = document.getElementById('mainCanvas');
  ctx = cv.getContext('2d');
  cv.height = 960;
  cv.width = 1600;

  //spaceship movement
  archy.move();

  //keep bullets moving
  bulletMovement();

  //keep enemies moving
  enemyMovement();

  //get FPS and adjust multiplier
  getFPS().then(fps => currentFramerate = fps);
  adjustForFramerate();

  if (currentlyRunning == true) {
    window.requestAnimationFrame(loop);
  }
}

//movement is adjusted based on the players screen refresh rate
function adjustForFramerate() {
  globalMovementAdjust = ( 100 - ( ( currentFramerate * 88 ) / 100 ) + 100 ) * 0.01; // we calculate the multiplier here
  globalSpeed = 10 * globalMovementAdjust;
  globalEnemySpeed = 4 * globalMovementAdjust;
  globalBulletSpeed = 18 * globalMovementAdjust;
  globalBulletDelay = 200;
  globalEnemyDelay = 2000;
}

//game over function to be called when the game needs to be stopped (things to be stopped must be added in here)
function gameOver() {
  if (currentlyRunning == true) {
    currentlyRunning = false;
  } else {
    currentlyRunning = true
    loop();
  }
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
    var audio = new Audio('audio/bullet.mp3');
    audio.play();
  }
}

//initial shoot function
function shootInit() {
  if (currentlyShooting == false) {
    generateBullet(); //initially call function once to allow for one tapping
    //this also allows the user to continously tap to shoot faster, although not escalate in the function breaking (might be adjusted later)
  }
  if (currentlyShooting == false) {
    currentlyShooting = true;
    mainBulletLoop = setInterval(generateBullet, globalBulletDelay); //to avoid bullet spam call a fixed interval once
  }
}

//generate bullet
function generateBullet() {
  if (currentlyRunning == true) {
    let bl1 = new Bullet();
    bulletArray.push(bl1);
    playAudio('shoot');
  }
}

//bullet movement for bullet array
function bulletMovement() {
  for (let i = 0; i < bulletArray.length; i++) {
    if ((bulletArray[i].bPosY) < 0) {
      bulletArray.splice(i, 1);
    } else {
      bulletArray[i].move();
    }
  }
}

//enemy generation
function generateEnemy() {
  if (currentlyRunning == true) {
    let en1 = new Enemy();
    enemyArray.push(en1);
    setInterval(function () {
    let en1 = new Enemy();
    enemyArray.push(en1);
  }, globalEnemyDelay);
  }
}

//enemy movement with collision checks
function enemyMovement() {
  for (let i = 0; i < enemyArray.length; i++) {
    if (collision(enemyArray[i].ePosX, enemyArray[i].ePosY) == true) {
      enemyArray.splice(i, 1);
    } else {
      if ((enemyArray[i].ePosX + imageEnemy.width) > cv.width) {
        enemyArray[i].movementX = -globalEnemySpeed;
        enemyArray[i].ePosY += 80;
      }
      if ((enemyArray[i].ePosX) < 0) {
        enemyArray[i].movementX = globalEnemySpeed;
        enemyArray[i].ePosY += 80;
      }
      enemyArray[i].move();
    }
  }
}

//check for collisions with bullets
function collision(X, Y) {
  for (let i = 0; i < bulletArray.length; i++) {
    if (bulletArray[i].bPosX < X + 60 && bulletArray[i].bPosX > X && bulletArray[i].bPosY < Y + 60 && bulletArray[i].bPosY > Y) {
      bulletArray.splice(i, 1);
      return true;
    }
  }
}

//class for bullets
class Bullet {
  constructor() {
    this.bPosX = archy.posX + 20; //shift to center
    this.bPosY = archy.posY;
  }
  move() {
    ctx.drawImage(
      imageBullet,
      this.bPosX,
      this.bPosY,
      20,
      20
    );
    this.bPosY -= globalBulletSpeed;
  }
}

//class for enemies
class Enemy {
  constructor() {
    this.ePosX = 80;
    this.ePosY = 80;
    this.movementX = globalEnemySpeed;
  }
  move() {
    ctx.drawImage(
      imageEnemy,
      this.ePosX,
      this.ePosY,
      60,
      60
    );
    this.ePosX += this.movementX;
  }
}

//class for spaceship, namely "archy"
class Spaceship {
  constructor() {
    this.posX = 800;
    this.posY = 800;
  }
  move() {
    ctx.drawImage(
      image,
      archy.posX,
      archy.posY,
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
}

//event listener to reset move variables on keyup
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

//event listener to trigger shooting
if (currentlyShooting == false) {
  document.addEventListener('keydown', function (event) {
    if (event.code == 'Space') {
      shootInit();
    }
  });
}

//event listener to reset shooting trigger on keyup
document.addEventListener('keyup', function (event) {
  if (event.code == 'Space') {
    currentlyShooting = false;
    clearInterval(mainBulletLoop); // clears the interval that was previously called to generate bullets
  }
});

//event listener to stop/resume game
document.addEventListener('keydown', function (event) {
  if (event.code == 'KeyG') {
    gameOver();
  }
});

//generate new Archy (spaceship)
let archy = new Spaceship();

//start loop
loop();

//enemy function for testing
generateEnemy();












































































































































































































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