//base definition of a game object
function GameObject() {
	this.x = 0;
	this.y = 0;
	this.image = null;
}

var urbieImg = new Image();
var atlasImgArray = new Array();
var elementalImg = new Image();
var elementalSwarmingImg = new Image();
var golemImg = new Image();
var golemDamagedImg = new Image();
var golemSwarmingImg = new Image();
var projectileImg = new Image();
var projectileSmallImg = new Image();
var buckshotImg = new Image();
var swarmedImg = new Image();
var backgroundImg = new Image();
var destroyedImgArray = new Array();
var waveClearedImgArray = new Array();
var waveScoreImg = new Image();
var gameOverImgArray = new Array();

var score = 0;
var gameOver = false;
var context;
var screenWidth;
var screenHeight;
var showBounds = false;
var frameCount = 0;
var frameCountId;
var gameloopId;
var screenWidth;
var screenHeight;
var gameRunning = false;
var PI = 3.14;

var level = 0;

var waveEnded = false;
var waveClearedAnimationIndex = 0;
var lastWaveClearedAnimationTime;
var intermissionStartTime;
var gameOverAnimationIndex = 0;
var lastGameOverAnimationTime;
var maxCorpses = 50;
var corpseNum = 0;

var startWaveTime;
var lastSpawnTimeElemental;
var lastSpawnTimeGolem;

var selectedWeapon;
var urbieShotInterval = 500;
var nextUrbieShotWait = 125;
var projectileSpeed = 10;
var urbieAltFireInnerArcLength = 15;
var urbieAltFireOuterArcLength = 50;
var nextUrbieInLineToFire = 0;
var urbieSwarmLimit = 3;
var elementalSpeed = 2;
var numElementals = 0;
var golemSpeed = 1;
var numGolems = 0;
var atlasSpeed = 1.5;

var mouseX;
var mouseY;
var clickX;
var clickY;
var altClickX;
var altClickY;

var urbies = new Array();
var atlasZambonies = null;
var elementals = new Array();
var golems = new Array();
var projectiles = new Array();
var weapons = new Array();
var laserPoints = new Array();
var destroyed = new Array();

var soundType = "wav";
if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1){
	soundType = "mp3";
}

// Urbanmech is the defensable objects
function Urbanmech() {
	Urbanmech.prototype = new GameObject();
	Urbanmech.prototype.angle = 0;
	Urbanmech.swarmCounter = urbieSwarmLimit;
	Urbanmech.swarmed = false;
	Urbanmech.shotTime = null;
	Urbanmech.shotInterval = urbieShotInterval;
};

// Atlas is the Zamboni to clean the previous wave of swatted objects
function Atlas() {
	Atlas.prototype = new GameObject();
	Atlas.prototype.angle = 0;
	Atlas.animationStep = 0;
	Atlas.lastAnimationStepTime = null;
};

// Elemental takes 1 slap but is faster
function Elemental() {
	Elemental.prototype = new GameObject();
	Elemental.prototype.angle = 0;
	Elemental.reward = 10;
	Elemental.swarmed = false;
	Elemental.swarmedImage = null;
	Elemental.targetObject = null;
};

// Golem takes 2 slaps but is slower
function Golem() {
	Golem.prototype = new GameObject();
	Golem.prototype.angle = 0;
	Golem.reward = 20;
	Golem.swarmed = false;
	Elemental.damagedImage = null;
	Elemental.swarmedImage = null;
	Golem.targetObject = null;
	Golem.damaged = false;
};

// it is shot
function Projectile() {
	Projectile.prototype = new GameObject();
	Projectile.prototype.angle = 0;
};

// its shoots
function Weapon() {
	Weapon.prototype = new GameObject();
	Weapon.name = "";
	Weapon.shotInterval = 0;
	Weapon.shotWait = 0;
	Weapon.projectileSpeed = 0;
}

function DestroyedObject() {
	DestroyedObject.prototype = new GameObject();
	DestroyedObject.prototype.angle = 0;
	DestroyedObject.speed = 0;
}

// Just used to represent a point in space
function Point(){
	Point.prototype = new GameObject();
}


//Wait for DOM to load and init game
$(window).ready(function(){ 
	init(); 
});

function init(){
	$("#startNewGame").hide();
	setWeaponSelectsVisible(false);
	loadImages();
	initSettings();
	addEventHandlers();
	startFPSCounter();
}  

//load all images for game
function loadImages() {
	urbieImg.src = "images/urbanmech.gif";
	
	elementalImg.src = "images/elemental.gif";
	elementalSwarmingImg.src = "images/elemental-swarming.gif";
	golemImg.src = "images/golem.gif";
	golemDamagedImg.src = "images/golem-damaged.gif";
	golemSwarmingImg.src = "images/golem-swarming.gif";
	swarmedImg.src = "images/swarmed.gif";
	
	projectileImg.src = "images/projectile.png";
	projectileSmallImg.src = "images/projectile-small.png";
	buckshotImg.src = "images/buckshot.png";
	
	waveScoreImg.src = "images/wave-score.png";
	backgroundImg.src = "images/urbanmap.jpg";
	
	for(var i=0; i<10; i++){
		// atlas moving right foot from rear to front
		atlasImgArray[i] = new Image();
		atlasImgArray[i].src = "images/atlas"+i+".gif";
	}
	for(var i=0; i<10; i++){
		// atlas moving left foot from rear to front
		atlasImgArray[10+i] = new Image();
		atlasImgArray[10+i].src = "images/atlas"+(10-1-i)+".gif";
	}
	
	for(var i=0; i<5; i++){
		destroyedImgArray[i] = new Image();
		destroyedImgArray[i].src= "images/destroyed"+i+".gif";
	}
	
	for(var i=0; i<10; i++){
		waveClearedImgArray[i] = new Image();
		waveClearedImgArray[i].src = "images/wave-cleared"+i+".png";
	}
	
	for(var i=0; i<10; i++){
		gameOverImgArray[i] = new Image();
		gameOverImgArray[i].src = "images/game-over"+i+".png";
	}
	
	// create group of 4 urbanmechs
	for(var i=0; i<4; i++) {
		urbies[i] = new Urbanmech();
		urbies[i].image = urbieImg;
	}
	
	//Wait for background image to load and then call gameLoop to draw initial stage
	backgroundImg.onload = function(){gameLoop(); };
}

