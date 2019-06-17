// base definition of a display object
var DisplayObject = Class.create({
	initialize: function() {
		this.type = null;
		this.color = '#000000';
		this.displayChar = null;
	}
});

var STATE_START = 0;		// game just started
var STATE_MENU = 1;			// game is paused to display menu
var STATE_GAME = 2;			// game is on
var STATE_INVENTORY = 3;	// inventory/internals screen is displayed

var state = STATE_START;
function setState(newState){
	if(state != newState){
		state = newState;
	}
}

var storedHexMap;

var canvas;
var context;
var postContext;
var screenWidth;
var screenHeight;
var showBounds = false;
var screenWidth;
var screenHeight;

var updateDisplay = true;

var playerEnded = true;
var playerJumping = false;
var playerTurnIndex = 0;

var renderPlayerAscii = false;

var prevPlayerHeading = -1;
var prevPlayerHeatGen = 0;
var prevPlayerHeatDiss = 0;
var prevPlayerMech;

var projectileInterval = 25;
var projectileDistance = 1;

var floatingTime = 2.0;
var floatingSpeed = 50;
var floatingDelay = 0.3;
var floatingInterval = 25;

var projectiles = [];

var floatingMessages = [];

var enemyBots = [];
var botTime = 250;

var destroyedChar = "&";

var PI = 3.14;

// set number of displayable cols and rows (the +1/+2 are to finish off incomplete hexes)
var maxVisibleHexCols = 18;
var maxVisibleHexRows = 10;
var numCols = maxVisibleHexCols*4 + 1;
var numRows = maxVisibleHexRows*4 + 2;
var visibleHexOffsetX = 0;
var visibleHexOffsetY = 0;

// some custom display types
var HEAVY_TREE_TYPE = "heavy_tree";
var HEAVY_ROCK_TYPE = "heavy_rock";
var DEEP_WATER_TYPE = "deep_water";
var BRACKET_TYPE    = "bracket";

var displayArray = [];		// the array containing the location of each character going to the display
var displayOrder = [HEX_TYPE, TREE_TYPE, HEAVY_TREE_TYPE, ROCK_TYPE, HEAVY_ROCK_TYPE, 
					WATER_TYPE, DEEP_WATER_TYPE, PLAYER_TYPE, ENEMY_TYPE, BRACKET_TYPE];

var messageDisplayIndex = -1;

var fontLoaded = false;
var fontName = "Topaz-8";
var logoFont = "42pt "+fontName;
var gameOverFont = "28pt "+fontName;

//IE&FF didn't like 1pt font, and 2pt is too big in Chrome, but 1.7 seems to look fine in all
var asciiFont = "1.7pt Topaz-8";
var asciiRowOffset = 2;

var font = "7pt "+fontName;
var fontOffset = 7;

var colOffset = 8;
var rowOffset = 10;
var topOffset = rowOffset * 3;
var hexColWidth = 4;

var lookMode = false;
var showHexNumbers = false;
var showArcOverlay = false;
var useHtalDamageDisplay = true;

var mouseX;
var mouseY;
var clickX;
var clickY;
var altClickX;
var altClickY;

// keep track if the player is using the shift+number keys to indicate weapons to be group fired
var groupWeaponChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];
var groupFireEnabled = false;

var soundType = "wav";
if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1){
	soundType = "mp3";
}

var ColorTemplate = Class.create({
	initialize: function(name) {
		// initialize some things for all templates
		this.name = name;
	},
	getName: function() {
		return this.name;
	},
});

var DefaultTemplate = new ColorTemplate("ComStar");
	DefaultTemplate.bgColor = 		"#FFFFFF";	// default white background
	DefaultTemplate.fgColor = 		"#000000";	// default black foreground
	DefaultTemplate.playerColor = 	"#0000FF";	// default blue player
	DefaultTemplate.enemyColor = 	"#FF0000";	// default red enemy
	DefaultTemplate.treeColor = 	"#228B22";	// default green trees level 1
	DefaultTemplate.treeColor2 = 	"#134E13";	// default dark green trees level 2
	DefaultTemplate.rockColor = 	"#A52A2A";	// default brown rocks
	DefaultTemplate.waterColor = 	"#1E90FF";	// default light blue water level 1
	DefaultTemplate.waterColor2 = 	"#0000FF";	// default blue water level 2
	DefaultTemplate.sevHighColor =  "#FF0000";	// default red high sev message color
	DefaultTemplate.energyColor =  	"#FF0000";	// red energy weapons
	DefaultTemplate.ballisticColor=	"#000000";	// black ballistic weapons
	DefaultTemplate.missileColor = 	"#FF4500";	// red-orange missile weapons

var DarkTemplate = new ColorTemplate("Alliance");
	DarkTemplate.bgColor = 		"#000000";	// black background
	DarkTemplate.fgColor = 		"#FFFFFF";	// white foreground
	DarkTemplate.playerColor = 	"#1E90FF";	// light blue player
	DarkTemplate.enemyColor = 	"#FF0000";	// red enemy
	DarkTemplate.treeColor = 	"#4EA24E";	// green trees level 1
	DarkTemplate.treeColor2 = 	"#468146";	// dark green trees level 2
	DarkTemplate.rockColor = 	"#C06A6A";	// light brown rocks
	DarkTemplate.waterColor = 	"#00FFFF";	// light blue water level 1
	DarkTemplate.waterColor2 = 	"#00A3FF";	// blue water level 2
	DarkTemplate.sevHighColor = "#FF0000";	// red high sev message color
	DarkTemplate.energyColor =  "#FF0000";	// red energy weapons
	DarkTemplate.ballisticColor="#FFD700";	// yellow ballistic weapons
	DarkTemplate.missileColor = "#FFA500";	// orange missile weapons
	
var DarkMonoTemplate = new ColorTemplate("Dark Mono");
	DarkMonoTemplate.bgColor = 		"#000000";	// black background
	DarkMonoTemplate.fgColor = 		"#FFFFFF";	// white foreground
	DarkMonoTemplate.playerColor = 	"#FFFFFF";
	DarkMonoTemplate.enemyColor = 	"#FFFFFF";
	DarkMonoTemplate.treeColor = 	"#FFFFFF";
	DarkMonoTemplate.treeColor2 = 	"#FFFFFF";
	DarkMonoTemplate.rockColor = 	"#FFFFFF";
	DarkMonoTemplate.waterColor = 	"#FFFFFF";
	DarkMonoTemplate.waterColor2 = 	"#FFFFFF";
	DarkMonoTemplate.sevHighColor = "#FFFFFF";
	DarkMonoTemplate.bracketColor = "#808080";
	
var LightMonoTemplate = new ColorTemplate("Light Mono");
	LightMonoTemplate.bgColor = 	"#FFFFFF";	// white background
	LightMonoTemplate.fgColor = 	"#000000";	// black foreground
	LightMonoTemplate.playerColor = "#000000";
	LightMonoTemplate.enemyColor = 	"#000000";
	LightMonoTemplate.treeColor = 	"#000000";
	LightMonoTemplate.treeColor2 = 	"#000000";
	LightMonoTemplate.rockColor = 	"#000000";
	LightMonoTemplate.waterColor = 	"#000000";
	LightMonoTemplate.waterColor2 = "#000000";
	LightMonoTemplate.sevHighColor ="#000000";
	LightMonoTemplate.bracketColor ="#808080";
	
var CGAPalette0Template = new ColorTemplate("CGA Palette 0");
	// black 	  #000000	gray 		  #555555
	// green 	  #00AA00	light green	  #55FF55
	// red 	  	  #AA0000	light red 	  #FF5555
	// brown 	  #AA5500	yellow 		  #FFFF55
	CGAPalette0Template.bgColor = 			"#000000";
	CGAPalette0Template.fgColor = 			"#555555";
	CGAPalette0Template.playerColor = 		"#55FF55";
	CGAPalette0Template.enemyColor = 		"#FF5555";
	CGAPalette0Template.treeColor = 		"#55FF55";
	CGAPalette0Template.treeColor2 = 		"#00AA00";
	CGAPalette0Template.rockColor = 		"#AA5500";
	CGAPalette0Template.waterColor = 		"#FFFF55";
	CGAPalette0Template.waterColor2 = 		"#FFFF55";
	CGAPalette0Template.sevHighColor =		"#FF5555";
	CGAPalette0Template.energyColor =		"#FF5555";
	CGAPalette0Template.ballisticColor =	"#FFFF55";
	CGAPalette0Template.missileColor =		"#55FF55";

var CGAPalette1Template = new ColorTemplate("CGA Palette 1");
	// black 	  #000000	gray 		  #555555
	// light gray #AAAAAA	white 		  #FFFFFF
	// cyan 	  #00AAAA	light cyan 	  #55FFFF
	// magenta 	  #AA00AA	light magenta #FF55FF
	CGAPalette1Template.bgColor = 			"#000000";
	CGAPalette1Template.fgColor = 			"#AAAAAA";
	CGAPalette1Template.playerColor = 		"#55FFFF";
	CGAPalette1Template.enemyColor = 		"#FFFFFF";
	CGAPalette1Template.treeColor = 		"#FF55FF";
	CGAPalette1Template.treeColor2 = 		"#AA00AA";
	CGAPalette1Template.rockColor = 		"#555555";
	CGAPalette1Template.waterColor = 		"#55FFFF";
	CGAPalette1Template.waterColor2 = 		"#00AAAA";
	CGAPalette1Template.sevHighColor =		"#FF55FF";
	
var GBoyPaletteTemplate = new ColorTemplate("BrickBoy");
	// black 	  #313119	light gray 	  #BDBD9C
	// gray  	  #8C8C73	dark gray	  #5A5A4A
	GBoyPaletteTemplate.bgColor = 			"#BDBD9C";
	GBoyPaletteTemplate.fgColor = 			"#8C8C73";
	GBoyPaletteTemplate.playerColor = 		"#313119";
	GBoyPaletteTemplate.enemyColor = 		"#313119";
	GBoyPaletteTemplate.treeColor = 		"#5A5A4A";
	GBoyPaletteTemplate.treeColor2 = 		"#313119";
	GBoyPaletteTemplate.rockColor = 		"#313119";
	GBoyPaletteTemplate.waterColor = 		"#8C8C73";
	GBoyPaletteTemplate.waterColor2 = 		"#5A5A4A";
	GBoyPaletteTemplate.sevHighColor =		"#313119";
	GBoyPaletteTemplate.bracketColor =		"#5A5A4A";
	
var DraconisTemplate = new ColorTemplate("Draconis");
	DraconisTemplate.bgColor = 		"#000000";	// black background
	DraconisTemplate.fgColor = 		"#FFFFFF";	// white foreground
	DraconisTemplate.playerColor = 	"#CC0000";	// deep red player
	DraconisTemplate.enemyColor = 	"#B54ED6";	// purple enemy
	DraconisTemplate.treeColor = 	"#4EA24E";	// green trees level 1
	DraconisTemplate.treeColor2 = 	"#468146";	// dark green trees level 2
	DraconisTemplate.rockColor = 	"#C06A6A";	// light brown rocks
	DraconisTemplate.waterColor = 	"#00FFFF";	// light blue water level 1
	DraconisTemplate.waterColor2 = 	"#00A3FF";	// blue water level 2
	DraconisTemplate.sevHighColor = "#CC0000";	// deep red high sev message color
	DraconisTemplate.energyColor =  "#FF0000";	// red energy weapons
	DraconisTemplate.ballisticColor="#FFD700";	// yellow ballistic weapons
	DraconisTemplate.missileColor = "#FFA500";	// orange missile weapons
	
var MarikTemplate = new ColorTemplate("Free World");
	MarikTemplate.bgColor = 		"#000000";	// black background
	MarikTemplate.fgColor = 		"#B2FDFF";	// teal foreground
	MarikTemplate.playerColor = 	"#B54ED6";	// purple player
	MarikTemplate.enemyColor = 		"#FF0000";	// red enemy
	MarikTemplate.treeColor = 		"#4EA24E";	// green trees level 1
	MarikTemplate.treeColor2 = 		"#468146";	// dark green trees level 2
	MarikTemplate.rockColor = 		"#C06A6A";	// light brown rocks
	MarikTemplate.waterColor = 		"#00FFFF";	// light blue water level 1
	MarikTemplate.waterColor2 = 	"#00A3FF";	// blue water level 2
	MarikTemplate.sevHighColor = 	"#FF0000";	// red high sev message color
	MarikTemplate.energyColor =  	"#FF0000";	// red energy weapons
	MarikTemplate.ballisticColor=	"#FFD700";	// yellow ballistic weapons
	MarikTemplate.missileColor = 	"#FFA500";	// orange missile weapons
	
var CapellanTemplate = new ColorTemplate("Capellan");
	CapellanTemplate.bgColor = 		"#000000";	// black background
	CapellanTemplate.fgColor = 		"#FFFF79";	// light yellow foreground
	CapellanTemplate.playerColor = 	"#2AD632";	// green player
	CapellanTemplate.enemyColor = 	"#FF0000";	// red enemy
	CapellanTemplate.treeColor = 	"#4EA24E";	// green trees level 1
	CapellanTemplate.treeColor2 = 	"#468146";	// dark green trees level 2
	CapellanTemplate.rockColor = 	"#C06A6A";	// light brown rocks
	CapellanTemplate.waterColor = 	"#00FFFF";	// light blue water level 1
	CapellanTemplate.waterColor2 = 	"#00A3FF";	// blue water level 2
	CapellanTemplate.sevHighColor = "#FF0000";	// red high sev message color
	CapellanTemplate.energyColor =  "#FF0000";	// red energy weapons
	CapellanTemplate.ballisticColor="#FFD700";	// yellow ballistic weapons
	CapellanTemplate.missileColor = "#FFA500";	// orange missile weapons
	
var FederatedTemplate = new ColorTemplate("Federated");
	FederatedTemplate.bgColor = 	"#000000";	// black background
	FederatedTemplate.fgColor = 	"#F7D266";	// gold foreground
	FederatedTemplate.playerColor = "#C42127";	// red player
	FederatedTemplate.enemyColor = 	"#2AD632";	// green enemy
	FederatedTemplate.treeColor = 	"#4EA24E";	// green trees level 1
	FederatedTemplate.treeColor2 = 	"#468146";	// dark green trees level 2
	FederatedTemplate.rockColor = 	"#C06A6A";	// light brown rocks
	FederatedTemplate.waterColor = 	"#00FFFF";	// light blue water level 1
	FederatedTemplate.waterColor2 = "#00A3FF";	// blue water level 2
	FederatedTemplate.sevHighColor = "#FF0000";	// red high sev message color
	FederatedTemplate.energyColor =  "#FF0000";	// red energy weapons
	FederatedTemplate.ballisticColor="#FFD700";	// yellow ballistic weapons
	FederatedTemplate.missileColor = "#FFA500";	// orange missile weapons

var colors = DarkTemplate;
var templates = [DefaultTemplate, DarkTemplate, DraconisTemplate, MarikTemplate, CapellanTemplate, FederatedTemplate, CGAPalette0Template, CGAPalette1Template, DarkMonoTemplate, GBoyPaletteTemplate, LightMonoTemplate];

function setTheme(themeName){
	for(var i=0; i<templates.length; i++){
		if(themeName == templates[i].getName()){
			colors = templates[i];
			return;
		}
	}
}

var HexDisplay = Class.create(DisplayObject, {
	initialize: function() {
		HexDisplay.prototype.type = HEX_TYPE;
	}
});

var PlayerDisplay = Class.create(DisplayObject, {
	initialize: function() {
		this.type = PLAYER_TYPE;
	}
});

var EnemyDisplay = Class.create(DisplayObject, {
	initialize: function() {
		this.type = ENEMY_TYPE;
	}
});

var TreeDisplay = Class.create(DisplayObject, {
	initialize: function() {
		this.displayChar = "*";
		this.type = TREE_TYPE;
	}
});

var HeavyTreeDisplay = Class.create(DisplayObject, {
	initialize: function() {
		this.displayChar = "%";
		this.type = HEAVY_TREE_TYPE;
	}
});

var RockDisplay = Class.create(DisplayObject, {
	initialize: function() {
		this.displayChar = ".";
		this.type = ROCK_TYPE;
	}
});

var HeavyRockDisplay = Class.create(DisplayObject, {
	initialize: function() {
		this.displayChar = ":";
		this.type = HEAVY_ROCK_TYPE;
	}
});

var WaterDisplay = Class.create(DisplayObject, {
	initialize: function() {
		this.displayChar = "~";
		this.type = WATER_TYPE;
	}
});

var DeepWaterDisplay = Class.create(DisplayObject, {
	initialize: function() {
		this.displayChar = "~";
		this.type = DEEP_WATER_TYPE;
	}
});

// used to represent animated projectile
var Projectile = Class.create(DisplayObject, {
	initialize: function(x, y, angle) {
		this.x = x;
		this.y = y;
		this.angle = angle;
		this.render = true;
		this.animationIndex = 0;
		
		// width and length, or radius for drawing projectile itself
		this.width = 0;
		this.length = 0;
		this.radius = 0;
		
		// optional source, mid and destination points only needed for non-linear animation paths
		this.src;
		this.mid1;
		this.mid2;
		this.dest;
	}
});

// used to represent animated floating messages
var FloatingMessage = Class.create(DisplayObject, {
	initialize: function(x, y, message, color) {
		this.x = x;
		this.y = y;
		this.message = message;
		this.color = color;
		this.render = true;
		this.animationIndex = floatingTime;
		this.font = "10pt Topaz-8";
		this.fontWidth = 12;
		this.isStatic = false;
	}
});

// Just used to represent a point in space
var Point = Class.create(DisplayObject, {
	initialize: function(x, y) {
		this.x = x;
		this.y = y;
	}
});


var MENU_TYPE_MENU = "menu";			// just a top level menu that leads to menu items or other menus
var MENU_ITEM_PROPERTY = "property";	// displays a simple property
var MENU_ITEM_ENTRY = "entry";			// displays a field to enter text
var MENU_ITEM_SELECT_MECH = "mech";		// displays selections for choosing a mech
var MENU_ITEM_SELECT_BOT = "bot";		// displays selections for choosing a bot mech
var MENU_ITEM_LIST = "list";			// displays a simple non-interactive list item // TODO: make this interactive, for changing controls
var MENU_ITEM_ACTION = "action";		// does something when selected (e.g. return to game)
var MENU_ITEM_SEPARATOR = "separator";	// provides some separation in the menus
var MENU_ITEM_THEME = "theme";			// lets the user change theme just by selecting it (without needing to activate it)

// used to represent every menu selection item
var MenuItem = Class.create({
	initialize: function(name, type) {
		this.name = name;
		this.type = type;
		this.selected = false;
	},
	getName: function() {
		return this.name;
	},
	getType: function() {
		return this.type;
	},
	isSelected: function() {
		return this.selected;
	},
});

var BotMechMenuItem = Class.create(MenuItem, {
	initialize: function(name, type) {
		this.name = name;
		this.type = type;
		this.selected = false;
	},
});


//Wait for DOM to load and init game
$(document).ready(function(){ 
	debug.log("Detected browser: "+navigator.sayswho);
	isChrome = (navigator.sayswho.indexOf("Chrome") != -1);
	isFirefox = (navigator.sayswho.indexOf("Firefox") != -1);
	isIE = (navigator.sayswho.indexOf("MSIE") != -1);
	isSafari = (navigator.sayswho.indexOf("Safari") != -1);
	
	init(); 
	
	resize_canvas();
});

// some silly function that is needed because browsers can't be consistent
var isFirefox = false;
var isIE = false;
var isChrome = false;
var isSafari = false;
navigator.sayswho = (function(){
	var N= navigator.appName, ua= navigator.userAgent, tem;
	var M= ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
	if(M && (tem= ua.match(/version\/([\.\d]+)/i))!= null) M[2]= tem[1];
	M= M? [M[1], M[2]]: [N, navigator.appVersion,'-?'];
	return M;
})();


function resize_canvas(){
	var postCanvas = document.getElementById("canvas");
	
	if (postCanvas.width  != window.innerWidth){
		postCanvas.width  = window.innerWidth;
		canvas.width = window.innerWidth;
	}
	
	if (postCanvas.height != window.innerHeight){
		postCanvas.height = window.innerHeight;
		canvas.height = window.innerHeight;
	}
	
	// update screen dimensions
	screenWidth = canvas.width;
	screenHeight = canvas.height;
	
	// update number of displayable hex rows/cols (minimum supported is 800x600, so scale up from there)
	maxVisibleHexCols = 18;
	maxVisibleHexRows = 10;
	
	var xPerHex = colOffset * 5;
	var yPerHex = rowOffset * 4;
	
	for(var extraCol = screenWidth; extraCol >= 800 + xPerHex; extraCol -= xPerHex){
		maxVisibleHexCols ++;
	}
	
	for(var extraRow = screenHeight; extraRow >= 550 + yPerHex; extraRow -= yPerHex){
		maxVisibleHexRows ++;
	}
	
	// update number of renderable rows/cols
	numCols = maxVisibleHexCols*4 + 1;
	numRows = maxVisibleHexRows*4 + 2;
	
	// if the screen width is >= 21 hexes wide then we can show the player ascii mech
	renderPlayerAscii = (maxVisibleHexCols >= 21);
	
	// keep the player in the center
	autoCenterOnMech();
	
	// update base map array to reflect new render area size
	initMap();
	
	updateDisplay = true;
	
	debug.log("resizing to "+screenWidth+"x"+screenHeight);
}

/** 
 * shifts the display to render different portions of the map, 
 * also updates messages and projectiles that may be rendering still by the appropriate amount 
 */
function setVisibleHexOffset(newHexOffsetX, newHexOffsetY){
	var diffX = visibleHexOffsetX - newHexOffsetX;
	var diffY = visibleHexOffsetY - newHexOffsetY;
	
	visibleHexOffsetX = newHexOffsetX;
	visibleHexOffsetY = newHexOffsetY;
	
	if(diffX != 0 || diffY != 0){
		var diffOffsetX = (diffX * colOffset * 4);
		var diffOffsetY = (diffY * rowOffset * 4);
	
		// update floating messages
		for(var i=0; i<floatingMessages.length; i++){
			var floatMessage = floatingMessages[i];
			
			floatMessage.x += diffOffsetX;
			floatMessage.y += diffOffsetY;
		}
		
		// update projectiles
		for(var i=0; i<projectiles.length; i++){
			var thisProjectile = projectiles[i];
			
			thisProjectile.x += diffOffsetX;
			thisProjectile.y += diffOffsetY;
			
			if(thisProjectile.src != null){
				thisProjectile.src.x += diffOffsetX;
				thisProjectile.src.y += diffOffsetY;
			}
			
			if(thisProjectile.dest != null){
				thisProjectile.dest.x += diffOffsetX;
				thisProjectile.dest.y += diffOffsetY;
			}
			
			if(thisProjectile.mid1 != null){
				thisProjectile.mid1.x += diffOffsetX;
				thisProjectile.mid1.y += diffOffsetY;
			}
			
			if(thisProjectile.mid2 != null){
				thisProjectile.mid2.x += diffOffsetX;
				thisProjectile.mid2.y += diffOffsetY;
			}
		}
	}
}


function init(){
	handleBrowserQuirks();
	
	initSettings();
	gameLoop();
	addEventHandlers();
} 

/** handles some of the offsets and other settings needed to fit the individual browser */
function handleBrowserQuirks(){
	// different browsers support different request animation frame methods because... ug
	window.requestAnimFrame = function(){
	    return (
	        window.requestAnimationFrame       || 
	        window.webkitRequestAnimationFrame || 
	        window.mozRequestAnimationFrame    || 
	        window.oRequestAnimationFrame      || 
	        window.msRequestAnimationFrame     || 
	        function(/* function */ callback){
	            window.setTimeout(callback, 1000 / 60);
	        }
	    );
	}();
}

function getTestFontSize(testFont){
	var pa = document.body;
	var who= document.createElement('span');
	
	who.style.cssText='display:inline-block; padding:0; line-height:1; position:absolute; visibility:hidden; font:'+testFont;
	
	// using 100 M's to average out the width of a single character
	var testStr = 'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM';
	who.appendChild(document.createTextNode(testStr));
	pa.appendChild(who);
	 
	var fs= [(who.offsetWidth/testStr.length), who.offsetHeight];
	pa.removeChild(who);
	return fs;
}

/** sets up the player, mech, bots and the gameplay */
function startGame(){
	// removing logo alpha just in case the game was started quickly before it could animate to 1
	logoAlpha = 1;
	
	// resetting floating/projectile animations
	floatingMessages = [];
	projectiles = [];
	
	// resetting some player stat tracking
	prevPlayerHeatGen = 0;
	prevPlayerHeatDiss = 0;
	
	initGame();
	initBots();
	
	// start the game state
	setState(STATE_GAME);
	
	autoCenterOnMech();
	
	updateDisplay = true;
}

function initBots(){
	enemyBots = [];
	
	// assigns a bot to each enemy mech
	for(var i=0; i<gameMechs.length; i++){
		var thisMech = gameMechs[i];
		
		var thisBot = new MekBot(thisMech);
		enemyBots.push(thisBot);
	}
} 

//init all game variables that can only be achieved after the DOM is loaded
function initSettings() {
	//Get a handle to the 2d context of the canvas
	canvas = document.createElement('canvas');
	canvas.width  = window.innerWidth;
	canvas.height = window.innerHeight;
	
	context = canvas.getContext('2d');
	postContext = document.getElementById('canvas').getContext('2d'); 
	
	if(isChrome){
		// Chrome already fits the designed font width offset
	}
	else{
		// determine actual font pixel width that the browser chooses
		var fs = getTestFontSize(font);
		colOffset = fs[0];
	}
	
	debug.log("font width offset: "+colOffset);
	
	// reset message index
	messageDisplayIndex = -1;
	
	// initialize map display array
	initMap();
}

var lastTime;
var delta;
var fps;
//Main game loop
function gameLoop(time){  

	if(!lastTime) {
		delta = 0;
		lastTime = time;
		fps = 0;
	}
	else{
		delta = (time - lastTime)/1000;
		lastTime = time;
		fps = 1/delta;
	}
	
	if(updateDisplay){	// only render new frames when needed
		updateDisplay = false;
		
		if(state == STATE_START){
			updateStartDisplay();
		}
		else if(state == STATE_MENU){
			updateMenuDisplay();
		}
		else if(state == STATE_GAME){
			updateGameDisplay();
		}
		else if(state == STATE_INVENTORY){
			updateInventoryDisplay();
		}
		
		if(debug.debug == true){
			drawFPS();
		}
		
		// draw the canvas in memory to the canvas on screen
		postContext.drawImage(canvas, 0, 0);
	}
	
	requestAnimFrame(gameLoop);
}  

/** shows the intro game screen/menu */
function updateStartDisplay(){
	//Draw the background
	drawBackground();
	
	if(!fontLoaded){
		// check to see if the font is loaded before displaying the game screen
		fontLoaded = fontdetect.isFontLoaded(fontName);
	}
	
	if(!fontLoaded || logoAlpha < 1){
		// font still isn't loaded, just show "loading...", then fade it out and the start screen in when it is loaded
		context.save();
		context.globalAlpha = 1 - logoAlpha;
		
		var xOffset = colOffset;
		var yOffset = fontOffset + rowOffset;
		
		context.fillStyle = colors.fgColor;
		context.fillText("Loading...", xOffset, yOffset);
		
		context.restore();
		
		// keep updating display until the font loads
		updateDisplay = true;
		
		if(!fontLoaded){
			// only show "loading..." until loaded
			return;
		}
	}
	
	// draw the game logo
	renderLogo();
	
	// draw "press something to start"
	renderPressKeyToStartButton();
	
	// render projectile
	renderProjectiles();
	
	// render floating messages
	renderFloatingMessages();
}

/** shows the in-game menu */
function updateMenuDisplay(){
	//Draw the background
	drawBackground();
	
	// draw the game logo
	renderLogo();
	
	//draw the in game or new game menu options/controls using '@' as the indicator for selection
	renderMenuOptions();
	
	// render projectiles
	renderProjectiles();
	
	// render floating messages
	renderFloatingMessages();
}

/** updates the display with the inventory/internal screen */
function updateInventoryDisplay(){
	//Draw the background
	drawBackground();
	
	// render player weapon stats
	renderPlayerWeaponStats();
	
	// render heat scale to screen
	renderHeatScale();
	
	// render internal critical slots diagram
	renderCriticalSlots(playerMech);
	
	// TODO: display mech tonnage, speed, #heat sinks, critical status', etc in the right side of the screen
	
	// since the player can't see the mech ascii due to screen width all the time, show it now where the target one usually goes
	var xOffset = (numCols+1)*colOffset;
	var yOffset = topOffset;
	if(performAsciiRenders){
		renderAsciiMech(playerMech, (numCols+1)*colOffset, -fontOffset, colors.playerColor, true);
		
		yOffset += (rowOffset * 9);
	}
	
	// show mech summary stats on far right under the ascii image as well
	renderMechSummary(playerMech, xOffset, yOffset);
}

