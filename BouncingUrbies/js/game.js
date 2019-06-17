var PI = 3.14;

var UrbieSpawn = Class.create();

UrbieSpawn.prototype = 
{
	initialize: function(waveNum_, elapsedTime_) {this.waveNum=waveNum_; this.elapsedTime=elapsedTime_;},
	waveNum: 0,
	elapsedTime: 0
};

function Urbie(){
	this.object = null;
	this.image = null;
};

function Fire(){
	this.image = null;
	this.x;
	this.y;
};

function ElementalOnFire(){
	// 0=up, 1=right, 2=down, 3=left
	this.direction = 0;	
	
	this.x;
	this.y;
	
	// 0=fall from building
	// 1=go left to right on street
	// 2=glide down and right from building
	// 3=fly up and right from building
	this.behavior = 0;	
}
ElementalOnFire.DIRECTION_UP = 0;
ElementalOnFire.DIRECTION_RIGHT = 1;
ElementalOnFire.DIRECTION_DOWN = 2;
ElementalOnFire.DIRECTION_LEFT = 3;

ElementalOnFire.BEHAVIOR_FALL = 0;
ElementalOnFire.BEHAVIOR_CROSS_STREET = 1;
ElementalOnFire.BEHAVIOR_GLIDE = 2;
ElementalOnFire.BEHAVIOR_FLY = 3;

var atlas = function(){
	this.object = null;
	this.image = null;
};

var world = createWorld();
var context;
var screenWidth;
var screenHeight;
var canvasTop;
var canvasLeft;

var score = 0;
var wave = 1;
var perWaveMult = 5;
var nextWaveAt = 5;
var urbieSpawnArray = new Array();
var urbies = new Array();
var urbieLives = 5;
var spawnedUrbies = 0;
var prevSpawnTime;

var firePositions = new Array();
var prevFireUpdateTime;
var burningElementals = new Array();
var spawnNewBurningElemental = false;

var rescue;
var rescueWidth = 50;		// this is really half the actual width as its based on distance from center
var rescueHeight = 40;		// this is really half the actual height as its based on distance from center

var building;
var buildingWidth = 40;		// ditto as above
var buildingHeight = 200;	// ditto as above


var mouseX;
var mouseY;

var urbieImg = new Image();
var urbieSmallImg = new Image();
var atlasImg = new Image();
var ambulanceImg = new Image();
var buildingImg = new Image();
var groundImg = new Image();
var smokeImg = new Image();
var fireImgArray = new Array();
var elementalImgArray = new Array();

function initGame(){
	urbieImg.src = "images/Urbanmech.gif";
	urbieSmallImg.src = "images/Urbanmech-small.gif";
	atlasImg.src = "images/Atlas.gif";
	ambulanceImg.src = "images/ambulance.png";
	buildingImg.src = "images/building.png";
	groundImg.src = "images/street.png";
	smokeImg.src = "images/smoke.png";
	
	for(var i=0; i<4; i++){
		fireImgArray[i] = new Image();
		fireImgArray[i].src = "images/fire"+(i+1)+".png";
	}
	
	elementalImgArray[ElementalOnFire.DIRECTION_UP] = new Image();
	elementalImgArray[ElementalOnFire.DIRECTION_UP].src = "images/elemental-burning-up.png";
	elementalImgArray[ElementalOnFire.DIRECTION_RIGHT] = new Image();
	elementalImgArray[ElementalOnFire.DIRECTION_RIGHT].src = "images/elemental-burning-right.png";
	elementalImgArray[ElementalOnFire.DIRECTION_DOWN] = new Image();
	elementalImgArray[ElementalOnFire.DIRECTION_DOWN].src = "images/elemental-burning-down.png";
	elementalImgArray[ElementalOnFire.DIRECTION_LEFT] = new Image();
	elementalImgArray[ElementalOnFire.DIRECTION_LEFT].src = "images/elemental-burning-left.png";
	
	// create 2 big platforms	
	building = createBox(world, buildingWidth, screenHeight - buildingHeight, buildingWidth, buildingHeight, true, 'building');
	rescue = createBox(world, screenWidth - rescueWidth, screenHeight - rescueHeight, rescueWidth, rescueHeight, true, 'rescue');
	
	// create floor
	createBox(world, 0, screenHeight, screenWidth, 8, true, 'ground');
	
	// create atlas trampoline as rectangle
	atlas.image = atlasImg;
	atlas.object = createBox(world, screenWidth/2, screenHeight - 20, 30, 12, false, 'atlas');
	
	initWaveUrbieSpawnArray();
}