//init all game variables that can only be achieved after the DOM is loaded
function initSettings() {
	//Get a handle to the 2d context of the canvas
	context = document.getElementById('canvas').getContext('2d'); 
	
	//Calulate screen height and width
	screenWidth = parseInt($("#canvas").attr("width"));
	screenHeight = parseInt($("#canvas").attr("height"));
	
	//center the group of urbies in the middle of the screen, spaced out so they each are at N, S, E, W
	screenCenterX = parseInt(screenWidth/2);
	screenCenterY = parseInt(screenHeight/2);
	
	// TODO: remove these once I figure out how to get width/height before they're drawn the first time
	urbieWidth = 48;
	urbieHeight = 38;
	urbieCenterX = parseInt(urbieWidth/2);
	urbieCenterY = parseInt(urbieHeight/2);
	
	// default projectile speed=10
	// AC10 500/125
	// HVAC10 500/125 (projectile speed=15)
	// UAC10 300/75
	// RAC5 200/50 (projectile speed=12)
	// LBX10 500/125 (projectile speed=8)
	ac10 = new Weapon();
	ac10.name = "ac10";
	ac10.image = projectileImg;
	ac10.shotInterval = 500;
	ac10.shotWait = 125;
	ac10.projectileSpeed = 10;
	
	hvac10 = new Weapon();
	hvac10.name = "hvac10";
	hvac10.image = projectileImg;
	hvac10.shotInterval = 500;
	hvac10.shotWait = 125;
	hvac10.projectileSpeed = 18;
	
	uac10 = new Weapon();
	uac10.name = "uac10";
	uac10.image = projectileImg;
	uac10.shotInterval = 300;
	uac10.shotWait = 75;
	uac10.projectileSpeed = 10;
	
	rac5 = new Weapon();
	rac5.name = "rac5";
	rac5.image = projectileSmallImg;
	rac5.shotInterval = 200;
	rac5.shotWait = 50;
	rac5.projectileSpeed = 12;
	
	lbx10 = new Weapon();
	lbx10.name = "lbx10";
	lbx10.image = buckshotImg;
	lbx10.shotInterval = 500;
	lbx10.shotWait = 125;
	lbx10.projectileSpeed = 8;
	
	weapons[0] = ac10;
	weapons[1] = hvac10;
	weapons[2] = uac10;
	weapons[3] = rac5;
	weapons[4] = lbx10;
	
	for(var i=0; i<urbies.length; i++) {
		currentUrbie = urbies[i];
		
		switch(i){
			case 0:// North facing urbie
				currentUrbie.x = screenCenterX - urbieCenterX;
				currentUrbie.y = screenCenterY - urbieCenterY - 40;
				currentUrbie.angle = 0;
				break;
		
			case 1:
				// East facing urbie
				currentUrbie.x = screenCenterX - urbieCenterX + 40;
				currentUrbie.y = screenCenterY - urbieCenterY;
				currentUrbie.angle = 90;
				break;
			
			case 2:
				// South facing urbie
				currentUrbie.x = screenCenterX - urbieCenterX;
				currentUrbie.y = screenCenterY - urbieCenterY + 40;
				currentUrbie.angle = 180;
				break;
			
			case 3:
				// West facing urbie
				currentUrbie.x = screenCenterX - urbieCenterX - 40;
				currentUrbie.y = screenCenterY - urbieCenterY;
				currentUrbie.angle = 270;
				break;
		}
	}
}

//Using jQuery add the event handlers after the DOM is loaded
function addEventHandlers() {
	//add event handler to surrounding DIV to monitor mouse position
	document.onmousemove = function(e){
		mouseX = e.pageX;
		mouseY = e.pageY;
		
		if(clickX != null && clickY != null){
			clickX = mouseX;
			clickY = mouseY;
		}
		
		if(altClickX != null && altClickY != null){
			altClickX = mouseX;
			altClickY = mouseY;
		}
		
		// return false is needed to prevent the drag-select from occuring on the page
		return false;
	};
	
	// add handlers to mouse click
	document.onmousedown = function(e){
		
		switch(e.which) {
			case 1:
				// left click
				clickX = e.pageX;
				clickY = e.pageY;
				break;
			case 2:
				// middle click
				break;
				
			case 3:
				// right click
				altClickX = e.pageX;
				altClickY = e.pageY;
				break;
		}
		
		// return false is needed to prevent the drag-select from occuring on the page
		return false;
	};
	
	document.oncontextmenu = function(e){
		// return false is needed to prevent the right click menu from appearing on the page while the game is playing
		if(gameRunning){
			return false;
		}
	};
	
	document.onmouseup = function(e) {
	
		switch(e.which) {
			case 1:
				// left click
				clickX = null;
				clickY = null;
				break;
			case 2:
				// middle click
				break;
				
			case 3:
				// right click
				altClickX = null;
				altClickY = null;
				break;
		}
	};
	
	//Add event handler for start button
	$("#BtnImgStart").click(function (){		
		setWeaponSelectsVisible(true);
		$("#BtnImgStart").hide();
	});
	
	// add event handler for start new button
	$("#startNewGame").click(function (){
		if(gameRunning){
			$("#BtnImgStart").show();
			
			// run gameloop once more to clear out things that don't show when the game isn't running
			gameRunning = false;
			gameLoop();
			
			$("#startNewGame").hide();
		}
	});

	//Add event handler for show/hide bounds button	
	$("#showHideBounds").click(function (){		
		showBounds = !showBounds;
		gameLoop();
	});
	
	$("#ac10").click(function (){
		setWeapon("ac10");
		toggleGameplay();
		setWeaponSelectsVisible(false);
	});
	$("#ac10").hover(function (){
		$(this).attr("src", "images/choose-weapon-ac10-shadow.png");}, 
					 function() {
		$(this).attr("src", "images/choose-weapon-ac10.png");
	});
	
	$("#hvac10").click(function (){
		setWeapon("hvac10");
		toggleGameplay();
		setWeaponSelectsVisible(false);
	});
	$("#hvac10").hover(function (){
		$(this).attr("src", "images/choose-weapon-hvac10-shadow.png");}, 
					 function() {
		$(this).attr("src", "images/choose-weapon-hvac10.png");
	});
	
	$("#uac10").click(function (){
		setWeapon("uac10");
		toggleGameplay();
		setWeaponSelectsVisible(false);
	});
	$("#uac10").hover(function (){
		$(this).attr("src", "images/choose-weapon-uac10-shadow.png");}, 
					 function() {
		$(this).attr("src", "images/choose-weapon-uac10.png");
	});
	
	$("#rac5").click(function (){
		setWeapon("rac5");
		toggleGameplay();
		setWeaponSelectsVisible(false);
	});
	$("#rac5").hover(function (){
		$(this).attr("src", "images/choose-weapon-rac5-shadow.png");}, 
					 function() {
		$(this).attr("src", "images/choose-weapon-rac5.png");
	});
	
	$("#lbx10").click(function (){
		setWeapon("lbx10");
		toggleGameplay();
		setWeaponSelectsVisible(false);
	});
	$("#lbx10").hover(function (){
		$(this).attr("src", "images/choose-weapon-lbx10-shadow.png");}, 
					 function() {
		$(this).attr("src", "images/choose-weapon-lbx10.png");
	});
}

function startGame() {
	score=0;
	gameOver = false;
	level = 1;
	
	startLevel(level);
}

function startLevel(level) {
	waveEnded = false;
	destroyed = new Array();
	corpseNum = 0;
	atlasZambonies = null;
	startWaveTime = new Date().getTime();
	lastSpawnTimeElemental = startWaveTime;
	lastSpawnTimeGolem = startWaveTime;
	
	waveClearedAnimationIndex = 0;
	clearUrbieStatus();
	
	// TODO: come up with unique levels or something
	unleashElementals((level+1)*10);
	unleashGolems(level * 2);
}