/** updates the display during the game state */
function updateGameDisplay(){
	
	if(projectiles.length > 0){
		// if projectiles or floating messages are still being rendered, do not proceed with the next player turn until they are done
		// but only prevent bots from moving while projectiles are still being animated
	}
	else if(isPlayerTurn() && floatingMessages.length == 0){
		// updates the movement points, weapon status, etc. for the player's new turn
		
		// check messages after each player action, for instance ammo explosions or fall damage
		var counter = createUnreadFloatMessages();
		
		if(playerEnded){
			// start the new turn
			prevPlayerHeatDiss = playerMech.heatDiss;
			
			newTurn(playerMech);
			playerTurnIndex ++;
			
			// check if destroyed just in case
			if(playerMech.isDestroyed()){
				createFloatMessage(playerMech.location, "DESTROYED", colors.sevHighColor, (counter*floatingDelay), 1.25);
				counter ++;
			}
			else if(playerMech.isShutdown()){
				// if the player is shutdown, skip their turn automatically and create a floating message "SHUTDOWN"
				moveNowhere(playerMech);
				
				createFloatMessage(playerMech.location, "SHUTDOWN", colors.sevHighColor, (counter*floatingDelay), 1.25);
				counter ++;
				
				window.setTimeout(autoEndPlayerTurn, 1000);
			}
			else{
				// show floating message of AP to help indicate it is the player turn again
				createFloatMessage(playerMech.location, "AP +"+playerMech.actionPoints, colors.playerColor, (counter*floatingDelay), 1);
				counter ++;
				
				if(playerMech.jumpPoints > 0){
					createFloatMessage(playerMech.location, "JP +"+playerMech.jumpPoints, colors.playerColor, (counter*floatingDelay*1.5), 1);
					counter ++;
				}
			}
			
			// reset move/fire
			playerEnded = false;
		}
		
		if(counter > 0){
			updateDisplay = true;
		}
	}
	else if(!isPlayerTurn()){// enemy turn
		
		// find which bot's turn it is and make sure other bots' threads aren't still running
		var turnBot = getCurrentTurnBot();
		
		if(turnBot == null){
			// no bot assigned to this mech, just skip its turn
			debug.log("ERROR: No bot assigned for mech "+getTurnMech().chassis);
			endTurn(getTurnMech());
			updateDisplay = true;
			return;
		}
		
		
		// in case the game is over and bot has no enemies, there's nothing more to do
		var liveEnemies = 0;
		var enemies = getEnemyMechs(turnBot.getMech());
		
		for(var i=0; i<enemies.length; i++){
			if(enemies[i] != null && !enemies[i].isDestroyed()){
				liveEnemies ++;
			}
		}
		// check messages after the new turn started, for instance ammo explosions or fall damage
		var counter = createUnreadFloatMessages();
		
		if(liveEnemies == 0){
			clearInterval(turnBot.intervalId);
		}
		else if(!turnBot.isPlaying()){
			// start the bot's turn
			turnBot.beginTurn();
			
			// check if destroyed just in case
			if(turnBot.getMech().isDestroyed()){
				createFloatMessage(turnBot.getMech().location, "DESTROYED", colors.sevHighColor, (counter*floatingDelay), 1.25);
				counter ++;
			}
			
			// start a thread to keep the bot moving
			turnBot.intervalId = setInterval(function(){
				
				if(state != STATE_GAME){
					// put the bot on hold until the game is returned to
					return;
				}
				
				var turnBot = getCurrentTurnBot();
				if(turnBot == null){
					updateDisplay = true;
					return;
				}
				
				// in case the game is over and bot has no enemies, there's nothing more to do
				var liveEnemies = 0;
				var enemies = getEnemyMechs(turnBot.getMech());
				for(var i=0; i<enemies.length; i++){
					if(enemies[i] != null && !enemies[i].isDestroyed()){
						liveEnemies ++;
					}
				}
				
				if(liveEnemies == 0){
					clearInterval(turnBot.intervalId);
					return;
				}
				
				// in case the UI needs to hold off on an action until the bot is done
				turnBot.setAwake(true);
				
				var botMech = turnBot.getMech();
				// purposefully getting the previous action of the bot's results so they don't appear on screen twice
				var botFire = turnBot.getWeaponsFired();
				var botTarget = turnBot.getTarget();
				debug.log("turn: "+turnBot.getTurnIndex()+" for "+botMech.variant+". id="+turnBot.intervalId);
				
				// now have the bot do something
				turnBot.doAction();
				
				if(botFire != null && botFire.length > 0){
					// add any result messages from the bot's actions
					for(var i=0; i<botFire.length; i++){
						var botWeapon = botFire[i].getWeapon();
						var botResult = botFire[i].getResult();
						
						if(botResult instanceof WeaponFireGameMessage){
							handleWeaponFire(botMech, botWeapon, botTarget, botResult);
						}
					}

					// clear the bot's stored result now that we've already dealt with it
					turnBot.clearWeaponsFired();
				}
				else if(botMech.isShutdown()){
					createFloatMessage(botMech.location, "SHUTDOWN", colors.sevHighColor);
				}
				
				turnBot.setAwake(false);
				
				updateDisplay = true;
				
			}, botTime);
			
			updateDisplay = true;
		}
	}
	
	// insert hex map to display array
	insertMap();
	// insert environment to display array
	insertEnvironment();
		
	// insert prone mech indicator
	insertProneIndicator();
	
	// insert other mechs to display array
	insertBots();
	
	// insert jump hex indicator after insertBots so it will display the number over them for use by DFA
	insertJumpIndicator();
	
	// insert player mech to display array
	insertPlayer();
	// insert highlight around player (if player turn)
	insertPlayerTurnIndicator();
	
	// insert highlight around target (if selected)
	insertTargetBracket();
	
	//Draw the background
	drawBackground();
	
	// draw the firing arc hexes under everything else since its a color mask
	renderFiringArcs();
	
	// render display array to screen
	renderDisplay();
	
	// render projectile
	renderProjectiles();
	
	// render floating messages
	renderFloatingMessages();
			
	// render player stats to screen
	renderPlayerStats();
	
	if(useHtalDamageDisplay){
		renderPlayerHtalDisplay();
	}
	else{
		renderPlayerDamageDisplay();
	}
	
	renderTargetStats();
	
	
	var turnMech = getTurnMech();
	if(turnMech != null && turnMech != playerMech){
		// if bot mech currently moving is offscreen, show an indicator to it
		if(turnMech.team != -1 && turnMech.team == playerMech.team){
			renderOffscreenIndicators(turnMech.location, colors.playerColor);
		}
		else{
			renderOffscreenIndicators(turnMech.location, colors.enemyColor);
		}
	}
	
	if(!playerMech.isDestroyed()){
		// if player mech is offscreen (from freelook), show an indicator to it
		renderOffscreenIndicators(playerMech.location, colors.playerColor);
	}
	
	
	// render heat scale to screen
	renderHeatScale();
	
	// render messages to screen
	renderMessages();
	
	
	if(gameOver == true){
		if(playerMech.isDestroyed()){
			// display the game over message
			renderGameOver();
			
			// automatically enable free look mode for spectating after death
			lookMode = true;
		}
		else{
			// display the game won message
			renderGameWon();
		}
	}
}

function autoEndPlayerTurn(){
	endPlayerTurn();
	
	updateDisplay = true;
}

function endPlayerTurn(){
	// grab some values for the display before the new turn updates/clears them
	prevPlayerHeatGen = playerMech.heatGen;
	
	playerEnded = true;
	
	endTurn(playerMech);
}

/**
 * gets the bot for the mech that is currently playing
 */
function getCurrentTurnBot(){
	var turnBot = null;
	var turnMech = getTurnMech();
	
	if(playerMech == turnMech){
		return null;
	}
	
	for(var i=0; i<enemyBots.length; i++){
		if(enemyBots[i].getMech() == turnMech){
			turnBot = enemyBots[i];
		}
		else if(enemyBots[i].intervalId != 0){
			clearInterval(enemyBots[i].intervalId);
			enemyBots[i].intervalId = 0;
		}
	}
	
	return turnBot;
}

/**
 * gets the bot that is piloting the given mech
 * @param mech
 * @returns
 */
function getMechBot(mech){
	if(playerMech == mech){
		return null;
	}
	
	for(var i=0; i<enemyBots.length; i++){
		if(enemyBots[i] != null && enemyBots[i].getMech() == mech){
			return enemyBots[i];
		}
	}
	
	return null;
}

function initMap(){
	// initialize the display array of characters as empty strings
	for(var y=0; y<numRows; y++){
		
		thisRow = [];
		for(var x=0; x<numCols; x++){
			thisRow[x] = new HexDisplay();
		}
		
		displayArray[y] = thisRow;
	}
}

var samplefps;
var samplefpsDelta;
function drawFPS(){
	// render FPS at top right
	context.save();
	context.font = font;
	
	var xOffset = screenWidth - (colOffset * 8);
	var yOffset = fontOffset;
	
	context.fillStyle = colors.fgColor;
	
	// only display a sampling of FPS
	if(!samplefps){
		samplefps = fps;
		samplefpsDelta = 0;
	}
	else{
		samplefpsDelta += delta;
		
		if(samplefpsDelta >= 0.25){
			samplefps = fps;
			samplefpsDelta = 0;
		}
	}
	context.fillText("fps:"+samplefps.toFixed(1), xOffset, yOffset);
	
	context.restore();
}

function drawBackground(){

	context.clearRect(0, 0, screenWidth, screenHeight);
	
	context.save();
	context.fillStyle = colors.bgColor;
	context.fillRect(0, 0, screenWidth, screenHeight);
	context.restore();
}

/**
 * renders game over display for when the player mech has been destroyed
 */
function renderGameOver(){
	context.save();
	context.font = gameOverFont;
	
	context.globalAlpha = 1.0 * (1/4);
	context.fillStyle = colors.sevHighColor;
	context.fillRect(0, 0, screenWidth, topOffset + rowOffset * 6);
	
	context.globalAlpha = 1.0;
	
	var xOffset = 0;
	var yOffset = rowOffset * 5 + fontOffset;
	
	context.fillStyle = colors.sevHighColor;
	context.fillText("You were destroyed!", xOffset, yOffset);
	
	context.restore();
}

/**
 * renders the game over display for when the player mech has beaten all enemies
 */
function renderGameWon(){
	context.save();
	context.font = gameOverFont;
	
	context.globalAlpha = 1.0 * (1/4);
	context.fillStyle = colors.playerColor;
	context.fillRect(0, 0, screenWidth, topOffset + rowOffset * 6);
	
	context.globalAlpha = 1.0;
	
	var xOffset = 0;
	var yOffset = rowOffset * 5 + fontOffset;
	
	context.fillStyle = colors.playerColor;
	context.fillText("You have won!", xOffset, yOffset);
	
	context.restore();
}

var logoMech = null;
var logoAlpha = 0.02;
function renderLogo(){
	context.save();
	context.font = logoFont;
	
	// render map background with an alpha mask over it so its not so bright
	visibleHexOffsetX = 0;
	visibleHexOffsetY = 0;
	numHexCols = 18;
	numHexRows = 2;
	
	insertMap(true);
	renderDisplay();
	
	// now for the alpha mask
	context.globalAlpha = logoAlpha * (2/3);
	context.fillStyle = colors.bgColor;
	context.fillRect(0, 0, topOffset + (numHexCols + 1) * colOffset * 4, (numHexRows + 1) * rowOffset * 4);
	
	if(logoAlpha < 1){
		context.globalAlpha = logoAlpha;
		logoAlpha += (0.5 * delta);
		updateDisplay = true;
	}
	else{
		context.globalAlpha = 1.0;
	}
	
	// render title of the game
	var xOffset = colOffset * 17;
	var yOffset = rowOffset * 9 + fontOffset;
	
	var logoStr = "R gueMek";
	context.fillStyle = colors.fgColor;
	context.fillText(logoStr, xOffset, yOffset);
	
	// render a target bracket in place of the "o" in RogueMek
	context.font = font;
	context.fillStyle = colors.enemyColor;
	for(var i=0; i<targetBracket.length; i++){
		var lineStr = getSpacing("", 6 * 4);
		
		// render an enemy "O" and its direction char
		var bracketStr = targetBracket[i];
		if(i == 1){
			lineStr += bracketStr.substring(0, 2) + '|' + bracketStr.substring(3);
		}
		else if(i == 2){
			lineStr += bracketStr.substring(0, 2) + 'O' + bracketStr.substring(3);
		}
		else{
			lineStr += bracketStr;
		}
		
		context.fillText(lineStr, 0,  yOffset + (i * rowOffset) - (rowOffset * 3) - fontOffset);
	}
	
	if(performAsciiRenders){
		// render a random mech image in ascii
		if(logoMech == null){
			var numMechs = MECHS.length - 1;
			var dieResult = getDieRollTotal(1, numMechs);
			logoMech = createMechFromMTF(dieResult - 1, true);
			logoMech.location = new Coords(-14,-2);
			logoMech.heading = 2;
		}
		
		renderAsciiMech(logoMech, colOffset, 0, colors.playerColor, true);
	}
	
	// render the player @ char on top of the ascii mech
	context.font = font;
	context.fillStyle = colors.playerColor;
	context.fillText('@', (colOffset * 2),  topOffset + rowOffset);
	context.fillText('\\', (colOffset * 3),  topOffset + (rowOffset*2));

	context.restore();
}

/** renders instruction to press something */
function renderPressKeyToStartButton(){
	context.save();
	context.font = font;
	context.fillStyle = colors.fgColor;
	context.globalAlpha = logoAlpha;
	
	var xOffset = colOffset * 16;
	var yOffset = rowOffset * 12 + topOffset;
	
	var pressText = "- press a key to begin -";
	context.fillText(pressText, xOffset,  yOffset);
	
	context.restore();
}


// Set up some things for displaying the menus
var NewGameMenuItem = new MenuItem("Start New Game", MENU_TYPE_MENU);
var ResumeGameMenuItem = new MenuItem("Resume Game", MENU_ITEM_ACTION);

var PlayerNameMenuItem = new MenuItem("Call Sign", MENU_ITEM_ENTRY);
var PlayerMechMenuItem = new MenuItem("Player Mech", MENU_TYPE_MENU);
var LaunchMenuItem = new MenuItem("Launch Arena", MENU_ITEM_ACTION);

var CustomBattleMenuItem = new MenuItem("Custom Battle", MENU_TYPE_MENU);
var LaunchCustomArenaMenuItem = new MenuItem("Launch Arena", MENU_ITEM_ACTION);
var LaunchCustomMenuItem = new MenuItem("Launch Random Map", MENU_ITEM_ACTION);
var AddBotMenuItem = new MenuItem("Add Bot", MENU_ITEM_ACTION);

var OptionsMenuItem = new MenuItem("Options", MENU_TYPE_MENU);
var ControlsMenuItem = new MenuItem("Controls", MENU_TYPE_MENU);
var ThemeMenuItem = new MenuItem("Theme", MENU_TYPE_MENU);

var SeparatorMenuItem = new MenuItem(null, MENU_ITEM_SEPARATOR);


/** makes sure any previously selected menu item objects are deselected so they won't mess up future calls to the menu */
function deselectAllMenuItems(){
	// TODO: deselect in a more automated fashion
	NewGameMenuItem.selected = false;
	ResumeGameMenuItem.selected = false;
	PlayerNameMenuItem.selected = false;
	PlayerMechMenuItem.selected = false;
	LaunchMenuItem.selected = false;
	CustomBattleMenuItem.selected = false;
	LaunchCustomMenuItem.selected = false;
	LaunchCustomArenaMenuItem.selected = false;
	AddBotMenuItem.selected = false;
	OptionsMenuItem.selected = false;
	ControlsMenuItem.selected = false;
	ThemeMenuItem.selected = false;
}


var NEW_GAME_MENU = {
	"item":		null,
	"menus":	[
		{"item":	NewGameMenuItem,
		 "menus":	[
		         	 {"item":	PlayerNameMenuItem,},
		         	 {"item":	PlayerMechMenuItem,},
		         	 {"item":	SeparatorMenuItem},
		         	 {"item":	LaunchMenuItem},
		         	 {"item":	CustomBattleMenuItem},
		         	],
		},
		{"item":	SeparatorMenuItem},
		{"item":	ControlsMenuItem},
		{"item":	ThemeMenuItem},
	]
};

var IN_GAME_MENU  = {
		"item":		null,
		"menus":	[
			{"item":	ResumeGameMenuItem},
			{"item":	SeparatorMenuItem},
			{"item":	ControlsMenuItem},
			{"item":	ThemeMenuItem},
		]
};

var END_GAME_MENU = {
	"item":		null,
	"menus":	[
	    {"item":	ResumeGameMenuItem},
		{"item":	NewGameMenuItem,
		 "menus":	[
		         	 {"item":	PlayerNameMenuItem,},
		         	 {"item":	PlayerMechMenuItem,},
		         	 {"item":	SeparatorMenuItem},
		         	 {"item":	LaunchMenuItem},
		         	{"item":	CustomBattleMenuItem},
		         	],
		},
		{"item":	SeparatorMenuItem},
		{"item":	ControlsMenuItem},
		{"item":	ThemeMenuItem},
	]
};

var menuHistory = [];		// store where the player was and is in the menus
var currentMenuIndex = 0;	// stores current selection in the current menu

// gets the top/root level menu
function getTopLevelMenu(){
	if(gameOver == true){
		return END_GAME_MENU;
	}
	
	return (gameStarted == true) ? IN_GAME_MENU : NEW_GAME_MENU;
}

// gets the menu for the current level
function getCurrentLevelMenu(){
	var topMenu = getTopLevelMenu();
	if(menuHistory.length == 0){
		return topMenu.menus;
	}
	
	var lastMenu = menuHistory[menuHistory.length - 1];
	
	if(lastMenu.menus == null)
		return [];
	
	return lastMenu.menus;
}

// gets the sub menu for the current menu level
function getCurrentSubMenu(){
	var menu = getCurrentLevelMenu();
	
	if(menu == null)
		return [];
	
	var subMenu = null;
	$.each(menu, function(key, value){
		if(key == currentMenuIndex){
			subMenu = value;
			return false;
		}
	});
	
	return subMenu;
}

// gets all menu item objects for the current menu level
function getCurrentMenuItems(){
	var menu = getCurrentLevelMenu();	
	return getMenuItems(menu);
}

// gets all menu item objects for the given menu
function getMenuItems(menu){
	var menuItems = [];
	$.each(menu, function(key, value){
		if(value.item != null){
			menuItems.push(value.item);
		}
	});
	
	return menuItems;
}

// gets the currently selected menu item
function getSelectedMenuItem(){
	var currentMenus = getCurrentMenuItems();
	return currentMenus[currentMenuIndex];
}

// selects the next available menu item
function selectNextMenuItem(){
	var currentMenus = getCurrentMenuItems();
	
	currentMenuIndex ++;
	if(currentMenuIndex >= currentMenus.length){
		currentMenuIndex = 0;
	}
	
	var testSelItem = getSelectedMenuItem();
	if(MENU_ITEM_SEPARATOR == testSelItem.getType()){
		selectNextMenuItem();
	}
	else if(MENU_ITEM_THEME == testSelItem.getType()){
		// set the theme that is currently selected
		setTheme(testSelItem.getName());
		
		// show some testing fire
		createThemeMenuTestFire();
	}
	else if(MENU_ITEM_SELECT_MECH == testSelItem.getType() 
			|| MENU_ITEM_SELECT_BOT == testSelItem.getType()){
		// fully load the selected mech so it can display full stats
		if(testSelItem.mech != null && testSelItem.mech.mtfIndex >= 0){
			var selectedMech = createMechFromMTF(testSelItem.mech.mtfIndex);
			testSelItem.mech = selectedMech;
		}
	}
}

// selects the previous available menu item
function selectPrevMenuItem(){
	var currentMenus = getCurrentMenuItems();
	
	currentMenuIndex --;
	if(currentMenuIndex < 0){
		currentMenuIndex = currentMenus.length - 1;
	}
	
	var testSelItem = getSelectedMenuItem();
	if(MENU_ITEM_SEPARATOR == testSelItem.getType()){
		selectPrevMenuItem();
	}
	else if(MENU_ITEM_THEME == testSelItem.getType()){
		// set the theme that is currently selected
		setTheme(testSelItem.getName());
		
		// show some testing fire
		createThemeMenuTestFire();
	}
	else if(MENU_ITEM_SELECT_MECH == testSelItem.getType()
			|| MENU_ITEM_SELECT_BOT == testSelItem.getType()){
		// fully load the selected mech so it can display full stats
		if(testSelItem.mech != null && testSelItem.mech.mtfIndex >= 0){
			var selectedMech = createMechFromMTF(testSelItem.mech.mtfIndex);
			testSelItem.mech = selectedMech;
		}
	}
}