function step() {
	if(urbieLives <= 0){
		showGameOver();
		return;	
	}
	
	handleInteractions();
	
	spawnUrbies();
	
	var timeStep = 1.0/60;
	var iteration = 1;
	world.Step(timeStep, iteration);
	context.clearRect(0, 0, screenWidth, screenHeight);
	
	// draw objects on the canvas
	drawBackground();
	drawBuilding();
	drawFires();
	drawSmoke();
	drawAmbulance();
	drawBouncingUrbies();
	drawAtlas();
	
	showWaveAndScore();
	showLives();
	
	// draw box2d object overlay (for testing only)
	//drawWorld(world, context);
	
	setTimeout('step()', 10);
}

function spawnUrbies(){
	if(urbieLives <= 0){
		return;
	}
	
	spawnUrbie = getSpawnUrbie();
	
	if(spawnUrbie){
		// determine unused index to place the urbie so the array doesn't get too huge
		index = -1;
		for(var i=0; i<urbies.length; i++){
			if(urbies[i] == null){
				index = i;
				break;
			}
		}
		if(index == -1){
			index = urbies.length;
		}
		
		urbie = new Urbie();
		urbie.object = createBall(world, 23, 100 , 'urbie'+index);
		urbie.image = urbieImg;
		
		urbies[index] = urbie;
		
		spawnedUrbies ++;
	}
}

function drawBouncingUrbies(){
	for(var i=0; i<urbies.length; i++){
		currentUrbie = urbies[i];
		
		if(currentUrbie != null){
			context.save();
			
			//Translate to the center of the urbie (i.e. the point about which we are going to perform the rotation
			context.translate(currentUrbie.object.GetCenterPosition().x, currentUrbie.object.GetCenterPosition().y);
			
			//Perform the rotation based on the current prize angle
			context.rotate(currentUrbie.object.GetRotation());
			
			context.drawImage(currentUrbie.image, - (currentUrbie.image.width/2), - (currentUrbie.image.height/2));
			
			context.restore();
		}
	}
}