function clearUrbieStatus(){
	nextUrbieInLineToFire = 0;
	for(var i=0; i<urbies.length; i++){
		urbies[i].swarmCounter = urbieSwarmLimit;
		urbies[i].swarmed = false;
		urbies[i].shotTime = null;
		urbies[i].shotInterval = urbieShotInterval;
	}
}

//Main game loop
function gameLoop(){  
  
	//Clear the screen by drawing a clear rectangle the size of the screen
	context.clearRect(0, 0, screenWidth, screenHeight);
	
	//Draw the background
	context.drawImage(backgroundImg, 0, 0);
	
	// determine if a weapon should fire and shoot it
	determineWeaponsFire();
	
	//update projectile positions
	moveProjectiles();
	
	// update elemental positions
	moveElementals();
	
	// update golem positions
	moveGolems();
	
	// draw destroyed units
	drawDestroyedObject();
	
	// draw the wave and score
	drawWaveAndScore();
	
	// TESTING LASER POINTERS
	drawLasers();
	
	//Draw projectiles
	drawProjectiles();
	
	//Draw the urbanmechs (depending on their current status)
	drawUrbies();
	
	// draw the elementals
	drawElementals();
	
	// draw the golems
	drawGolems();
	
	// draw the crosshairs
	drawCrosshairs();
	
	//Check collisions for projectiles and elementals
	hasProjectileHitEnemy();
	hasEnemyHitUrbie();
	
	gameOver = hasLevelFailed();
	
	if(gameOver){
		drawGameOver();
		
		$("#startNewGame").show();
	}
	else{
		startNextWave = false;
		if(waveEnded && hasLevelCompleted()){
			// show wave cleared animation and atlas zamboni sweep animation
			time = new Date().getTime();
			
			if(intermissionStartTime == null){
				// start 10 second intermission
				intermissionStartTime = time;
			}
			else if(time - intermissionStartTime >= 10000){
				// end intermission
				startNextWave = true;
				intermissionStartTime = null;
			}
			
			moveAtlasZambonies();
			performZamboniCleanup();
			drawAtlasZambonies();
			
			drawWaveCleared();
		}
		
		if(startNextWave){
			level ++;
			startLevel(level);
		}
	}
	
	//increment frame count
	frameCount++;
}  

function drawCrosshairs(){
	context.beginPath();
	
    context.moveTo(mouseX + 5, mouseY);
    context.lineTo(mouseX + 25, mouseY);
	
    context.moveTo(mouseX - 5, mouseY);
    context.lineTo(mouseX - 25, mouseY);
	
	context.moveTo(mouseX, mouseY + 5);
    context.lineTo(mouseX, mouseY + 25);
	
	context.moveTo(mouseX, mouseY - 5);
    context.lineTo(mouseX, mouseY - 25);
	
	context.lineWidth = 3;
    context.strokeStyle = "rgb(255,255,255)";
	context.stroke();  
	
	// draw red on top of the cursor when the urbie corresponding to that location is not yet ready to fire again
	context.beginPath();
	for(var i=0; i<urbies.length; i++){
		if(urbies[i].shotTime != null){
			switch(i){
				case 0:
					context.moveTo(mouseX, mouseY - 5);
					context.lineTo(mouseX, mouseY - 25);
					break;
						
				case 1:
					context.moveTo(mouseX + 5, mouseY);
					context.lineTo(mouseX + 25, mouseY);
					break;
						
				case 2:
					context.moveTo(mouseX, mouseY + 5);
					context.lineTo(mouseX, mouseY + 25);
					break;
				
				case 3:
					context.moveTo(mouseX - 5, mouseY);
					context.lineTo(mouseX - 25, mouseY);
					break;
			}
		}
	}
	context.lineWidth = 5;
	context.strokeStyle = "rgba(255,255,0, 1)";
	context.lineCap = "round";
	context.stroke();
	context.lineCap = "butt";
	
	// draw black on top of cursor when the urbie is swarmed
	context.beginPath();
	for(var i=0; i<urbies.length; i++){
		if(urbies[i].swarmed){
			switch(i){
				case 0:
					context.moveTo(mouseX, mouseY - 5);
					context.lineTo(mouseX, mouseY - 25);
					break;
						
				case 1:
					context.moveTo(mouseX + 5, mouseY);
					context.lineTo(mouseX + 25, mouseY);
					break;
						
				case 2:
					context.moveTo(mouseX, mouseY + 5);
					context.lineTo(mouseX, mouseY + 25);
					break;
				
				case 3:
					context.moveTo(mouseX - 5, mouseY);
					context.lineTo(mouseX - 25, mouseY);
					break;
			}
		}
	}
	context.lineWidth = 3;
	context.strokeStyle = "rgba(255,0,0, 1)";
	context.stroke();
}

function setWeapon(weaponName){
	for(var i=0; i<weapons.length; i++){
		if(weapons[i].name == weaponName){
			selectedWeapon = weapons[i];
			
			urbieShotInterval = weapons[i].shotInterval;
			nextUrbieShotWait = weapons[i].shotWait;
			projectileSpeed = weapons[i].projectileSpeed;
			break;
		}
	}
}