//perform the current action or enter the current menu
function activateCurrentMenuItem(){
	var thisMenuItem = getSelectedMenuItem();
	if(thisMenuItem == null)
		return;
		
	thisMenuItem.selected = true;
	debug.log(thisMenuItem.getName()+": "+thisMenuItem.getType());
	
	if(MENU_TYPE_MENU == thisMenuItem.getType()){
		debug.log("Entering menu "+thisMenuItem.getName());
		
		var subMenu = getCurrentSubMenu();
		menuHistory.push(subMenu);
		currentMenuIndex = 0;
		
		if(ThemeMenuItem == thisMenuItem){
			// generate list of MENU_ITEM_THEME items to select and change the color theme
			var theme_list = [];
			for(var i=0; i<templates.length; i++){
				var thisTemplate = templates[i];
				if(colors == thisTemplate){
					currentMenuIndex = i;
				}
				
				var thisThemeItem = {"item":	new MenuItem(thisTemplate.getName(), MENU_ITEM_THEME)};
				theme_list.push(thisThemeItem);
			}
			
			subMenu.menus = theme_list;
		}
		else if(ControlsMenuItem == thisMenuItem){
			// TODO: put controls into proper objects that can be dynamically displayed and changed
			var controls_list = [];
			controls_list.push({"item":	new MenuItem("Note: future version will support control rebinding", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem(null, MENU_ITEM_SEPARATOR)});
			controls_list.push({"item":	new MenuItem("R - target nearest enemy mech", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("T/Y - target next/previous enemy mech", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("WASD or Arrow Keys - rotate and move mech", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem(". Period, Enter or Space - end turn", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("J - toggle jump jets (if equipped)", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("1-0 - fire weapon with indicated number slot", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("SHIFT 1-0 - group fire weapon with indicated number slot", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("\\ Backslash - toggle group fire mode (fire GRP indicated weapons with 'end turn')", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("P,K - punch/kick", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem(null, MENU_ITEM_SEPARATOR)});
			controls_list.push({"item":	new MenuItem("CTRL Mouse Wheel Up/Down - browser zoom in/out", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("L - toggle free look mode", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("PgUp/PgDn - scroll messages up/down", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("Home/End - scroll to first/last message", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("/ Forward Slash - toggle damage displays (HTAL/Numerical)", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("-/+ - decrease/increase animation time (better performance/smoother animations)", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("F - toggle firing arc display", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("H - toggle hex map numbers", MENU_ITEM_LIST)});
			controls_list.push({"item":	new MenuItem("[] Left/Right Square Brackets - cycle previous/next color theme", MENU_ITEM_LIST)});
			
			subMenu.menus = controls_list;
		}
		else if(CustomBattleMenuItem == thisMenuItem){
			generateCustomBattleMenu();
		}
		else if(thisMenuItem instanceof BotMechMenuItem){
			// generate mech menu for selection of enemy mech
			var mech_list = [];
			
			// insert RANDOM as selection
			var randomMechMenuItem = new MenuItem("???t RANDOM", MENU_ITEM_SELECT_BOT);
			randomMechMenuItem.mech = new Mech();
			mech_list.push({"item": randomMechMenuItem});
			
			var mtfMechList = getMechListFromMTF();
			for(var i=0; i<mtfMechList.length; i++){
				var thisMech = mtfMechList[i].getObj();
				var thisTonnage = mtfMechList[i].getValue();
				if(thisTonnage < 100)
					thisTonnage = " "+thisTonnage;
				thisTonnage += "t";
				
				var mechText = thisTonnage + getSpacing(thisTonnage, 5) + thisMech.chassis +" "+ thisMech.variant; 
			
				var thisMechSelectMenuItem = new MenuItem(mechText, MENU_ITEM_SELECT_BOT);
				thisMechSelectMenuItem.mech = thisMech;
				
				mech_list.push({"item": thisMechSelectMenuItem});
				
				// determine if this mech is the currently selected player mech to set the current index on it
				if(thisMenuItem.mech != null && thisMenuItem.mech.chassis == thisMech.chassis 
						&& thisMenuItem.mech.variant == thisMech.variant){
					currentMenuIndex = mech_list.length - 1;
					thisMechSelectMenuItem.mech = thisMenuItem.mech;
				}
			}
			
			subMenu.menus = mech_list;
		}
		else if(PlayerMechMenuItem == thisMenuItem){
			// generate mech menu for selection of player mech
			var mech_list = [];
			
			// insert RANDOM as selection
			var randomMechMenuItem = new MenuItem("???t RANDOM", MENU_ITEM_SELECT_MECH);
			randomMechMenuItem.mech = new Mech();
			mech_list.push({"item": randomMechMenuItem});
			
			var mtfMechList = getMechListFromMTF();
			for(var i=0; i<mtfMechList.length; i++){
				var thisMech = mtfMechList[i].getObj();
				var thisTonnage = mtfMechList[i].getValue();
				if(thisTonnage < 100)
					thisTonnage = " "+thisTonnage;
				thisTonnage += "t";
				
				var mechText = thisTonnage + getSpacing(thisTonnage, 5) + thisMech.chassis +" "+ thisMech.variant; 
			
				var thisMechSelectMenuItem = new MenuItem(mechText, MENU_ITEM_SELECT_MECH);
				thisMechSelectMenuItem.mech = thisMech;
				
				mech_list.push({"item": thisMechSelectMenuItem});
				
				// determine if this mech is the currently selected player mech to set the current index on it
				if(playerMech != null && playerMech.chassis == thisMech.chassis 
						&& playerMech.variant == thisMech.variant){
					currentMenuIndex = mech_list.length - 1;
					thisMechSelectMenuItem.mech = playerMech;
				}
			}
			
			subMenu.menus = mech_list;
		}
	}
	else if(PlayerNameMenuItem == thisMenuItem){
		if(PlayerNameMenuItem.newName == null){
			// allow player to enter a callsign
			PlayerNameMenuItem.newName = "";
		}
		else{
			// player is finished entering a callsign
			var newName = PlayerNameMenuItem.newName.trim();
			if(newName.length > 0 && newName.length <= 40){
				playerName = newName;
			}
			
			PlayerNameMenuItem.newName = null;
			PlayerNameMenuItem.selected = false;
		}
	}
	else if(AddBotMenuItem == thisMenuItem){
		customBotMechs.push(new Mech());
		
		// update custom battle menu
		generateCustomBattleMenu();
		
		// deselect menu item since it doesn't go into a menu
		AddBotMenuItem.selected = false;
	}
	else if(MENU_ITEM_SELECT_MECH == thisMenuItem.getType()
			|| MENU_ITEM_SELECT_BOT == thisMenuItem.getType()){
		// select this mech for the player, then return to the previous menu
		var selectedMech = thisMenuItem.mech;
		if(selectedMech != null && selectedMech.chassis != ""){
			// in case the menu was regenerated it may have not fully recreated the mech, in which case the mtfIndex will be available
			selectedMech = createMechFromMTF(selectedMech.mtfIndex);
		}
		else{
			selectedMech = new Mech();
		}
		
		if(MENU_ITEM_SELECT_MECH == thisMenuItem.getType()){
			selectedMech.team = playerMech.team;
			playerMech = selectedMech;
			
			// also make the mech in the logo be this mech
			logoMech = selectedMech;
		}
		
		// pop back to previous menu
		returnToPrevMenu();
		
		if(MENU_ITEM_SELECT_BOT == thisMenuItem.getType()){
			// set the enemy mech selection that was activated by peeking into the now current menu item that was popped back to
			var thisBotMenuItem = getSelectedMenuItem();
			thisBotMenuItem.mech = selectedMech;
			
			// bot mech menu index is offset due to having 3 menu items above the first bot menu item index
			var botMenuIndex = currentMenuIndex - 3;
			
			selectedMech.team = (customBotMechs[botMenuIndex] != null) ? customBotMechs[botMenuIndex].team : -1;
			customBotMechs[botMenuIndex] = selectedMech;
		}
	}
	else if(MENU_ITEM_THEME == thisMenuItem.getType()){
		// the theme would have already been set by selecting it, just return to the previous menu
		returnToPrevMenu();
	}
	else if(MENU_ITEM_LIST == thisMenuItem.getType()){
		// just return to the previous menu since this item does nothing more than display
		returnToPrevMenu();
	}
	else if(LaunchMenuItem == thisMenuItem
			|| LaunchCustomMenuItem == thisMenuItem
			|| LaunchCustomArenaMenuItem == thisMenuItem){
		
		if(LaunchMenuItem == thisMenuItem){
			// in case they customized the enemies then launched arena, clear out selections
			customBotMechs = null;
		}
		
		if(LaunchCustomMenuItem == thisMenuItem){
			// launch in a randomly generated map instead of the arena
			generateRandomMap = true;
		}
		else{
			generateRandomMap = false;
		}
		
		startGame();
		setState(STATE_GAME);
		
		// reset menu states
		menuHistory = [];
		currentMenuIndex = 0;
		deselectAllMenuItems();
	}
	else if(ResumeGameMenuItem == thisMenuItem){
		deselectAllMenuItems();
		
		resumeGame();
	}
}

/** generate custom battle menu, starting with one random enemy mech, ability to add another */
function generateCustomBattleMenu(){
	
	var custom_list = [];
	
	custom_list.push({"item":	new MenuItem("# Select a Mech and press a number key to set Team #", MENU_ITEM_LIST)});
	custom_list.push({"item":	new MenuItem(null, MENU_ITEM_SEPARATOR)});
	
	// show player mech (and team) here also for convenience
	custom_list.push({"item": PlayerMechMenuItem});
	
	if(customBotMechs == null){
		// insert one random enemy mech as default selection for a custom game
		customBotMechs = [new Mech()];
	}
	
	for(var i=0; i<customBotMechs.length ; i++){
		var thisMech = customBotMechs[i];
		
		var mechMenuItem = new BotMechMenuItem("Bot #"+(i+1), MENU_TYPE_MENU);
		mechMenuItem.mech = thisMech;
		
		custom_list.push({"item": mechMenuItem});
	}
	
	// add enemy mech option
	custom_list.push({"item":	AddBotMenuItem});
	
	// add separator, then launch option
	custom_list.push({"item":	new MenuItem(null, MENU_ITEM_SEPARATOR)});
	custom_list.push({"item":	LaunchCustomArenaMenuItem});
	custom_list.push({"item":	LaunchCustomMenuItem});
	
	var subMenu = menuHistory[menuHistory.length - 1];
	subMenu.menus = custom_list;
}

/** puts the game state back in with the stored map that was set aside */
function resumeGame(){
	// restore the game map
	setHexMap(storedHexMap);
	
	// put the game back on
	setState(STATE_GAME);
	autoCenterOnMech(playerMech);
	
	// reset menu states
	menuHistory = [];
	currentMenuIndex = 0;
}

// goes back to the previously shown menu
function returnToPrevMenu(){
	if(menuHistory.length == 0){
		if(IN_GAME_MENU == getTopLevelMenu()){
			// automatically return to game
			resumeGame();
		}
		return;
	}
	
	// pop the last menu off the history to go back
	menuHistory.pop();
	
	// set the menu index of the previously selected menu item, then deselect it
	var displayedMenus = getCurrentMenuItems();
	for(var i=0; i<displayedMenus.length; i++){
		var menuItem = displayedMenus[i];
		
		if(menuItem.isSelected()){
			currentMenuIndex = i;
			menuItem.selected = false;
			break;
		}
	}
}

/** renders the menu in whatever state it currently needs to be in */
function renderMenuOptions(){
	// determine which controls currently need to show, and which is currently selected
	var displayedMenus = getCurrentMenuItems();
	
	context.save();
	context.font = font;
	
	var xOffset = colOffset * 15;
	var yOffset = rowOffset * 10 + topOffset;
	
	var currentMenuName = null;
	
	if(menuHistory.length > 0){
		// show previous menu selection as the title of the new menu
		var prevMenu = getTopLevelMenu();
		if(menuHistory.length > 1){
			prevMenu = menuHistory[menuHistory.length - 2];
		}
			
		var prevMenuItems = getMenuItems(prevMenu.menus);

		context.fillStyle = colors.playerColor;
		
		for(var i=0; i<prevMenuItems.length; i++){
			var menuItem = prevMenuItems[i];
			
			if(menuItem.getName() != null && menuItem.isSelected()){
				currentMenuName = menuItem.getName();
				
				context.fillText(currentMenuName, xOffset,  yOffset);
				yOffset += (rowOffset * 2);
				
				if(ThemeMenuItem == menuItem){
					renderThemeMenuTestMap();
				}
			}
		}
	}
	else if(gameOver == true){
		// show score/deathboard above menu to start the next game
		var headingText = "Congratulations, you have ";
		if(prevPlayerMech.isDestroyed()){
			context.fillStyle = colors.enemyColor;
			headingText += "been DESTROYED!";
		}
		else{
			context.fillStyle = colors.playerColor;
			headingText += "WON!";
		}
		
		context.fillText(headingText, xOffset,  yOffset);
		yOffset += (rowOffset * 2);
		
		context.fillStyle = colors.fgColor;
		
		for(var i=0; i<turnOrder.length; i++){
			var thisMech = turnOrder[i];
			
			var boardText = (prevPlayerMech == thisMech) ? playerName : 
								((thisMech.team != -1 && thisMech.team == playerMech.team) ? "Friendly" : "Enemy");
			boardText += getSpacing(boardText, 15) + thisMech.chassis;
			boardText += getSpacing(boardText, 30) + thisMech.variant;
			
			if(thisMech.isDestroyed()){
				boardText += getSpacing(boardText, 40) + "DESTROYED";
			}
			else{
				boardText += getSpacing(boardText, 40) + "ALIVE";
			}
			
			context.fillText(boardText, xOffset,  yOffset);
			yOffset += rowOffset;
		}
		
		yOffset += (rowOffset * 3);
	}
	else{
		yOffset += (rowOffset * 2);
	}
	
	
	context.fillStyle = colors.fgColor;
	
	xOffset += colOffset * 3;
	
	var numItems = displayedMenus.length;
	
	// in case the menu has too many options an offset will be needed so they can scroll up/down the full list on screen 
	var maxItems = 15;
	var menuOffset = 0;
	if(numItems > maxItems && currentMenuIndex >= (maxItems / 2)){
		// calculate menu offset based on the current index position
		menuOffset = currentMenuIndex - Math.round(maxItems / 2) + 1;
		
		if(menuOffset + maxItems >= numItems){
			menuOffset = numItems - maxItems;
		}
	}
	
	if(menuOffset > 0){
		// draw indicator that there are more above
		context.fillText(getSpacing("", 7) + "^^^", xOffset,  yOffset - rowOffset);
	}
	
	for(var i=menuOffset; i<menuOffset + maxItems; i++){
		var menuItem = displayedMenus[i];
		if(menuItem == null){
			continue;
		}
		
		var itemName = menuItem.getName();
		
		if(itemName != null){
			context.fillStyle = colors.fgColor;
			context.fillText(itemName, xOffset,  yOffset);
			
			if(PlayerNameMenuItem == menuItem){
				// show the current player name next to it in the player color
				context.fillStyle = colors.playerColor;
				
				var callSign = playerName;
				if(PlayerNameMenuItem.newName != null){
					// player is currently entering a new callsign
					callSign = PlayerNameMenuItem.newName + "_";
				}
				
				var playerNameText = getSpacing("", 15) + callSign;
				context.fillText(playerNameText, xOffset,  yOffset);
			}
			else if(PlayerMechMenuItem == menuItem){
				// show the current mech next to it in the player color
				context.fillStyle = colors.playerColor;
				
				var mechName = "RANDOM";
				
				if(playerMech == null){
					playerMech = new Mech();
				}
				
				if(playerMech.chassis != ""){
					mechName = playerMech.chassis+" "+playerMech.variant;
				}
				
				var mechNameText = getSpacing("", 15) + mechName;
				context.fillText(mechNameText, xOffset,  yOffset);
				
				if(currentMenuName == CustomBattleMenuItem.getName()){
					// show the player's team next to it also
					// but only if at the custom battle menu
					var teamName = "No Team";
					if(playerMech.team != -1){
						teamName = "Team "+playerMech.team;
					}
					
					var mechTeamText = getSpacing("", 35) + teamName;
					context.fillText(mechTeamText, xOffset,  yOffset);
				}
			}
			else if(menuItem instanceof BotMechMenuItem){
				// show the bot mech next to it in the appropriate color
				context.fillStyle = colors.enemyColor;
				if(menuItem.mech != null && menuItem.mech.team != -1 
							&& menuItem.mech.team == playerMech.team){
					context.fillStyle = colors.playerColor;
				}
				
				var mechName = "RANDOM";
				if(menuItem.mech != null && menuItem.mech.chassis != ""){
					mechName = menuItem.mech.chassis+" "+menuItem.mech.variant;
				}
				
				var mechNameText = getSpacing("", 15) + mechName;
				context.fillText(mechNameText, xOffset,  yOffset);
				
				// show the bot's team next to it also
				var teamName = "No Team";
				if(menuItem.mech != null && menuItem.mech.team != -1){
					teamName = "Team "+menuItem.mech.team;
				}
				var mechTeamText = getSpacing("", 35) + teamName;
				context.fillText(mechTeamText, xOffset,  yOffset);
			}
		}
		
		if(currentMenuIndex == i){
			// display the selection '@-' characters
			context.fillStyle = colors.playerColor;
			context.fillText('@-', xOffset - (colOffset * 3),  yOffset);
			
			if(menuItem.mech != null &&
					(MENU_ITEM_SELECT_MECH == menuItem.getType()
						|| MENU_ITEM_SELECT_BOT == menuItem.getType())){
				
				var mech = menuItem.mech;
				
				var xInfoOffset = colOffset * 52;
				var yInfoOffset = rowOffset * 12 + topOffset;
				
				if(performAsciiRenders){
					renderAsciiMech(mech, colOffset * 50,  rowOffset * 7 + topOffset, colors.fgColor, true);
					
					yInfoOffset += (rowOffset * 8);
				}
				
				renderMechSummary(mech, xInfoOffset, yInfoOffset);
			}
		}
		
		yOffset += (rowOffset * 2);
	}
	
	if(numItems > menuOffset + maxItems){
		// draw indicator that there are more below
		context.fillStyle = colors.fgColor;
		context.fillText(getSpacing("", 7) + "vvv", xOffset,  yOffset);
	}
	
	context.restore();
}

function renderMechSummary(mech, xOffset, yOffset){
	context.save();
	context.font = font;
	
	context.fillStyle = colors.fgColor;
	
	// display the mech summary stats
	var rowText = "";
	context.fillStyle = colors.fgColor;
	
	// show chassis and variant under the ascii image
	rowText = mech.chassis;
	rowText += getSpacing(rowText, 12);
	var variantText = mech.variant;
	rowText += variantText;
	
	context.fillText(rowText, xOffset,  yOffset);
	yOffset += rowOffset;
	yOffset += rowOffset;
	
	
	// show move speed and max AP
	rowText = "";
	var speedText = "WalkMP:"+mech.walkMP;
	speedText += getSpacing(speedText, 12) + "AP:"+getMechAP(mech);
	rowText += speedText;
	
	context.fillText(rowText, xOffset,  yOffset);
	yOffset += rowOffset;
	
	// show jump MP
	rowText = "";
	var jumpText = "JumpMP:"+mech.jumpMP;
	jumpText += getSpacing(jumpText, 12) + "JP:"+getMechJP(mech);
	rowText += jumpText;
	
	context.fillText(rowText, xOffset,  yOffset);
	yOffset += rowOffset;
	yOffset += rowOffset;
	
	
	// show heat sinks
	rowText = "Heatsinks:    "+mech.heatSinks;
	
	context.fillText(rowText, xOffset,  yOffset);
	yOffset += rowOffset;
	
	// show heat dissipation
	rowText = "Dissipation: "+(mech.heatSinks/turnsPerRound).toFixed(1);
	
	context.fillText(rowText, xOffset,  yOffset);
	yOffset += rowOffset;
	yOffset += rowOffset;
	
	
	// weapons 1, 6
	rowText = "";
	
	var weaponText = getWeaponOnlyText(mech.weapons[0]);
	rowText += weaponText;
	
	rowText += getSpacing(weaponText, 12);
	
	weaponText = getWeaponOnlyText(mech.weapons[5]);
	rowText += weaponText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// weapons 2, 7
	rowText = "";
	
	weaponText = getWeaponOnlyText(mech.weapons[1]);
	rowText += weaponText;
	
	rowText += getSpacing(weaponText, 12);
	
	weaponText = getWeaponOnlyText(mech.weapons[6]);
	rowText += weaponText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// weapons 3, 8
	rowText = "";
	
	weaponText = getWeaponOnlyText(mech.weapons[2]);
	rowText += weaponText;
	
	rowText += getSpacing(weaponText, 12);
	
	weaponText = getWeaponOnlyText(mech.weapons[7]);
	rowText += weaponText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// weapons 4, 9
	rowText = "";
	
	weaponText = getWeaponOnlyText(mech.weapons[3]);
	rowText += weaponText;
	
	rowText += getSpacing(weaponText, 12);
	
	weaponText = getWeaponOnlyText(mech.weapons[8]);
	rowText += weaponText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// weapons 5, 0
	rowText = "";
	
	weaponText = getWeaponOnlyText(mech.weapons[4]);
	rowText += weaponText;
	
	rowText += getSpacing(weaponText, 12);
	
	weaponText = getWeaponOnlyText(mech.weapons[9]);
	rowText += weaponText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	context.restore();
}

/** creates a backdrop map so the player can preview the colors */
var THEME_TEST_MAP = [];
function createThemeTestMap(){
	if(THEME_TEST_MAP.length > 0)
		return;
		
	var numCols = 4;
	var numRows = 6;
	
	var testHexMap = [];
	for(var y=0; y<numRows; y++){
		var thisHexRow = [];
	
		for(var x=0; x<numCols; x++){
			thisHexRow[x] = new Hex();
		}
		
		testHexMap[y] = thisHexRow;
	}
	
	var row1 = testHexMap[0];
	var row2 = testHexMap[1];
	var row3 = testHexMap[2];
	var row4 = testHexMap[3];
	var row5 = testHexMap[4];
	var row6 = testHexMap[5];
	
	row1[1].elevation = 1;
	row1[2].elevation = 2;
	row1[3].elevation = 3;
	
	row2[1] = new TreeHex();
	row2[2] = new TreeHex();	row2[2].elevation = 1;
	row2[3] = new HeavyTreeHex();
	
	row3[1] = new TreeHex();
	row3[2] = new HeavyTreeHex();
	row3[3] = new RockHex();
	
	row4[0] = new WaterHex();
	row4[1] = new WaterHex();
	row4[2] = new WaterHex();
	row4[3] = new RockHex();
	
	row5[0] = new WaterHex();
	row5[1] = new WaterHex();	row5[1].elevation = -2;
	row5[2] = new WaterHex();	row5[1].elevation = -2;
	
	row6[0] = new WaterHex();
	row6[1] = new WaterHex();
	row6[2] = new WaterHex();
	
	setHexMap(testHexMap);
}

/** renders a portion of the map to the side of the screen so the colors can be viewed */
function renderThemeMenuTestMap(){
	// offset the theme map so its far to the right of the screen
	visibleHexOffsetX = -14;
	visibleHexOffsetY = -2;
	
	// create the underlying map in the model
	createThemeTestMap();
	
	// insert hex grid backdrop
	insertMap(true);
	// insert environment to display array
	insertEnvironment();
	
	// send map to display
	renderDisplay();
	
	// draw fake enemy target 
	context.font = font;
	context.fillStyle = colors.enemyColor;
	var xOffset = 0;
	var yOffset = fontOffset + rowOffset + (rowOffset * 4 * 5);
	
	// render and enemy "A" and its direction char
	var directionStr = getSpacing("", (14 * 4) + 1) + "\\";
	var fakeEnemyStr = getSpacing("", (14 * 4) + 2) + "A";
	
	context.fillText(directionStr, xOffset,  yOffset + (1 * rowOffset) - (rowOffset * 3) - fontOffset);
	context.fillText(fakeEnemyStr, xOffset,  yOffset + (2 * rowOffset) - (rowOffset * 3) - fontOffset);
}

/** fires some test shots so the player can preview the colors */
var testWeapons = [new WeaponPPC(LEFT_ARM), new WeaponLLAS(RIGHT_ARM), new WeaponAC20(LEFT_TORSO), new WeaponLRM20(RIGHT_TORSO), new WeaponSRM6(CENTER_TORSO)];
function createThemeMenuTestFire(){
	// just some random fireworks
	var numWeapons = testWeapons.length;
	var dieResult = getDieRollTotal(1, numWeapons);
	var weapon = testWeapons[dieResult - 1];
	var fireResult = new WeaponFireGameMessage(null, true, null, SEV_HIGH);
	
	var numProjectiles = weapon.getProjectiles();
	for(var i=0; i<numProjectiles; i++){
		
		if(weapon.isLRM()){
			fireResult.hitDamages.push(weapon.damage * 5);
			i += 4;
		}
		else{
			fireResult.hitDamages.push(weapon.damage);
		}
			
		fireResult.hitLocations.push(getDieRollTotal(1, 7));
	}
	
	var missed = (fireResult.hitLocations.length == 0);
	
	// convert click coordinates into hex coordinates
	var tgtLocation = new Coords(0, 2);
	
	var animationIndex = 0;
	if(isClusterWeapon(weapon))
		animationIndex = createClusterProjectile(logoMech, weapon, tgtLocation, fireResult);
	else if(WEAPON_BALLISTIC == weapon.getType())
		animationIndex = createBurstProjectile(logoMech, weapon, tgtLocation, fireResult);
	else
		animationIndex = createProjectile(logoMech, weapon, tgtLocation, missed);
	
	var delay = animationIndex;
	var counter = 0;
	for(var i=0; i<fireResult.hitLocations.length; i++){
		var floatMsg = getLocationText(fireResult.hitLocations[i])+" -"+fireResult.hitDamages[i];
		createFloatMessage(tgtLocation, floatMsg, colors.sevHighColor, delay + (counter*floatingDelay));
		
		counter ++;
	}
}

/** renders an ascii version of the image of the given mech */
function renderAsciiMech(mech, startX, startY, color, flip){
	var asciiString = getAsciiForMech(mech, flip);
	
	if(asciiString != null){
		var origFont = context.font;
		var origColor = context.fillStyle;
		
		var asciiImgArr = asciiString.split('\n');
		
		context.font = asciiFont;
		context.fillStyle = color;
		
		var numLines = asciiImgArr.length;
		for(var i=0; i<numLines; i++){
			var thisX = startX;
			var thisY = startY + (i * asciiRowOffset);
			
			context.fillText(asciiImgArr[i], thisX, thisY);
		}
		
		// restore original font
		context.font = origFont;
		context.fillStyle = origColor;
	}
}

function renderDisplay(){
	context.save();
	
	context.font = font;
	
	if(logoAlpha < 1){
		context.globalAlpha = logoAlpha;
	}
	
	for(var i=0; i<displayOrder.length; i++){
		var thisType = displayOrder[i];
		
		if(thisType == HEX_TYPE){
			context.fillStyle = colors.fgColor;
		}
		else if(thisType == TREE_TYPE){
			context.fillStyle = colors.treeColor;
		}
		else if(thisType == HEAVY_TREE_TYPE){
			context.fillStyle = colors.treeColor2;
		}
		else if(thisType == ROCK_TYPE || thisType == HEAVY_ROCK_TYPE){
			context.fillStyle = colors.rockColor;
		}
		else if(thisType == WATER_TYPE){
			context.fillStyle = colors.waterColor;
		}
		else if(thisType == DEEP_WATER_TYPE){
			context.fillStyle = colors.waterColor2;
		}
		else if(thisType == PLAYER_TYPE){
			context.fillStyle = colors.playerColor;
		}
		else if(thisType == ENEMY_TYPE){
			context.fillStyle = colors.enemyColor;
		}
		else if(thisType == BRACKET_TYPE){
			if(colors.bracketColor != null){
				context.fillStyle = colors.bracketColor;
			}
			else{
				context.fillStyle = colors.enemyColor;
			}
		}
		else{
			debug.log("unknown display type:"+thisType);
		}
		
		for(var y=0; y<numRows; y++){
			var thisRow = displayArray[y];
			
			var xOffset = 0;
			var yOffset = topOffset + (y * rowOffset);
			
			var rowText = "";
			for(var x=0; x<numCols; x++){
				if(thisRow[x].type === thisType)
					rowText += thisRow[x].displayChar;
				else
					rowText += ' ';
			}
			
			context.fillText(rowText, xOffset, yOffset);
		}
	}
	
	context.restore();
}

// spawn messages from any unread message source
function createUnreadFloatMessages(){
	var counter = 0;
	var unreadMessages = getUnreadMessages();
	
	for(var i=0; i<unreadMessages.length; i++){
		var thisMessage = unreadMessages[i];
		
		var messageMech = thisMessage.mech;
		
		if(thisMessage instanceof CriticalHitGameMessage){
			var floatMsg = "CRIT "+getLocationText(thisMessage.critLocation)+": "+thisMessage.critComponent;
			createFloatMessage(messageMech.location, floatMsg, colors.sevHighColor, (counter*floatingDelay), 1);
			counter ++;
		}
		else if(thisMessage instanceof AmmoExplosionGameMessage){
			for(var j=0; j<thisMessage.hitLocations.length; j++){
				var floatMsg = "AMMO EXP "+getLocationText(thisMessage.hitLocations[j])+" -"+thisMessage.hitDamages[j];
				createFloatMessage(messageMech.location, floatMsg, colors.sevHighColor, (counter*floatingDelay), 1);
				
				counter ++;
			}
		}
		else if(thisMessage instanceof WeaponFireGameMessage){
			if(thisMessage.hitLocations == null || thisMessage.hitLocations.length == 0){
				// null hit locations means the mech is standing back up
				var floatMsg = "MISS";
				createFloatMessage(messageMech.location, floatMsg, colors.sevHighColor, (counter*floatingDelay), 1);
				
				counter ++;
			}
			else{
				for(var j=0; j<thisMessage.hitLocations.length; j++){
					var floatMsg = getLocationText(thisMessage.hitLocations[j])+" -"+thisMessage.hitDamages[j];
					createFloatMessage(messageMech.location, floatMsg, colors.sevHighColor, (counter*floatingDelay), 1);
					
					counter ++;
				}
			}
		}
		else if(thisMessage instanceof MechFallingGameMessage){
			if(thisMessage.hitLocations == null || thisMessage.hitLocations.length == 0){
				// null hit locations means the mech is standing back up
				var floatMsg = "STANDING";
				createFloatMessage(messageMech.location, floatMsg, colors.fgColor, (counter*floatingDelay), 1);
				
				counter ++;
			}
			else{
				for(var j=0; j<thisMessage.hitLocations.length; j++){
					var floatMsg = "FALL DMG "+getLocationText(thisMessage.hitLocations[j])+" -"+thisMessage.hitDamages[j];
					createFloatMessage(messageMech.location, floatMsg, colors.sevHighColor, (counter*floatingDelay), 1);
					
					counter ++;
				}
			}
		}
		else if(thisMessage instanceof MechChargingGameMessage){
			if(thisMessage.hitLocations == null || thisMessage.hitLocations.length == 0){
				// null hit locations means the mech is standing back up
				var floatMsg = "CHARGE MISS";
				createFloatMessage(messageMech.location, floatMsg, colors.sevHighColor, (counter*floatingDelay), 1);
				
				counter ++;
			}
			else{
				for(var j=0; j<thisMessage.hitLocations.length; j++){
					var floatMsg = "CHARGE DMG "+getLocationText(thisMessage.hitLocations[j])+" -"+thisMessage.hitDamages[j];
					createFloatMessage(messageMech.location, floatMsg, colors.sevHighColor, (counter*floatingDelay), 1);
					
					counter ++;
				}
			}
		}
		else if(thisMessage instanceof DeathFromAboveGameMessage){
			if(thisMessage.hitLocations == null || thisMessage.hitLocations.length == 0){
				// null hit locations means the mech is standing back up
				var floatMsg = "DFA MISS";
				createFloatMessage(messageMech.location, floatMsg, colors.sevHighColor, (counter*floatingDelay), 1);
				
				counter ++;
			}
			else{
				for(var j=0; j<thisMessage.hitLocations.length; j++){
					var floatMsg = "DFA DMG "+getLocationText(thisMessage.hitLocations[j])+" -"+thisMessage.hitDamages[j];
					createFloatMessage(messageMech.location, floatMsg, colors.sevHighColor, (counter*floatingDelay), 1);
					
					counter ++;
				}
			}
		}
	}
	
	return counter;
}

// creates a thread to spawn a new upward floating message
function createFloatMessage(srcLocation, message, color, delay, durationMultiplier, staticMessage){
	if(isPlayerTurn() && !playerEnded){
		// show all floaters from player actions
	}
	else if(srcLocation.actualX != null && srcLocation.actualY != null){
		// show any floaters that were given specific screen x,y pixel location
	}
	else if(!isLocationInDisplayArea(srcLocation)){
		// only display the floater if it was in the display when not during the player's turn
		return -1;
	}
	
	var isStaticMessage = (staticMessage != null) ? staticMessage : false;
	
	var messageX;
	var messageY;
	if(srcLocation.actualX != null && srcLocation.actualY != null){
		messageX = srcLocation.actualX;
		messageY = srcLocation.actualY;
	}
	else{
		messageX = (getHexCol(srcLocation.x, srcLocation.y, true) * colOffset);
		messageY = (getHexRow(srcLocation.x, srcLocation.y, true) * rowOffset) + topOffset;
	}

	//debug.log("floater creating at "+messageX+", "+messageY+": "+message);
	
	var floatMessage = new FloatingMessage(messageX, messageY, message, color);
	floatMessage.isStatic = isStaticMessage;
	floatMessage.origLocation = srcLocation;
	
	if(!isStaticMessage){
		// check other nearby float messages to see if this message should be delayed automatically to appear after any existing floaters
		var highestDelay = -1;
		for(var i=0; i<floatingMessages.length; i++){
			var thisFloat = floatingMessages[i];
			if(thisFloat == null){
				continue;
			}
			
			var diffX = Math.abs(thisFloat.x - messageX);
			var diffY = Math.abs(thisFloat.y - messageY);
			
			if(diffX > (colOffset * 4) || diffY > (rowOffset * 2) - 1){
				// this float isn't near enough to consider
				continue;
			}
			
			if(thisFloat.delay != null && thisFloat.delay > 0 
					&& thisFloat.delay > highestDelay){
				highestDelay = thisFloat.delay;
			}
			else if(highestDelay < 0 
					&& thisFloat.startAnimationIndex - thisFloat.animationIndex < floatingDelay){
				highestDelay = 0;
			}
		}
		
		if(highestDelay >= 0){
			// apply the standard floating delay to this float message
			delay = highestDelay + floatingDelay;
		}
	}
	
	if(delay != null && delay > 0){
		// add # delay cycles before rendering
		floatMessage.delay = delay;
		floatMessage.render = false;
	}
	
	if(durationMultiplier != null && durationMultiplier > 0){
		// multiplier for the duration of the the floating message
		floatMessage.animationIndex = floatMessage.animationIndex * durationMultiplier;
	}
	
	// store starting animation index so it can later be used to determine how long it has been shown for
	floatMessage.startAnimationIndex = floatMessage.animationIndex;
	
	// send the message along
	floatingMessages.push(floatMessage);
	
	updateDisplay = true;
	
	return floatMessage.animationIndex;
}

// draws the floating messages being animated
function renderFloatingMessages(){
	
	var numMessages = floatingMessages.length;
	if(numMessages == 0){
		return;
	}
	
	var liveMessages = 0;
	
	for(var i=0; i<numMessages; i++){
		var floatMessage = floatingMessages[i];
	
		if(floatMessage.delay > 0){
			liveMessages ++;
			floatMessage.delay -= delta;
		}
		else{
			if(floatMessage.isStatic){
				// static messages do not move
			}
			else{
				// update floating message position properly based on the upwards direction
				var p = getMovementDestination(floatMessage.x, floatMessage.y, delta * floatingSpeed, 0);
				floatMessage.x = p.x;
				floatMessage.y = p.y;
			}
			
			floatMessage.animationIndex -= delta;
			
			if(floatMessage.animationIndex < 0){
				floatMessage.render = false;
			}
			else{
				floatMessage.render = true;
				liveMessages ++;
			}
		}
	}
	
	if(liveMessages == 0){
		// kill the thread by resetting the array
		floatingMessages = [];
		//debug.log("killing messages thread");
		
		return;
	}
			
	context.save();
	
	for(var i=0; i<numMessages; i++){
		var floatMessage = floatingMessages[i];
		if(floatMessage != null && floatMessage.render){
		
			if(floatMessage.isStatic && playerMech.location.equals(floatMessage.origLocation)){
				// do not show a static message that is in the player characters location before it had a chance to disappear
				continue;
			}
			
			// render a slight backdrop to the message so it is more visible against what is behind it
			context.globalAlpha = (floatMessage.animationIndex < floatingDelay) ? 0.67 * (floatMessage.animationIndex/floatingDelay) : 0.67;
			context.fillStyle = colors.bgColor;
			context.fillRect(floatMessage.x - (floatMessage.fontWidth/2), floatMessage.y - 15, 
						(floatMessage.message.length + 1) * floatMessage.fontWidth, 20);
			
			// render the message
			context.globalAlpha = (floatMessage.animationIndex < floatingDelay) ? 1.0 * (floatMessage.animationIndex/floatingDelay) : 1.0;
			context.font = floatMessage.font;
			context.fillStyle = floatMessage.color;
			context.fillText(floatMessage.message, floatMessage.x, floatMessage.y);
		}
	}
	
	context.restore();
	
	// keep updating display until floating messages are done
	updateDisplay = true;
}

// creates multiple projectiles with slight variations on the target position for effect
function createClusterProjectile(srcMech, weapon, tgtLocation, result){
	// spawn off more projectiles in slightly different target locations
	var numProjectiles = weapon.getProjectiles();
	
	var numMissed = numProjectiles;
	for(var i=0; i<result.hitDamages.length; i++){
		var thisDmg = result.hitDamages[i];
		
		numMissed -= (thisDmg / weapon.damage);
	}
	
	var lastAnimationIndex = 0;
	var counter = 0;
	for(var i=0; i<numProjectiles; i++){
		
		lastAnimationIndex = createProjectile(srcMech, weapon, tgtLocation, (numMissed > 0), true, counter * 0.03);
		counter ++;
		if(numMissed > 0)
			numMissed --;
	}
	
	// return with animationIndex to let the caller know how long the animation will last
	return lastAnimationIndex;
}

// creates multiple projectiles which follow each other in the same linear path for effect
function createBurstProjectile(srcMech, weapon, tgtLocation, result){
	var burstProjectiles = 3;
	var missed = true;
	for(var i=0; i<result.hitDamages.length; i++){
		var thisDmg = result.hitDamages[i];
		
		if(thisDmg > 0)
			missed = false;
	}
	
	var lastAnimationIndex = 0;
	var counter = 0;
	for(var i=0; i<burstProjectiles; i++){
		lastAnimationIndex = createProjectile(srcMech, weapon, tgtLocation, missed, false, (counter * 0.1));
		counter ++;
	}
	
	// return with animationIndex to let the caller know how long the animation will last
	return lastAnimationIndex;
}


// creates the thread to fire a projectile
function createProjectile(srcMech, weapon, tgtLocation, missed, isCluster, delay){

	var srcLocation = srcMech.location;
	if(srcLocation == null){
		return 0;
	}
	
	var srcInArea = isLocationInDisplayArea(srcLocation);
	var tgtInArea = isLocationInDisplayArea(tgtLocation);
	
	if(!(srcInArea || tgtInArea)){
		// don't draw the projectile if neither the source nor target are visible
		return 0;
	}
	
	var centerX = (getHexCol(srcLocation.x, srcLocation.y, true) * colOffset) + colOffset;
	var centerY = topOffset + (getHexRow(srcLocation.x, srcLocation.y, true) * rowOffset) + rowOffset;
	var centerPoint = new Point(centerX, centerY);
	
	var weaponPoint = getPositionFromLocationAngle(centerPoint, srcMech.heading, weapon.getLocation());
	var weaponX = weaponPoint.x;
	var weaponY = weaponPoint.y;
	
	var targetX = (getHexCol(tgtLocation.x, tgtLocation.y, true) * colOffset) + colOffset;
	var targetY = topOffset + (getHexRow(tgtLocation.x, tgtLocation.y, true) * rowOffset) + rowOffset;
	
		
	if(isCluster){
		// give cluster projectiles a tiny variation in the source and target pixel position for effect
		var randomPosNegX = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
		var randomPosNegY = (getDieRollTotal(1, 2) == 1) ? 1 : -1;

		var randomOffsetX = getDieRollTotal(1, 4) * randomPosNegX;
		var randomOffsetY = getDieRollTotal(1, 4) * randomPosNegY;
		
		weaponX += randomOffsetX;
		weaponY += randomOffsetY;
	
		// now for the target variation
		randomPosNegX = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
		randomPosNegY = (getDieRollTotal(1, 2) == 1) ? 1 : -1;

		randomOffsetX = getDieRollTotal(1, 8) * randomPosNegX;
		randomOffsetY = getDieRollTotal(1, 8) * randomPosNegY;
		
		targetX += randomOffsetX;
		targetY += randomOffsetY;
	}
	
	var weaponAngle;
	var weaponDistance;
	
	if(missed){
		// weapon missed, animate some random place away from target
		var randomPosNegAngle = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
		
		var randomAngleOffset = getDieRollTotal(1, 12) * randomPosNegAngle;
		var randomDistanceOffset = getDieRollTotal(4, 20);
		
		weaponAngle = getAngleToTarget(weaponX, weaponY, targetX, targetY) + randomAngleOffset;
		weaponDistance = getDistanceToTarget(weaponX, weaponY, targetX, targetY) + randomDistanceOffset;
	}
	else{
		// weapon hit, animate directly at target
		weaponAngle = getAngleToTarget(weaponX, weaponY, targetX, targetY);
		weaponDistance = getDistanceToTarget(weaponX, weaponY, targetX, targetY);
	}
	
	var weaponProjectile = new Projectile(weaponX, weaponY, weaponAngle);
	weaponProjectile.weapon = weapon;
	weaponProjectile.speed = getWeaponProjectileSpeed(weapon);
	
	if(delay != null && delay > 0){
		// add # delay cycles before rendering
		weaponProjectile.delay = delay;
		weaponProjectile.render = false;
	}
	
	// make each weapon projectile a different character
	if(weapon instanceof WeaponPPC){
		// TODO: come up with a non-character based projectile for the PPC
		weaponProjectile.font = "8pt Topaz-8";
		weaponProjectile.displayChar = "*";
	}
	else if(weapon instanceof WeaponMLAS 
			|| weapon instanceof WeaponLLAS 
			|| weapon instanceof WeaponSLAS){
		// beam projectile
		var randomOffsetX = 0;
		var randomOffsetY = 0;
		if(missed){
			var randomPosNegX = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
			var randomPosNegY = (getDieRollTotal(1, 2) == 1) ? 1 : -1;
			
			randomOffsetX = getDieRollTotal(1, 12) * randomPosNegX;
			randomOffsetY = getDieRollTotal(1, 12) * randomPosNegY;
		}
		
		weaponProjectile.src = new Point(weaponX, weaponY);
		weaponProjectile.dest = new Point(targetX + (colOffset/2) + randomOffsetX, targetY - (rowOffset/2) + randomOffsetY);
	}
	else if(weapon instanceof WeaponAC20 
			|| weapon instanceof WeaponAC10 
			|| weapon instanceof WeaponAC5
			|| weapon instanceof WeaponAC2
			|| weapon instanceof WeaponMGUN
			|| weapon instanceof WeaponFlamer ){
		
		// for ACs and Machine guns use lines of a given width and length
		if(weapon instanceof WeaponAC20){
			weaponProjectile.width = 3;
			weaponProjectile.length = 20;
		}
		else if(weapon instanceof WeaponAC10){
			weaponProjectile.width = 2.5;
			weaponProjectile.length = 15;
		}
		else if(weapon instanceof WeaponAC5 
				|| weapon instanceof WeaponFlamer){
			weaponProjectile.width = 2;
			weaponProjectile.length = 10;
		}
		else if(weapon instanceof WeaponAC2){
			weaponProjectile.width = 1;
			weaponProjectile.length = 10;
		}
		else if(weapon instanceof WeaponMGUN){
			weaponProjectile.width = 1;
			weaponProjectile.length = 5;
		}
	}
	else if(weapon instanceof WeaponSRM2
			|| weapon instanceof WeaponSRM4
			|| weapon instanceof WeaponSRM6
			|| weapon instanceof WeaponLRM5
			|| weapon instanceof WeaponLRM10
			|| weapon instanceof WeaponLRM15
			|| weapon instanceof WeaponLRM20){
			
		// LRMs fire in an arc so need source and destination values stored up front
		var isLRM = weapon.isLRM();
		if(isLRM){
			weaponProjectile.src = new Point(weaponX, weaponY);
			weaponProjectile.dest = new Point(targetX, targetY);
			
			var x0 = weaponX; var y0 = weaponY;
			var x1; var y1;
			var x2; var y2;
			var x3 = targetX; var y3 = targetY;
			
			// calculate control points for the curve
			var arcLeft = (x0 < x3);
			var arcLow = (y0 > y3);
			
			// use the location of the weapon and heading of the mech to determine the control points
			// so the arc appears to come from that side
			switch(weapon.location){
				case LEFT_ARM:
				case LEFT_TORSO:
				case LEFT_LEG:
					if(arcLeft && arcLow){
						arcLeft = false;
						arcLow = false;
					}
					else if(arcLeft && !arcLow){
						// already arcs correctly
					}
					else if(!arcLeft && !arcLow){
						arcLeft = true;
						arcLow = true;
					}
					else{// if(!arcLeft && arcLow){
						// already arcs correctly
					}

					break;
					
				case RIGHT_ARM:
				case RIGHT_TORSO:
				case RIGHT_LEG:
					if(arcLeft && arcLow){
						// already arcs correctly
					}
					else if(arcLeft && !arcLow){
						arcLeft = false;
						arcLow = true;
					}
					else if(!arcLeft && !arcLow){
						// already arcs correctly
					}
					else{// if(!arcLeft && arcLow){
						arcLeft = true;
						arcLow = false;
					}
					break;
				
				default: break;
			}

			
			if(arcLeft){
				// from left arc
				x1 = x0 + colOffset*8;
				x2 = x3 - colOffset*4;
			}
			else{
				// from right arc
				x1 = x0 - colOffset*8;
				x2 = x3 + colOffset*4;
			}
			
			if(arcLow){
				// from low arc
				y1 = y0 + rowOffset*8;
				y2 = y3 + rowOffset*4;
			}
			else{
				// from high arc
				y1 = y0 - rowOffset*8;
				y2 = y3 - rowOffset*4;
			}
			
			weaponProjectile.mid1 = new Point(x1, y1);
			weaponProjectile.mid2 = new Point(x2, y2);
			
			//debug.log("LRM from ["+weaponProjectile.src.x+","+weaponProjectile.src.y+"] to ["+weaponProjectile.dest.x+","+weaponProjectile.dest.y+"]");
			//debug.log("    Mid1=["+ x1 +","+ y1 +"] Mid2=["+ x2 +","+ y2 +"]");
			
			// LRMs appear as circles
			weaponProjectile.radius = 1.25;
		}
		else{
			// SRMs appear as circles that are a bit larger than LRMs
			weaponProjectile.radius = 1.5;
		}
	}
	else{
		// do not display a projectile
		return;
	}
	
	if(weaponProjectile.speed == -1){
		return;
	}
	
	// use the weapon type to determine the projectile color
	if(weapon.getType() == WEAPON_ENERGY){
		if(colors.energyColor != null){
			weaponProjectile.color = colors.energyColor;
		}
		else{
			weaponProjectile.color = colors.sevHighColor;
		}
	}
	else if(weapon.getType() == WEAPON_BALLISTIC){
		if(colors.ballisticColor != null){
			weaponProjectile.color = colors.ballisticColor;
		}
		else{
			weaponProjectile.color = colors.fgColor;
		}
	}
	else if(weapon.getType() == WEAPON_MISSILE){
		if(colors.missileColor != null){
			weaponProjectile.color = colors.missileColor;
		}
		else{
			weaponProjectile.color = colors.fgColor;
		}
	}
		
	if(weapon instanceof WeaponMLAS 
			|| weapon instanceof WeaponLLAS 
			|| weapon instanceof WeaponSLAS){
		// lasers are solid lines, so instead of using speed just set a duration in seconds
		weaponProjectile.animationIndex = (weapon instanceof WeaponLLAS) ? 0.5 : 0.4;
	}
	else{
		// use the distance and speed of the projectile to determine how many cycles it needs to display (t = px/(px/s))
		weaponProjectile.animationIndex = weaponDistance / weaponProjectile.speed;
	}
	
	// store the original index so it can be used to calculate elapsed time
	weaponProjectile.startAnimationIndex = weaponProjectile.animationIndex;
	
	// send the projectile along
	projectiles.push(weaponProjectile);
	
	updateDisplay = true;
	
	// return with animationIndex to let the caller know how long the animation will last
	return weaponProjectile.animationIndex;
}

/** gets the animated projectile speed (px per second) of the given weapon */
function getWeaponProjectileSpeed(weapon){
	var projectileSpeed = -1;
	if(weapon instanceof WeaponPPC){
		projectileSpeed = 500;
	}
	else if(weapon instanceof WeaponMLAS 
			|| weapon instanceof WeaponLLAS 
			|| weapon instanceof WeaponSLAS){
		// lasers are lines, so their speed only affects their duration
		projectileSpeed = 600;
	}
	else if(weapon instanceof WeaponAC20 
			|| weapon instanceof WeaponAC10 
			|| weapon instanceof WeaponAC5
			|| weapon instanceof WeaponFlamer){

		projectileSpeed = 400;
	}
	else if(weapon instanceof WeaponAC2
			|| weapon instanceof WeaponMGUN){
			
		projectileSpeed = 500;
	}
	else if(weapon instanceof WeaponSRM2
			|| weapon instanceof WeaponSRM4
			|| weapon instanceof WeaponSRM6
			|| weapon instanceof WeaponLRM5
			|| weapon instanceof WeaponLRM10
			|| weapon instanceof WeaponLRM15
			|| weapon instanceof WeaponLRM20){
		
		if(weapon.isLRM()){
			projectileSpeed = 200;
		}
		else{
			projectileSpeed = 300;	
		}
	}

	return projectileSpeed;
}

/** 
 * Using the Point object of center reference, mech heading, and a mech limb location will return the Point on screen from where it should be.
 * e.g. to display the weapon fire coming from the left arm, it should be 90 degrees counter clockwise from the heading
 */ 
function getPositionFromLocationAngle(p, heading, location){
	var radius = colOffset;
	var headingAngle = 0;
	var locationAngle = 0;
	
	switch(heading){
		case 0: //"N"
			headingAngle = 270;
			break;
			
		case 1: //"NE"
			headingAngle = 330;
			break;
			
		case 2: //"SE"
			headingAngle = 30;
			break;
			
		case 3: //"S"
			headingAngle = 90;
			break;
			
		case 4: //"SW"
			headingAngle = 150;
			break;
			
		case 5: //"NW"
			headingAngle = 210;
			break;
	}
	
	switch(location){
		case LEFT_ARM:
			locationAngle = -90;
			break;
			
		case LEFT_TORSO:
		case LEFT_LEG:
			locationAngle = -60;
			break;
		
		case RIGHT_ARM:
			locationAngle = 90;
			break;
			
		case RIGHT_TORSO:
		case RIGHT_LEG:
			locationAngle = 60;
			break;
			
		case LEFT_REAR:
			locationAngle = 210;
			break;
			
		case RIGHT_REAR:
			locationAngle = 150;
			break;
			
		case CENTER_REAR:
			locationAngle = 180;
			break;
			
		default: break;
	}
	
	var angleInRadians = (headingAngle + locationAngle) * Math.PI / 180;
	
	var x = p.x + Math.cos(angleInRadians) * radius;
	var y = p.y + Math.sin(angleInRadians) * radius;
	
	return new Point(x, y);
}

// updates and draws the projectiles being fired/animated
function renderProjectiles(){
	
	// update the positions of the projectiles first (and determine if there are none left to render)
	var numProjectiles = projectiles.length;
	if(numProjectiles == 0){
		return;
	}
	
	var liveProjectiles = 0;
	
	for(var i=0; i<numProjectiles; i++){
		var weaponProjectile = projectiles[i];
	
		// update projectile position properly based on direction being fired (speed is in px/second since delta is also in seconds)
		var p = null;
		
		if(weaponProjectile.delay != null && weaponProjectile.delay > 0){
			weaponProjectile.delay -= delta;
		}
		else if(weaponProjectile.src != null 
				&& weaponProjectile.mid1 != null &&  weaponProjectile.mid2 != null 
				&& weaponProjectile.dest != null){
			// this is an arced projectile
			var t = 1 - weaponProjectile.animationIndex/weaponProjectile.startAnimationIndex;
			p = getCurveDestination(weaponProjectile.src, weaponProjectile.mid1, weaponProjectile.mid2, weaponProjectile.dest, t);
		}
		else{
			p = getMovementDestination(weaponProjectile.x, weaponProjectile.y, delta * weaponProjectile.speed, weaponProjectile.angle);
		}
			
		if(p != null){
			weaponProjectile.x = p.x;
			weaponProjectile.y = p.y;
			
			weaponProjectile.render = true;
			weaponProjectile.animationIndex -= delta;
		}
		
		if(weaponProjectile.animationIndex < 0){
			weaponProjectile.render = false;
		}
		else{
			liveProjectiles ++;
		}
	}
	
	if(liveProjectiles == 0){
		// kill the thread by resetting the array
		projectiles = [];
		//debug.log("killing projectiles thread");
		
		return;
	}
	
	context.save();
	
	for(var i=0; i<numProjectiles; i++){
		var weaponProjectile = projectiles[i];
		if(weaponProjectile.render){
			var weapon = weaponProjectile.weapon;
			
			//debug.log(i+": projectile at "+weaponProjectile.x+","+weaponProjectile.y+"   animIndex="+weaponProjectile.animationIndex);
			if(weapon instanceof WeaponMLAS 
					|| weapon instanceof WeaponLLAS 
					|| weapon instanceof WeaponSLAS){
				// render a beam instead of a moving projectile
				context.beginPath();
				
				context.moveTo(weaponProjectile.src.x, weaponProjectile.src.y);
			    context.lineTo(weaponProjectile.dest.x, weaponProjectile.dest.y);
				
			    // adjust the line width amount based on small/medium/large laser
			    var animIndexDiff = weaponProjectile.startAnimationIndex - weaponProjectile.animationIndex;
			    
			    if(animIndexDiff <  weaponProjectile.startAnimationIndex / 5){
			    	context.lineWidth = 1;
			    }
			    else if(animIndexDiff <  2*weaponProjectile.startAnimationIndex / 5){
			    	context.lineWidth = (weapon instanceof WeaponMLAS || weapon instanceof WeaponLLAS) ? 2 : 1;
			    }
			    else if(animIndexDiff <  3*weaponProjectile.startAnimationIndex / 5){
			    	context.lineWidth = (weapon instanceof WeaponLLAS) ? 3 : 2;
			    }
			    else if(animIndexDiff <  4*weaponProjectile.startAnimationIndex / 5){
			    	context.lineWidth = (weapon instanceof WeaponMLAS || weapon instanceof WeaponLLAS) ? 2 : 1;
			    }
			    else{
			    	context.lineWidth = 1;
			    }
			    
			    context.strokeStyle = weaponProjectile.color;
			    context.lineCap = 'round';
				context.stroke();
			}
			else if(weaponProjectile.font != null 
					&& weaponProjectile.displayChar != null){
				context.font = weaponProjectile.font;
				context.fillStyle = weaponProjectile.color;
				
				context.fillText(weaponProjectile.displayChar, weaponProjectile.x, weaponProjectile.y);
			}
			else if(weaponProjectile.radius > 0){
				var centerX = weaponProjectile.x;
				var centerY = weaponProjectile.y;
				var radius = weaponProjectile.radius;
				
				context.beginPath();
				context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
				
				context.fillStyle = weaponProjectile.color;
				
				context.fill();
			}
			else if(weaponProjectile.width > 0 && weaponProjectile.length > 0){
				// determine end point based on the projectile length from the current position
				var endPoint = getMovementDestination(weaponProjectile.x, weaponProjectile.y, weaponProjectile.length, weaponProjectile.angle);
				
				context.beginPath();
				context.moveTo(weaponProjectile.x, weaponProjectile.y);
			    context.lineTo(endPoint.x, endPoint.y);
			    
			    context.lineWidth = weaponProjectile.width;
			    context.strokeStyle = weaponProjectile.color;
			    context.lineCap = 'round';
			    
				context.stroke();
			}
		}
	}
	
	context.restore();
	
	// the projectiles are going to want to keep rendering until they are all done
	updateDisplay = true;
}

// gets some spaces to fill up total length based on input text's length
function getSpacing(text, desiredLength, fillChar){
	if(text == null)
		text = "";
	
	if(fillChar == null)
		fillChar = ' ';

	var spacing = "";
	for(var i=0; i<desiredLength - text.length; i++){
		spacing += fillChar;
	}
	
	return spacing;
}

// returns a string with only the weapon's name if exists
function getWeaponOnlyText(weapon){
	if(weapon == null){
		return "";
	}
	
	return weapon.shortName;
}

// returns a string with the format "index-location:name[ammo]<cooldown>/toHit%"
function getWeaponText(mech, index, weapon, toHit){
	var weaponText = "";
	
	weaponText += index + "-";
	
	if(weapon == null){
		weaponText += "";
	}
	else{
		// generate location based on index
		var locText = getLocationText(weapon.location);
		
		if(weapon.isGroupFiring()){
			// when group firing, display GRP instead of location
			locText = "GRP";
		}
		
		weaponText += locText + ":";
		
		weaponText += weapon.shortName;
		
		var ammoCount = getAmmoCount(mech, weapon);
		if(ammoCount >= 0){
			var ammoText = "["+ammoCount+"]";
			weaponText += ammoText;
		}
		
		if(weapon.cooldown > 0){
			var coolText = "";//"<"+weapon.cooldown+">";
			for(var i=0; i<weapon.cooldown; i++){
				coolText += ".";
			}
			weaponText += getSpacing(weaponText, 10);
			weaponText += coolText;
		}
		else{
			if(mech == playerMech && playerEnded){
				// don't show the to hit until the player's turn starts again properly
			}
			else if(ammoCount == 0){
				// don't show the to hit if there's no ammo
			}
			else if(weapon.isDestroyed()){
				// don't show the to hit if the weapon is destroyed
			}
			else if(getTurnMech() == mech && toHit != null && toHit >= 0){
				var hitText = "/"+toHit+"%";
				weaponText += hitText;
			}
		}
	}
	
	return weaponText;
}

// returns a string with the format "location:armor(internal)"
function getArmorText(index, mech){
	var armorText = "";
	
	var locText = getLocationText(index);
	armorText += locText + ":" + mech.armor[index];
	
	if(index < LEFT_REAR){
		armorText += "("+mech.internal[index]+")";
	}
	
	return armorText;
}

// returns a string with the format "xxyy"
function getHexText(x, y){
	var hexText = "Hex:";
	
	// hex numbers start at 1 instead of 0
	var hexX = x+1;
	var hexY = y+1;
	
	if(hexX<10) hexText+="0";
	hexText += hexX;
	
	if(hexY<10) hexText += "0";
	hexText += hexY;
	
	return hexText;
}

function renderHeatScale(){
	context.save();
	
	context.font = font;
	
	var xOffset = 0;
	var yOffset = topOffset + (rowOffset * (numRows + 10)) - (rowOffset * 21);

	context.fillStyle = colors.fgColor;
	
	var rowText = "";
	
	// start with rendering the top of the scale, then when we get to the heat that it is currently a
	// the indicator will be drawn and then SEV_HIGH color will be used if >=15 on the scale
	for(var i=40; i>=15; i--){
	
		if(playerMech.heat >= i){
			context.fillStyle = colors.sevHighColor;
		}
	
		var caseText = null;
		switch(i){
			case 40: 
					caseText = i+"|SD100%";
					break;
			case 38: 
					caseText = i+"|AE58%";
					break;
			case 36: 
					caseText = i+"|SD83%";
					break;
			case 35: 
					caseText = i+"| -5MP";
					break;
			case 34: 
					caseText = i+"|+4HIT";
					break;
			case 33: 
					caseText = i+"|AE28%";
					break;
			case 32:
					caseText = i+"|SD58%";
					 break;
			case 30:
					caseText = i+"| -4MP";
					break;
			case 29:
					caseText = i+"| AE8%";
					break;
			case 28:
					caseText = i+"|SD28%";
					break;
			case 27:
					caseText = i+"|+3HIT";
					break;
			case 25: 
					caseText = i+"| -3MP";
					break;
			case 24: 
					caseText = i+"| SD8%";
					break;
			case 23: 
					caseText = i+"|+2HIT";
					break;
			case 20: 
					caseText = i+"| -2MP";
					break;
			case 18: 
					caseText = i+"|+1HIT";
					break;
			case 15: 
					caseText = i+"| -1MP";
					break;
			default: 
					break;
		}
		
		if(caseText != null){
			if(playerMech.heat >= i){
				rowText = getSpacing("", numCols+1 + hexColWidth*3);
				rowText += "--> ";
			}
			else{
				rowText = getSpacing("", numCols+1 + hexColWidth*4);
			}
			
			rowText += caseText;
			
			context.fillText(rowText, xOffset, yOffset);
			yOffset += rowOffset;
		}
	}
	
	// show divider
	rowText = getSpacing("", numCols+1 + hexColWidth*4);
	var divText = "--|-----";
	rowText += divText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	// finally, show heat numbers
	rowText = getSpacing("", numCols+1 + hexColWidth*3 -1);
	
	var heatText = "Heat:" + playerMech.heat.toFixed(1);
	rowText += heatText;
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	// for heat diff, only show red when the generation is greater than the dissipation
	var heatGen = prevPlayerHeatGen.toFixed(1);
	var heatDiss = prevPlayerHeatDiss.toFixed(1);
	
	if( heatGen > heatDiss){
		context.fillStyle = colors.sevHighColor;
	}
	else{
		context.fillStyle = colors.fgColor;
	}
	// show divider indicator
	rowText = getSpacing("", numCols+1 + hexColWidth*4);
	var divText = "  ^";
	
	rowText += divText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	// show heat diff
	rowText = getSpacing("", numCols+1 + hexColWidth*3 -1);
	rowText += "Diff" + "+"+heatGen + " " + "-"+heatDiss;
	context.fillText(rowText, xOffset, yOffset);
	
	context.restore();
}

function renderOffscreenIndicators(tgtLocation, color){
	if(!isLocationInDisplayArea(tgtLocation)){
		context.save();
		
		context.font = font;
		context.fillStyle = color;
		
		var offHexX = -1;
		var offHexY = -1;
		
		if(tgtLocation.x >= visibleHexOffsetX && tgtLocation.x < visibleHexOffsetX + maxVisibleHexCols){
			offHexX = tgtLocation.x;
		}
		
		if(tgtLocation.y >= visibleHexOffsetY && tgtLocation.y < visibleHexOffsetY + maxVisibleHexRows){
			offHexY = tgtLocation.y;
		}
		
		var offX = (getHexCol(tgtLocation.x, tgtLocation.y) * colOffset);
		var offY = (getHexRow(tgtLocation.x, tgtLocation.y) * rowOffset) + fontOffset + rowOffset;
		
		if(offHexX == -1 && offHexY == -1){
			// mech is off to one of the corners
			if(tgtLocation.x < visibleHexOffsetX && tgtLocation.y < visibleHexOffsetY){
				context.fillText("###", offX + colOffset, offY += rowOffset);
				context.fillText("#\\", offX + colOffset, offY += rowOffset);
				context.fillText("#", offX + colOffset, offY += rowOffset);
			}
			else if(tgtLocation.x > visibleHexOffsetX && tgtLocation.y < visibleHexOffsetY){
				offX = ((maxVisibleHexCols*4) * colOffset) - colOffset*3;
				
				context.fillText("###", offX + colOffset, offY += rowOffset);
				context.fillText(" /#", offX + colOffset, offY += rowOffset);
				context.fillText("  #", offX + colOffset, offY += rowOffset);
			}
			else if(tgtLocation.x > visibleHexOffsetX && tgtLocation.y > visibleHexOffsetY){
				offX = ((maxVisibleHexCols*4) * colOffset) - colOffset*3;
				offY = ((maxVisibleHexRows*4) * rowOffset) + fontOffset;
				
				context.fillText("  #", offX + colOffset, offY += rowOffset);
				context.fillText(" \\#", offX + colOffset, offY += rowOffset);
				context.fillText("###", offX + colOffset, offY += rowOffset);
			}
			else{
				offY = ((maxVisibleHexRows*4) * rowOffset) + fontOffset;
				
				context.fillText("#", offX + colOffset, offY += rowOffset);
				context.fillText("#/", offX + colOffset, offY += rowOffset);
				context.fillText("###", offX + colOffset, offY += rowOffset);
			}
		}
		else if(offHexX == -1){
			// mech is off to the left or right
			if(tgtLocation.x < visibleHexOffsetX){
				context.fillText("#<", offX + colOffset, offY += rowOffset);
				context.fillText("#<", offX + colOffset, offY += rowOffset);
				context.fillText("#<", offX + colOffset, offY += rowOffset);
			}
			else{
				// set X at the right side of the map display
				offX = ((maxVisibleHexCols*4) * colOffset) - colOffset;
				
				context.fillText(">#", offX, offY += rowOffset);
				context.fillText(">#", offX, offY += rowOffset);
				context.fillText(">#", offX, offY += rowOffset);
			}
		}
		else{
			// mech is off to the top or bottom
			if(tgtLocation.y < visibleHexOffsetY){
				context.fillText("###", offX, offY += rowOffset);
				context.fillText("^^^", offX, offY += rowOffset);
			}
			else{
				// set Y at the bottom of the map display
				offY = ((maxVisibleHexRows*4) * rowOffset) + fontOffset + rowOffset;
				
				context.fillText("vvv", offX, offY += rowOffset);
				context.fillText("###", offX, offY += rowOffset);
			}
		}
		
		context.restore();
	}
}

function renderTargetStats(){
	context.save();
	
	if(targetMech != null && performAsciiRenders){
		renderAsciiMech(targetMech, (numCols+1)*colOffset, -fontOffset, colors.enemyColor, true);
	}
	
	
	context.font = font;
	
	var xOffset = 0;
	var yOffset = rowOffset;
	
	// first render the target, chassis, and variant in the enemy color
	context.fillStyle = colors.enemyColor;
	
	if(targetMech == null){
		// no target selected, just show to press a key to select a target
		if(isPlayerTurn()){
			yOffset += rowOffset;
			
			var rowText = getSpacing("", numCols);
			rowText += "Press 'r' to Target Nearest";
			context.fillText(rowText, xOffset, yOffset);
			yOffset += rowOffset;
			
			var rowText = getSpacing("", numCols);
			rowText += "Press 't' to Target Next";
			context.fillText(rowText, xOffset, yOffset);
			yOffset += rowOffset;
			
			var rowText = getSpacing("", numCols);
			rowText += "Press 'y' to Target Prev";
			context.fillText(rowText, xOffset, yOffset);
			yOffset += rowOffset;
		}
		
		return;
	}
	
	
	// if the target is offscreen, render some indicators pointing to it
	if(targetMech.team != -1 && targetMech.team == playerMech.team){
		renderOffscreenIndicators(targetMech.location, colors.playerColor);
	}
	else{
		renderOffscreenIndicators(targetMech.location, colors.enemyColor);
	}
	
	
	// render target display to the right of the screen
	var rowText = getSpacing("", numCols+1);
	
	var targetText = "Target";
	rowText += targetText;
	rowText += getSpacing(targetText, 12);
	
	var mechText = targetMech.chassis;
	rowText += mechText;
		
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	var rowText = getSpacing("", numCols+1);
	if(targetMech.isDestroyed())
		targetText = "Destroyed";
	else
		targetText = targetMech.tonnage +" tons";
	
	rowText += targetText;
	rowText += getSpacing(targetText, 12);
	
	var varText = targetMech.variant;
	rowText += varText;
	
	context.fillText(rowText, xOffset, yOffset);
	
	if(performAsciiRenders)
		yOffset += (rowOffset * 9);
	else
		yOffset += (rowOffset * 2);
	
	// render the rest in the normal foreground color
	context.fillStyle = colors.fgColor;
	
	// 2nd line: Hex, Range
	rowText = getSpacing("", numCols+1);
	
	var hexText = getHexText(targetMech.location.x, targetMech.location.y);
	rowText += hexText;
	
	rowText += getSpacing(hexText, 12);
	
	var rangeText = "Range:" + getRange(playerMech.location, targetMech.location);
	rowText += rangeText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// 3rd line: Heading, Relative Direction
	rowText = getSpacing("", numCols+1);
	
	var headingText = "Heading:"+getHeadingText(targetMech.heading);
	rowText += headingText;
	
	rowText += getSpacing(headingText, 12);
	
	var relText = "Arc:"+getRelativeDirection(playerMech, targetMech);
	rowText += relText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// 4th line, critical effects (e.g. shutdown, legged, fallen)
	var rowText = getSpacing("", numCols+1);
	context.fillStyle = colors.sevHighColor;
	if(targetMech.isLegged()){
		rowText += "Legged";
		rowText += "  ";
	}
	if(targetMech.isProne()){
		rowText += "Prone";
		rowText += "  ";
	}
	if(targetMech.isShutdown()){
		rowText += "Shutdown";
		rowText += "  ";
	}
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	// putting regular foreground color back
	context.fillStyle = colors.fgColor;
	
	
	// render the damage/htal display
	if(useHtalDamageDisplay){
		yOffset = renderTargetHtalDisplay(xOffset, yOffset);
	}
	else{
		yOffset = renderTargetDamageDisplay(xOffset, yOffset);
	}
	
	// put the foreground color back
	context.fillStyle = colors.fgColor;
	
	
	// 10th line: blank
	yOffset += rowOffset;

	
	// 11th line: 1, 6
	rowText = getSpacing("", numCols+1);
	
	var weaponText = getWeaponOnlyText(targetMech.weapons[0]);
	rowText += weaponText;
	
	rowText += getSpacing(weaponText, 12);
	
	weaponText = getWeaponOnlyText(targetMech.weapons[5]);
	rowText += weaponText;
	
	context.fillText(rowText, xOffset, yOffset);
	
	renderMechWeaponStrikethroughIfDestroyed(targetMech, 0, null, yOffset);
	renderMechWeaponStrikethroughIfDestroyed(targetMech, 5, null, yOffset);
	
	yOffset += rowOffset;
	
	
	// 12th line: 2, 7
	rowText = getSpacing("", numCols+1);
	
	weaponText = getWeaponOnlyText(targetMech.weapons[1]);
	rowText += weaponText;
	
	rowText += getSpacing(weaponText, 12);
	
	weaponText = getWeaponOnlyText(targetMech.weapons[6]);
	rowText += weaponText;
	
	context.fillText(rowText, xOffset, yOffset);
	
	renderMechWeaponStrikethroughIfDestroyed(targetMech, 1, null, yOffset);
	renderMechWeaponStrikethroughIfDestroyed(targetMech, 6, null, yOffset);
	
	yOffset += rowOffset;
	
	
	// 13th line: 3, 8
	rowText = getSpacing("", numCols+1);
	
	weaponText = getWeaponOnlyText(targetMech.weapons[2]);
	rowText += weaponText;
	
	rowText += getSpacing(weaponText, 12);
	
	weaponText = getWeaponOnlyText(targetMech.weapons[7]);
	rowText += weaponText;
	
	context.fillText(rowText, xOffset, yOffset);
	
	renderMechWeaponStrikethroughIfDestroyed(targetMech, 2, null, yOffset);
	renderMechWeaponStrikethroughIfDestroyed(targetMech, 7, null, yOffset);
	
	yOffset += rowOffset;
	
	
	// 14th line: 4, 9
	rowText = getSpacing("", numCols+1);
	
	weaponText = getWeaponOnlyText(targetMech.weapons[3]);
	rowText += weaponText;
	
	rowText += getSpacing(weaponText, 12);
	
	weaponText = getWeaponOnlyText(targetMech.weapons[8]);
	rowText += weaponText;
	
	context.fillText(rowText, xOffset, yOffset);
	
	renderMechWeaponStrikethroughIfDestroyed(targetMech, 3, null, yOffset);
	renderMechWeaponStrikethroughIfDestroyed(targetMech, 8, null, yOffset);
	
	yOffset += rowOffset;
	
	
	// 15th line: 5, 0
	rowText = getSpacing("", numCols+1);
	
	weaponText = getWeaponOnlyText(targetMech.weapons[4]);
	rowText += weaponText;
	
	rowText += getSpacing(weaponText, 12);
	
	weaponText = getWeaponOnlyText(targetMech.weapons[9]);
	rowText += weaponText;
	
	context.fillText(rowText, xOffset, yOffset);
	
	renderMechWeaponStrikethroughIfDestroyed(targetMech, 4, null, yOffset);
	renderMechWeaponStrikethroughIfDestroyed(targetMech, 9, null, yOffset);
	
	yOffset += rowOffset;
	
	yOffset += rowOffset;
	
	// 17th line +: target modifiers
	if(!playerMech.isDestroyed()){
		context.fillStyle = colors.enemyColor;
		
		rowText = getSpacing("", numCols+1);
		rowText += "TO HIT:";
		
		context.fillText(rowText, xOffset, yOffset);
		yOffset += rowOffset;
		
		var toHitMods = getToHitModifiers(playerMech, playerMech.weapons[0], targetMech);
		// first, look through for any IMPOSSIBLE modifers, and just show that if found
		var showDetailedToHitMods = true;
		for(var i=0; i<toHitMods.length; i++){
			var thisModifier = toHitMods[i];
			if(MODIFIER_IMPOSSIBLE == thisModifier.getType()){
				showDetailedToHitMods = false;
				
				rowText = getSpacing("", numCols+1);
				rowText += thisModifier.getType();
				
				context.fillText(rowText, xOffset, yOffset);
				yOffset += rowOffset;
			}
		}
		
		if(showDetailedToHitMods){
			// certain modifer types don't need to be shown since they are weapon specific,
			// since we only want to show the generic ones that apply to all weapons
			var ignoredModifierTypes = [MODIFIER_MIN_RANGE, MODIFIER_SHORT_RANGE, MODIFIER_MEDIUM_RANGE, MODIFIER_LONG_RANGE, MODIFIER_MAX_RANGE, 
			                            MODIFIER_KICK, MODIFIER_HATCHET, MODIFIER_CRIT];
			
			var numDisplayedMods = 0;
			
			for(var i=0; i<toHitMods.length; i++){
				var thisModifier = toHitMods[i];
				
				if(ignoredModifierTypes.indexOf(thisModifier.getType()) != -1){
					continue;
				}
				
				if(thisModifier.getValue() != 0){
					rowText = getSpacing("", numCols+1);
					
					var valueText = thisModifier.getValue();
					if(thisModifier.getValue() >= 0){
						valueText = "+"+valueText;
					}
					
					rowText += valueText +" "+ thisModifier.getType();
					
					context.fillText(rowText, xOffset, yOffset);
					yOffset += rowOffset;
					
					numDisplayedMods ++;
				}
			}
			
			if(numDisplayedMods == 0){
				// to avoid showing nothing, display something
				rowText = getSpacing("", numCols+1);
				rowText += "+0 NO MOVEMENT";
				
				context.fillText(rowText, xOffset, yOffset);
				yOffset += rowOffset;
			}
		}
	}
	
	
	context.restore();
}

function renderTargetDamageDisplay(xOffset, yOffset){
	// 4th line: Head (centered)
	var rowText = getSpacing("", numCols+1);
	rowText += getSpacing("", 5);
	
	var armorText = getArmorText(HEAD, targetMech);
	rowText += armorText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
		
	// 5th line: LA, RA
	rowText = getSpacing("", numCols+1);
	
	armorText = getArmorText(LEFT_ARM, targetMech);
	rowText += armorText;
	
	rowText += getSpacing(armorText, 12);
	
	armorText = getArmorText(RIGHT_ARM, targetMech);
	rowText += armorText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// 6th line: CT, CTR
	rowText = getSpacing("", numCols+1);
	
	armorText = getArmorText(CENTER_TORSO, targetMech);
	rowText += armorText;
	
	rowText += getSpacing(armorText, 12);
	
	armorText = getArmorText(CENTER_REAR, targetMech);
	rowText += armorText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// 7th line: LT, RT
	rowText = getSpacing("", numCols+1);
	
	armorText = getArmorText(LEFT_TORSO, targetMech);
	rowText += armorText;
	
	rowText += getSpacing(armorText, 12);
	
	armorText = getArmorText(RIGHT_TORSO, targetMech);
	rowText += armorText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// 8th line: LTR, RTR
	rowText = getSpacing("", numCols+1);
	
	armorText = getArmorText(LEFT_REAR, targetMech);
	rowText += armorText;
	
	rowText += getSpacing(armorText, 12);
	
	armorText = getArmorText(RIGHT_REAR, targetMech);
	rowText += armorText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// 9th line: LL, RL
	rowText = getSpacing("", numCols+1);
	
	armorText = getArmorText(LEFT_LEG, targetMech);
	rowText += armorText;
	
	rowText += getSpacing(armorText, 12);
	
	armorText = getArmorText(RIGHT_LEG, targetMech);
	rowText += armorText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	return yOffset;
}

/** Renders an HTAL graph display of the damage
0 _   _ _ _ _ _ _
1 |   | | | | | |
2 |_  |_| |_| |_|
3 ||  ||| ||| |||
4 ||  ||| ||| |||
5 HD  LTR CTR RTR
6  _  _   _  _	
7  |  |   |  | 	
8  |_ |_  |_ |_	
9  || ||  || ||	
0  || ||  || ||	
1  LA RA  LL RL	
*/
function renderTargetHtalDisplay(xOffset, yOffset){
	if(targetMech == null) return yOffset;
	
	// pre-determine each bars' amount based on the current armor and original armor values
	var armorPercents = targetMech.getPercentRemainingArmor();
	var internalPercents = targetMech.getPercentRemainingInternal();
	
	// create an array that corresponds to each column's location. The second occurrence of each is the internal, nulls are spaces.
	var percentCriticalSections1 = [];
	var percentCriticalSections2 = [];
	var percentDisplay1 = [HEAD, HEAD, null, 
						  LEFT_TORSO, LEFT_TORSO, LEFT_REAR, null,
						  CENTER_TORSO, CENTER_TORSO, CENTER_REAR, null,
						  RIGHT_TORSO, RIGHT_TORSO, RIGHT_REAR];
	var percentDisplay2 =[LEFT_ARM, LEFT_ARM, null, 
						  RIGHT_ARM, RIGHT_ARM, null, null,
						  LEFT_LEG, LEFT_LEG, null,
						  RIGHT_LEG, RIGHT_LEG];
	
	var percentLevels = [100, 75, 50, 25, 0];
	var percentLevelsInternal = [-1, -1, 100, 50, 0];
	
	var rowText = "";
	for(var part=1; part<=2; part++){
		// set which display array is to be drawn this loop
		var percentDisplay = (part == 1) ? percentDisplay1 : percentDisplay2;
		var percentCriticalSections = (part == 1) ? percentCriticalSections1 : percentCriticalSections2;
		
		for(var r=0; r<percentLevels.length; r++){
			for(var criticalLevelsOnly=0; criticalLevelsOnly<=1; criticalLevelsOnly++){
				if(criticalLevelsOnly == 1){
					context.fillStyle = colors.sevHighColor;
				}
				else{
					context.fillStyle = colors.fgColor;
				}
				
				rowText = getSpacing("", numCols+1);
				
				var prevLocation = null;
				
				for(var i=0; i<percentDisplay.length; i++){
					var thisLocation = percentDisplay[i];
					if(thisLocation == null){
						rowText += " ";
						continue;
					}
						
					var isInternal = (thisLocation == prevLocation);
					var thisPercent = isInternal ? internalPercents[thisLocation] : armorPercents[thisLocation];
					
					var thisLevel = isInternal ? percentLevelsInternal[r] : percentLevels[r];
					if(thisLevel == 100){
						if(criticalLevelsOnly == 0 && thisPercent == 100){
							// horizontal bar cap at 100 level only if at 100%
							rowText += "_";
						}
						else{
							rowText += " ";
						}
					}
					else if(thisLevel == -1){
						rowText += " ";
					}
					else if((criticalLevelsOnly == 1 
									&& ((!isInternal && thisPercent <= 20)
										|| (isInternal && thisPercent <= 34)))
							|| (criticalLevelsOnly == 0 
									&& ((!isInternal && thisPercent > 20)
											|| (isInternal && thisPercent > 34)))){
						// separated when armor/internal levels are critical so they can get a different color on the display
						
						var nextLevel = -1;
						if(r < percentLevels.length - 1){
							nextLevel = isInternal ? percentLevelsInternal[r+1] : percentLevels[r+1];
						}
						
						if(thisPercent > thisLevel){
							rowText += "|";
						}
						else if(nextLevel != -1 
								&& thisPercent > nextLevel){
							// horizontal bar cap at the level if its above the next level but below current
							rowText += "_";
						}
						else if(r == percentLevels.length - 1
								&& thisPercent == 0){
							// horizontal bar cap at the bottom if down to 0
							rowText += "_";
						}
						else{
							rowText += " ";
						}
						
						// have the section letter under the graph show as critical also
						if(criticalLevelsOnly == 1){
							percentCriticalSections[i] = thisPercent;
						}
					}
					else{
						rowText += " ";
					}
					
					prevLocation = thisLocation;
				}
				
				context.fillText(rowText, xOffset, yOffset);
			}
			
			yOffset += rowOffset;
		}
		
		// finally draw labels for locations
		var sectionText = (part == 1) ? "HD LTR CTR RTR" : "LA RA  LL RL";
		
		for(var criticalLevelsOnly=0; criticalLevelsOnly<=1; criticalLevelsOnly++){
			if(criticalLevelsOnly == 1){
				context.fillStyle = colors.sevHighColor;
			}
			else{
				context.fillStyle = colors.fgColor;
			}
			
			rowText = getSpacing("", numCols+1);

			for(var i=0; i<percentDisplay.length; i++){
				var thisLocation = percentDisplay[i];
				if(thisLocation == null){
					rowText += " ";
					continue;
				}
				
				if((criticalLevelsOnly == 1 && percentCriticalSections[i] != null)
						|| (criticalLevelsOnly == 0 && percentCriticalSections[i] == null)){
					rowText += sectionText.substring(i, i+1);
				}
				else{
					rowText += " ";
				}
			}
			
			
			context.fillText(rowText, xOffset, yOffset);
		}
		
		context.fillText(rowText, xOffset, yOffset);
		yOffset += rowOffset;
	
	}
	
	
	return yOffset;
}

function renderPlayerStats(){
	context.save();
	
	context.font = font;
	
	var rowText = "";
	
	var xOffset = 1;
	var yOffset = rowOffset;
	
	
	// start with the player name, chassis, variant at the top of the screen
	context.fillStyle = colors.playerColor;
	
	if(lookMode){
		rowText += "Free Look On";
	}	
	else if(playerMech.isDestroyed()){
		context.fillStyle = colors.sevHighColor;
		rowText += playerName +" @ "+ "has been destroyed";
	}
	else{
		rowText += playerName +" @ "+ playerMech.chassis +" "+ playerMech.variant;
	}

	// show turn number at top right
	var turnText = "Turn:"+playerTurnIndex;
	var spacing = getSpacing(rowText, numCols/2);
	if(spacing.length == 0) spacing = "  ";
	rowText += spacing + turnText;
		
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	// render a dashed top border
	context.fillStyle = colors.fgColor;
	rowText = "";
	for(var x=0; x<numCols; x++){
		if(visibleHexOffsetY < 0
					|| x + (visibleHexOffsetX*4) > numHexCols * 4 
					|| x + (visibleHexOffsetX*4) < 0){
			rowText += ".";
		}
		else{
			rowText += "-";
		}
	}
	context.fillText(rowText, xOffset, yOffset);
	
	
	// move on to the bottom of the screen
	yOffset = topOffset + (numRows * rowOffset);
	
	rowText = "";
	
	// render the player AP in the player color
	context.fillStyle = colors.playerColor;
	
	if(playerMech.isDestroyed()){
		context.fillStyle = colors.sevHighColor;
		var destText = "DESTROYED";
		rowText += destText;
	}
	else if(isPlayerTurn() && !playerEnded){
		var apText = "AP:" + playerMech.actionPoints;
		rowText += apText;
	}
	else{
		var waitText = "WAIT";
		rowText += waitText;
	}
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// jump jets (if any) and render any critical effects (being shutdown, fallen, etc)
	if(isPlayerTurn() && !playerEnded && playerMech.jumpMP > 0){
		var jumpText = "JP:"+playerMech.jumpPoints;
		context.fillText(jumpText, xOffset, yOffset);
	}
	
	
	context.fillStyle = colors.sevHighColor;
	
	if(playerMech.jumpMP > 0)
		rowText = getSpacing(rowText, 16);
	else
		rowText = "";
	
	if(playerMech.isLegged()){
		rowText += "Legged";
		rowText += "  ";
	}
	
	if(playerMech.isProne()){
		rowText += "Prone";
		rowText += "  ";
	}
	
	if(playerMech.isShutdown()){
		rowText += "Shutdown";
		rowText += "  ";
	}
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// if there's enough horizontal space, render the player's ascii mech at the bottom left of the screen
	if(renderPlayerAscii && performAsciiRenders){
		renderAsciiMech(playerMech, xOffset,  yOffset - fontOffset - (rowOffset * 1.5), colors.playerColor, false);
		
		// update the xOffset so the restof the display is to the right of the image
		xOffset = 1+ (colOffset * (5 * 4));
	}
	
	
	// render the rest in the normal foreground color
	context.fillStyle = colors.fgColor;
	
	// Hex, Heading, walking/running/jumping
	rowText = "";
	var hexText = getHexText(playerMech.location.x, playerMech.location.y);
	rowText += hexText;
	
	rowText += getSpacing(rowText, 12);
	
	var headingText = "Heading:"+getHeadingText(playerMech.heading);
	rowText += headingText;
	
	rowText += getSpacing(rowText, 24);
	
	var moveStatText = "";
	if(playerJumping){
		moveStatText = "Jumping";
	}
	else{
		moveStatText = getMechMovementStatus(playerMech);
	}
	
	rowText += moveStatText;
	
	context.fillText(rowText, xOffset, yOffset);
	
	
	var weaponOffset1 = 38;
	var weaponOffset2 = 58;
	
	// Group fire enabled displays directly above weapons in playerColor
	if(groupFireEnabled){
		context.fillStyle = colors.playerColor;
		rowText = getSpacing("", weaponOffset1) + "Group Fire Enabled";
		context.fillText(rowText, xOffset, yOffset);
		
		// if any weapons are queued up to fire, display total heat from them if fired
		var queuedHeat = 0;
		for(var i=0; i<playerMech.weapons.length; i++){
			var thisWeapon = playerMech.weapons[i];
			
			if(thisWeapon != null && thisWeapon.isGroupFiring()){
				queuedHeat += thisWeapon.getHeat();
			}
		}
		if(queuedHeat > 0){
			context.fillStyle = colors.sevHighColor;
			rowText = getSpacing("", weaponOffset2) + "+"+queuedHeat +" heat";
			context.fillText(rowText, xOffset, yOffset);
		}
		
		// put fgColor back
		context.fillStyle = colors.fgColor;
	}
	
	yOffset += rowOffset;
	
	
	// insert spacing
	yOffset += rowOffset;
	
	
	
	// Weapons 1, 6
	rowText = getSpacing("", weaponOffset1);
	
	var weaponText = getWeaponText(playerMech, 1, playerMech.weapons[0], Math.round(getToHitAsPercent(playerMech, playerMech.weapons[0], targetMech)));
	rowText += weaponText;
	if(playerMech.weapons[0] != null && playerMech.weapons[0].isGroupFiring()){
		// when group firing, display the weapon text in the player color for emphasis
		context.fillStyle = colors.playerColor;
	}else{
		context.fillStyle = colors.fgColor;
	}
	context.fillText(rowText, xOffset, yOffset);
	
	rowText = getSpacing("", weaponOffset2);
	
	weaponText = getWeaponText(playerMech, 6, playerMech.weapons[5], Math.round(getToHitAsPercent(playerMech, playerMech.weapons[5], targetMech)));
	rowText += weaponText;
	if(playerMech.weapons[5] != null && playerMech.weapons[5].isGroupFiring()){
		// when group firing, display the weapon text in the player color for emphasis
		context.fillStyle = colors.playerColor;
	}
	else{
		context.fillStyle = colors.fgColor;
	}
	
	context.fillText(rowText, xOffset, yOffset);
	
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 0, null, yOffset);
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 5, null, yOffset);
	
	yOffset += rowOffset;
	
	
	// Weapons 2, 7
	rowText = getSpacing("", weaponOffset1);
	
	weaponText = getWeaponText(playerMech, 2, playerMech.weapons[1], Math.round(getToHitAsPercent(playerMech, playerMech.weapons[1], targetMech)));
	rowText += weaponText;
	if(playerMech.weapons[1] != null && playerMech.weapons[1].isGroupFiring()){
		// when group firing, display the weapon text in the player color for emphasis
		context.fillStyle = colors.playerColor;
	}else{
		context.fillStyle = colors.fgColor;
	}
	context.fillText(rowText, xOffset, yOffset);
	
	rowText = getSpacing("", weaponOffset2);
	
	weaponText = getWeaponText(playerMech, 7, playerMech.weapons[6], Math.round(getToHitAsPercent(playerMech, playerMech.weapons[6], targetMech)));
	rowText += weaponText;
	if(playerMech.weapons[6] != null && playerMech.weapons[6].isGroupFiring()){
		// when group firing, display the weapon text in the player color for emphasis
		context.fillStyle = colors.playerColor;
	}else{
		context.fillStyle = colors.fgColor;
	}
	
	context.fillText(rowText, xOffset, yOffset);
	
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 1, null, yOffset);
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 6, null, yOffset);
	
	yOffset += rowOffset;
	

	// Weapons 3, 8
	rowText = getSpacing("", weaponOffset1);
	
	weaponText = getWeaponText(playerMech, 3, playerMech.weapons[2], Math.round(getToHitAsPercent(playerMech, playerMech.weapons[2], targetMech)));
	rowText += weaponText;
	if(playerMech.weapons[2] != null && playerMech.weapons[2].isGroupFiring()){
		// when group firing, display the weapon text in the player color for emphasis
		context.fillStyle = colors.playerColor;
	}else{
		context.fillStyle = colors.fgColor;
	}
	context.fillText(rowText, xOffset, yOffset);
	
	rowText = getSpacing("", weaponOffset2);
	
	weaponText = getWeaponText(playerMech, 8, playerMech.weapons[7], Math.round(getToHitAsPercent(playerMech, playerMech.weapons[7], targetMech)));
	rowText += weaponText;
	if(playerMech.weapons[7] != null && playerMech.weapons[7].isGroupFiring()){
		// when group firing, display the weapon text in the player color for emphasis
		context.fillStyle = colors.playerColor;
	}else{
		context.fillStyle = colors.fgColor;
	}
	
	context.fillText(rowText, xOffset, yOffset);
	
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 2, null, yOffset);
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 7, null, yOffset);
	
	yOffset += rowOffset;
	
	
	// Weapons 4, 9
	rowText = getSpacing("", weaponOffset1);
	
	weaponText = getWeaponText(playerMech, 4, playerMech.weapons[3], Math.round(getToHitAsPercent(playerMech, playerMech.weapons[3], targetMech)));
	rowText += weaponText;
	if(playerMech.weapons[3] != null && playerMech.weapons[3].isGroupFiring()){
		// when group firing, display the weapon text in the player color for emphasis
		context.fillStyle = colors.playerColor;
	}else{
		context.fillStyle = colors.fgColor;
	}
	context.fillText(rowText, xOffset, yOffset);
	
	rowText = getSpacing("", weaponOffset2);
	
	weaponText = getWeaponText(playerMech, 9, playerMech.weapons[8], Math.round(getToHitAsPercent(playerMech, playerMech.weapons[8], targetMech)));
	rowText += weaponText;
	if(playerMech.weapons[8] != null && playerMech.weapons[8].isGroupFiring()){
		// when group firing, display the weapon text in the player color for emphasis
		context.fillStyle = colors.playerColor;
	}else{
		context.fillStyle = colors.fgColor;
	}
	
	context.fillText(rowText, xOffset, yOffset);
	
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 3, null, yOffset);
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 8, null, yOffset);
	
	yOffset += rowOffset;
	
	
	// Weapons 5, 0
	rowText = getSpacing("", weaponOffset1);
	
	weaponText = getWeaponText(playerMech, 5, playerMech.weapons[4], Math.round(getToHitAsPercent(playerMech, playerMech.weapons[4], targetMech)));
	rowText += weaponText;
	if(playerMech.weapons[4] != null && playerMech.weapons[4].isGroupFiring()){
		// when group firing, display the weapon text in the player color for emphasis
		context.fillStyle = colors.playerColor;
	}else{
		context.fillStyle = colors.fgColor;
	}
	context.fillText(rowText, xOffset, yOffset);
	
	rowText = getSpacing("", weaponOffset2);
	weaponText = getWeaponText(playerMech, 0, playerMech.weapons[9], Math.round(getToHitAsPercent(playerMech, playerMech.weapons[9], targetMech)));
	rowText += weaponText;
	if(playerMech.weapons[9] != null && playerMech.weapons[9].isGroupFiring()){
		// when group firing, display the weapon text in the player color for emphasis
		context.fillStyle = colors.playerColor;
	}else{
		context.fillStyle = colors.fgColor;
	}
	
	context.fillText(rowText, xOffset, yOffset);
	
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 4, null, yOffset);
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 9, null, yOffset);
	
	yOffset += rowOffset;
	
	
	// Punch, Kick
	context.fillStyle = colors.fgColor;
	
	rowText = getSpacing("", weaponOffset1);
	
	// automatically only show the best potential punching arm
	var punchWeapon = getBestArmPunch(playerMech, targetMech);
	var punchToHit = Math.round(getToHitAsPercent(playerMech, punchWeapon, targetMech));
	
	weaponText = getWeaponText(playerMech, 'P', punchWeapon, punchToHit);
	rowText += weaponText;
	rowText += getSpacing(rowText, weaponOffset2);
	
	var kickWeapon = playerMech.melee[KICK];
	weaponText = getWeaponText(playerMech, 'K', kickWeapon, 
								Math.round(getToHitAsPercent(playerMech, playerMech.melee[KICK], targetMech)));
	rowText += weaponText;
	
	context.fillText(rowText, xOffset, yOffset);
	
	// for melee weapons, just passing a bogus index that is on the correct side of the display
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 0, punchWeapon, yOffset);
	renderMechWeaponStrikethroughIfDestroyed(playerMech, 5, kickWeapon, yOffset);
	
	yOffset += rowOffset;
	
	
	context.restore();
}

/**
 * this method will render a strikethrough if the indicated weapon is destroyed in the player/target stats
 * @param mech
 * @param weaponIndex
 * @param weapon
 * @param yOffset
 */
function renderMechWeaponStrikethroughIfDestroyed(mech, weaponIndex, weapon, yOffset){
	if(mech == null || mech.weapons == null 
			|| weaponIndex == null || weaponIndex < 0 
			|| yOffset < 0){
		return;
	}
	
	if(weapon == null){
		weapon = mech.weapons[weaponIndex];
	}
	else{
		// melee weapons will be passed in with a bogus weapon index but the object of their weapon
	}
	
	if(weapon == null || !weapon.isDestroyed()){
		return;
	}
	
	var xOffset = 0;
	var xWidth = 0;
	
	if(mech == playerMech){
		// if the player ascii mech is being rendered it will shift it over by some amount
		xOffset = (renderPlayerAscii && performAsciiRenders) ? 
				(1 + (colOffset * (5 * 4)) + (colOffset * 38)) 
				: (1 + (colOffset * 38));
				
		xWidth = colOffset * 14 ;
		
		if(weaponIndex >= 5){
			xOffset += (colOffset * 20);
		}
		
	}
	else{
		xOffset = 1 + (numCols+1) * colOffset;
		xWidth = colOffset * 6;
		
		if(weaponIndex >= 5){
			xOffset += (colOffset * 12);
		}
	}
	
	// draw line through the section text to indicate it is destroyed
	context.beginPath();

	context.moveTo(xOffset - colOffset, yOffset - (fontOffset / 2));
    context.lineTo(xOffset + xWidth + colOffset, yOffset - (fontOffset / 2));
	
	context.lineWidth = 2;
    context.strokeStyle = colors.sevHighColor;
	context.stroke();
}

function renderPlayerWeaponStats(){
	context.save();
	
	context.font = font;
	
	
	var rowText = "";
	
	var xOffset = 1;
	var yOffset = topOffset + (numRows * rowOffset);
	
	// render column headings for weapon stats
	context.fillStyle = colors.playerColor;
	
	rowText = getSpacing("", 3) + "LOC";
	rowText += getSpacing(rowText, 8) + "WPN";
	rowText += getSpacing(rowText, 18) + "DMG";
	rowText += getSpacing(rowText, 24) + "HEAT";
	rowText += getSpacing(rowText, 30) + "COOL";
	rowText += getSpacing(rowText, 36) + "AMMO";
	rowText += getSpacing(rowText, 44) + "MIN";
	rowText += getSpacing(rowText, 48) + "SHORT";
	rowText += getSpacing(rowText, 55) + "MED";
	rowText += getSpacing(rowText, 62) + "LONG";
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	// render full stats for all mounted weapons
	context.fillStyle = colors.fgColor;
	
	for(var i=0; i<playerMech.weapons.length; i++){
		var weapon = playerMech.weapons[i];
		
		context.fillStyle = colors.fgColor;
		
		// number first
		var rowText = (i+1).toString();
		if((i+1) == 10)	rowText = "0";
		rowText += "-";
		
		// weapon name
		if(weapon == null){
			rowText += getSpacing(rowText, 8) + "-";
		}
		else{
			rowText += getSpacing(rowText, 3) + getLocationText(weapon.location); //LOC
			rowText += getSpacing(rowText, 8) + weapon.shortName; //WPN
			
			if(weapon.isDestroyed()){
				rowText += getSpacing(rowText, 18) + "DESTROYED";
				context.fillStyle = colors.sevHighColor;
			}
			else{
				var damageText = weapon.damage;
				if(weapon.getProjectiles() > 1){
					damageText = weapon.getProjectiles() +"x"+ damageText;
				}
				rowText += getSpacing(rowText, 18) + damageText; //DMG
				
				rowText += getSpacing(rowText, 24) + weapon.heat; //HEAT
				
				rowText += getSpacing(rowText, 30) + weapon.speed; //COOL
				
				var ammoCount = getAmmoCount(playerMech, weapon);
				if(ammoCount < 0)	ammoCount = "-";
				rowText += getSpacing(rowText, 36) + ammoCount; //AMMO
				
				var minText = (weapon.minRange != null) ? weapon.minRange : "-";
				rowText += getSpacing(rowText, 44) + minText; //MIN
				
				var rangeArr = weapon.getRange();
				var shortText = 0 +"-"+ rangeArr[0];
				rowText += getSpacing(rowText, 48) + shortText; //SHORT
				
				var medText = (rangeArr[0]+1) +"-"+ rangeArr[1];
				rowText += getSpacing(rowText, 55) + medText; //MED
				
				var longText = (rangeArr[1]+1) +"-"+ rangeArr[2];
				rowText += getSpacing(rowText, 62) + longText; //LONG
			}
			
		}
		
		context.fillText(rowText, xOffset, yOffset);
		yOffset += rowOffset;
	}
	
	context.restore();
}

// renders the number based damage display for the player
function renderPlayerDamageDisplay(){
	context.save();
	
	context.font = font;
	
	context.fillStyle = colors.fgColor;
	
	var xOffset = 1;
	var yOffset = topOffset + (numRows * rowOffset);
	
	if(renderPlayerAscii && performAsciiRenders){
		// update the xOffset so the restof the display is to the right of the image
		xOffset = 1+ (colOffset * (5 * 4 + 1));
	}
	
	// skip down to where the display needs to start
	yOffset += 4 * rowOffset;
	
	
	// Head
	var rowText = "";
	
	rowText += getSpacing(rowText, 12);
	
	var hdText = getArmorText(HEAD, playerMech);
	rowText += hdText;

	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// Left Arm, Right Arm
	rowText = "";
	var laText = getArmorText(LEFT_ARM, playerMech);
	rowText += laText;
	
	rowText += getSpacing(rowText, 24);
	
	var raText = getArmorText(RIGHT_ARM, playerMech);
	rowText += raText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// LT, CT, RT
	rowText = "";
	var ltText = getArmorText(LEFT_TORSO, playerMech);
	rowText += ltText;
	
	rowText += getSpacing(rowText, 12);
	
	var ctText = getArmorText(CENTER_TORSO, playerMech);
	rowText += ctText;
	
	rowText += getSpacing(rowText, 24);
	
	var rtText = getArmorText(RIGHT_TORSO, playerMech);
	rowText += rtText;
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// LTR, CTR, RTR
	rowText = "";
	var ltrText = getArmorText(LEFT_REAR, playerMech);
	rowText += ltrText;
	
	rowText += getSpacing(rowText, 12);
	
	var ctrText = getArmorText(CENTER_REAR, playerMech);
	rowText += ctrText;
	
	rowText += getSpacing(rowText, 24);
	
	var rtrText = getArmorText(RIGHT_REAR, playerMech);
	rowText += rtrText;
		
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	
	// LL, RL
	rowText = "";
	var llText = "LL:"+playerMech.armor[LEFT_LEG]+"("+playerMech.internal[LEFT_LEG]+")";
	rowText += llText;
	
	rowText += getSpacing(rowText, 24);
	
	var rlText = "RL:"+playerMech.armor[RIGHT_LEG]+"("+playerMech.internal[RIGHT_LEG]+")";
	rowText += rlText;	
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	

	context.restore();
}

/** renders the HTAL bar graph damage display for the player
0_  _ _ _ _ _ _ _   _   _   _
1|  | | | | | | |   |   |   |
2|_ |_| |_| |_| |_  |_  |_  |_
3|| ||| ||| ||| ||  ||  ||  ||
4|| ||| ||| ||| ||  ||  ||  ||
5|| ||| ||| ||| ||  ||  ||  ||
6H  LTR CTR RTR LA  RA  LL  RL
*/
function renderPlayerHtalDisplay(){
	context.save();
	
	context.font = font;
	
	var xOffset = 1;
	var yOffset = topOffset + (numRows * rowOffset);
	
	if(renderPlayerAscii && performAsciiRenders){
		// update the xOffset so the restof the display is to the right of the image
		xOffset = 1+ (colOffset * (5 * 4 + 1));
	}
	
	// skip down to where the display needs to start
	yOffset += 3 * rowOffset;
	
	// pre-determine each bars' amount based on the current armor and original armor values
	var armorPercents = playerMech.getPercentRemainingArmor();
	var internalPercents = playerMech.getPercentRemainingInternal();
	
	// create an array that corresponds to each column's location. The second occurrence of each is the internal, nulls are spaces.
	var percentCriticalSections = [];
	var percentDisplay = [HEAD, HEAD, null, null,
						  LEFT_TORSO, LEFT_TORSO, LEFT_REAR, null,
						  CENTER_TORSO, CENTER_TORSO, CENTER_REAR, null,
						  RIGHT_TORSO, RIGHT_TORSO, RIGHT_REAR, null, null,
						  LEFT_ARM, LEFT_ARM, null, 
						  RIGHT_ARM, RIGHT_ARM, null, null,
						  LEFT_LEG, LEFT_LEG, null,
						  RIGHT_LEG, RIGHT_LEG];
	
	var percentLevels = [100, 80, 60, 40, 20, 0];
	var percentLevelsInternal = [-1, -1, 100, 67, 34, 0];
	
	for(var r=0; r<percentLevels.length; r++){
		for(var criticalLevelsOnly=0; criticalLevelsOnly<=1; criticalLevelsOnly++){
			
			if(criticalLevelsOnly == 1){
				context.fillStyle = colors.sevHighColor;
			}
			else{
				context.fillStyle = colors.fgColor;
			}
			
			var rowText = " ";
			
			var prevLocation = null;
			
			for(var i=0; i<percentDisplay.length; i++){
				var thisLocation = percentDisplay[i];
				if(thisLocation == null){
					rowText += " ";
					continue;
				}
					
				var isInternal = (thisLocation == prevLocation);
				var thisPercent = isInternal ? internalPercents[thisLocation] : armorPercents[thisLocation];
				
				var thisLevel = isInternal ? percentLevelsInternal[r] : percentLevels[r];
				if(thisLevel == 100){
					if(criticalLevelsOnly == 0 && thisPercent == 100){
						// horizontal bar cap at 100 level only if at 100%
						rowText += "_";
					}
					else{
						rowText += " ";
					}
				}
				else if(thisLevel == -1){
					rowText += " ";
				}
				else if((criticalLevelsOnly == 1 
								&& ((!isInternal && thisPercent <= 20)
									|| (isInternal && thisPercent <= 34)))
						|| (criticalLevelsOnly == 0 
								&& ((!isInternal && thisPercent > 20)
										|| (isInternal && thisPercent > 34)))){
					// separated when armor/internal levels are critical so they can get a different color on the display 
					
					var nextLevel = -1;
					if(r < percentLevels.length - 1){
						nextLevel = isInternal ? percentLevelsInternal[r+1] : percentLevels[r+1];
					}
					
					if(thisPercent > thisLevel){
						rowText += "|";
					}
					else if(nextLevel != -1 
							&& thisPercent > nextLevel){
						// horizontal bar cap at the level if its above the next level but below current
						rowText += "_";
					}
					else if(r == percentLevels.length - 1
							&& thisPercent == 0){
						// horizontal bar cap at the bottom if down to 0
						rowText += "_";
					}
					else{
						rowText += " ";
					}
					
					// have the section letter under the graph show as critical also
					if(criticalLevelsOnly == 1){
						percentCriticalSections[i] = thisPercent;
					}
				}
				else{
					rowText += " ";
				}
				
				prevLocation = thisLocation;
			}
			
			context.fillText(rowText, xOffset, yOffset);
		}
		
		yOffset += rowOffset;
	}

	
	// finally draw labels for locations
	var sectionText = "HD  LTR CTR RTR  LA RA  LL RL";
	
	for(var criticalLevelsOnly=0; criticalLevelsOnly<=1; criticalLevelsOnly++){
		if(criticalLevelsOnly == 1){
			context.fillStyle = colors.sevHighColor;
		}
		else{
			context.fillStyle = colors.fgColor;
		}
		
		rowText = " ";

		for(var i=0; i<percentDisplay.length; i++){
			var thisLocation = percentDisplay[i];
			if(thisLocation == null){
				rowText += " ";
				continue;
			}
			
			if((criticalLevelsOnly == 1 && percentCriticalSections[i] != null)
					|| (criticalLevelsOnly == 0 && percentCriticalSections[i] == null)){
				rowText += sectionText.substring(i, i+1);
			}
			else{
				rowText += " ";
			}
		}
		
		
		context.fillText(rowText, xOffset, yOffset);
	}
	
	yOffset += rowOffset;
	
	
	context.restore();
}

/** renders the latest or currently selected game message */
function renderMessages(){
	if(messages.length == 0)
		return;
		
	context.save();
	
	context.font = font;
	
	var xOffset = 1;
	var yOffset = topOffset + (numRows * rowOffset);
	
	var index = messages.length - 1;
	if(messageDisplayIndex >= 0 && messageDisplayIndex < messages.length){
		index = messageDisplayIndex;
	}
	
	var thisMessage = messages[index];
	
	while(index > 0 && thisMessage.message == null){
		// sometimes the last message may not contain a displayable message, so find one that does
		index --;
		thisMessage = messages[index];
	}
		

	if(thisMessage.severity == SEV_HIGH)
		context.fillStyle = colors.sevHighColor;
	else
		context.fillStyle = colors.fgColor;
	
	var rowText = getSpacing("", 12);
	
	var preText = null;
	if(thisMessage.message != null && 
			(messageDisplayIndex == -1 || messageDisplayIndex == messages.length-1)){
		preText = "> ";
	}
	else if(messageDisplayIndex == 0){
		preText = "< ";
	}
	else if(messageDisplayIndex > 0 && messageDisplayIndex < messages.length-1){
		preText = "^ ";
	}
	
	if(preText != null){
		rowText += preText + ((thisMessage.message != null) ? thisMessage.message : "");
	}
	
	context.fillText(rowText, xOffset, yOffset);
	
	context.restore();
	
	// limit the messages buffer
	if(messages.length > 250){
		messages.shift();
	}
}

/** displays all critical slots and status (when destroyed) for the mech */
function renderCriticalSlots(mech){
	// TODO: display some kind of divider or that generic mech outline in the background (as long as it doesn't interfere with being able to read the text)
	context.save();
	context.font = font;
	
	context.fillStyle = colors.fgColor;
	
	var rowText = "";
	
	context.fillText(rowText, xOffset, yOffset);
	yOffset += rowOffset;
	
	for(var show_destroyed=0; show_destroyed <= 1; show_destroyed ++){
		
		for(var loc=0; loc <= 7; loc++){
			var critSection = mech.crits[loc];
			
			var sectionTitle = getLocationName(loc).toUpperCase();
			
			// set the appropriate X spacing and yOffset to start the section
			var xOffset = 1;
			var yOffset = topOffset + rowOffset;
			
			var xSpacing = 1;
			
			var numCrits = critSection.length;
			if(HEAD == loc){
				xSpacing = 30;
				numCrits = 6;
			}
			else if(LEFT_ARM == loc){
				yOffset += (rowOffset * 18);
			}
			else if(CENTER_TORSO == loc){
				xSpacing = 30;
				yOffset += (rowOffset * 11);
			}
			else if(RIGHT_ARM == loc){
				xSpacing = 58;
				yOffset += (rowOffset * 18);
			}
			else if(LEFT_TORSO == loc){
				yOffset += (rowOffset * 4);
			}
			else if(RIGHT_TORSO == loc){
				xSpacing = 58;
				yOffset += (rowOffset * 4);
			}
			else if(LEFT_LEG == loc){
				xSpacing = 12;
				yOffset += (rowOffset * 32);
				numCrits = 6;
			}
			else if(RIGHT_LEG == loc){
				xSpacing = 46;
				yOffset += (rowOffset * 32);
				numCrits = 6;
			}
		
			rowText = getSpacing("", xSpacing);
			
			var critSectionDestroyed = false;
			if(show_destroyed == 1){
				if(mech.internal[loc] == 0){
					critSectionDestroyed = true;
					
					// draw line through the section text to indicate it is destroyed
					context.beginPath();
	
					context.moveTo((xSpacing * colOffset) - colOffset, yOffset - (fontOffset / 2));
				    context.lineTo((xSpacing * colOffset) + (sectionTitle.length * colOffset) + colOffset, yOffset - (fontOffset / 2));
					
					context.lineWidth = 2;
				    context.strokeStyle = colors.sevHighColor;
					context.stroke();
				}
			}
			else{
				rowText += sectionTitle;
			}
			
			context.fillText(rowText, xOffset, yOffset);
			yOffset += rowOffset;
			
			for(var i=0; i<numCrits; i++){
				var thisCrit = critSection[i];
				
				// TODO: show game name instead of MTF name (e.g SRM6 instead of ISSRM6)
				var critText = thisCrit.getName();
				
				if(thisCrit.isAmmo()){
					critText += "["+thisCrit.getAmmo()+"]";
				}
				
				rowText = getSpacing("", xSpacing);
				if(show_destroyed == 1){
					// draw line through the critical name text to indicate it is destroyed
					if(thisCrit.isDestroyed() || critSectionDestroyed){
						context.beginPath();
						
						context.moveTo((xSpacing * colOffset) - colOffset, yOffset - (fontOffset / 2));
					    context.lineTo((xSpacing * colOffset) + (critText.length * colOffset) + colOffset, yOffset - (fontOffset / 2));
						
						context.lineWidth = 2;
					    context.strokeStyle = colors.sevHighColor;
						context.stroke();
					}
				}
				else{
					
					rowText += critText;
				}
				
				context.fillText(rowText, xOffset, yOffset);
				yOffset += rowOffset;
			}
		}
	}
	
	context.restore();
}

/* 
 * simple function to get the starting row position
 * set returnOffScreen true to return positions that are out of bounds (this is only used for animations really)
 */
function getHexRow(x, y, returnOffScreen){
	if(returnOffScreen == null)
		returnOffScreen = false;
	
	var result = -1;
	if(x % 2 == 0){
		result = ((y - visibleHexOffsetY) * 4);
	}
	else{
		result = ((y - visibleHexOffsetY) * 4) + 2;
	}
	
	if(result < 0 || result > numRows - 3){
		if(returnOffScreen && result > numRows - 3){
			return numRows - 3;
		}
		return -1;
	}
		
	return result;
}

/*
 *  simple function to get the starting col position
 *  set returnOffScreen true to return positions that are out of bounds (this is only used for animations really)
 */
function getHexCol(x, y, returnOffScreen){
	if(returnOffScreen == null)
		returnOffScreen = false;
	
	var result = ((x - visibleHexOffsetX) * 4) + 1;
	
	if(result < 0 || result > numCols){
		if(returnOffScreen && result > numCols){
			return numCols;
		}
		
		return -1;
	}
	
	return result;
}

// gets the heading character based on the heading (0=N, 1=NE, 2=SE, 3=S, 4=SW, 5=NW)
function getHeadingChar(heading){
	switch(heading){
		case 0:
			return '|';
			break;
			
		case 1:
			return '/';
			break;
			
		case 2:
			return '\\';
			break;
			
		case 3:
			return '|';
			break;
			
		case 4:
			return '/';
			break;
			
		case 5:
			return '\\';
			break;
	}
}

// gets the heading indicator's display x,y offset based on the heading (0=N, 1=NE, 2=SE, 3=S, 4=SW, 5=NW)
function getHeadingOffset(heading){
	switch(heading){
		case 0:
			return [1,0];
			break;
			
		case 1:
			return [2,0];
			break;
			
		case 2:
			return [2,2];
			break;
			
		case 3:
			return [1,2];
			break;
			
		case 4:
			return [0,2];
			break;
			
		case 5:
			return [0,0];
			break;
	}
}

// based on the hex of the player, display numbers 1-6 corresponding to the adjacent hexes they can jump to
function insertJumpIndicator(){
	// TODO: use the '^^^' indicators when bots are jumping, when that is implemented
	if(!playerJumping){ return; }
	
	if(playerMech.isProne() || playerMech.isDestroyed()){
		// disable jumping
		playerJumping = false;
		return;
	}
	
	if(isPlayerTurn() && !playerEnded){
		// create offsets for the surrounding hexes from the player
		var hexOffsets = [];
		if(playerMech.location.x % 2 == 0){
			hexOffsets = [
				new Coords(playerMech.location.x, playerMech.location.y -1),
				new Coords(playerMech.location.x +1, playerMech.location.y -1),
				new Coords(playerMech.location.x +1, playerMech.location.y),
				new Coords(playerMech.location.x, playerMech.location.y +1),
				new Coords(playerMech.location.x -1, playerMech.location.y),
				new Coords(playerMech.location.x -1, playerMech.location.y -1)
			];
		}
		else{
			hexOffsets = [
				new Coords(playerMech.location.x, playerMech.location.y -1),
				new Coords(playerMech.location.x +1, playerMech.location.y),
				new Coords(playerMech.location.x +1, playerMech.location.y +1),
				new Coords(playerMech.location.x, playerMech.location.y +1),
				new Coords(playerMech.location.x -1, playerMech.location.y +1),
				new Coords(playerMech.location.x -1, playerMech.location.y)
			];
		}
		
		for(var i=0; i<hexOffsets.length; i++){
			var offset = hexOffsets[i];
			
			var hexRowStart = getHexRow(offset.x, offset.y);
			var hexColStart = getHexCol(offset.x, offset.y);
			
			if(hexRowStart < 0 || hexColStart < 0){
				continue;
			}
				
			var playerRow = displayArray[hexRowStart + 1];
		
			var jumpIndicator = new PlayerDisplay();
			
			if(playerMech.jumpMP > 0){
				jumpIndicator.displayChar = (i+1).toString();
			}
			else{
				jumpIndicator.displayChar = "X";
			}
			
			
			playerRow[hexColStart + 1] = jumpIndicator;
		}
	}
	
	// also, show some characters '^^^' in the player's hex to indicate jumping is enabled also
	var hexRowStart = getHexRow(playerMech.location.x, playerMech.location.y);
	var hexColStart = getHexCol(playerMech.location.x, playerMech.location.y);
	
	if(hexRowStart >= 0 && hexColStart >= 0){
		// only display on the third row so they only appear under the player character
		var playerRow = displayArray[hexRowStart + 2];
		if(playerRow != null){
			var jumpIndicator = new PlayerDisplay();
			jumpIndicator.displayChar = '^';
			
			for(var c=0; c<=2; c++){
				playerRow[hexColStart + c] = jumpIndicator;
			}
		}
	}
}
/** inserts some characters to represent each mech that is prone */
function insertProneIndicator(){
	var allMechs = getAllMechs();
	
	for(var i=0; i<allMechs.length; i++){
		var mech = allMechs[i];
		
		if(mech == null || mech.isDestroyed() || !mech.isProne()){
			continue;
		}
		
		// show some characters 'vvv' in the mech's hex to indicate it is prone
		var hexRowStart = getHexRow(mech.location.x, mech.location.y);
		var hexColStart = getHexCol(mech.location.x, mech.location.y);
		
		if(hexRowStart >= 0 && hexColStart >= 0){
			// only display on the third row so they only appear under the player character
			var thisRow = displayArray[hexRowStart + 2];
			if(thisRow != null){
				var proneIndicator;
				if(mech == playerMech){
					proneIndicator = new PlayerDisplay();
				}
				else{
					proneIndicator = new EnemyDisplay();
				}
				
				proneIndicator.displayChar = 'v';
				
				for(var c=0; c<=2; c++){
					thisRow[hexColStart + c] = proneIndicator;
				}
			}
		}
	}
}

/** inserts player objects into the display array */
function insertPlayer(){
	playerChar = "@";
	if(playerMech.isDestroyed()){
		playerChar = destroyedChar;
	}
	
	// first, insert the player
	var hexRowStart = getHexRow(playerMech.location.x, playerMech.location.y);
	var hexColStart = getHexCol(playerMech.location.x, playerMech.location.y);
	
	if(hexRowStart < 0 || hexColStart < 0)
		return;

	var playerRow = displayArray[hexRowStart + 1];
	
	var player = new PlayerDisplay();
	player.displayChar = playerChar;
	playerRow[hexColStart + 1] = player;
	
	if(playerMech.isDestroyed()){
		// TODO: something special for being destroyed?
	}
	else{
		// next, insert the heading
		var offset = getHeadingOffset(playerMech.heading);
		var headingRow = displayArray[hexRowStart + offset[1]];
		var heading = new PlayerDisplay();
		heading.displayChar = getHeadingChar(playerMech.heading);
		headingRow[hexColStart + offset[0]] = heading;
	}
	
}

/** inserts bot mech objects into the display array */
function insertBots(){
	
	for(var destroyedIndex = 1; destroyedIndex <= 2; destroyedIndex ++){
		// insert destroyed mechs first, that way live mechs can override their display when in the same hex
		var destroyedOnly = (destroyedIndex == 1);
		for(var i=0; i<gameMechs.length; i++){
			var botMech = gameMechs[i];
			
			if((destroyedOnly && !botMech.isDestroyed())
					|| (!destroyedOnly && botMech.isDestroyed())){
				continue;
			}
		
			var enemyChar = botMech.chassis.substring(0,1);
			
			if(botMech.variant.search("YLW") != -1){
				// gotta have the Yen-lo-wang as 'y'
				enemyChar = "y";
			}
			
			if(botMech.tonnage <= 55){
				enemyChar = enemyChar.toLowerCase();
			}
			
			if(botMech.isDestroyed()){
				enemyChar = destroyedChar;
			}
			
			// first, insert the enemy
			var hexRowStart = getHexRow(botMech.location.x, botMech.location.y);
			var hexColStart = getHexCol(botMech.location.x, botMech.location.y);
			
			if(hexRowStart < 0 || hexColStart < 0){
				continue;
			}
	
			var enemyRow = displayArray[hexRowStart + 1];
			var enemy = new EnemyDisplay();
			if(botMech.team == 1){
				enemy = new PlayerDisplay();
			}
			
			enemy.displayChar = enemyChar;
			
			enemyRow[hexColStart + 1] = enemy;
			
			if(botMech.isDestroyed()){
				// TODO: something special for being destroyed?
			}
			else{
				// next, insert the heading
				var offset = getHeadingOffset(botMech.heading);
				var headingRow = displayArray[hexRowStart + offset[1]];
				var heading = new EnemyDisplay();
				if(botMech.team == 1){
					heading = new PlayerDisplay();
				}
				
				heading.displayChar = getHeadingChar(botMech.heading);
				headingRow[hexColStart + offset[0]] = heading;
			}
		}
	}
}


var targetBracket = [
"|---|",
"/   \\",
">   <",
"\\   /",
"|-^-|"
];
function insertTargetBracket(){
	if(isPlayerTurn() && playerEnded){ return; }

	var bracketMech = null;
	
	if(isPlayerTurn() || playerMech.isDestroyed()){
		bracketMech = targetMech;
	}
	else if(getTurnMech() != playerMech){
		bracketMech = getTurnMech();
	}
	
	if(bracketMech == null){ return; }
	
	var hexRowStart = getHexRow(bracketMech.location.x, bracketMech.location.y);
	var hexColStart = getHexCol(bracketMech.location.x, bracketMech.location.y);
	
	if(hexRowStart < 0 || hexColStart < 0){
		return;
	}
	
	for(var y=hexRowStart-1; y<hexRowStart+4; y++){
		if(y<0 || y >= displayArray.length || displayArray[y] == null){
			continue;
		}
		
		var thisRow = displayArray[y];

		for(var x=hexColStart-1; x<hexColStart+4; x++){
			if(x<0 || x >= thisRow.length || thisRow[x] == null){
				continue;
			}
			
			if(x == hexColStart - 1 || x == hexColStart + 3 
					|| y == hexRowStart - 1 || y == hexRowStart + 3){
				
				if(colors.bracketColor != null){
					thisRow[x].type = BRACKET_TYPE;
				}
				else{
					thisRow[x].type = ENEMY_TYPE;
				}
				
				if(!playerEnded){
					var thisX = x - hexColStart + 1;
					var thisY = y - hexRowStart + 1;
					
					var thisChar = targetBracket[thisY].substring(thisX, thisX+1);
					
					thisRow[x].displayChar = thisChar;
					
				}
			}
		}
	}
}

function insertPlayerTurnIndicator(){
	if(playerEnded){ return; }
	
	// highlights the player's hex to indicate it is the player's turn
	var hexRowStart = getHexRow(playerMech.location.x, playerMech.location.y);
	var hexColStart = getHexCol(playerMech.location.x, playerMech.location.y);
	
	if(hexRowStart < 0 || hexColStart < 0){
		return;
	}
	
	for(var y=hexRowStart-1; y<hexRowStart+4; y++){
		if(y<0 || y >= displayArray.length){
			continue;
		}
		
		var thisRow = displayArray[y];

		for(var x=hexColStart-1; x<hexColStart+4; x++){
			if(x<0 || x >= thisRow.length || thisRow[x] == null){
				continue;
			}
				
			if(x == hexColStart - 1 || x == hexColStart + 3 
					|| y == hexRowStart - 1 || y == hexRowStart + 3){
					
				if(colors.bracketColor != null){
					thisRow[x].type = BRACKET_TYPE;
				}
				else{
					thisRow[x].type = PLAYER_TYPE;
				}
			}
		}
	}
}

// start with a base overlay of generic hexes, these will be added on to by terrain and other objects later
function insertMap(hideEdgeDots){
	
	for(var y=0; y<numRows; y++){
		if(y >= displayArray.length)
			break;
		
		var thisRow = displayArray[y];
		
		var block = "????????";
		
		if(y + (visibleHexOffsetY*4) < 0
				|| y + (visibleHexOffsetY*4) > numHexRows * 4){
			
			if(hideEdgeDots){
				block = "        ";
			}
			else{
				block = "........";
			}
		}
		else if(y == numRows - 1){
			block = "--------";
		}
		else if(visibleHexOffsetX % 2 == 0){
			if(y % 4 == 3){
				block = " >-<    ";
			}
			else if(y % 4 == 0){
				block = "/   \\   ";
			}
			else if(y % 4 == 1){
				block = "     >-< ";
			}
			else if(y % 4 == 2){
				block = "\\   /   ";
			}
		}
		else{
			if(y % 4 == 3){
				block = "     >-< ";
			}
			else if(y % 4 == 0){
				block = "\\   /   ";
			}
			else if(y % 4 == 1){
				block = " >-<    ";
			}
			else if(y % 4 == 2){
				block = "/   \\   ";
			}
		}
			
		for(var x=0; x<numCols; x++){
			if(x >= thisRow.length){
				break;
			}
				
			if(x + (visibleHexOffsetX*4) > numHexCols * 4 
					|| x + (visibleHexOffsetX*4) < 0){
				if(hideEdgeDots){
					thisRow[x].displayChar = " ";
				}
				else{
					thisRow[x].displayChar = ".";
				}
				thisRow[x].type = HEX_TYPE;
			}
			else{
				//thisRow[x] = new HexDisplay();
				thisRow[x].displayChar = block.substring(x%8, x%8+1);
				thisRow[x].type = HEX_TYPE;
			}
		}
	}
}

// finds each environment hex and inserts into the display array
function insertEnvironment(){
	var map = getHexMap();
	
	for(var y=visibleHexOffsetY; y<numRows + visibleHexOffsetY; y++){
		if(y < 0){
			continue;
		}
		else if(y >= map.length){
			break;
		}
	
		var thisHexRow = map[y];
		for(var x=visibleHexOffsetX; x<numCols + visibleHexOffsetX; x++){
			if(x >= thisHexRow.length){
				break;
			}
			else if(x < 0){
				continue;
			}
			
			var thisHex = thisHexRow[x];
			
			//debug.log(thisHex+": "+x+", "+y);
			
			hexRowStart = getHexRow(x, y);
			hexColStart = getHexCol(x, y);
			
			for(var i=0; i<3; i++){
				if(hexRowStart + i >= numRows - 1 || !displayArray[hexRowStart + i]){
					break;
				}
			
				thisRow = displayArray[hexRowStart + i];
				
				for(var j=0; j<3; j++){
					if(!thisRow[hexColStart+j])
						break;
				
					if(thisHex.type != HEX_TYPE){
						if(thisHex instanceof TreeHex){
							thisRow[hexColStart+j] = new TreeDisplay();
						}
						if(thisHex instanceof HeavyTreeHex){
							thisRow[hexColStart+j] = new HeavyTreeDisplay();
						}
						else if(thisHex instanceof RockHex){
							if(thisHex.level > 1){
								thisRow[hexColStart+j] = new HeavyRockDisplay();
							}
							else{
								thisRow[hexColStart+j] = new RockDisplay();
							}
						}
						else if(thisHex instanceof WaterHex){
							if(thisHex.level > 1){
								thisRow[hexColStart+j] = new DeepWaterDisplay();
							}
							else{
								thisRow[hexColStart+j] = new WaterDisplay();
							}
						}
					}
					
					if(showHexNumbers){
					
						// overlay XY position, hex numbers start at 1 instead of 0
						var hexX = x+1;
						var hexY = y+1;
						
						if(hexX<10) xString ="0"+hexX;
						else xString = ""+hexX;
						if(hexY<10) yString = "0"+hexY;
						else yString = ""+hexY;
						
						if(i==0){
							if(j == 0){
								thisRow[hexColStart+j].displayChar = 'X';
							}
							else if(j == 1){
								thisRow[hexColStart+j].displayChar = xString.substring(0,1);
							}
							else if(j == 2){
								thisRow[hexColStart+j].displayChar = xString.substring(1,2);
							}
						}
						else if(i==2){
							if(j == 0){
								thisRow[hexColStart+j].displayChar = 'Y';
							}
							else if(j == 1){
								thisRow[hexColStart+j].displayChar = yString.substring(0,1);
							}
							else if(j == 2){
								thisRow[hexColStart+j].displayChar = yString.substring(1,2);
							}
						}
					}
					else if(i==1 && j != 1){
						// overlay elevation/water level in the left/right sides
						if(thisHex instanceof WaterHex){
							thisRow[hexColStart+j].displayChar = thisHex.level;
						}
						else if(thisHex.elevation != 0){
							thisRow[hexColStart+j].displayChar = thisHex.elevation;
						}
					}
				}
			}
		}
	}
}

// adjusts the visible hex offsets to keep the mech on screen
function autoCenterOnMech(mech){
	if(state != STATE_GAME)
		return;
	
	if(mech == null){
		mech = playerMech;
	}
	//debug.log("old offset: "+visibleHexOffsetX+", "+visibleHexOffsetY);

	var mechX = mech.location.x;
	var mechY = mech.location.y;
	
	var mechOffsetX = mechX - Math.floor(maxVisibleHexCols / 2);
	var mechOffsetY = mechY - Math.floor(maxVisibleHexRows / 2);
	
	if(numHexCols > maxVisibleHexCols){
		// only snap to edge of map if wider than displayable area
		if(mechOffsetX < 0){
			mechOffsetX = 0;
		}
		else if(mechOffsetX > numHexCols - maxVisibleHexCols){
			mechOffsetX = numHexCols - maxVisibleHexCols;
		}
	}
	else{
		// display entire width of the map in the center of the display area instead of on the mech
		mechOffsetX = Math.floor((numHexCols - maxVisibleHexCols) / 2);
	}
	
	if(numHexRows > maxVisibleHexRows){
		// only snap to edge of map if taller than displayable area
		if(mechOffsetY < 0){
			mechOffsetY = 0;
		}
		else if(mechOffsetY > numHexRows - maxVisibleHexRows){
			mechOffsetY = numHexRows - maxVisibleHexRows;
		}
	}
	else{
		// display entire length of the map in the center of the display area instead of on the mech
		mechOffsetY = Math.floor((numHexRows - maxVisibleHexRows) / 2);
	}
	
	setVisibleHexOffset(mechOffsetX, mechOffsetY);
	
	//debug.log("NEW offset: "+visibleHexOffsetX+", "+visibleHexOffsetY);
}

function isLocationInDisplayArea(location){
	return (location.x >= visibleHexOffsetX && location.x < visibleHexOffsetX + maxVisibleHexCols
				&& location.y >= visibleHexOffsetY && location.y < visibleHexOffsetY + maxVisibleHexRows);
}

function drawCrosshairs(){
	context.save();

	context.beginPath();
	
    context.moveTo(mouseX + 5, mouseY);
    context.lineTo(mouseX + 15, mouseY);
	
    context.moveTo(mouseX - 5, mouseY);
    context.lineTo(mouseX - 15, mouseY);
	
	context.moveTo(mouseX, mouseY + 5);
    context.lineTo(mouseX, mouseY + 15);
	
	context.moveTo(mouseX, mouseY - 5);
    context.lineTo(mouseX, mouseY - 15);
	
	context.lineWidth = 1;
    context.strokeStyle = "rgb(0,0,0)";
	context.stroke(); 

	context.restore();
}

// creates a static float message above each mech displaying its chassis and variant
function showMechIdentification(){
	var allMechs = getAllMechs();
	
	for(var i=0; i<allMechs.length; i++){
		var mech = allMechs[i];
		if(mech == null 
				|| mech.location == null 
				|| !isLocationInDisplayArea(mech.location))
			continue;
		
		var text = mech.chassis;
		var color = colors.enemyColor;
		
		if(playerMech == mech){
			text = playerName;
			color = colors.playerColor;
		}
		else if(mech.team != -1 && mech.team == playerMech.team){
			color = colors.playerColor;
		}
		
		// defining a custom location for the mech ID
		var thisCoord = new Coords(-1,-1);
		thisCoord.actualX = 1 + colOffset * (mech.location.x - visibleHexOffsetX) * hexColWidth;
		thisCoord.actualY = topOffset + (rowOffset * (mech.location.y - visibleHexOffsetY) * 4);
		if(mech.location.x % 2 != 0){
			thisCoord.actualY += (rowOffset * 2);
		}

		createFloatMessage(thisCoord, text, color, 0, 1.5, true);
		
		//createFloatMessage(mech.location, mech.variant, color, animationIndexDelay, 1.5, true);
	}
}


// creates a static float message above each unoccupied hex display how many AP would be required to move into it from the current position
function showHexRequiredAP(){	
	
	if(playerMech == null || playerMech.isDestroyed()){
		return;
	}
	
	var allMoves = getAllValidMovesAP(playerMech);
	var numMoves = allMoves.length;
	
	var map = getHexMap();
	
	for(var row=visibleHexOffsetY; row<visibleHexOffsetY + maxVisibleHexRows; row++){
		if(row < 0 || row >= map.length || map[row] == null){
			continue;
		}
		
		var thisRow = map[row];
		
		for(var col=visibleHexOffsetX; col<visibleHexOffsetX + maxVisibleHexCols; col++){
			if(col < 0 || col >= thisRow.length || thisRow[col] == null){
				continue;
			}
			
			var thisCoord = new Coords(col, row);
			var bestRemainAP = -100;
			
			// check to see if this coordinate was in the list of valid moves
			for(var i=0; i<numMoves; i++){
				var moveObj = allMoves[i];
				
				var moveCoord = moveObj.getObj();
				var apRemain = moveObj.getValue();
				
				if(thisCoord.equals(moveCoord)
						&& apRemain > bestRemainAP){
					bestRemainAP = apRemain;
				}
			}
			
			if(bestRemainAP == -100){
				continue;
			}
			
			thisCoord.actualX = 1 + colOffset * (col - visibleHexOffsetX) * hexColWidth;
			thisCoord.actualY = topOffset + (rowOffset * (row - visibleHexOffsetY) * 4) + rowOffset;
			if(col % 2 != 0){
				thisCoord.actualY += (rowOffset * 2);
			}
			
			var hexAP = playerMech.actionPoints - bestRemainAP;
			if(hexAP > 0){
				// only display if the hex is available and if more than 1 AP is needed to move into it
				var color = colors.playerColor;
				createFloatMessage(thisCoord, " "+hexAP+" ", color, 0, 2.5, true);
			}
		}
	}
}

/**
 * toggles showing the player's firing arcs
 */
function toggleFiringArcs(){
	showArcOverlay = !showArcOverlay;
}

/**
 * renders masked hexes on the board to indicate the front, side, and rear firing arcs for the player
 */
function renderFiringArcs(){
	if(!showArcOverlay){
		return;
	}
	
	context.save();
	
	var map = getHexMap();
	
	context.globalAlpha = 0.2;
	
	for(var y=visibleHexOffsetY; y<visibleHexOffsetY + maxVisibleHexRows; y++){
		if(y < 0 || y >= map.length || map[y] == null){
			continue;
		}
		
		var thisRow = map[y];
		
		for(var x=visibleHexOffsetX; x<visibleHexOffsetX + maxVisibleHexCols; x++){
			if(x < 0 || x >= thisRow.length || thisRow[x] == null){
				continue;
			}
			
			var thisCoord = new Coords(x, y);
			if(playerMech.location.equals(thisCoord)){
				continue;
			}
			
			var relDirection = getRelativeDirectionFrom(playerMech.location, playerMech.heading, thisCoord);
			
			var startX = colOffset * (x - visibleHexOffsetX) * hexColWidth;
			var startY = topOffset + (rowOffset * (y - visibleHexOffsetY) * 4) + fontOffset;
			if(x % 2 != 0){
				startY += (rowOffset * 2);
			}
			
			// begin drawing a filled in hexagon
			context.beginPath();
			context.moveTo(startX, startY);
			context.lineTo(startX + colOffset, startY - rowOffset*2);
			context.lineTo(startX + colOffset*4, startY - rowOffset*2);
			context.lineTo(startX + colOffset*5, startY);
			context.lineTo(startX + colOffset*4, startY + rowOffset*2);
			context.lineTo(startX + colOffset, startY + rowOffset*2);
			context.lineTo(startX, startY);
			context.closePath();
			
			if(relDirection == REL_DIRECTION_FRONT){
				context.fillStyle = colors.playerColor;
			}
			else if(relDirection == REL_DIRECTION_REAR){
				context.fillStyle = colors.sevHighColor;
			}
			else if(relDirection == REL_DIRECTION_LEFT
					|| relDirection == REL_DIRECTION_RIGHT){
				context.fillStyle = colors.bgColor;
			}
			
			context.fill();
		}
	}
	
	context.restore();
}


/**
 * converts clicked x and y positions to a hex location on the display
 */
function getClickedHexLocation(clickedX, clickedY){
	// TODO: this seems off a bit to the top and right sides of hexes, need to fine tune it
	var clickedHexX = Math.floor((clickedX / colOffset / 4));
	var clickedHexY = Math.floor((clickedY - topOffset) / rowOffset / 4);
	var clickedLocation = new Coords(clickedHexX, clickedHexY);
	
	debug.log("clicked ["+clickedX+","+clickedY+"] -> ["+clickedHexX+","+clickedHexY+"]");
	
	return clickedLocation;
}

function handleStartClick(){
	// TODO: when clicking is integrated into the gamplay we can do something here
	return;
	
	if(clickX != null && clickY != null){
		// just some random fireworks
		var numWeapons = logoMech.weapons.length;
		var dieResult = getDieRollTotal(1, numWeapons);
		var weapon = logoMech.weapons[dieResult - 1];
		var fireResult = new WeaponFireGameMessage(null, true, null, SEV_HIGH);
		
		var numProjectiles = weapon.getProjectiles();
		for(var i=0; i<numProjectiles; i++){
			
			if(weapon.isLRM()){
				fireResult.hitDamages.push(weapon.damage * 5);
				i += 4;
			}
			else{
				fireResult.hitDamages.push(weapon.damage);
			}
				
			fireResult.hitLocations.push(getDieRollTotal(1, 7));
		}
		
		var missed = (fireResult.hitLocations.length == 0);
		
		// convert click coordinates into hex coordinates
		var clickLocation = getClickedHexLocation(clickX, clickY);
		
		var animationIndex = 0;
		if(isClusterWeapon(weapon))
			animationIndex = createClusterProjectile(logoMech, weapon, clickLocation, fireResult);
		else if(WEAPON_BALLISTIC == weapon.getType())
			animationIndex = createBurstProjectile(logoMech, weapon, clickLocation, fireResult);
		else
			animationIndex = createProjectile(logoMech, weapon, clickLocation, missed);
		
		var delay = animationIndex;
		var counter = 0;
		for(var i=0; i<fireResult.hitLocations.length; i++){
			var floatMsg = getLocationText(fireResult.hitLocations[i])+" -"+fireResult.hitDamages[i];
			createFloatMessage(clickLocation, floatMsg, colors.sevHighColor, delay + (counter*floatingDelay));
			
			counter ++;
		}
	}
}


function cycleColorTemplate(forward){
	var templateIndex = -1;
	for(var i=0; i<templates.length; i++){
		if(templates[i] == colors){
			templateIndex = i;
			break;
		}
	}
	
	if(forward){
		templateIndex ++;
	}
	else{
		templateIndex --;
	}
	
	if(templateIndex >= templates.length){
		templateIndex = 0;
	}
	else if(templateIndex < 0){
		templateIndex = templates.length - 1;
	}
		
	colors = templates[templateIndex];
	
	// also change html document background to match
	document.body.style.backgroundColor = colors.bgColor;
}

// gets the display X,Y coordinates of an object moving a number of pixels at the given angle
function getMovementDestination(sourceX, sourceY, distance, angle){
	var oppSide = Math.sin(angle * PI/180) * distance;
	var adjSide = Math.cos(angle * PI/180) * distance;
	
	var p = new Point();
	p.x = sourceX + oppSide;
	p.y = sourceY - adjSide;
	
	return p;
}

// gets the display X, Y coordinates of an object moving along a curve to a destination
function getCurveDestination(p0, p1, p2, p3, t){
	
	// calculate coefficients
	var cx = 3 * (p1.x - p0.x);
	var bx = 3 * (p2.x - p1.x) - cx;
	var ax = p3.x - p0.x - cx - bx;

	var cy = 3 * (p1.y - p0.y);
	var by = 3 * (p2.y - p1.y) - cy;
	var ay = p3.y - p0.y - cy - by;
	
	if(t > 1){ t = 1 };
	var xt = ax*(t*t*t) + bx*(t*t) + cx*t + p0.x;
	var yt = ay*(t*t*t) + by*(t*t) + cy*t + p0.y;
	
	return new Point(xt, yt);
}

function getDistanceToTarget(sourceX, sourceY, targetX, targetY){
	// C^2 = A^2 + B^2
	return Math.sqrt(Math.pow(Math.abs(sourceX - targetX), 2) + Math.pow(Math.abs(sourceY - targetY), 2));
}

// gets the angle to the target
function getAngleToTarget(sourceX, sourceY, targetX, targetY){
	var quadrant = 0;
	var addedAngle = 0;
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
	
	var oppSide = 0;
	var adjSide = 0;
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
	var angle = addedAngle + Math.atan((oppSide) / (adjSide)) * (180 / PI);
	return angle;
}

/**
 * handles the display of animated projectiles and related animated messages from weapon fire
 * @param fireResult the WeaponFireGameMessage returned from the model call to fireWeapon
 */
function handleWeaponFire(srcMech, weapon, tgtMech, fireResult){
	if(fireResult instanceof WeaponFireGameMessage){
		// show animation of weapon fire
		var missed = (fireResult.hitLocations.length == 0);
		
		var animationIndex = 0;
		if(isClusterWeapon(weapon)){
			animationIndex = createClusterProjectile(srcMech, weapon, tgtMech.location, fireResult);
		}
		else if(WEAPON_BALLISTIC == weapon.getType()){
			animationIndex = createBurstProjectile(srcMech, weapon, tgtMech.location, fireResult);
		}
		else{
			animationIndex = createProjectile(srcMech, weapon, tgtMech.location, missed);
		}
		
		// counter to make the float messages not appear all at once
		var counter = 0;
		var delay = animationIndex;
		
		// if melee, show melee attack that was used
		if(isMeleeWeapon(weapon)){
			delay = 0;	// TODO: add some kind of animation for melee weapon hits (e.g. slash for hatchet, something for the others?)
			createFloatMessage(tgtMech.location, weapon.shortName, colors.sevHighColor, delay + (counter*floatingDelay));
			counter ++;
		}
	
		// show animation of result of weapon fire
		if(missed){
			createFloatMessage(tgtMech.location, "MISS", colors.sevHighColor, delay + (counter*floatingDelay));
			counter ++;
			
			// skipping through unread message since it will just be a duplicated MISS message
			getUnreadMessages();
		}
		else{
			for(var i=0; i<fireResult.hitLocations.length; i++){
				// have the float message appear a bit to the left or right if hit a left or right side location
				var offsetLocation = getDisplayOffsetByLocation(tgtMech.location, fireResult.hitLocations[i]);
				
				var floatMsg = getLocationText(fireResult.hitLocations[i])+" -"+fireResult.hitDamages[i];
				createFloatMessage(offsetLocation, floatMsg, colors.sevHighColor, delay + (counter*floatingDelay));
				
				counter ++;
			}
			
			// show any critical messages
			var unreadMessages = getUnreadMessages();
			for(var i=0; i<unreadMessages.length; i++){
				var thisMessage = unreadMessages[i];
				
				if(thisMessage.success && thisMessage instanceof CriticalHitGameMessage){
					var floatMsg = "CRIT "+getLocationText(thisMessage.critLocation)+": "+thisMessage.critComponent;
					createFloatMessage(tgtMech.location, floatMsg, colors.sevHighColor, delay + (counter*floatingDelay), 1.5);
					counter ++;
				}
				else if(thisMessage.success && thisMessage instanceof AmmoExplosionGameMessage){
					for(var j=0; j<thisMessage.hitLocations.length; j++){
						var floatMsg = "AMMO EXP "+getLocationText(thisMessage.hitLocations[j])+" -"+thisMessage.hitDamages[j];
						createFloatMessage(tgtMech.location, floatMsg, colors.sevHighColor, delay + (counter*floatingDelay), 1.5);
						
						counter ++;
					}
				}
			}
			
			// lastly, show if destroyed
			if(tgtMech.isDestroyed()){
				createFloatMessage(tgtMech.location, "DESTROYED", colors.sevHighColor, delay + (counter*floatingDelay), 2.0);
			}
		}
	}
}

/**
 * Gets an offset location used for a float message display offset left or right based on hit location
 * @param srcLocation
 * @param hitLocation
 * @returns {___thisCoord31}
 */
function getDisplayOffsetByLocation(srcLocation, hitLocation){
	var thisCoord = new Coords(srcLocation.x, srcLocation.y);
	thisCoord.actualX = (getHexCol(srcLocation.x, srcLocation.y, true) * colOffset);
	thisCoord.actualY = (getHexRow(srcLocation.x, srcLocation.y, true) * rowOffset) + topOffset;
	if(srcLocation.x % 2 != 0){
		thisCoord.actualY += (rowOffset * 2);
	}
	
	switch(hitLocation){
		case LEFT_TORSO:
		case LEFT_REAR:
			thisCoord.actualX -= colOffset;
			break;
			
		case LEFT_ARM:
		case LEFT_LEG:
			thisCoord.actualX -= (colOffset * 2);
			break;
			
		case RIGHT_TORSO:
		case RIGHT_REAR:
			thisCoord.actualX += colOffset;
			break;
			
		case RIGHT_ARM:
		case RIGHT_LEG:
			thisCoord.actualX += (colOffset * 2);
			break;
			
		default: break;
	}
	
	return thisCoord;
}

/** routes key presses to the correct state handler method */
function handleKeyPress(key){
	debug.log("pressed: "+key);
	
	if(state == STATE_START){
		handleStartKeyPress(key);
	}
	else if(state == STATE_MENU){
		handleMenuKeyPress(key);
	}
	else if(state == STATE_GAME){
		handleGameKeyPress(key);
	}
	else if(state == STATE_INVENTORY){
		handleInventoryKeyPress(key);
	}
	
	updateDisplay = true;
}


/** handles key presses during STATE_START */
function handleStartKeyPress(key){
	// start screen is just the logo, the menu handles the menu when starting a new game or in the middle of a game
	if(key == "[" || key == "]"){
		cycleColorTemplate(key == "]" ? true : false);
	}
	else if(key != null){
		setState(STATE_MENU);
	}
}


/** handles key presses during STATE_MENU */
function handleMenuKeyPress(key){
	if(PlayerNameMenuItem.newName != null){
		// player is currently entering a new callsign, only allow enter or escape to bring it out
		if(key == "space")
			key = " ";
		
		if(key == "enter" || key == "escape"){
			activateCurrentMenuItem();
		}
		else if(key == "backspace"){
			if(PlayerNameMenuItem.newName.length > 0){
				PlayerNameMenuItem.newName = PlayerNameMenuItem.newName.substr(0, PlayerNameMenuItem.newName.length - 1);
			}
		}
		else if(key.length == 1){
			// only accepting characters, not things like "up" or "down"
			var thisChar = key;
			
			if(PlayerNameMenuItem.newName.length < 40){
				PlayerNameMenuItem.newName += thisChar;
			}
		}
	}
	else if(key == "[" || key == "]"){
		cycleColorTemplate(key == "]" ? true : false);
	}
	else if(key == "w" || key == "up"){
		selectPrevMenuItem();
	}
	else if(key == "s" || key == "down"){
		selectNextMenuItem();
	}
	else if(key == "d" || key == "right" || key == "enter" || key == "space"){
		activateCurrentMenuItem();
	}
	else if(key == "a" || key == "left" || key == "escape" || key == "backspace"){
		returnToPrevMenu();
	}
	else{
		// pressing 1-0 may do something
		var numPressed = -1;
		for(var i=1; i<=10; i++){
			var strVal = i.toString();
			if(i == 10) strVal = "0";
			
			if(key == strVal){
				numPressed = i;
				break;
			}
		}
		
		if(numPressed != -1){
			var thisMenuItem = getSelectedMenuItem();
			if(thisMenuItem == null){
				return;
			}
			
			if(thisMenuItem.mech != null){
				// pressing a number while choosing bot mechs in Custom Battle menu
				// sets the team number for that bot mech
				var selectedMech = thisMenuItem.mech;
				selectedMech.team = numPressed;
			}
			else if(PlayerMechMenuItem == thisMenuItem){
				// pressing a number while choosing player mech in Custom Battle menu
				// sets the team number for the player
				playerMech.team = numPressed;
			}
		}
	}
}


/** handles key presses during STATE_INVENTORY */
function handleInventoryKeyPress(key){
	if(key == "i" || key == "escape"){
		// return to game state
		setState(STATE_GAME);
	}
	else if(key == "[" || key == "]"){
		cycleColorTemplate(key == "]" ? true : false);
	}
}

/** handles key presses during STATE_GAME */
function handleGameKeyPress(key){
	var playerMoved = false;
	var weaponFired = -1;
	var jumpDirection = -1;
	
	if(lookMode){
		// no weapons fire/jumping during look mode
	}
	else if(playerEnded){
		// do nothing
	}
	else if(playerJumping){
		// jumping mode uses 1-6 for direction
		for(var i=1; i<=6; i++){
			var strVal = i.toString();
			
			if(key == strVal){
				jumpDirection = (i-1);
				break;
			}
		}
	}
	else{
		// pressing 1-0 fires that weapon
		for(var i=1; i<=10; i++){
			var strVal = i.toString();
			if(i == 10) strVal = "0";
			
			if(key == strVal){
				weaponFired = (i-1);
				break;
			}
		}
		
		// pressing SHIFT + 1-0 toggles that weapon to fire as a group
		if(weaponFired == -1){
			
			for(var i=0; i<10; i++){
				if(key == groupWeaponChars[i]){
					weaponFired = i;
					groupFireEnabled = true;
					
					break;
				}
			}
		}
	}
	
	if(weaponFired >= 0){
		var weapon = playerMech.weapons[weaponFired];
		
		if(weapon == null){
			// nothing to fire with
		}
		else if(groupFireEnabled){
			if(weapon instanceof WeaponHatchet
				|| weapon.cooldown > 0
				|| weapon.isDestroyed()){
				// Hatchets cannot be group fired with other weapons
				// weapons on cooldown cannot be set to group fire
			}
			else{
				var toggle = true;
				if(!weapon.isGroupFiring()){
					// before enabling group fire, one more check to see if > 0% to hit
					var toHit = getToHitAsPercent(playerMech, weapon, targetMech);
					if(toHit <= 0){
						toggle = false;
					}
				}
			
				if(toggle){
					weapon.setGroupFiring(!weapon.isGroupFiring());
				}
			}
		}
		else{
			// firing a weapon without moving indicates the player did not want to move
			var result = fireWeapon(playerMech, weapon, targetMech);
			
			if(result instanceof WeaponFireGameMessage){
				// show animation of weapon fire
				handleWeaponFire(playerMech, weapon, targetMech, result);
			
				if(playerMech.heldMoves.length > 0){
					moveNowhere(playerMech);
				}
				
				playerMoved = true;
			}
		}
	}
	else if(jumpDirection >= 0){
		// need to store held moves before issuing the result to tell whether the move was allowed but held
		var prevNumHeldMoves = (playerMech.heldMoves.length);
		
		var result = jump(playerMech, jumpDirection);
		if(result.success || prevNumHeldMoves != playerMech.heldMoves.length){
			// resetting the prev heading value to indicate the player is no longer just jump turning in place
			prevPlayerHeading = -1;
		}
		
		playerMoved = result.success;
		
		// update screen to make sure the player doesn't run off the displayed portion of the map
		autoCenterOnMech();
	}
	else if(key == "p"){
		// punch
		if(lookMode){
			autoCenterOnMech();
		}
		else if(playerEnded){
			// do nothing
		}
		else if(playerJumping){
			// do nothing //TODO: JUMP PUNCH!
		}
		else{
			// firing a weapon without moving indicates the player did not want to move
			var weapon = getBestArmPunch(playerMech, targetMech);
			var result = fireWeapon(playerMech, weapon, targetMech);
			
			if(result instanceof WeaponFireGameMessage){
				handleWeaponFire(playerMech, weapon, targetMech, result);
				
				if(playerMech.heldMoves.length > 0){
					moveNowhere(playerMech);
				}
				
				playerMoved = true;
			}
		}
	}
	else if(key == "k"){
		// kick
		if(lookMode){
			autoCenterOnMech();
		}
		else if(playerEnded){
			// do nothing
		}
		else if(playerJumping){
			// do nothing //TODO: JUMP KICK!
		}
		else{
			// firing a weapon without moving indicates the player did not want to move
			var weapon = playerMech.melee[KICK];
			var result = fireWeapon(playerMech, weapon, targetMech);
			
			if(result instanceof WeaponFireGameMessage){
				handleWeaponFire(playerMech, weapon, targetMech, result);
				
				if(playerMech.heldMoves.length > 0){
					moveNowhere(playerMech);
				}
				
				playerMoved = true;
			}
		}
	}
	else if(key == "." || key == "space" || key == "enter"){
		if(lookMode){
			autoCenterOnMech();
		}
		else if(playerEnded){
			// do nothing
		}
		else{
			// pressing period skips movement AND firing (unless there are group fire weapons queued up)
			if(groupFireEnabled){
				// sort firing weapons by their speed, so faster ones fire first (where higher number is faster)
				var weaponSortObjects = [];
				for(var i=0; i<playerMech.weapons.length; i++){
					var weapon = playerMech.weapons[i];
					
					if(weapon != null && weapon.isGroupFiring()){
						var projectileSpeed = getWeaponProjectileSpeed(weapon);
						weaponSortObjects.push(new SortObject(weapon, projectileSpeed));
					}
				}
				
				weaponSortObjects.sort(sortObjectCompare);
				
				for(var i=weaponSortObjects.length-1; i>=0; i--){
					var weapon = weaponSortObjects[i].getObj();
					var result = fireWeapon(playerMech, weapon, targetMech);
					
					if(result instanceof WeaponFireGameMessage){
						// show animation of weapon fire
						handleWeaponFire(playerMech, weapon, targetMech, result);
					}
					
					weapon.setGroupFiring(false);
				}
				
				groupFireEnabled = false;
			}
			
			if(playerMech.heldMoves.length > 0){
				moveNowhere(playerMech);
			}
			
			playerMoved = true;
		}
	}
	else if(key == "\\"){
		if(lookMode){
			autoCenterOnMech();
		}
		else if(playerEnded){
			// do nothing
		}
		else{
			// toggle group fire mode
			groupFireEnabled = !groupFireEnabled;
			
			if(!groupFireEnabled){
				for(var i=0; i<playerMech.weapons.length; i++){
					// disable group fire setting from each weapon
					var weapon = playerMech.weapons[i];
					
					if(weapon != null && weapon.isGroupFiring()){
						weapon.setGroupFiring(false);
					}
				}
			}
		}
	}
	else if(key == "j"){
		if(lookMode){
			autoCenterOnMech();
		}
		else if(playerEnded){
			// do nothing
		}
		else if(playerMech.jumpMP == 0){
			// no jump jets, show floating message
			createFloatMessage(playerMech.location, "NO JUMPJETS", colors.playerColor);
		}
		else if(playerJumping){
			// turn off jump jet mode
			playerJumping = false;
			
			if(prevPlayerHeading >= 0 && prevPlayerHeading != playerMech.getHeading()){
				// player jumped and only rotated in place, count as a move
				var result = jump(playerMech, -1);
				if(result.success){
					prevPlayerHeading = -1;
				}
			}
		}
		else if(playerMech.jumpPoints == 0){
			// no jump points remain, show floating message
			createFloatMessage(playerMech.location, "NO JUMP POINTS", colors.playerColor);
		}
		else{
			// turn on jump jet mode
			playerJumping = true;
			
			prevPlayerHeading = playerMech.heading;
		}
	}
	else if(key == "a" || key == "left"){
		if(lookMode){
			// scroll map view left 1 hex
			if(visibleHexOffsetX > -5){
				setVisibleHexOffset(visibleHexOffsetX - 1, visibleHexOffsetY);
			}
		}
		else if(playerEnded){
			// do nothing
		}
		else{
			var result = rotateHeadingCCW(playerMech, playerJumping);
			
			playerMoved = result.success;
		}
	}
	else if(key == "d" || key == "right"){
		if(lookMode){
			// scroll map view right 1 hex
			if(visibleHexOffsetX < numHexCols - maxVisibleHexCols + 5){
				setVisibleHexOffset(visibleHexOffsetX + 1, visibleHexOffsetY);
			}
		}
		else if(playerEnded){
			// do nothing
		}
		else{
			var result = rotateHeadingCW(playerMech, playerJumping);
			
			playerMoved = result.success;
		}
	}
	else if(key == "w" || key == "up"){
		if(lookMode){
			// scroll map up 1 hex
			if(visibleHexOffsetY > -5){
				setVisibleHexOffset(visibleHexOffsetX, visibleHexOffsetY - 1);
			}
		}
		else if(playerEnded){
			// do nothing
		}
		else if(playerJumping){
			// do nothing
		}
		else{
			var result = moveForward(playerMech, false);
			
			playerMoved = result.success;
			
			// update screen to make sure the player doesn't run off the displayed portion of the map
			autoCenterOnMech();
		}
	}
	else if(key == "s" || key == "down"){
		if(lookMode){
			// scroll map down 1 hex
			if(visibleHexOffsetY < numHexRows - maxVisibleHexRows + 5){
				setVisibleHexOffset(visibleHexOffsetX, visibleHexOffsetY + 1);
			}
		}
		else if(playerEnded){
			// do nothing
		}
		else if(playerJumping){
			// do nothing
		}
		else{
			var result = moveBackward(playerMech, false);
			
			playerMoved = result.success;
			
			// update screen to make sure the player doesn't run off the displayed portion of the map
			autoCenterOnMech();
		}
	}
	else if(key == "r"){
		if(isPlayerTurn() || playerMech.isDestroyed()){
			targetNearest();
			
			if(playerMech.isDestroyed()){
				autoCenterOnMech(targetMech);
			}
		}
	}
	else if(key == "t"){
		if(isPlayerTurn() || playerMech.isDestroyed()){
			targetNext();
			
			if(playerMech.isDestroyed()){
				autoCenterOnMech(targetMech);
			}
		}
	}
	else if(key == "y"){
		if(isPlayerTurn() || playerMech.isDestroyed()){
			targetPrevious();
			
			if(playerMech.isDestroyed()){
				autoCenterOnMech(targetMech);
			}
		}
	}
	else if(key == "i"){
		if(isPlayerTurn() || playerMech.isDestroyed()){
			
			while(getCurrentTurnBot() != null && getCurrentTurnBot().isAwake()){
				// wait until the bot is done with its current iteration since it should have time between them to safely go to the menu
				sleep(botTime/10);
			}
			
			// go to inventory screen state
			setState(STATE_INVENTORY);
		}
	}
	else if(key == "l"){
		lookMode = !lookMode;
		debug.log("lookMode: "+lookMode);
		
		if(!lookMode){
			if(playerMech.isDestroyed()){
				autoCenterOnMech(targetMech);
			}
			else{
				autoCenterOnMech();
			}
		}
	}
	else if(key == "escape"){
		
		while(getCurrentTurnBot() != null && getCurrentTurnBot().isAwake()){
			// wait until the bot is done with its current iteration since it should have time between them to safely go to the menu
			sleep(botTime/10);
		}
		
		// store gameplay map so it can be restored when the game is returned to
		storedHexMap = getHexMap();
		
		// go to menu state
		setState(STATE_MENU);
	}
	else if(key == "q"){
		if((isPlayerTurn() && !playerEnded)
				|| playerMech.isDestroyed()){
			// show AP amount to enter each visible hex
			showHexRequiredAP();
			
			// show mech chassis of each visible mech
			showMechIdentification();
		}
	}
	else if(key == "f"){
		toggleFiringArcs();
		debug.log("showArcOverlay: "+showArcOverlay);
	}
	else if(key == "h"){
		showHexNumbers = !showHexNumbers;
		debug.log("showHexNumbers: "+showHexNumbers);
	}
	else if(key == "[" || key == "]"){
		cycleColorTemplate(key == "]" ? true : false);
	}
	else if(key == "/"){
		useHtalDamageDisplay = !useHtalDamageDisplay;
	}
	else if(key == "pgup"){
		if((isPlayerTurn() && !playerEnded)
				|| playerMech.isDestroyed()){
			prevMessage();
			
			while(messageDisplayIndex > 0 && messages[messageDisplayIndex].message == null){	
				// skip over null messages
				prevMessage();
			}
			
			// show up to 5 additional prior messages temporarily as floaters
			showMessageHistoryFloats();
		}
	}
	else if(key == "pgdn"){
		if((isPlayerTurn() && !playerEnded)
				|| playerMech.isDestroyed()){
			nextMessage();
			
			while(messageDisplayIndex != -1 && messageDisplayIndex < messages.length - 1 && messages[messageDisplayIndex].message == null){	
				// skip over null messages
				nextMessage();
			}
			
			// show up to 5 additional prior messages temporarily as floaters
			showMessageHistoryFloats();
		}
	}
	else if(key == "home"){
		if((isPlayerTurn() && !playerEnded)
				|| playerMech.isDestroyed()){
			messageDisplayIndex = 0;
			
			// show up to 5 additional prior messages temporarily as floaters
			showMessageHistoryFloats();
		}
	}
	else if(key == "end"){
		if((isPlayerTurn() && !playerEnded)
				|| playerMech.isDestroyed()){
			messageDisplayIndex = messages.length - 1;
			
			// show up to 5 additional prior messages temporarily as floaters
			showMessageHistoryFloats();
		}
	}
	else if(isPlayerTurn() && key == "delete" && debug.debug == true){
		// DEBUG ONLY: kill the player
		playerMech.setDestroyed(true);
		playerMoved = true;
	}
	else if(isPlayerTurn() && key == "insert" && debug.debug == true){
		// DEBUG ONLY: kill all enemies
		var enemyMechs = getEnemyMechsByRange(playerMech);
		for(var i=0; i<enemyMechs.length; i++){
			if(enemyMechs[i] == null) continue;
			
			enemyMechs[i].setDestroyed(true);
			playerMoved = true;
		}
	}
	
	if(playerMoved){
		if(groupFireEnabled){
			// if the player left group fire on, turn it off and any weapons that were grouped as well
			for(var i=0; i<playerMech.weapons.length; i++){
				var weapon = playerMech.weapons[i];
				
				if(weapon != null && weapon.isGroupFiring()){
					weapon.setGroupFiring(false);
				}
			}
			
			groupFireEnabled = false;
		}
		
		messageDisplayIndex = -1;
		endPlayerTurn();
	}
}

function showMessageHistoryFloats(){
	var counter = 0;
		
	// clear other floaters first
	floatingMessages = [];
	
	var i = messages.length - 1;
	if(messageDisplayIndex >= 0){
		i = messageDisplayIndex;
	}
	
	while(i >= 0 && counter <= 5){
		var thisMessage = messages[i];
		i --;
		if(thisMessage == null || thisMessage.message == null){
			continue;
		}
		else if(counter == 0){
			// purposefully skipping first found message since it will be the same one being displayed as the last message
			counter ++;
			continue;
		}
		
		var thisColor = colors.fgColor;
		if(thisMessage.severity == SEV_HIGH)
			thisColor = colors.sevHighColor;
			
		var historyCoords = new Coords(-1, -1);
		historyCoords.actualX = 1 + colOffset * 3 * hexColWidth;
		historyCoords.actualY = topOffset + (rowOffset * numRows) - (counter * rowOffset * 2);
		
		createFloatMessage(historyCoords, thisMessage.message, thisColor, 0, 1.5, true);
		
		counter ++;
	}
}

function prevMessage(){
	if(messageDisplayIndex == -1)
		messageDisplayIndex = messages.length - 1;
	
	if(messageDisplayIndex > 0)
		messageDisplayIndex --;
}

function nextMessage(){
	if(messageDisplayIndex != -1 && messageDisplayIndex < messages.length - 1)
		messageDisplayIndex ++;
}

//Using jQuery add the event handlers after the DOM is loaded
function addEventHandlers() {
	// add event handler for key presses
	document.onkeypress = function(e){
		var charCode = e.which || e.keyCode;
		var key = String.fromCharCode(charCode);
		
		handleKeyPress(key);
		
		e.preventDefault();
	};
	
	specialKeyCodes = [8, 9, 13, 16, 17, 18, 27, 32, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46];
	window.addEventListener("keydown", function(e) {
		// handle special keys which don't have char codes, such as space and arrow keys
		if(specialKeyCodes.indexOf(e.keyCode) > -1) {
			e.preventDefault();
			
			var key = "";
			switch(e.keyCode){
				case 8:		key = "backspace";
							break;
				case 9:		key = "tab";
							break;
				case 13:	key = "enter";
							break;
				case 16:	key = "shift";
							break;
				case 17:	key = "ctrl";
							break;
				case 18:	key = "alt";
							break;
				case 27:	key = "escape";
							break;
				case 32:	key = "space";
							break;
				case 33:	key = "pgup";
							break;
				case 34:	key = "pgdn";
							break;
				case 35:	key = "end";
							break;
				case 36:	key = "home";
							break;
				case 37:	key = "left";
							break;
				case 38:	key = "up";
							break;
				case 39:	key = "right";
							break;
				case 40:	key = "down";
							break;
				case 45:	key = "insert";
							break;
				case 46:	key = "delete";
							break;
				default:	key = "undefined";
							break;
			}
			
			handleKeyPress(key);
		}
	}, false);

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
		
		if(state == STATE_START){
			handleStartClick();
		}
		
		// return false is needed to prevent the drag-select from occuring on the page
		return false;
	};
	
	document.oncontextmenu = function(e){
		// return false is needed to prevent the right click menu from appearing on the page while the game is playing
		if(state == STATE_GAME){
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

}

/** store ascii images so they can be retrieved after they are finish being created */
var performAsciiRenders = true;
var asciiStorage = [];
var AsciiObject = Class.create({
	initialize: function(name) {
		this.name = name;
		this.asciiStr = null;
	},
});
function getAsciiForMech(mech, flipImage){
	// look through storage first
	var imageKey = mech.chassis;
	
	if(imageKey == null || imageKey == ""){
		return;
	}
	
	if(mech.isDestroyed()){
		imageKey = "Destroyed";
	}
	else if(mech.variant.search("YLW") != -1){
		imageKey = "Centurion_YLW";
	}
	
	var indexKey = imageKey;
	if(flipImage){
		indexKey += "_flip";
	}
	
	for(var i=0; i<asciiStorage.length; i++){
		var obj = asciiStorage[i];
		
		if(obj.name == indexKey){
			return obj.asciiStr;
		}
	}

	var thisObj = new AsciiObject(indexKey);
	asciiStorage.push(thisObj);

	var mechImg = new Image();
	try{
		mechImg.src = "images/mechs/"+ imageKey +".jpg";
	}
	catch(err){
		debug.log("Error because image does not exist: " + err);
		return;
	}
	
	mechImg.onload = function(){
		var imgJscii = new Jscii({
			width: 75,
			flip: flipImage,
			image: mechImg,
		});
		
		var asciiStr = imgJscii.render();
		
		if(asciiStr != null && asciiStr.length > 0){
			// store the ascii string and update render the parts of the UI that are using it
			thisObj.asciiStr = asciiStr;
			
			// TODO: this will need to be made either generic or have the function name passed in as a parameter?
			//renderTargetStats();
			updateDisplay = true;
		}
	};
}

// The following are resources from elsewhere

/**
 * value to character mapping from dark to light
 * add more characters and they will be accounted for automatically
 * note: the extra &nbsp; is to account for the value range inclusive of 100%
 */
var chars = ['@','#','$','=','*','!',';',':','~','-',',','.',' ', ' '];
var charLen = chars.length-1;
function getChar(val) { return chars[parseInt(val*charLen, 10)]; }

/**
 * Options:
 * el        - DOM node (img or video)
 * container - if supplied, ascii string will automatically be set on container innerHTML during a render
 * fn        - function, callback to fire during a render with ascii string as arguments[0]
 * width     - hi-res images/videos must be resized down, specify width and jscii will figure out height
 * color     - enable color ascii (highly experimental)
 * interval  - integer - for videos only, this is the interval between each render
 * webrtc    - bool, default false, only applicable if 'el' is a video
 */
function Jscii(params) {
	this.flip = params.flip;
	this.image = params.image;
	this.width = typeof params.width === 'number' ? params.width : 150;

	this.canvas = document.createElement('canvas');
	this.ctx = this.canvas.getContext('2d');
}

/**
 * getter/setter for output dimension
 */
Jscii.prototype.dimension = function(width, height) {
	if(typeof width === 'number' && typeof height === 'number') {
		this._scaledWidth = this.canvas.width = width;
		this._scaledHeight = this.canvas.height = height;
		return this;
	} else {
		return { width: this._scaledWidth, height: this._scaledHeight };
	}
};

/**
 * gets context image data, perform ascii conversion, append string to container
 */
Jscii.prototype.render = function() {
	var ratio;
	var dim = this.dimension(), width, height;
	if(!dim.width || !dim.height) {
		ratio = this.image.height/this.image.width ;
		this.dimension(this.width, parseInt(this.width*ratio, 10));
		dim = this.dimension();
	}
	width = dim.width;
	height = dim.height;

	// might take a few cycles before we
	if(!width || !height) return;
	
	if(this.flip == true){
		// rotate 180 degrees:
		this.ctx.setTransform(1,0,0,1,0,0);
		var angleInRadians = 180 * Math.PI / 180;
		this.ctx.translate(0.5*width, 0.5*height);
		this.ctx.rotate(angleInRadians);
		
		this.ctx.drawImage(this.image, -.5*width, -.5*height, width, height);
	}
	else{
		this.ctx.drawImage(this.image, 0, 0, width, height);
	}
	var asciiStr = "";
	try{
		this.imageData = this.ctx.getImageData(0, 0, width, height).data;
		asciiStr = this.getAsciiString();
	}
	catch(err){
		debug.log("Error because this is not being run from a web server: " + err);
		performAsciiRenders = false;
	}
	return asciiStr;
};

/**
 * given a picture/frame's pixel data and a defined width and height
 * return the ASCII string representing the image
 */
Jscii.prototype.getAsciiString = function() {
	var dim = this.dimension(), width = dim.width, height = dim.height;
	var len = width*height, d = this.imageData, str = '';

	// helper function to retrieve rgb value from pixel data
	var getRGB = function(i) { return [d[i=i*4], d[i+1], d[i+2]]; };

	for(var i=0; i<len; i++) {
		if(i%width === 0) str += '\n';
		var rgb = getRGB(i);
		var val = Math.max(rgb[0], rgb[1], rgb[2])/255;
		str += getChar(val);
	}
	return str;
};


/**
 * FontDetect - A simple library to detect if an internal font is present or an external font got loaded.
 * 
 * TO USE: 
 *     Include jQuery. This was developed using jQuery 1.7.
 *     Include this file. If desired, you can load this file after the BODY.
 *     Create a new fontdetect().
 *     After you load the fonts you want to test, call either of these methods:
 *     
 *	       fontDetect = new fontdetect();
 *	       
 *	       // Checks that the font is loaded now.
 *	       isLoaded = fontDetect.isFontLoaded(fontname);
 *     
 *         // Polls for the font getting loaded and calls a callback when it does.
 *	       fontDetect.onFontLoaded(fontname, callback [, {onFail: xxx, msInterval: yyy, msTimeout: zzz}]);
 *     
 *     Note: For externally loaded fonts, you may have to wait for more than a second to get a reliable 
 *     answer. Internal browser fonts can be detected immediately.
 *     
 *         // Determines which font in the font stack is being used for a given element.
 *	       sFontname = fontDetect.whichFont(element);
 *     
 * @author		Jennifer Simonds
 * @copyright	2012 Jennifer Simonds
 * @license	MIT License http://opensource.org/licenses/MIT
 * 
 * @version 1.0  2012-04-11	Created.
 * 
 * @version 1.0  2012-04-12	Refined the algorithm to use fewer helper elements, more reference fonts,
 *								and quicker detection of a nonexistent font.
 * 
 * @version 2.0  2012-06-01	Added onFontLoaded for a callback to execute as soon as the font is 
 *								detected or when a timeout has passed without loading. Added whichFont
 *								to determine which font actually loaded. Changed the license from BSD 
 *								3-clause to MIT.
 *								
 * @version 2.1  2012-08-12	Fixed a bug that caused horizontal scrollbar to show up in FF & IE.
 *                              (Thanks to Geoff Beaumont for the bug report & fix)
 */
fontdetect = function()
{
	// The private parts
	var _isInitialized = false;
	var _aFallbackFonts = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'];
	
	function _init ()
	{
		if (_isInitialized)
		{	return;
		}

		_isInitialized = true;

		$('body > :first-child').before(
			'<div id="fontdetectHelper"><span>abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ</span></div>'
		);
		$('#fontdetectHelper').css({
			'position': 'absolute',
			'visibility': 'hidden',
			'top': '-200px',
			'left': '-100000px',
			'width': '100000px',
			'height': '200px',
			'font-size': '100px'
		});
	}

	
	// The public interface
	return	{
		/**
		 * Polls 10 times/second until a font gets loaded or until it times out. (Default = 2 secs) It 
		 * calls a callback on load, & optionally calls another function if it times out without loading.
		 * 
		 * NOTE: You must specify at least one callback - for success or failure.
		 * 
		 * @param string		The font name to check for.
		 * @param function		The function to call if it gets loaded within the timeout period.
		 * @param options		An optional object with named parameters:
		 *     @param onFail       The function to call if the font doesn't load within the timeout period.
		 *     @param msInterval   How many milliseconds for the polling interval. Default = 100.
		 *     @param msTimeout    How many milliseconds until we time out & call onFail. Default = 2000.
		 */
		onFontLoaded: function (p_cssFontName, p_onLoad, p_onFail, p_options)
		{
			if (!p_cssFontName)
			{	return;
			}
			
			// Our hashtable of optional params.
			var msInterval = (p_options && p_options.msInterval) ? p_options.msInterval : 100;
			var msTimeout  = (p_options && p_options.msTimeout) ? p_options.msTimeout : 2000;

			if (!p_onLoad && !p_onFail)
			{	// Caller must specify at least one callback.
				return;
			}
			
			if (!_isInitialized)
			{	_init ();
			}
			
			if (this.isFontLoaded(p_cssFontName))
			{	// It's already here, so no need to poll.
				if (p_onLoad)
				{	p_onLoad(p_cssFontName);
				}
				return;
			}
			
			// At this point we know the font hasn't loaded yet. Add it to the list of fonts to monitor.
			
			// Set up an interval using msInterval. The callback calls isFontLoaded(), & if true
			// it closes the interval & calls p_onLoad, else if the current time has timed out
			// it closes the interval & calls onFail if there is one.
			var outerThis = this;
			var utStart = new Date().getTime();
			var idInterval = setInterval (
				function()
				{
					if (outerThis.isFontLoaded(p_cssFontName))
					{	// It's now loaded.
						clearInterval (idInterval);
						p_onLoad(p_cssFontName);
						return;
					}
					else
					{	// Still not loaded.
						var utNow = new Date().getTime();
						if ((utNow - utStart) > msTimeout)
						{
							clearInterval (idInterval);
							if (p_onFail)
							{	p_onFail(p_cssFontName);
							}
						}
					}
				},
				msInterval
			);
		},


		/**
		 * Determines if a font has gotten loaded.
		 * 
		 * @param string		The font name to check for.
		 * 
		 * @returns bool		true if it's loaded, else false if the browser had to use a fallback font.
		 */
		isFontLoaded: function (p_cssFontName)
		{
			var wThisFont = 0;
			var wPrevFont = 0;

			if (!_isInitialized)
			{	_init ();
			}
			
			for(var ix = 0; ix < _aFallbackFonts.length; ++ix)
			{
				var $helperSpan = $('#fontdetectHelper > SPAN');
				$helperSpan.css('font-family', p_cssFontName + ',' + _aFallbackFonts[ix]);
				wThisFont = $helperSpan.width();
				if (ix > 0 && wThisFont != wPrevFont)
				{// This iteration's font was different than the previous iteration's font, so it must
				//  have fallen back on a generic font. So our font must not exist.
					return false;
				}

				wPrevFont = wThisFont;
			}

			// The widths were all the same, therefore the browser must have rendered the text in the same
			// font every time. So unless all the generic fonts are identical widths (highly unlikely), it 
			// couldn't have fallen back to a generic font. It's our font.
			return true;
		},


		/**
		 * Determines which font is being used for a given element.
		 * 
		 * @param string/object		The element to examine. If it's a string, it's a jQuery selector. If it's 
		 *							an object, it's taken as a DOM element.
		 * 
		 * @returns string			The name of the font that's being used - either one of the fonts 
		 *							listed in the element's font-family css value, or null.
		 */
		whichFont: function (p_element)
		{
			var sStack = $(p_element).css('font-family');
			var aStack = sStack.split(',');
			
			var sFont = aStack.shift();
			while (sFont)
			{
				sFont = sFont.replace(/^\s*['"]?\s*([^'"]*)\s*['"]?\s*$/, '$1');
				
				if (this.isFontLoaded(sFont))
				{	return sFont;
				}
				sFont = aStack.shift();
			}
			
			return null;
		}
	};
}();