function drawFires(){
	time = new Date().getTime();

	if(prevFireUpdateTime == null || time - prevFireUpdateTime >= 500){
		// draw new fires in random places using a random fire graphic
		firePositions = new Array();
		prevFireUpdateTime = time;
		
		for(var i=0; i<wave*2; i++){
			randFireImgIndex = Math.floor(Math.random()*3.99);
			randX = Math.floor(Math.random()*50);
			randY = Math.floor(Math.random()*250) + 75;
			
			thisFire = new Fire();
			firePositions[i] = new Fire();
			firePositions[i].image = fireImgArray[randFireImgIndex];
			firePositions[i].x = randX;
			firePositions[i].y = randY;
		}
	}
	
	for(var i=0; i<firePositions.length; i++){
		thisFire = firePositions[i];
		
		context.drawImage(thisFire.image, thisFire.x, thisFire.y);
	}
	
	
	if(spawnNewBurningElemental){
		spawnNewBurningElemental = false;
		
		index = -1;
		for(var i=0; i<burningElementals.length; i++){
			if(burningElementals[i] == null){
				index = i;
				break;
			}
		}
		if(index == -1){
			index = burningElementals.length;
		}
		
		// determine the behavior of the new burning elemental
		elemental = new ElementalOnFire();
		elemental.behavior = Math.floor(Math.random()*3.99);
		
		initialX = 0;
		initialY = 0;
		// determine the starting position based on the behavior
		if(elemental.behavior == ElementalOnFire.BEHAVIOR_FALL){
			initialX = Math.floor(Math.random()*50);
			initialY = Math.floor(Math.random()*50) + 75;
		}
		else if(elemental.behavior == ElementalOnFire.BEHAVIOR_CROSS_STREET){
			initialX = 0;
			initialY = 450;
		}
		else if(elemental.behavior == ElementalOnFire.BEHAVIOR_GLIDE){
			initialX = Math.floor(Math.random()*50);
			initialY = Math.floor(Math.random()*100) + 75;
		}
		else if(elemental.behavior == ElementalOnFire.BEHAVIOR_FLY){
			initialX = Math.floor(Math.random()*50);
			initialY = Math.floor(Math.random()*200) + 125;
		}
		
		elemental.x = initialX;
		elemental.y = initialY;
		
		burningElementals[index] = elemental;
	}
	
	for(var i=0; i<burningElementals.length; i++){
		elemental = burningElementals[i];
		if(elemental == null){
			continue;
		}
		
		// update image and position based on previous position
		elementalImgIndex = ElementalOnFire.DIRECTION_DOWN;
		
		switch(elemental.behavior){
			case ElementalOnFire.BEHAVIOR_FALL:
				elementalImgIndex = ElementalOnFire.DIRECTION_DOWN;
				elemental.y += 2;
				break;
				
			case ElementalOnFire.BEHAVIOR_CROSS_STREET:
				elementalImgIndex = ElementalOnFire.DIRECTION_RIGHT;
				elemental.x += 2;
				break;
				
			case ElementalOnFire.BEHAVIOR_GLIDE:
				elementalImgIndex = ElementalOnFire.DIRECTION_RIGHT;
				elemental.x += 3;
				elemental.y += 1;
				break;
				
			case ElementalOnFire.BEHAVIOR_FLY:
				elementalImgIndex = ElementalOnFire.DIRECTION_RIGHT;
				elemental.x += 3;
				elemental.y -= 1;
				break;
		}
		
		if(hasObjectHitEdge(elemental)){
			//despawn object
			burningElementals[i] = null;
		}
		else{
			// draw burning elemental at its new position
			context.drawImage(elementalImgArray[elementalImgIndex], elemental.x, elemental.y);
		}
	}
}

function drawBackground(){
	context.drawImage(groundImg, 0, 0);
}

function drawBuilding(){
	context.drawImage(buildingImg, 0, screenHeight - (buildingHeight * 2));
}

function drawSmoke(){
	context.drawImage(smokeImg, 0, 0);
}

function drawAmbulance(){
	context.drawImage(ambulanceImg, screenWidth - (rescueWidth*2), screenHeight - (rescueHeight*2));
}

function drawAtlas(){
	context.drawImage(atlas.image, atlas.object.GetCenterPosition().x - (atlas.image.width/2), atlas.object.GetCenterPosition().y - (atlas.image.height/2));
}

function showGameOver(){
	context.fillStyle    = '#FFF';
	context.font         = '50px Arial Black';
	context.textBaseline = 'top';
	context.fillText('Game Over!', screenWidth/2 - 150, screenHeight/2);
}

function showWaveAndScore(){
	context.fillStyle    = '#FFF';
	context.font         = '25px Arial Black';
	context.textBaseline = 'top';
	context.fillText('Wave '+wave+'     Score: '+score, screenWidth - 300, 0);
}

function showLives(){
	if(urbieLives > 0){
		context.fillStyle    = '#FFF';
		context.font         = '18px Arial Black';
		context.textBaseline = 'top';
		context.fillText('Lives', 25, 0);
		
		for(var i=0; i<urbieLives; i++){
			
			context.drawImage(urbieSmallImg, 100+i*20, 5);
		}
	}
}