function determineWeaponsFire(){
	// determine if projectiles ready to fire again with user click
	time = new Date().getTime();
	
	// clear up urbie for fire if the proper amount of time has passed for it
	for(var i=0; i<urbies.length; i++){
		if(urbies[i].shotTime != null && time - urbies[i].shotTime >= urbies[i].shotInterval){
			// shot interval time has passed, allow this urbie to fire again
			urbies[i].shotTime = null;
		}
	}
	
	// determine if projectiles need to shoot
	if(altClickX != null && altClickY != null){
		// alternate projectile shooting, shoot from all available urbies simultaneously in an arc towards fire direction
		// the angle to be used is directly in the center of the urbie formation, center screen
		radius = getDistanceToTarget(screenWidth/2, screenHeight/2, altClickX, altClickY);
		baseAngle = getAngleToTarget(screenWidth/2, screenHeight/2, altClickX, altClickY);
		
		outerArcAngle = getArcAngle(radius, urbieAltFireOuterArcLength);
		innerArcAngle = getArcAngle(radius, urbieAltFireInnerArcLength);
		
		// plot target points spread out on the arc
		shotPoints = new Array();
		shotPoints[0] = getMovementDestination(screenWidth/2, screenHeight/2, radius, baseAngle-outerArcAngle);
		shotPoints[1] = getMovementDestination(screenWidth/2, screenHeight/2, radius, baseAngle-innerArcAngle);
		shotPoints[2] = getMovementDestination(screenWidth/2, screenHeight/2, radius, baseAngle+innerArcAngle);
		shotPoints[3] = getMovementDestination(screenWidth/2, screenHeight/2, radius, baseAngle+outerArcAngle);
		
		orderedUrbies = new Array();
		
		// pick which urbie fires at which point based on position to avoid overlapping fire lines starting with the
		for(var i=0; i<shotPoints.length; i++){
			// find the most appropriate angle from this target point from each urbie, which is the highest angle remaining
			pointX = shotPoints[i].x;
			pointY = shotPoints[i].y;
			
			bestUrbie = null;
			bestAngle = -1;
			
			for(var j=0; j<urbies.length; j++){
				if(urbies[j].shotTime == null && !urbies[j].swarmed){
					currentUrbie = urbies[j];
					
					projectileAngle = getAngleToTarget(pointX, pointY, 
										currentUrbie.x + (currentUrbie.image.width/2), currentUrbie.y + (currentUrbie.image.height/2));
					
					if(bestAngle >= 0 && bestAngle < 360 && projectileAngle - bestAngle > 180){
						// the best angle wrapped around 360 degrees, so add it
						bestAngle += 360;
					}
					else if(bestAngle - projectileAngle > 180){
						// projectile angle wrapped around 360 degress, so add it
						projectileAngle += 360;
					}
					
					if(projectileAngle > bestAngle){
						bestAngle = projectileAngle;
						bestUrbie = currentUrbie;
					}
				}
			}
			
			if(bestUrbie != null){
				orderedUrbies[orderedUrbies.length] = bestUrbie;
				
				// set urbie as fired so it won't be considered for next best angle to shot
				bestUrbie.shotTime = time;
			}
		}
		
		for(var i=0; i<orderedUrbies.length; i++){
			currentUrbie = orderedUrbies[i];
			
			//laserPoints[getUrbieIndex(currentUrbie)] = shotPoints[i];
			
			arcAngle = getAngleToTarget(currentUrbie.x + (currentUrbie.image.width/2), currentUrbie.y + (currentUrbie.image.height/2),
										shotPoints[i].x, shotPoints[i].y);
			
			shootProjectile(currentUrbie.x + (currentUrbie.image.width/2), currentUrbie.y + (currentUrbie.image.height/2), arcAngle);
			currentUrbie.shotTime = time;
		}
		
		nextUrbieInLineToFire = 0;
	}
	else if(clickX != null && clickY != null){
		// add in delay between separate urbies firing so they don't all fire immediately upon click
		lastUrbieFireTime = null;
		for(var i=0; i<urbies.length; i++){
			if(urbies[i].shotTime != null && (lastUrbieFireTime == null || urbies[i].shotTime > lastUrbieFireTime)){
				// this is so far the latest time an urbie has fired
				lastUrbieFireTime = urbies[i].shotTime;
			}
		}
	
		// normal projectile shooting, first try to fire from the next urbie in line to fire, otherwise move on
		urbieFireIndex = -1;
		if(urbies[nextUrbieInLineToFire].shotTime == null && !urbies[nextUrbieInLineToFire].swarmed &&
				(lastUrbieFireTime == null || time - lastUrbieFireTime >= nextUrbieShotWait)){
				
			urbieFireIndex = nextUrbieInLineToFire;
		}
		if(urbieFireIndex == -1){
			for(var i=0; i<urbies.length; i++){
				if(urbies[i].shotTime == null && !urbies[i].swarmed &&
						(lastUrbieFireTime == null || time - lastUrbieFireTime >= nextUrbieShotWait)){
						
					urbieFireIndex = i;
					break;
				}
			}
		}
		
		if(urbieFireIndex != -1){
			currentUrbie = urbies[urbieFireIndex];
			angle = getAngleToTarget(currentUrbie.x + (currentUrbie.image.width/2), currentUrbie.y + (currentUrbie.image.height/2),
										clickX, clickY);
			shootProjectile(currentUrbie.x + (currentUrbie.image.width/2), currentUrbie.y + (currentUrbie.image.height/2), angle);
			currentUrbie.shotTime = time;
			
			// determine next urbie to fire
			nextUrbieInLineToFire ++;
			if(nextUrbieInLineToFire >= urbies.length){
				nextUrbieInLineToFire = 0;
			}
		}
	}
}

function unleashElementals(elementalsPerWave){
	// elementals are spawned based on the length of the wave and how many
	elementals = new Array();
	numElementals = elementalsPerWave;
}

function unleashGolems(golemsPerWave){
	// golems are spawned based on the length of the wave and how many
	golems = new Array();
	numGolems = golemsPerWave;
}

/**
 * returns true if there are no more enemies to be drawn on screen but the wave must first be over before this can be accurate
 */
function hasLevelCompleted(){
	for(var i=0; i<elementals.length; i++){
		if(elementals[i] != null && !elementals[i].swarmed){
			return false;
		}
	}
	
	for(var i=0; i<golems.length; i++){
		if(golems[i] != null && !golems[i].swarmed){
			return false;
		}
	}

	return true;
}

function hasLevelFailed(){
	for(var i=0; i<urbies.length; i++){
		if(!urbies[i].swarmed){
			return false;
		}
	}
	
	return true;
}

function shootProjectile(sourceX, sourceY, angle) {
	projectileIndex = -1;
	for(var i=0; i<projectiles.length; i++){
		if(projectiles[i] == null){
			projectileIndex = i;
			break;
		}
	}
	if(projectileIndex == -1){
		projectileIndex = projectiles.length;
	}
	
	projectile = new Projectile();
	projectile.image = selectedWeapon.image;
	projectile.x = sourceX - (projectile.image.width/2);
	projectile.y = sourceY - (projectile.image.height/2);
	projectile.angle = angle;
	
	projectiles[projectileIndex] = projectile;
	
	return projectile;
}

function moveProjectiles() {
	//Move each projectile in its current direction
	for(var i=0; i<projectiles.length; i++){
		if(projectiles[i] != null){
			if(hasObjectHitEdge(projectiles[i])){
				projectiles[i] = null;
			}
			else{
				currentProjectile = projectiles[i];
				
				point = getMovementDestination(currentProjectile.x, currentProjectile.y, projectileSpeed, currentProjectile.angle);
				
				currentProjectile.x = point.x;
				currentProjectile.y = point.y;
			}
		}
	}
}

function moveElementals(){
	// check to see if new elementals need to be spawned
	time = new Date().getTime();
	waveTime = (time - startWaveTime);
	
	if(waveTime >= 30000){
		// 30 second wave times for now
		waveEnded = true;
	}
	else{
		timeBetweenElementals = parseInt(30000/(numElementals+1));
		
		timeSinceLastSpawnElemental = (time - lastSpawnTimeElemental);
		if(timeSinceLastSpawnElemental >= timeBetweenElementals){
			timeSinceLastSpawnElemental = 0;
		}
		
		if(timeSinceLastSpawnElemental == 0){
			// time to spawn new elemental
			lastSpawnTimeElemental = time;
			
			index = elementals.length;
			
			currentElemental = new Elemental();
			currentElemental.image = elementalImg;
			currentElemental.swarmedImage = elementalSwarmingImg;
			currentElemental.reward = 10;
		
			numSides = 0.99;
			if(waveTime >= 22500){
				numSides = 3.99;
			}
			else if(waveTime >= 15000){
				numSides = 2.99;
			}
			else if(waveTime >= 7500){
				numSides = 1.99;
			}
			
			startSide = Math.floor(Math.random()*numSides);
			
			if(startSide ==0){
				currentElemental.x = Math.floor(Math.random()*screenWidth);
				currentElemental.y = -10;
			}
			else if(startSide == 1){
				currentElemental.x = screenWidth+10;
				currentElemental.y = Math.floor(Math.random()*screenHeight);
			}
			else if(startSide == 2){
				currentElemental.x = Math.floor(Math.random()*screenWidth);
				currentElemental.y = screenHeight+10;
			}
			else{
				currentElemental.x = -10;
				currentElemental.y = Math.floor(Math.random()*screenHeight);
			}
			
			currentElemental.targetObject = getClosestUrbie(currentElemental.x, currentElemental.y);
			currentElemental.angle = getAngleToTarget(currentElemental.x + (currentElemental.image.width/2), currentElemental.y + (currentElemental.image.height/2), 
													currentElemental.targetObject.x + (currentElemental.targetObject.image.width/2), currentElemental.targetObject.y + (currentElemental.targetObject.image.height/2));
													
			elementals[index] = currentElemental;
		}
	}

	for(var i=0; i<elementals.length; i++){
		currentElemental = elementals[i];
		
		if(currentElemental == null || currentElemental.swarmed){
			continue;
		}
		
		if(hasObjectHitEdge(currentElemental)){
			elementals[i] = null;
			continue;
		}
		
		point = getMovementDestination(currentElemental.x, currentElemental.y, elementalSpeed, currentElemental.angle);
		
		currentElemental.x = point.x;
		currentElemental.y = point.y;
	}
}

function moveGolems(){
	// check to see if new golem need to be spawned
	time = new Date().getTime();
	waveTime = (time - startWaveTime);
	
	if(waveTime >= 30000){
		// 30 second wave times for now
		waveEnded = true;
	}
	else{
		timeBetweenGolems = parseInt(30000/(numGolems+1));
		
		timeSinceLastSpawnGolem = (time - lastSpawnTimeGolem);
		if(timeSinceLastSpawnGolem >= timeBetweenGolems){
			timeSinceLastSpawnGolem = 0;
		}
		
		if(timeSinceLastSpawnGolem == 0){
			// time to spawn new golem
			lastSpawnTimeGolem = time;
			
			index = golems.length;
			
			currentGolem = new Golem();
			currentGolem.reward = 20;
			currentGolem.image = golemImg;
			currentGolem.damagedImage = golemDamagedImg;
			currentGolem.swarmedImage = golemSwarmingImg;
		
			startSide = Math.floor(Math.random()*4.99);
			
			if(startSide <=1){
				currentGolem.x = Math.floor(Math.random()*screenWidth);
				currentGolem.y = -10;
			}
			else if(startSide == 2){
				currentGolem.x = screenWidth+10;
				currentGolem.y = Math.floor(Math.random()*screenHeight);
			}
			else if(startSide == 3){
				currentGolem.x = Math.floor(Math.random()*screenWidth);
				currentGolem.y = screenHeight+10;
			}
			else{
				currentGolem.x = -10;
				currentGolem.y = Math.floor(Math.random()*screenHeight);
			}
			
			currentGolem.targetObject = getClosestUrbie(currentGolem.x, currentGolem.y);
			currentGolem.angle = getAngleToTarget(currentGolem.x + (currentGolem.image.width/2), currentGolem.y + (currentGolem.image.height/2), 
													currentGolem.targetObject.x + (currentGolem.targetObject.image.width/2), currentGolem.targetObject.y + (currentGolem.targetObject.image.height/2));
													
			golems[index] = currentGolem;
		}
	}

	for(var i=0; i<golems.length; i++){
		currentGolem = golems[i];
		
		if(currentGolem == null || currentGolem.swarmed){
			continue;
		}
		
		if(hasObjectHitEdge(currentGolem)){
			golems[i] = null;
			continue;
		}
		
		point = getMovementDestination(currentGolem.x, currentGolem.y, golemSpeed, currentGolem.angle);
		
		currentGolem.x = point.x;
		currentGolem.y = point.y;
	}
}

function drawWaveAndScore(){
	if(level > 0 && gameRunning){
		context.drawImage(waveScoreImg, 0, 0);
	
		text = ""+level;
		context.font = "30pt Arial Black";
		context.lineWidth = 3;
		context.strokeStyle = "Black";
		context.strokeText(text, 85, 44);
		
		text = ""+score;
		context.font = "25pt Arial Black";
		context.lineWidth = 2;
		context.strokeStyle = "Black";
		context.strokeText(text, 250, 44);
	}
}

function drawUrbies() {

	for(var i=0; i<urbies.length; i++) {
		currentUrbie = urbies[i];
		
		if(currentUrbie.swarmed){
			// swarmed urbie cannot move
		}
		else if(mouseX != null && mouseY != null){
			urbieCenterX = currentUrbie.x + (currentUrbie.image.width/2);
			urbieCenterY = currentUrbie.y +(currentUrbie.image.height/2);
			
			currentUrbie.angle = getAngleToTarget(urbieCenterX, urbieCenterY, mouseX, mouseY);
		}
		
		context.save();
				
		//Translate to the center of the urbie (i.e. the point about which we are going to perform the rotation
		context.translate(currentUrbie.x + (currentUrbie.image.width/2), currentUrbie.y + (currentUrbie.image.height/2));
		
		//Perform the rotation based on the current prize angle
		context.rotate(currentUrbie.angle * PI/180);
		
		context.drawImage(currentUrbie.image, - (currentUrbie.image.width/2), - (currentUrbie.image.width/2));
		
		showObjectBounds(currentUrbie, - (currentUrbie.image.width/2), - (currentUrbie.image.width/2));
		
		context.restore();
		
		if(currentUrbie.swarmed){
			// draw the swarmed gif on top of the Urbie
			context.drawImage(swarmedImg, currentUrbie.x, currentUrbie.y);
		}
	}
}

function drawElementals() {

	for(var i=0; i<elementals.length; i++) {
		currentElemental = elementals[i];
		
		if(currentElemental == null){
			continue;
		}
		
		context.save();
				
		//Translate to the center of the urbie (i.e. the point about which we are going to perform the rotation
		context.translate(currentElemental.x + (currentElemental.image.width/2), currentElemental.y + (currentElemental.image.height/2));
		
		//Perform the rotation based on the current prize angle
		context.rotate(currentElemental.angle * PI/180);
		
		if(currentElemental.swarmed){
			context.drawImage(currentElemental.swarmedImage, - (currentElemental.image.width/2), - (currentElemental.image.width/2));
		}
		else{
			context.drawImage(currentElemental.image, - (currentElemental.image.width/2), - (currentElemental.image.width/2));
		}
		
		showObjectBounds(currentElemental, - (currentElemental.image.width/2), - (currentElemental.image.width/2));
		
		context.restore();
	}
}