function handleInteractions(){
	// update position of atlas based on mouse position
	if(mouseX >= buildingWidth + atlas.image.width && mouseX <= screenWidth - rescueWidth - atlas.image.width){
		centerPos = atlas.object.GetCenterPosition();
		centerPos.x = mouseX;
		
		atlas.object.SetCenterPosition(centerPos, 0);
	}
	
	for(var i=0; i<urbies.length; i++){
		currentUrbie = urbies[i];
		
		if(currentUrbie == null){
			continue;
		}
		
		var vel = currentUrbie.object.GetLinearVelocity();
		
		var collision = world.m_contactList;
		if (collision != null){
			if (collision.GetShape1().GetUserData() == 'urbie'+i || collision.GetShape2().GetUserData() == 'urbie'+i){
				if (collision.GetShape1().GetUserData() == 'atlas' || collision.GetShape2().GetUserData() == 'atlas'){
					var urbieObj = (collision.GetShape1().GetUserData() == 'urbie'+i ? collision.GetShape1().GetPosition() :  collision.GetShape2().GetPosition());
					var atlasObj = (collision.GetShape1().GetUserData() == 'atlas' ? collision.GetShape1().GetPosition() :  collision.GetShape2().GetPosition());
					if (urbieObj.y < atlasObj.y){
						vel.y = -400;
					}
				}
				else if(collision.GetShape1().GetUserData() == 'rescue' || collision.GetShape2().GetUserData() == 'rescue'){
					// urbie has hit the rescue area, so give points and despawn it
					score ++;
					world.DestroyBody(currentUrbie.object);
					urbies[i] = null;
				}
				else if(collision.GetShape1().GetUserData() == 'ground' || collision.GetShape2().GetUserData() == 'ground'){
					// urbie has hit the ground, so make it dead
					urbieLives --;
					world.DestroyBody(currentUrbie.object);
					urbies[i] = null;
				}
			}
		}
	
		// constant velocity to the right to keep it horizontally moving
		vel.x = 60;
		
		currentUrbie.object.SetLinearVelocity(vel);
	}
}

Event.observe(window, 'load', function() {
	world = createWorld();
	context = $('game').getContext('2d');
	var canvasElm = $('game');
	screenWidth = parseInt(canvasElm.width);
	screenHeight = parseInt(canvasElm.height);
	canvasTop = parseInt(canvasElm.style.top);
	canvasLeft = parseInt(canvasElm.style.left);
	
	initGame();
	step();
});


// disable vertical page scrolling from arrows
document.onkeydown=function(){
	return event.keyCode!=38 && event.keyCode!=40;
};

//add event handler to surrounding DIV to monitor mouse position
document.onmousemove = function(e){
	mouseX = e.pageX;
	mouseY = e.pageY;
	
	// return false is needed to prevent the drag-select from occuring on the page
	return false;
};

function hasObjectHitEdge(gameObject){
	return(gameObject.x > screenWidth + 30 ||
			gameObject.x < -30 ||
			gameObject.y > screenHeight + 30 ||
			gameObject.y < -30);
		
}

//Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

/**
 * determine if its time to spawn another urbie based on wave and time since last urbie spawn
 */
function getSpawnUrbie(){
	if(urbieSpawnArray.length <= 0){
		// no more waves coded in, so end the game already!
		return true;
	}
	
	time = new Date().getTime();
	
	testUrbieSpawn = urbieSpawnArray[0];
	
	spawnUrbie = false;
	
	if(prevSpawnTime == null){
		prevSpawnTime = time;
	}
	
	if(time - prevSpawnTime >= testUrbieSpawn.elapsedTime){
		spawnUrbie = true;
		prevSpawnTime = time;
		
		if(testUrbieSpawn.waveNum > wave){
			wave = testUrbieSpawn.waveNum;
			spawnNewBurningElemental = true;
		}
		
		urbieSpawnArray.remove(0);
	}
	
	return spawnUrbie;
}