function drawGolems() {

	for(var i=0; i<golems.length; i++) {
		currentGolem = golems[i];
		
		if(currentGolem == null){
			continue;
		}
		
		context.save();
				
		//Translate to the center of the urbie (i.e. the point about which we are going to perform the rotation
		context.translate(currentGolem.x + (currentGolem.image.width/2), currentGolem.y + (currentGolem.image.height/2));
		
		//Perform the rotation based on the current prize angle
		context.rotate(currentGolem.angle * PI/180);
		
		if(currentGolem.swarmed){
			context.drawImage(currentGolem.swarmedImage, - (currentGolem.image.width/2), - (currentGolem.image.width/2));
		}
		else if(currentGolem.damaged){
			context.drawImage(currentGolem.damagedImage, - (currentGolem.image.width/2), - (currentGolem.image.width/2));
		}
		else{
			context.drawImage(currentGolem.image, - (currentGolem.image.width/2), - (currentGolem.image.width/2));
		}
		
		showObjectBounds(currentGolem, - (currentGolem.image.width/2), - (currentGolem.image.width/2));
		
		context.restore();
	}
}


function drawDestroyedObject() {

	for(var i=0; i<destroyed.length; i++) {
		currentDestroyedObject = destroyed[i];
		
		if(currentDestroyedObject == null){
			continue;
		}
		
		// update xy position of destroyed objects so they get blown back a bit in the direction they were hit
		if(currentDestroyedObject.speed > 0){
			point = getMovementDestination(currentDestroyedObject.x, 
											currentDestroyedObject.y, 
											currentDestroyedObject.speed, 
											currentDestroyedObject.angle);
			currentDestroyedObject.x = point.x;
			currentDestroyedObject.y = point.y;
			
			if(currentDestroyedObject.speed > 0.1){
				currentDestroyedObject.speed /= 2;
			}
			else{
				currentDestroyedObject.speed = 0;
			}
		}
		
		context.save();
				
		//Translate to the center of the urbie (i.e. the point about which we are going to perform the rotation
		context.translate(currentDestroyedObject.x + (currentDestroyedObject.image.width/2), currentDestroyedObject.y + (currentDestroyedObject.image.height/2));
		
		//Perform the rotation based on the current prize angle
		context.rotate(currentDestroyedObject.angle * PI/180);
		
		context.drawImage(currentDestroyedObject.image, - (currentDestroyedObject.image.width/2), - (currentDestroyedObject.image.width/2));
		
		showObjectBounds(currentDestroyedObject, - (currentDestroyedObject.image.width/2), - (currentDestroyedObject.image.width/2));
		
		context.restore();
	}
}

function drawLasers(){
	if(altClickX != null && altClickY != null){
		// get angle to direction of the alternate fire from center screen
		//laserAngle = getAngleToTarget(screenWidth/2, screenHeight/2, altClickX, altClickY);
		
		for(var i=0; i<urbies.length; i++){
			// get offscreen destination so the laser is a continuous beam
			laserPoint = laserPoints[i];
			if(laserPoint == null){
				continue;
			}
			
			//getMovementDestination(urbies[i].x + urbies[i].image.width/2, urbies[i].y + urbies[i].image.height/2, 500, laserAngle);
		
			context.beginPath();
	
			context.moveTo(urbies[i].x + urbies[i].image.width/2, urbies[i].y + urbies[i].image.height/2);
			context.lineTo(laserPoint.x, laserPoint.y);
			
			context.lineWidth = 5;
			context.strokeStyle = "rgba(0,0,255,0.5)";
			context.stroke(); 
			
			
			context.beginPath();
			
			context.moveTo(urbies[i].x + urbies[i].image.width/2, urbies[i].y + urbies[i].image.height/2);
			context.lineTo(laserPoint.x, laserPoint.y);
			
			context.lineWidth = 3;
			context.strokeStyle = "rgba(0,0,255,0)";
			context.stroke(); 
		}
	}
}

function drawProjectiles() {

	for(var i=0; i<projectiles.length; i++) {
		currentProjectile = projectiles[i];
		
		if(currentProjectile == null){
			continue;
		}

		context.save();
				
		//Translate to the center of the urbie (i.e. the point about which we are going to perform the rotation
		context.translate(currentProjectile.x + (currentProjectile.image.width/2), currentProjectile.y + (currentProjectile.image.height/2));
		
		//Perform the rotation based on the current prize angle
		context.rotate(currentProjectile.angle * PI/180);
		
		context.drawImage(currentProjectile.image, - (currentProjectile.image.width/2), - (currentProjectile.image.width/2));
		
		showObjectBounds(currentProjectile, - (currentProjectile.image.width/2), - (currentProjectile.image.width/2));
		
		context.restore();
	}
}

function performZamboniCleanup(){
	if(atlasZambonies == null){
		return;
	}
	
	columnToClear = 0;
	for(var i=0; i<atlasZambonies.length; i++){
		currentAtlas = atlasZambonies[i];
		if(currentAtlas == null){
			continue;
		}
		
		columnToClear = currentAtlas.x + 20;
		break;
	}
	
	if(columnToClear <= 0){
		return;
	}
	
	if(destroyed != null){
		for(var i=0; i<destroyed.length; i++){
			currentDestroyed = destroyed[i];
			if(currentDestroyed == null){
				continue;
			}
			
			if(currentDestroyed.x <= columnToClear){
				destroyed[i] = null;
			}
		}
	}
	
	// clear urbies that are swarmed
	for(var i=0; i<urbies.length; i++){
		currentUrbie = urbies[i];
		
		if(currentUrbie.swarmed && currentUrbie.x <= columnToClear){
			currentUrbie.swarmed = false;
		}
	}
	
	// remove elementals and golems that are swarmed
	for(var i=0; i<elementals.length; i++){
		currentElemental = elementals[i];
		if(currentElemental == null){
			continue;
		}
		
		if(currentElemental.swarmed && currentElemental.x <= columnToClear){
			currentElemental.swarmed = false;
			elementals[i] = null;
		}
	}
	for(var i=0; i<golems.length; i++){
		currentGolem = golems[i];
		if(currentGolem == null){
			continue;
		}
		
		if(currentGolem.swarmed && currentGolem.x <= columnToClear){
			currentGolem.swarmed = false;
			golems[i] = null;
		}
	}
}

function moveAtlasZambonies(){
	// spawn atlas zambonies
	if(atlasZambonies == null){
		atlasZambonies = new Array();
		
		for(var i=0; i<8; i++){
			currentAtlas = new Atlas();
			currentAtlas.x = -10;
			currentAtlas.y = 10+ (i * 75);
			currentAtlas.angle = 90;
			currentAtlas.animationStep = 0;
			
			atlasZambonies[i] = currentAtlas;
		}
	}

	//Move each atlas in its current direction
	for(var i=0; i<atlasZambonies.length; i++){
		if(atlasZambonies[i] != null){
			if(hasObjectHitEdge(atlasZambonies[i])){
				atlasZambonies[i] = null;
			}
			else{
				currentAtlas = atlasZambonies[i];
				
				point = getMovementDestination(currentAtlas.x, currentAtlas.y, atlasSpeed, currentAtlas.angle);
				
				currentAtlas.x = point.x;
				currentAtlas.y = point.y;
			}
		}
	}
}

function drawAtlasZambonies(){
	for(var i=0; i<atlasZambonies.length; i++){
		currentAtlas = atlasZambonies[i];
		
		if(currentAtlas == null){
			continue;
		}
		
		currentAtlasImg = atlasImgArray[currentAtlas.animationStep];
		
		time = new Date().getTime();
		
		if(currentAtlas.lastAnimationStepTime == null){
			currentAtlas.lastAnimationStepTime = time;
		}
		else if(time - currentAtlas.lastAnimationStepTime >= 85){
			currentAtlas.animationStep ++;
			
			if(currentAtlas.animationStep >= atlasImgArray.length){
				currentAtlas.animationStep = 0;
			}
			
			currentAtlas.lastAnimationStepTime = null;
		}
		
		context.save();
				
		//Translate to the center of the urbie (i.e. the point about which we are going to perform the rotation
		context.translate(currentAtlas.x + (currentAtlasImg.width/2), currentAtlas.y + (currentAtlasImg.height/2));
		
		//Perform the rotation based on the current prize angle
		context.rotate(currentAtlas.angle * PI/180);
		context.drawImage(currentAtlasImg, - (currentAtlasImg.width/2), - (currentAtlasImg.width/2));
		
		showObjectBounds(currentAtlas, - (currentAtlasImg.width/2), - (currentAtlasImg.width/2));
		
		context.restore();
	}

}

function drawGameOver() {
	if(!gameRunning){
		return;
	}
	
	currentGameOverImg = gameOverImgArray[gameOverAnimationIndex];
	if(gameOverAnimationIndex >= gameOverImgArray.length-1){
		gameOverAnimationIndex = gameOverImgArray.length-1;
		lastGameOverAnimationTime = null;
	}
	else{
		time = new Date().getTime();
		
		if(lastGameOverAnimationTime == null){
			lastGameOverAnimationTime = time;
		}
		else if(time - lastGameOverAnimationTime >= 50){
			gameOverAnimationIndex ++;
			lastGameOverAnimationTime = time;
		}
	}
	
	context.drawImage(currentGameOverImg, 0, 400);
}

function drawWaveCleared() {
	if(!gameRunning){
		return;
	}

	currentWaveImg = waveClearedImgArray[waveClearedAnimationIndex];
	if(waveClearedAnimationIndex >= waveClearedImgArray.length-1){
		waveClearedAnimationIndex = waveClearedImgArray.length-1;
		lastWaveClearedAnimationTime = null;
	}
	else{
		time = new Date().getTime();
		
		if(lastWaveClearedAnimationTime == null){
			lastWaveClearedAnimationTime = time;
		}
		else if(time - lastWaveClearedAnimationTime >= 35){
			waveClearedAnimationIndex ++;
			lastWaveClearedAnimationTime = time;
		}
	}
	
	context.drawImage(currentWaveImg, 0, 260);
}

function hasEnemyHitUrbie() {
	for(var i=0; i<elementals.length; i++){
		currentElemental = elementals[i];
		if(currentElemental == null || currentElemental.swarmed){
			continue;
		}
	
		for(var j=0; j<urbies.length; j++){
			currentUrbie = urbies[j];
		
			if(gameOver){
				// if game is over, allow any remaining elementals to attach more to a single urbie
			}
			else if(currentUrbie.swarmed){
				continue;
			}
			
			if(checkIntersect(currentUrbie, currentElemental, 2)){
				// set urbie and elemental to swarmed status as needed
				currentElemental.swarmed = true;
				
				if(currentUrbie.swarmCounter > 0){
					currentUrbie.swarmCounter --;
				}
				
				if(currentUrbie.swarmCounter == 0){
					currentUrbie.swarmed = true;
				}
				else{
					// decrease urbies ability to fire per elemental attached 
					// TODO: maybe put this in later for harder difficulty?
					//currentUrbie.shotInterval += urbieShotInterval/2;
				}
			}
		}
	}
	
	for(var i=0; i<golems.length; i++){
		currentGolem = golems[i];
		
		if(currentGolem == null || currentGolem.swarmed){
			continue;
		}
	
		for(var j=0; j<urbies.length; j++){
			currentUrbie = urbies[j];
		
			if(currentUrbie.swarmed){
				continue;
			}
			
			if(checkIntersect(currentUrbie, currentGolem, 5)){
				// set urbie and golem to swarmed status
				currentUrbie.swarmed = true;
				currentGolem.swarmed = true;
			}
		}
	}
}

function hasProjectileHitEnemy() {
	for(var i=0; i<projectiles.length; i++){
		currentProjectile = projectiles[i];
		if(currentProjectile == null){
			continue;
		}
		
		// check for hit against elementals
		for(var j=0; j<elementals.length; j++){
			currentElemental = elementals[j];
			if(currentElemental == null || currentElemental.swarmed){
				continue;
			}
			
			if(checkIntersect(currentProjectile, currentElemental, 0)){
				// add to destroyed elementals
				currentDestroyedObject = createDestroyedObject(currentElemental.x + (currentElemental.image.width/2), 
																currentElemental.y + (currentElemental.image.height/2), 
																projectileSpeed, currentProjectile.angle);
				
				// maximu
				numDestroyed = destroyed.length;
				if(numDestroyed >= maxCorpses){
					// max reached, so start despawning corpses
					if(corpseNum >= maxCorpses){
						corpseNum = 0;
					}
					else{
						corpseNum ++;
					}
				}
				else{
					corpseNum = numDestroyed;
				}
				
				destroyed[corpseNum] = currentDestroyedObject;
				
				// remove projectile and the elemental that was hit
				currentProjectile = null;
				projectiles[i] = null;
				elementals[j] = null;
				
				// add score
				score += currentElemental.reward;
			}
			
			if(currentProjectile == null){
				break;
			}
		}
		
		// check for hit against golems
		for(var j=0; j<golems.length; j++){
			currentGolem = golems[j];
			if(currentGolem == null || currentGolem.swarmed){
				continue;
			}
			
			if(checkIntersect(currentProjectile, currentGolem, 0)){
				if(currentGolem.damaged){
					// add to destroyed golems
					currentDestroyedObject = createDestroyedObject(currentGolem.x, currentGolem.y, projectileSpeed/2, currentProjectile.angle);
					destroyed[destroyed.length] = currentDestroyedObject;
					
					// remove projectile and the golem that was hit
					currentProjectile = null;
					projectiles[i] = null;
					golems[j] = null;
					
					// add score
					score += currentGolem.reward;
				}
				else{
					// Golems take 2 hits to destroy, set damaged status
					currentGolem.damaged = true;
					
					// remove projectile
					currentProjectile = null;
					projectiles[i] = null;
				}
			}
			
			if(currentProjectile == null){
				break;
			}
		}
	}
}