function initWaveUrbieSpawnArray(){
	// ~7000ms is the time it takes for an urbie to bounce to the ambulance from the building
	// ~3000ms is the time it takes for an urbie to get to its first bounce from the building
	// ~1200ms is the time it takes for an urbie to get from one bounce to the next
	urbieSpawnArray = new Array();
	i=0;
	// WAVE 1
	urbieSpawnArray[i++] = new UrbieSpawn(1, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(1, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(1, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(1, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(1, 2000);
	
	// WAVE 2
	urbieSpawnArray[i++] = new UrbieSpawn(2, 7000);
	urbieSpawnArray[i++] = new UrbieSpawn(2,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(2, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(2, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(2, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(2,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(2, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(2, 2000);
	
	// WAVE 3
	urbieSpawnArray[i++] = new UrbieSpawn(3, 7000);
	urbieSpawnArray[i++] = new UrbieSpawn(3,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(3, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(3, 4000);
	urbieSpawnArray[i++] = new UrbieSpawn(3,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(3, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(3, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(3,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(3, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(3, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(3, 2000);
	
	// WAVE 4
	urbieSpawnArray[i++] = new UrbieSpawn(4, 7000);
	urbieSpawnArray[i++] = new UrbieSpawn(4,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(4,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(4, 4000);
	urbieSpawnArray[i++] = new UrbieSpawn(4,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(4, 3500);
	urbieSpawnArray[i++] = new UrbieSpawn(4, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(4,  750);
	urbieSpawnArray[i++] = new UrbieSpawn(4, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(4, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(4, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(4,  750);
	urbieSpawnArray[i++] = new UrbieSpawn(4, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(4,  500);
	
	// WAVE 5
	urbieSpawnArray[i++] = new UrbieSpawn(5, 7000);
	urbieSpawnArray[i++] = new UrbieSpawn(5,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(5,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(5, 5000);
	urbieSpawnArray[i++] = new UrbieSpawn(5,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(5,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(5, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(5, 1750);
	urbieSpawnArray[i++] = new UrbieSpawn(5, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(5, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(5, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(5,  750);
	urbieSpawnArray[i++] = new UrbieSpawn(5, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(5,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(5, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(5, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(5, 1750);
	urbieSpawnArray[i++] = new UrbieSpawn(5, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(5,  500);
	
	// WAVE 6
	urbieSpawnArray[i++] = new UrbieSpawn(6, 7000);
	urbieSpawnArray[i++] = new UrbieSpawn(6,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(6,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 5000);
	urbieSpawnArray[i++] = new UrbieSpawn(6,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(6,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 1750);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(6,  750);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(6,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 1750);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(6,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(6, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(6,  500);
	
	// WAVE 7
	urbieSpawnArray[i++] = new UrbieSpawn(7, 7000);
	urbieSpawnArray[i++] = new UrbieSpawn(7,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(7,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(7,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 1750);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 5000);
	urbieSpawnArray[i++] = new UrbieSpawn(7,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(7,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(7,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 1500);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(7,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(7, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(7,  500);
	
	// WAVE 8
	urbieSpawnArray[i++] = new UrbieSpawn(8, 7000);
	urbieSpawnArray[i++] = new UrbieSpawn(8,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(8,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 1500);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(8,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(8,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(8,  500);
	urbieSpawnArray[i++] = new UrbieSpawn(8,  750);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 3000);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 1500);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 2000);
	urbieSpawnArray[i++] = new UrbieSpawn(8,  100);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(8,  200);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 1000);
	urbieSpawnArray[i++] = new UrbieSpawn(8,  300);
	urbieSpawnArray[i++] = new UrbieSpawn(8, 1000);
	
	// ENDGAME: because more levels takes too much time to make!
	urbieSpawnArray[i++] = new UrbieSpawn(99, 7000);
}