function createDestroyedObject(centerX, centerY, speed, angle){
	currentDestroyedObject = new DestroyedObject();
	currentDestroyedObject.image = destroyedImgArray[Math.floor(Math.random()*4.99)];
	currentDestroyedObject.x = centerX - (currentDestroyedObject.image.width/2);
	currentDestroyedObject.y = centerY - (currentDestroyedObject.image.height/2);
	currentDestroyedObject.angle = angle;
	currentDestroyedObject.speed = speed;
	
	return currentDestroyedObject;
}

function getClosestUrbie(sourceX, sourceY){
	closestUrbie = null;
	closestDist = -1;

	for(var i=0; i<urbies.length; i++){
		currentUrbie = urbies[i];
		if(currentUrbie.swarmed){
			continue;
		}
		
		dist = Math.abs(Math.sqrt(square(sourceX - currentUrbie.x) + square(sourceY - currentUrbie.y)));
		
		if(closestDist == -1 || dist < closestDist){
			closestDist = dist;
			closestUrbie = currentUrbie;
		}
	}
	
	if(closestUrbie == null){
		// all urbies destroyed, direct remaining enemies to random target
		return urbies[Math.floor(Math.random()*3.99)];
	}

	return closestUrbie;
}

function square(number){
	return number * number;
}

function startFPSCounter() {
	var start = new Date().getTime(),
		time = 0;
	function instance() {
		time += 1000;
		fps();
		
		var diff = (new Date().getTime() - start) - time;
		window.setTimeout(instance, (1000 - diff));
	}
	window.setTimeout(instance, 1000);

}

//Update the display to show frames per second and reset ready for next count
function fps() {
	$("#fps").html(frameCount + " fps");
	frameCount=0;
}

//Start game timer, i.e. setTimeout that calls itself taking into account the
//actual real difference in time. This is better than 
function startGameTimer() {
	var start = new Date().getTime(),
		time = 0;
	function timer()
	{
		time += 15;
		var diff = (new Date().getTime() - start) - time;
		if(gameRunning)
		{
			gameLoop();
			window.setTimeout(timer, (15 - diff));
		}
	}
	if(gameRunning)
		window.setTimeout(timer, 15);
}

function showObjectBounds(gameObject, transitionX, transitionY) {
		
	if(showBounds) {
		if(typeof(transitionX) != 'undefined')
			recontext = transitionX;
		else
			recontext = gameObject.x;
		
		if(typeof(transitionY) != 'undefined')
			rectY = transitionY;
		else
			rectY = gameObject.y;
			
		context.save();
		
		context.strokeStyle = '#f00'; // red
		context.lineWidth   = 2;
		context.strokeRect(recontext, rectY, gameObject.image.width, gameObject.image.height);
		
		context.restore();
	}
}

function hasObjectHitEdge(gameObject){
	return(gameObject.x > screenWidth + 20 ||
			gameObject.x < -20 ||
			gameObject.y > screenHeight + 20 ||
			gameObject.y < -20);
		
}

function getUrbieIndex(urbie){
	for(var i=0; i<urbies.length; i++){
		if(urbies[i] == urbie){
			return i;
		}
	}
	return -1;
}

function getMovementDestination(sourceX, sourceY, distance, angle){
	oppSide = Math.sin(angle * PI/180) * distance;
	adjSide = Math.cos(angle * PI/180) * distance;
	
	p = new Point();
	p.x = sourceX + oppSide;
	p.y = sourceY - adjSide;
	
	return p;
}

function getDistanceToTarget(sourceX, sourceY, targetX, targetY){
	// C^2 = A^2 + B^2
	return Math.sqrt(Math.pow(Math.abs(sourceX - targetX), 2) + Math.pow(Math.abs(sourceY - targetY), 2));
}

function getAngleToTarget(sourceX, sourceY, targetX, targetY){
	quadrant = 0;
	addedAngle = 0;
	if(targetX >= sourceX && targetY < sourceY){
		quadrant = 1;
		addedAngle = 0;
	}
	else if(targetX >= sourceX && targetY >= sourceY){
		quadrant = 2;
		addedAngle = 90;
	}
	else if(targetX < sourceX && targetY >= sourceY){
		quadrant = 3;
		addedAngle = 180;
	}
	else{
		quadrant = 4;
		addedAngle = 270;
	}
	
	oppSide = 0;
	adjSide = 0;
	switch(quadrant){
		case 1:
			oppSide = targetX - sourceX;
			adjSide = sourceY - targetY;
			break;
			
		case 2:
			oppSide = targetY - sourceY;
			adjSide = targetX - sourceX;
			break;
			
		case 3:
			oppSide = sourceX - targetX;
			adjSide = targetY - sourceY;
			break;
			
		case 4:
			oppSide = sourceY - targetY;
			adjSide = sourceX - targetX;
			break;
	}
	
	// calculate new angle based on pointer position, each angle is calculated from X axis where Urbie is origin point
	angle = addedAngle + Math.atan((oppSide) / (adjSide)) * (180 / PI);
	return angle;
}

function getArcAngle(distance, arcLength){
	// angle=arc length * 180/(pi*radius)
	angle = arcLength * 180 / (PI * distance);
	
	return angle;
}

function checkIntersect(object1, object2, overlap)
{
	//    x-Axis                      x-Axis
	//  A1------>B1 C1              A2------>B2 C2
	//  +--------+   ^              +--------+   ^ 
	//  | object1|   | y-Axis       | object2|   | y-Axis
	//  |        |   |              |        |   |
	//  +--------+  D1              +--------+  D2
	//
	
	if(object1 == null || object2 == null){
		return false;
	}
	
	A1 = object1.x + overlap;
	B1 = object1.x + object1.image.width - overlap;
	C1 = object1.y + overlap; 
	D1 = object1.y + object1.image.height - overlap;
	
	A2 = object2.x + overlap;
	B2 = object2.x + object2.image.width - overlap;
	C2 = object2.y + overlap;
	D2 = object2.y + object2.image.width - overlap;
	
	//Do they overlap on the x-Axis?
	if(A1 > A2 && A1 < B2
	   || B1 > A2 && B1 < B2)
	{
		//x axis intersects so check y axis
		if(C1 > C2 && C1 < D2
	   || D1 > C2 && D1 < D2)
		{
			return true;
		}
		
	}
	
	return false;
}

/**
 *Start/stop the game loop
 */
function toggleGameplay() {
	gameRunning = !gameRunning;
	
	if(gameRunning) {
		$("#startNewGame").hide();
		startGameTimer();
		startGame();
	}
	else {
		//TODO: pause
	}
}

function setWeaponSelectsVisible(visible){
	if(visible){
		$("#chooseWeapon").show();
		$("#ac10").show();
		$("#hvac10").show();
		$("#uac10").show();
		$("#rac5").show();
		$("#lbx10").show();
	}
	else{
		$("#chooseWeapon").hide();
		$("#ac10").hide();
		$("#hvac10").hide();
		$("#uac10").hide();
		$("#rac5").hide();
		$("#lbx10").hide();
	}
}