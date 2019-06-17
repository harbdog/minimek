 // base definition of a game object
var GameObject = Class.create({
	initialize: function() {
		this.x = 0;
		this.y = 0;
		this.type = null;
	}
});

var DebugLogger = Class.create({
	initialize: function(debug) {
		this.debug = debug;
	},
	setDebug: function(debug) {
		this.debug = debug;
	},
	log: function(str) {
		if(this.debug)
			console.log("[debug] "+str);
	}
});
var debug = new DebugLogger(false);

var playerName = "Rogue";
var gameStarted = false;
var gameOver = false;
var turnsPerRound = 4;
var hexMap = [];	// stores environment only
var generateRandomMap = false;
var numHexCols = 0;
var numHexRows = 0;

// keep track of whose turn it is
var currentTurn = 0;
var turnOrder = [];

var playerMech;
var targetMech;
var gameMechs = [];
var customBotMechs;

// static types
var HEX_TYPE = "hex";
var TREE_TYPE = "tree";
var ROCK_TYPE = "rock";
var WATER_TYPE = "water";

var PLAYER_TYPE = "player";
var ENEMY_TYPE = "enemy";

// static location indices
var HEAD = 0;
var LEFT_ARM = 1;
var LEFT_TORSO = 2;
var CENTER_TORSO = 3;
var RIGHT_TORSO = 4;
var RIGHT_ARM = 5;
var LEFT_LEG = 6;
var RIGHT_LEG = 7;
var LEFT_REAR = 8;
var CENTER_REAR = 9;
var RIGHT_REAR = 10;

var LEGS = [LEFT_LEG, RIGHT_LEG];
var ARMS = [LEFT_ARM, RIGHT_ARM];

// hit locations based on rolls in the order 2,3,4,5,6,7,8,9,10,11,12
var FRONT_HIT_LOCATIONS	= [CENTER_TORSO, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_TORSO, CENTER_TORSO, LEFT_TORSO, LEFT_LEG, LEFT_ARM, LEFT_ARM, HEAD];
var LEFT_HIT_LOCATIONS  = [LEFT_TORSO, LEFT_LEG, LEFT_ARM, LEFT_ARM, LEFT_LEG, LEFT_TORSO, CENTER_TORSO, RIGHT_TORSO, RIGHT_ARM, RIGHT_LEG, HEAD];
var RIGHT_HIT_LOCATIONS	= [RIGHT_TORSO, RIGHT_LEG, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_TORSO, CENTER_TORSO, LEFT_TORSO, LEFT_ARM, LEFT_LEG, HEAD];
var REAR_HIT_LOCATIONS	= [CENTER_REAR, RIGHT_ARM, RIGHT_ARM, RIGHT_LEG, RIGHT_REAR, CENTER_REAR, LEFT_REAR, LEFT_LEG, LEFT_ARM, LEFT_ARM, HEAD];

var TEST_ARM_ONLY_LOCATION = [LEFT_ARM, RIGHT_ARM, LEFT_ARM, RIGHT_ARM, LEFT_ARM, RIGHT_ARM, LEFT_ARM, RIGHT_ARM, LEFT_ARM, RIGHT_ARM, LEFT_ARM];

// melee hit locations based on rolls 1,2,3,4,5,6
var FRONT_PUNCH_LOCATIONS = [LEFT_ARM, LEFT_TORSO, CENTER_TORSO, RIGHT_TORSO, RIGHT_ARM, HEAD];
var LEFT_PUNCH_LOCATIONS  = [LEFT_TORSO, LEFT_TORSO, CENTER_TORSO, LEFT_ARM, LEFT_ARM, HEAD];
var RIGHT_PUNCH_LOCATIONS = [RIGHT_TORSO, RIGHT_TORSO, CENTER_TORSO, RIGHT_ARM, RIGHT_ARM, HEAD];
var REAR_PUNCH_LOCATIONS  = [LEFT_ARM, LEFT_REAR, CENTER_REAR, RIGHT_REAR, RIGHT_ARM, HEAD];

var FRONT_KICK_LOCATIONS = [RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG];
var LEFT_KICK_LOCATIONS  = [LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG, LEFT_LEG];
var RIGHT_KICK_LOCATIONS = [RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG, RIGHT_LEG];
var REAR_KICK_LOCATIONS  = FRONT_KICK_LOCATIONS;


// internal structure points for each tonnage
var INTERNAL_STRUCTURE = {
	//	T:		[HD,LA,LT,CT,RT,RA,LL,RL]
		20:		[ 3, 3, 5, 6, 5, 3, 4, 4],
		25:		[ 3, 4, 6, 8, 6, 4, 6, 6],
		30:		[ 3, 5, 7,10, 7, 5, 7, 7],
		35:		[ 3, 6, 8,11, 8, 6, 8, 8],
		40:		[ 3, 6,10,12,10, 6,10,10],
		45:		[ 3, 7,11,14,11, 7,11,11],
		50:		[ 3, 8,12,16,12, 8,12,12],
		55:		[ 3, 9,13,18,13, 9,13,13],
		60:		[ 3,10,14,20,14,10,14,14],
		65:		[ 3,10,15,21,15,10,15,15],
		70:		[ 3,11,15,22,15,11,15,15],
		75:		[ 3,12,16,23,16,12,16,16],
		80:		[ 3,13,17,25,17,13,17,17],
		85:		[ 3,14,18,27,18,14,18,18],
		90:		[ 3,15,19,29,19,15,19,19],
		95:		[ 3,16,20,30,20,16,20,20],
		100:	[ 3,17,21,31,21,17,21,21],
};


var CLUSTER_HITS = {
//weapon size 2, 4, 5, 6, 10, 15, 20
 2:	[1,1,1,2,3,5,6],		// rolled 2
 3:	[1,2,2,2,3,5,6],
 4:	[1,2,2,3,4,6,9],
 5:	[1,2,3,3,6,9,12],
 6:	[1,2,3,4,6,9,12],
 7:	[1,3,3,4,6,9,12],		// rolled 7
 8:	[2,3,3,4,6,9,12],
 9:	[2,3,4,5,8,12,16],
10:	[2,3,4,5,8,12,16],
11:	[2,4,5,6,10,15,20],
12:	[2,4,5,6,10,15,20]		// rolled 12
};

// average cluster hits based on number of projectiles (as index)
var expectedHitsByRackSize = [ 0.0, 1.0, 1.58, 2.0, 2.63, 3.17, 4.0, 4.49, 4.98, 5.47,
                               6.31, 7.23, 8.14, 8.59, 9.04, 9.5, 10.1, 10.8, 11.42, 12.1, 12.7 ];

// odds for die roll (as index) and above
var ODDS = [ 100, 100, 100, 97.2, 91.6, 83.3, 72.2, 58.3, 41.6, 27.7, 16.6, 8.3, 2.78, 0 ];


// mech melee weapon array indices
var PUNCH_LEFT_ARM  = 0;
var PUNCH_RIGHT_ARM = 1;
var KICK            = 2;
var HATCHET_LEFT_ARM  = 3;
var HATCHET_RIGHT_ARM = 4;

// mech movement vars
var MECH_STANDING = "Standing";
var MECH_WALKING = "Walking";
var MECH_RUNNING = "Running";
var MECH_JUMPING = "Jumping";
var MECH_IMMOBILE = "Immobile";
var MECH_PRONE = "Prone";
var MECH_DESTROYED = "Destroyed";

// relative direction vars
var REL_DIRECTION_FRONT = "Front";
var REL_DIRECTION_LEFT = "Left";
var REL_DIRECTION_RIGHT = "Right";
var REL_DIRECTION_REAR = "Rear";

//TODO: create vars for message contents since many of them get reused anyway

var messages = [];
var messageReadIndex = -1;	// keeps track of the last message the UI has read


/** simple function to get a new copy of an array */
Array.prototype.getCopy = function() {
	var copy = [];
	for (var i=0;i<this.length;i++){
		copy[i]=this[i];
	}
	return copy;
};

/** simple object used to store whatever object/value pair needs to be sorted on */
var SortObject = Class.create({
	initialize: function(obj, value) {
		this.obj = obj;
		this.value = value;
	},
	compareTo: function(otherObj) {
		if(this.value < otherObj.getValue()){
			return -1;
		}
		else if(this.value > otherObj.getValue()){
			return 1;
		}
		else{
			return 0;
		}
	},
	getObj: function() {
		return this.obj;
	},
	getValue: function() {
		return this.value;
	},
});

function sortObjectCompare(objectA, objectB){
	return objectA.compareTo(objectB);
}

var MapIterator = function(items) {
    this.index = 0;
    this.items = items;
};

MapIterator.prototype = {
    first: function() {
        this.reset();
        return this.next();
    },
    next: function() {
        //return this.items[this.index++];
    	var count = 0;
    	for(var item in this.items){
    		if(this.items[item] != null){
	    		if(count >= this.index){
	    			this.index = count+1;
	    			return this.items[item];
	    		}
	    		
	    		// only counting non-null indices
	    		count ++;
    		}
    	}
    	
    	return null;
    },
    hasNext: function() {
    	return this.index < getHashSize(this.items);
    },
    reset: function() {
        this.index = 0;
    },
    each: function(callback) {
        for (var item = this.first(); this.hasNext(); item = this.next()) {
            callback(item);
        }
    }
};

function randomInt(maxValue){
	return Math.floor((Math.random()*maxValue));
}

/** 
 * function used to have hashmap-like functionality
 * requires setting a unique "key" variable on any object to be hashed
 */
var hash = function(obj){
	if(obj.key != null){
		return obj.key;
	}
	else if(obj.x != null && obj.y != null){
		if(obj.heading != null){
			return "x"+obj.x+"y"+obj.y+"h"+obj.heading;
		}
		
		return "x"+obj.x+"y"+obj.y;
	}
	
	return obj;
};

function isHashEmpty(hashObj){
	for(var key in hashObj){
		if(hashObj[hash(key)] != null){
			return false;
		}
	}
	
	return true;
}

function getHashSize(hashObj){
	var size = 0;
	
	for(var key in hashObj){
		if(hashObj[hash(key)] != null){
			size ++;
		}
	}
	
	return size;
}

// sets the given 2 dimensional array as the hex map
function setHexMap(map){
	hexMap = map;
	
	if(hexMap != null){
		// update the cols/rows to match
		numHexRows = hexMap.length;
		
		if(numHexRows > 0){
			numHexCols = hexMap[0].length;
		}
		else{
			numHexCols = 0;
		}
	}
	else{
		numHexCols = 0;
		numHexRows = 0;
	}
}
// return the 2 dimensional array of the hex map
function getHexMap(){
	return hexMap;
}

// Class to store XY hex locations
var Coords = Class.create({
	initialize: function(x, y) {
		this.x = x;
		this.y = y;
	},
	setLocation: function(x, y) {
		this.x = x;
		this.y = y;
	},
	equals: function(thatCoord) {
		if(thatCoord == null)	return false;
		return (this.x == thatCoord.x && this.y == thatCoord.y);
	},
	distance: function(thatCoord) {
		return getRange(this, thatCoord);
	},
	direction: function(thatCoord) {
		return getDirection(this, thatCoord);
	},
	translated: function(direction) {
		return new Coords(xInDirection(this.x, this.y, direction), yInDirection(this.x, this.y, direction));
	},
	getCacheKey: function() {
		// key will currently only go up to 99x99
		var key = (this.x * 100) + this.y;
		
		return key;
	},
	isXOdd: function() {
		return (this.x & 1) == 1;
	},
});

// class to store line of sight impedences
// based off of the same class from MegaMek (LosEffects.java)
var LosEffects = Class.create({
	initialize: function() {
		this.blocked = false;
		this.lightWoods = 0;
		this.heavyWoods = 0;
		this.smoke = 0;
		this.targetCover = false;  // that means partial cover
		this.attackerCover = false;  // ditto
	},
	add: function(other) {
		this.blocked |= other.blocked;
        this.lightWoods += other.lightWoods;
        this.heavyWoods += other.heavyWoods;
        this.smoke += other.smoke;
        this.targetCover |= other.targetCover;
        this.attackerCover |= other.attackerCover;
	},
	print: function() {
		debug.log("[blocked="+this.blocked+", lightWoods="+this.lightWoods+", heavyWoods="+this.heavyWoods+", targetCover="+this.targetCover+", attCover="+this.attackerCover+"]");
	}
});

// keep a lookup table of heat effects
var heatEffects = [];
var EFFECT_MP_REDUCE = "mp_reduce";			// speed mp reduction (affects total AP)
var EFFECT_TOHIT_INCREASE = "aim_reduce";	// adds modifiers to hit
var EFFECT_AMMO_EXP_RISK = "ammo_exp";		// chance of ammo explosion
var EFFECT_SHUTDOWN_RISK = "shutdown";		// chance of shutdown
var EFFECT_HEAT_INCREASE = "heat_increase";	// heat built up every turn automatically (e.g. from engine damage)

// class to store the critical effects (e.g. high heat, from engine damage, leg destroyed, etc)
var CriticalEffect = Class.create({
	initialize: function(type, amount) {
		this.type = type;
		this.amount = amount;
	},
});


var Movement = Class.create({
	// c = Coords
	// points = AP used (int)
	// jumping = was jumping (boolean)
	initialize: function(c, points, jumping) {
		this.c = c;
		this.points = points;
		this.jumping = jumping;
	},
	getCoords: function() {
		return this.c;
	},
	getPoints: function() {
		return this.points;
	},
	isJumping: function() {
		return this.jumping;
	}
});

var SEV_NORMAL = 0;		// normal should be treated as a standard info message (eg "MLAS hits target for 5 damage on LL.")
var SEV_HIGH = 1; 		// high should be treated with a bit more emphasis, such as bright color (eg "Left leg has been destroyed!")
var GameMessage = Class.create({
	// class used to provide messages back to the UI based on the most recent action
	// success = true if the action proceeded (doesn't mean a hit in the case of weapon fire, just means the weapon fired)
	// message = message (if any) that needs to surface to the UI 
	// severity = indicates severity (eg needs to show in red versus black)
	initialize: function(mech, success, message, severity) {
		this.mech = mech;
		this.success = success;
		this.message = message;
		this.severity = severity;
	}
});

var WeaponFireGameMessage = Class.create(GameMessage, {
	// class used to provide extended messaging capabilities for weapons fire
	// success = true if the action proceeded (doesn't mean a hit in the case of weapon fire, just means the weapon fired)
	// message = message (if any) that needs to surface to the UI 
	// severity = indicates severity (eg needs to show in red versus black)
	initialize: function(mech, success, message, severity) {
		this.mech = mech;
		this.success = success;
		this.message = message;
		this.severity = severity;
		this.hitDamages = [];
		this.hitLocations = [];
	}
});

var CriticalHitGameMessage = Class.create(GameMessage, {
	// class used to provide extended messaging capabilities for critical hit
	// success = true if the action proceeded
	// message = message (if any) that needs to surface to the UI 
	// severity = indicates severity (eg needs to show in red versus black)
	initialize: function(mech, success, message, severity) {
		this.mech = mech;
		this.success = success;
		this.message = message;
		this.severity = severity;
		this.critLocation;
		this.critComponent;
	}
});

var AmmoExplosionGameMessage = Class.create(GameMessage, {
	// class used to provide extended messaging capabilities for ammo explosions
	// success = true if the action proceeded
	// message = message (if any) that needs to surface to the UI 
	// severity = indicates severity (eg needs to show in red versus black)
	initialize: function(mech, success, message, severity) {
		this.mech = mech;
		this.success = success;
		this.message = message;
		this.severity = severity;
		this.hitDamages = [];
		this.hitLocations = [];
	}
});

var MechFallingGameMessage = Class.create(GameMessage, {
	// class used to provide extended messaging capabilities for mechs that are falling and taking damage from it
	// success = true if the action proceeded
	// message = message (if any) that needs to surface to the UI 
	// severity = indicates severity (eg needs to show in red versus black)
	initialize: function(mech, success, message, severity) {
		this.mech = mech;
		this.success = success;
		this.message = message;
		this.severity = severity;
		this.hitDamages = [];
		this.hitLocations = [];
	}
});

var MechChargingGameMessage = Class.create(GameMessage, {
	// class used to provide extended messaging capabilities for mechs that are making a Charging attack
	// success = true if the action proceeded
	// message = message (if any) that needs to surface to the UI 
	// severity = indicates severity (eg needs to show in red versus black)
	initialize: function(mech, success, message, severity) {
		this.mech = mech;
		this.success = success;
		this.message = message;
		this.severity = severity;
		this.hitDamages = [];
		this.hitLocations = [];
	}
});

var DeathFromAboveGameMessage = Class.create(GameMessage, {
	// class used to provide extended messaging capabilities for mechs that are making a Charging attack
	// success = true if the action proceeded
	// message = message (if any) that needs to surface to the UI 
	// severity = indicates severity (eg needs to show in red versus black)
	initialize: function(mech, success, message, severity) {
		this.mech = mech;
		this.success = success;
		this.message = message;
		this.severity = severity;
		this.hitDamages = [];
		this.hitLocations = [];
	}
});


var Hex = Class.create(GameObject, {
	// main class to store the hex
	// type = describes the hex
	// elevation = terrain height
	// level = terrain impedence
	// cover = incoming aim cover
	initialize: function() {
		this.type = HEX_TYPE;
		this.elevation = 0;
		this.level = 0;
		this.cover = 0;
	}
});

var TreeHex = Class.create(Hex, {
	initialize: function() {
		this.type = TREE_TYPE;
		this.elevation = 0;
		this.level = 1;
		this.cover = 1;
	}
});

var HeavyTreeHex = Class.create(Hex, {
	initialize: function() {
		this.type = TREE_TYPE;
		this.elevation = 0;
		this.level = 2;
		this.cover = 2;
	}
});

var RockHex = Class.create(Hex, {
	initialize: function() {
		this.type = ROCK_TYPE;
		this.elevation = 0;
		this.level = 1;
		this.cover = 0;
	}
});

var WaterHex = Class.create(Hex, {
	initialize: function() {
		this.type = WATER_TYPE;
		this.elevation = 0;
		this.level = 1;
		this.cover = 0;
	}
});


var Pilot = Class.create({
	initialize: function(name){
		this.name = name;
		this.kills = 0;
		
		this.gunnery = 4;
		this.piloting = 5;
	},
	getName: function() {
		return this.name;
	},
	getKills: function() {
		return this.kills;
	},
	getGunnery: function() {
		return this.gunnery;
	},
	getPiloting: function() {
		return this.piloting;
	}
});

var Mech = Class.create({
	initialize: function() {
		this.mtfIndex = -1;
		this.team = -1;
		this.pilot = null;
		this.type = null;
		this.location = new Coords(0,0);
		this.heading = 0;
		this.tonnage = 0;
		this.chassis = "";
		this.variant = "";
		this.walkMP = 0;
		this.actionPoints = 0;
		this.jumpMP = 0;
		this.jumpPoints = 0;
		this.heat = 0;
		this.heatSinks = 0;
		this.heatDiss = 0;
		this.heatGen = 0;
		this.shutdown = false;
		this.prone = false;
		this.destroyed = false;
		//H,LA,LT,CT,RT,RA,LL,RL,LTR,CTR,RTR
		this.armor = [0,0,0,0,0,0,0,0,0,0,0];
		this.armorOrig = [];
		//H,LA,LT,CT,RT,RA,LL,RL
		this.internal = [0,0,0,0,0,0,0,0];
		this.internalOrig = [];
		// TODO: weapons stored as items in actual crits?
		this.weapons = [];
		this.melee = [];
		// store ammo keyed by the short name of the weapon
		this.ammo = [];
		//H,LA,LT,CT,RT,RA,LL,RL
		this.crits = [[],[],[],[],[],[],[],[]];
		// previous turns' hex coords stored to determine movement speed
		this.movement = [];
		// mechs need to store their moves before they can be committed at end of round
		this.heldMoves = [];
		// store damage accumulated each turn in case a piloting roll check for falling is needed from >= 20 damage
		this.damageThisTurn = 0;
	},
	getPilot: function() {
		return this.pilot;
	},
	setLocation: function(location) {
		this.location = location;
	},
	getLocation: function() {
		return this.location;
	},
	setHeading: function(heading) {
		this.heading = heading;
	},
	getHeading: function() {
		return this.heading;
	},
	isTeamMech: function(mech) {
		return (this.team != -1) ? (this.team == mech.team) : false;
	},
	// sets the armor array values and copies it to store the original
	setOrigArmor: function() {
		this.armorOrig = this.armor.getCopy();
	},
	// sets the internal array values and copies it to store the original
	setInternal: function(internal) {
		this.internal = internal;
		this.internalOrig = this.internal.getCopy();
	},
	getPercentRemainingArmor: function() {
		var length = this.armor.length;
		if(this.armorOrig.length != length)	return null;
		
		var remaining = [];
		for(var i=0; i<length; i++){
			remaining[i] = this.armor[i] / this.armorOrig[i] * 100;
		}
		
		return remaining;
	},
	getPercentRemainingInternal: function() {
		var length = this.internal.length;
		if(this.internalOrig.length != length)	return null;
		
		var remaining = [];
		for(var i=0; i<length; i++){
			remaining[i] = this.internal[i] / this.internalOrig[i] * 100;
		}
		
		return remaining;
	},
	getPercentRemainingTotal: function() {
		var remaining = 0;
		var original = 0;
		
		var armorLength = this.armor.length;
		if(this.armorOrig.length != armorLength)	return null;
		
		var intLength = this.internal.length;
		if(this.internalOrig.length != intLength)	return null;
		
		for(var i=0; i<armorLength; i++){
			remaining += this.armor[i];
			original += this.armorOrig[i];
		}
		
		for(var i=0; i<intLength; i++){
			remaining += this.internal[i];
			original += this.internalOrig[i];
		}
		
		return remaining / original * 100;
	},
	getAmmoCount: function(ammoKey) {
		return this.ammo[ammoKey];
	},
	consumeAmmo: function(ammoKey, ammoCount, consumeCrit) {
		if(this.ammo[ammoKey] == null)
			return -1;
		
		this.ammo[ammoKey] -= ammoCount;
		if(this.ammo[ammoKey] < 0)
			// this shouldn't ever happen...
			this.ammo[ammoKey] = 0;
		
		if(consumeCrit){
			var ammoConsumeRemains = ammoCount;
			// find appropriate ammo crit slots to consume the ammo from
			//getWeaponShortName()
			for(var loc=0; loc<8; loc++){
				if(loc >= this.crits.length || ammoConsumeRemains == 0)
					break;
				
				var critSection = this.crits[loc];
				for(var i=0; i<critSection.length; i++){
					var thisCrit = critSection[i];
					if(!thisCrit.isAmmo() || thisCrit.getWeaponShortName() != ammoKey)
						continue;
					
					var critAmmo = thisCrit.getAmmo();
					if(critAmmo == 0)
						continue;
					else if(critAmmo >= ammoConsumeRemains){
						thisCrit.consumeAmmo(ammoConsumeRemains);
						ammoConsumeRemains = 0;
					}
					else{
						ammoConsumeRemains -= critAmmo;
						thisCrit.consumeAmmo(critAmmo);
					}
					
					if(ammoConsumeRemains == 0)
						break;
				}
			}
		}
			
		return this.ammo[ammoKey];
	},
	isDestroyed: function() {
		return this.destroyed;
	},
	setDestroyed: function(destroyed) {
		this.destroyed = destroyed;
	},
	isShutdown: function() {
		return this.shutdown;
	},
	isLegged: function() {
		return (this.internal[LEFT_LEG] == 0 
				|| this.internal[RIGHT_LEG] == 0);
	},
	setProne: function(prone) {
		this.prone = prone;
	},
	isProne: function() {
		return this.prone;
	},
	getCriticals: function(section) {
		return (section < 0 || section >= this.crits.length) ? null : this.crits[section];
	},
	setDamageThisTurn: function(damage) {
		this.damageThisTurn = damage;
	},
	getDamageThisTurn: function() {
		return this.damageThisTurn;
	},
	addDamageThisTurn: function(damage) {
		if(this.damageThisTurn != -1){
			// only add if the value isn't -1 which indicates the piloting check has already been made this turn
			this.damageThisTurn += damage;
		}
	}
});

/**
 * returns remaining ammo for the weapon or -1 if it is not ammo dependent
 */
function getAmmoCount(mech, weapon) {
	if(weapon.ammoPerTon != null && weapon.ammoPerTon >= 1){
		return mech.getAmmoCount(weapon.shortName);
	}
	else{
		// weapon does not use ammo
		return -1;
	}
}

// base module of a critical slot used to set up some common functions
var CriticalSlot = {
	getName: function() {
		return this.name;
	},
	isDestroyed: function() {
		return (this.destroyed != null && this.destroyed == true);
	},
	setDestroyed: function(destroyed) {
		this.destroyed = destroyed;
	},
	isEmpty: function() {
		return (this instanceof EmptySlot);
	},
	isEquipment: function() {
		return (this instanceof EquipmentSlot);
	},
	isWeapon: function() {
		return (this instanceof WeaponSlot);
	},
	isAmmo: function() {
		return (this instanceof AmmoSlot);
	},
	isHeatsink: function() {
		return (this instanceof HeatsinkSlot);
	},
	isJumpJet: function() {
		return (this instanceof JumpJetSlot);
	},
	getWeaponClass: function() {
		return (this instanceof WeaponSlot) ? this.weaponClass : null;
	},
	getAmmoWeaponClass: function() {
		return (this instanceof AmmoSlot) ? this.weaponClass : null;
	},
};

var EmptySlot = Class.create(CriticalSlot, {
	initialize: function(name){
		this.name = name;
	}
});
var HeatsinkSlot = Class.create(CriticalSlot, {
	initialize: function(name) {
		this.name = name;
	}
});
var JumpJetSlot = Class.create(CriticalSlot, {
	initialize: function(name) {
		this.name = name;
	}
});
var EquipmentSlot = Class.create(CriticalSlot, {
	// generic slot just to keep track of any other type of equipment (e.g. engine, gyro, actuators)
	initialize: function(name) {
		this.name = name;
	}
});
var WeaponSlot = Class.create(CriticalSlot, {
	initialize: function(name, weaponClass, rear) {
		this.name = name;
		this.weaponClass = weaponClass;
		this.rear = (rear != null) ? rear : false;
	},
	isRearMounted: function(){
		return this.rear;
	},
});
var AmmoSlot = Class.create(CriticalSlot, {
	// need to initialize ammo with which weapon class (as string) that it belongs to and total (remaining) ammo
	initialize: function(name, weaponClass, weapon) {
		this.name = name;
		this.weaponClass = weaponClass;
		this.weaponShortName = weapon.getShortName();
		this.ammo = weapon.ammoPerTon;
	},
	getWeaponShortName: function() {
		return this.weaponShortName;
	},
	getAmmo: function() {
		return this.ammo;
	},
	consumeAmmo: function(amount) {
		if(this.ammo == null)
			this.ammo = 0;
		
		this.ammo -= amount;
		if(this.ammo < 0)
			this.ammo = 0;
	}
});


// base module of a weapon used to set up some common functions
var WEAPON_MELEE = "melee";
var WEAPON_ENERGY = "energy";
var WEAPON_BALLISTIC = "ballistic";
var WEAPON_MISSILE = "missile";
var Weapon = {
	getShortName: function() {
		return this.shortName;
	},
	getType: function() {
		return this.type;
	},
	getCooldown: function() {
		return this.cooldown;
	},
	getSpeed: function() {
		// speed indicates the cooldown amount to be set when fired 
		// e.g. 1 for machine guns, 2 for medium laser, 3 for large laser, 4 for PPC
		return this.speed;
	},
	getDamage: function() {
		return this.damage;
	},
	getDamageHeat: function() {
		// DamageHeat just means heat transferred to target when hit
		return (this.damageHeat != null) ? this.damageHeat : 0;
	},
	getProjectiles: function(){
		return (this.projectiles != null) ? this.projectiles : 1;
	},
	getHeat: function() {
		return this.heat;
	},
	getLocation: function() {
		return this.location;
	},
	getUsed: function() {
		return this.used;
	},
	setUsed: function(used) {
		this.used = used;
	},
	getMinRange: function() {
		return (this.minRange != null) ? this.minRange : 0;
	},
	getRange: function() {
		return this.range;
	},
	getShortRange: function(){
		return this.getRange()[0];
	},
	getMediumRange: function(){
		return this.getRange()[1];
	},
	getLongRange: function(){
		return this.getRange()[2];
	},
	isDestroyed: function() {
		return (this.destroyed != null && this.destroyed == true);
	},
	setDestroyed: function(destroyed) {
		this.destroyed = destroyed;
	},
	isLRM: function() {
		return (this instanceof WeaponLRM20 
				|| this instanceof WeaponLRM15 
				|| this instanceof WeaponLRM10 
				|| this instanceof WeaponLRM5);
	},
	addModifier: function(modifier) {
		if(this.modifier == null)
			this.modifier = 0;
		this.modifier += modifier;
	},
	getModifier: function(modifier) {
		return (this.modifier != null) ? this.modifier : 0;
	},
	setGroupFiring: function(groupFiring) {
		this.groupFiring = groupFiring;
	},
	isGroupFiring: function(groupFiring) {
		return (this.groupFiring != null && this.groupFiring == true);
	},
};

// -- PHYSICAL (MELEE)
var WeaponPunch = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_MELEE;
		this.name = "Punch";
		this.shortName = "PUNCH";
		this.damage = 0;
		this.heat = 0;
		this.range = [1,0,0];
		this.cooldown = 0;
		this.speed = 4;
		this.used = false;
		this.location = locationIndex;
	}
});
var WeaponKick = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_MELEE;
		this.name = "Kick";
		this.shortName = "KICK";
		this.damage = 0;
		this.heat = 0;
		this.range = [1,0,0];
		this.cooldown = 0;
		this.speed = 4;
		this.used = false;
		
		this.location = locationIndex;
	}
});
var WeaponHatchet = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_MELEE;
		this.name = "Hatchet";
		this.shortName = "HTCHT";
		this.damage = 0;
		this.heat = 0;
		this.range = [1,0,0];
		this.cooldown = 0;
		this.speed = 4;
		this.used = false;
		
		this.location = locationIndex;
	}
});

// -- ENERGY

var WeaponSLAS = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_ENERGY;
		this.name = "Small Laser";
		this.shortName = "SLAS";
		this.tonnage = 0.5;
		this.critSize = 1;
		this.damage = 3;
		this.heat = 2;
		this.range = [1,2,3];
		this.cooldown = 0;
		this.speed = 2;
		
		this.location = locationIndex;
	}
});
var WeaponMLAS = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_ENERGY;
		this.name = "Medium Laser";
		this.shortName = "MLAS";
		this.tonnage = 1.0;
		this.critSize = 1;
		this.damage = 5;
		this.heat = 3;
		this.range = [2,4,6];
		this.cooldown = 0;
		this.speed = 2;
		
		this.location = locationIndex;
	}
});
var WeaponLLAS = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_ENERGY;
		this.name = "Large Laser";
		this.shortName = "LLAS";
		this.tonnage = 5.0;
		this.critSize = 2;
		this.damage = 8;
		this.heat = 5;
		this.range = [3,6,9];
		this.cooldown = 0;
		this.speed = 3;
		
		this.location = locationIndex;
	}
});
var WeaponPPC = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_ENERGY;
		this.name = "Particle Projection Cannon";
		this.shortName = "PPC";
		this.tonnage = 7.0;
		this.critSize = 3;
		this.damage = 10;
		this.heat = 7;
		this.range = [4,8,12];
		this.minRange = 3;
		this.cooldown = 0;
		this.speed = 4;
		
		this.location = locationIndex;
	}
});
var WeaponFlamer = Class.create(Weapon, {
	initialize: function(locationIndex) {
		//TODO: handle heat transfer from the flamer shot
		this.type = WEAPON_ENERGY;
		this.name = "Flamer";
		this.shortName = "FLAMR";
		this.tonnage = 1.0;
		this.critSize = 1;
		this.damage = 2;
		this.damageHeat = 2;
		this.heat = 3;
		this.range = [1,2,3];
		this.cooldown = 0;
		this.speed = 2;
		
		this.location = locationIndex;
	}
});


// -- BALLISTICS
var WeaponAC20 = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_BALLISTIC;
		this.name = "Auto Cannon 20";
		this.shortName = "AC/20";
		this.tonnage = 14.0;
		this.critSize = 10;
		this.damage = 20;
		this.heat = 7;
		this.range = [3,6,9];
		this.projectiles = 1;
		this.ammoPerTon = 5;
		this.cooldown = 0;
		this.speed = 3;
		
		this.location = locationIndex;
	}
});
var WeaponAC10 = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_BALLISTIC;
		this.name = "Auto Cannon 10";
		this.shortName = "AC/10";
		this.tonnage = 12.0;
		this.critSize = 7;
		this.damage = 10;
		this.heat = 3;
		this.range = [5,10,15];
		this.projectiles = 1;
		this.ammoPerTon = 10;
		this.cooldown = 0;
		this.speed = 2;
		
		this.location = locationIndex;
	}
});
var WeaponAC5 = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_BALLISTIC;
		this.name = "Auto Cannon 5";
		this.shortName = "AC/5";
		this.tonnage = 8.0;
		this.critSize = 4;
		this.damage = 5;
		this.heat = 1;
		this.range = [6,12,18];
		this.minRange = 3;
		this.projectiles = 1;
		this.ammoPerTon = 20;
		this.cooldown = 0;
		this.speed = 2;
		
		this.location = locationIndex;
	}
});
var WeaponAC2 = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_BALLISTIC;
		this.name = "Auto Cannon 2";
		this.shortName = "AC/2";
		this.tonnage = 6.0;
		this.critSize = 1;
		this.damage = 2;
		this.heat = 1;
		this.range = [8,16,24];
		this.minRange = 4;
		this.projectiles = 1;
		this.ammoPerTon = 45;
		this.cooldown = 0;
		this.speed = 1;
		
		this.location = locationIndex;
	}
});
var WeaponMGUN = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_BALLISTIC;
		this.name = "Mechine Gun";
		this.shortName = "MGUN";
		this.tonnage = 0.5;
		this.critSize = 1;
		this.damage = 2;
		this.heat = 0;
		this.range = [1,2,3];
		this.projectiles = 1;
		this.ammoPerTon = 200;
		this.cooldown = 0;
		this.speed = 1;
		
		this.location = locationIndex;
	}
});

// -- LONG RANGE MISSILES
var WeaponLRM20 = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_MISSILE;
		this.name = "Long Range Missile 20";
		this.shortName = "LRM20";
		this.tonnage = 12.0;
		this.critSize = 5;
		this.damage = 1;
		this.heat = 6;
		this.range = [7,14,21];
		this.minRange = 6;
		this.projectiles = 20;
		this.ammoPerTon = 6;
		this.cooldown = 0;
		this.speed = 3;
		
		this.location = locationIndex;
	}
});
var WeaponLRM15 = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_MISSILE;
		this.name = "Long Range Missile 15";
		this.shortName = "LRM15";
		this.tonnage = 7.0;
		this.critSize = 3;
		this.damage = 1;
		this.heat = 5;
		this.range = [7,14,21];
		this.minRange = 6;
		this.projectiles = 15;
		this.ammoPerTon = 8;
		this.cooldown = 0;
		this.speed = 3;
		
		this.location = locationIndex;
	}
});
var WeaponLRM10 = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_MISSILE;
		this.name = "Long Range Missile 10";
		this.shortName = "LRM10";
		this.tonnage = 4.0;
		this.critSize = 2;
		this.damage = 1;
		this.heat = 4;
		this.range = [7,14,21];
		this.minRange = 6;
		this.projectiles = 10;
		this.ammoPerTon = 12;
		this.cooldown = 0;
		this.speed = 3;
		
		this.location = locationIndex;
	}
});
var WeaponLRM5 = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_MISSILE;
		this.name = "Long Range Missile 5";
		this.shortName = "LRM5";
		this.tonnage = 2.0;
		this.critSize = 1;
		this.damage = 1;
		this.heat = 2;
		this.range = [7,14,21];
		this.minRange = 6;
		this.projectiles = 5;
		this.ammoPerTon = 24;
		this.cooldown = 0;
		this.speed = 3;
		
		this.location = locationIndex;
	}
});

// -- SHORT RANGE MISSILES
var WeaponSRM6 = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_MISSILE;
		this.name = "Short Range Missile 6";
		this.shortName = "SRM6";
		this.tonnage = 3.0;
		this.critSize = 2;
		this.damage = 2;
		this.heat = 4;
		this.range = [3,6,9];
		this.projectiles = 6;
		this.ammoPerTon = 15;
		this.cooldown = 0;
		this.speed = 2;
		
		this.location = locationIndex;
	}
});
var WeaponSRM4 = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_MISSILE;
		this.name = "Short Range Missile 4";
		this.shortName = "SRM4";
		this.tonnage = 2.0;
		this.critSize = 1;
		this.damage = 2;
		this.heat = 3;
		this.range = [3,6,9];
		this.projectiles = 4;
		this.ammoPerTon = 25;
		this.cooldown = 0;
		this.speed = 2;
		
		this.location = locationIndex;
	}
});
var WeaponSRM2 = Class.create(Weapon, {
	initialize: function(locationIndex) {
		this.type = WEAPON_MISSILE;
		this.name = "Short Range Missile 2";
		this.shortName = "SRM2";
		this.tonnage = 1.0;
		this.critSize = 1;
		this.damage = 2;
		this.heat = 2;
		this.range = [3,6,9];
		this.projectiles = 2;
		this.ammoPerTon = 50;
		this.cooldown = 0;
		this.speed = 2;
		
		this.location = locationIndex;
	}
});


function initGame(){
	gameStarted = true;
	gameOver = false;
	
	turnOrder = [];
	currentTurn = 0;
	
	messages = [];
	messageReadIndex = -1;
	
	loadHeatEffects();
	
	// generate the map
	createHexMap();
	
	// create player mech from selection or random
	createPlayerMech();
	
	// generate enemies from selection or random
	createBotMechs();
}


function createHexMap(){

	if(generateRandomMap){
		generateRandomBoard(28, 24);
		return;
	}
	
	// create the Arena, hardcoded and pieced together maps from the table top
	numHexCols = 32;
	numHexRows = 32;
	
	hexMap = [];
	for(var y=0; y<numHexRows; y++){
		var thisHexRow = [];
	
		for(var x=0; x<numHexCols; x++){
			thisHexRow[x] = new Hex();
		}
		
		hexMap[y] = thisHexRow;
	}
	
	var row1 = hexMap[0];
	var row2 = hexMap[1];
	var row3 = hexMap[2];
	var row4 = hexMap[3];
	var row5 = hexMap[4];
	var row6 = hexMap[5];
	var row7 = hexMap[6];
	var row8 = hexMap[7];
	var row9 = hexMap[8];
	var row10 = hexMap[9];
	var row11 = hexMap[10];
	var row12 = hexMap[11];
	var row13 = hexMap[12];
	var row14 = hexMap[13];
	var row15 = hexMap[14];
	var row16 = hexMap[15];
	
	row2[1] = new TreeHex();
	row2[2] = new TreeHex();
	row2[3] = new TreeHex();
	row2[8] = new TreeHex();
	row2[9] = new RockHex();
	row2[10].elevation = 1;
	row2[11].elevation = 2;
	row2[12].elevation = 1;
	row2[13].elevation = 2;
	
	row3[2] = new HeavyTreeHex();
	row3[3] = new TreeHex();
	row3[10] = new RockHex();
	row3[12] = new TreeHex();	row3[12].elevation = 2;
	row3[13].elevation = 3;
	
	row4[11].elevation = 2;
	row4[12].elevation = 3;
	
	row5[10] = new TreeHex();
	row5[11] = new HeavyTreeHex();
	row5[12].elevation = 1;
	row5[13].elevation = 1;
	
	row6[9] = new TreeHex();
	row6[12] = new TreeHex();
	
	row7[5] = new WaterHex();
	row7[6] = new WaterHex();
	row7[8] = new TreeHex();
	row7[9] = new TreeHex();
	
	row8[6] = new WaterHex();	row8[6].level = 2;
	row8[7] = new WaterHex();
	row8[8] = new WaterHex();
	
	row9[5] = new TreeHex();
	row9[7] = new WaterHex();
	
	row10[5] = new HeavyTreeHex();
	row10[6] = new WaterHex();
	row10[7] = new WaterHex();	row10[7].level = 2;
	row10[8] = new WaterHex();
	row10[12] = new TreeHex();
	row10[13] = new TreeHex();
	
	row11[4] = new TreeHex();
	row11[6] = new WaterHex();
	row11[12] = new RockHex();
	
	row12[10] = new TreeHex();
	row12[11] = new HeavyTreeHex();
	row12[12].elevation = 1;

	row13[10] = new TreeHex();
	row13[11].elevation = 2;
	row13[12].elevation = 2;
	row13[13].elevation = 2;
	
	row14[3] = new HeavyTreeHex();
	row14[4] = new TreeHex();
	row14[11] = new TreeHex();	row14[11].elevation = 3;
	row14[12] = new TreeHex();	row14[12].elevation = 3;
	row14[13].elevation = 2;
	
	row15[2] = new TreeHex();
	row15[4] = new TreeHex();
	row15[9] = new RockHex();
	row15[10].elevation = 1;
	row15[11].elevation = 2;
	row15[12] = new TreeHex();	row15[12].elevation = 3;
	
	row16[10].elevation = 1;
	row16[12].elevation = 1;
	
	
	// yet another classic map to the right of the first map
	row3[16+3] = new HeavyTreeHex();
	row3[16+4] = new TreeHex();
	
	row4[16+4] = new TreeHex();
	row4[16+5] = new TreeHex();
	
	row7[16+14] = new TreeHex();
	
	row8[16+11] = new HeavyTreeHex();
	row8[16+12] = new TreeHex();
	row8[16+13] = new HeavyTreeHex();
	row8[16+14] = new TreeHex();
	
	row9[16+10] = new TreeHex();
	row9[16+11] = new TreeHex();
	row9[16+12] = new TreeHex();
	row9[16+13] = new TreeHex();
	
	row11[16+1] = new TreeHex();
	row11[16+3] = new HeavyTreeHex();
	row11[16+5] = new TreeHex();
	
	row12[16+1] = new TreeHex();
	row12[16+2] = new TreeHex();
	row12[16+3] = new TreeHex();
	row12[16+4] = new HeavyTreeHex();
	row12[16+5] = new TreeHex();
	
	row13[16+4] = new HeavyTreeHex();
	row13[16+5] = new TreeHex();
	row13[16+7] = new TreeHex();
	
	row14[16+5] = new TreeHex();
	row14[16+6] = new HeavyTreeHex();
	row14[16+7] = new HeavyTreeHex();
	row14[16+8] = new TreeHex();
	row14[16+9] = new TreeHex();
	
	row15[16+6] = new TreeHex();
	row15[16+8] = new TreeHex();
	
	
	// just for fun, tacking on another map below the first map
	row1 = hexMap[15];
	row2 = hexMap[16];
	row3 = hexMap[17];
	row4 = hexMap[18];
	row5 = hexMap[19];
	row6 = hexMap[20];
	row7 = hexMap[21];
	row8 = hexMap[22];
	row9 = hexMap[23];
	row10 = hexMap[24];
	row11 = hexMap[25];
	row12 = hexMap[26];
	row13 = hexMap[27];
	row14 = hexMap[28];
	row15 = hexMap[29];
	row16 = hexMap[30];
	
	row1[2] = new TreeHex();
	row1[7] = new WaterHex();
	
	row2[2] = new HeavyTreeHex();
	row2[3] = new TreeHex();
	row2[7] = new WaterHex();
	
	row3[2] = new TreeHex();
	row3[5] = new WaterHex();
	row3[6] = new WaterHex();
	row3[7].elevation = 1;
	row3[8].elevation = 1;
	
	row4[5] = new WaterHex();
	row4[6].elevation = 1;
	row4[7].elevation = 2;
	row4[8].elevation = 1;
	
	row5[5] = new WaterHex();
	row5[6].elevation = 1;
	row5[7].elevation = 1;
	row5[8].elevation = 1;
	
	row6[6] = new WaterHex();
	row6[7] = new WaterHex();
	row6[8] = new HeavyTreeHex();
	row6[9] = new TreeHex();
	
	row7[6] = new WaterHex();
	row7[7] = new WaterHex();
	row7[8] = new WaterHex();
	row7[9] = new WaterHex();
	
	row8[5] = new WaterHex();
	row8[6] = new WaterHex();
	row8[7] = new WaterHex();	row8[7].level = 2;
	row8[8] = new WaterHex();
	row8[9] = new WaterHex();
	row8[10] = new WaterHex();
	row8[11] = new WaterHex();
	row8[13].elevation = 1;
	
	row9[5] = new WaterHex();
	row9[6] = new WaterHex();
	row9[7] = new WaterHex();	row9[7].level = 3;
	row9[8] = new WaterHex();	row9[8].level = 3;
	row9[9] = new WaterHex();	row9[9].level = 2;
	row9[10] = new WaterHex();
	row9[11] = new WaterHex();
	row9[12].elevation = 1;
	row9[13].elevation = 1;
	
	row10[3] = new HeavyTreeHex();
	row10[4] = new TreeHex();
	row10[5] = new WaterHex();
	row10[6] = new WaterHex();
	row10[7] = new WaterHex();	row10[7].level = 2;
	row10[8] = new WaterHex();	row10[8].level = 3;
	row10[9] = new WaterHex();
	row10[10] = new WaterHex();
	row10[11] = new WaterHex();
	row10[12] = new TreeHex();	row10[12].elevation = 1;
	row10[13].elevation = 1;
	
	row11[3] = new TreeHex();
	row11[4] = new TreeHex();
	row11[5] = new WaterHex();
	row11[6] = new WaterHex();
	row11[7] = new WaterHex();	row11[7].level = 2;
	row11[8] = new WaterHex();
	row11[9] = new WaterHex();
	row11[10] = new WaterHex();
	row11[11] = new TreeHex();	row11[11].elevation = 1;
	row11[12] = new HeavyTreeHex();	row11[12].elevation = 1;
	row11[13].elevation = 2;
	row11[14].elevation = 1;
	
	row12[2] = new TreeHex();
	row12[3] = new TreeHex();
	row12[4] = new HeavyTreeHex();
	row12[5] = new TreeHex();
	row12[6] = new WaterHex();
	row12[7] = new WaterHex();
	row12[8] = new WaterHex();
	row12[9].elevation = 1;
	row12[10].elevation = 1;
	row12[11].elevation = 2;
	row12[12].elevation = 4;
	row12[13].elevation = 1;
	row12[14].elevation = 1;
	
	row13[2] = new TreeHex();
	row13[3] = new HeavyTreeHex();
	row13[4] = new TreeHex();
	row13[5] = new TreeHex();
	row13[6] = new TreeHex();
	row13[8].elevation = 1;
	row13[9].elevation = 1;
	row13[10].elevation = 3;
	row13[11].elevation = 1;
	row13[12].elevation = 1;
	
	row14[10].elevation = 1;
	
	row15[10].elevation = 1;
	
	
	// completely made up map to the right of the second map
	row3[16] = new TreeHex();
	row3[16+1] = new HeavyTreeHex();
	row3[16+2] = new HeavyTreeHex();
	row3[16+3] = new HeavyTreeHex();
	row3[16+4] = new TreeHex();
	
	row4[16+2] = new HeavyTreeHex();
	row4[16+3] = new TreeHex();
	row4[16+4] = new TreeHex();
	row4[16+5] = new TreeHex();
	
	row6[16+11] = new TreeHex();
	row6[16+12] = new TreeHex();
	row6[16+13] = new TreeHex();
	row6[16+14] = new TreeHex();
	
	row7[16+11] = new WaterHex();
	row7[16+12] = new WaterHex();
	row7[16+13] = new TreeHex();
	row7[16+14] = new WaterHex();
	

	row8[16+3].elevation = 1;
	row8[16+4].elevation = 1;
	row8[16+5].elevation = 2;
	row8[16+11] = new WaterHex();
	row8[16+12] = new WaterHex();	row8[16+12].level = 2;
	row8[16+13] = new WaterHex();
	row8[16+14] = new WaterHex();
	
	row9[16+2].elevation = 1;
	row9[16+3].elevation = 1;
	row9[16+4].elevation = 2;
	row9[16+5].elevation = 3;
	row9[16+10] = new WaterHex();
	row9[16+11] = new WaterHex();	row9[16+11].level = 2;
	row9[16+12] = new WaterHex();	row9[16+12].level = 2;
	row9[16+13] = new WaterHex();
	row9[16+14] = new WaterHex();
	
	row10[16+1].elevation = 1;
	row10[16+2].elevation = 1;
	row10[16+3].elevation = 1;
	row10[16+4].elevation = 3;
	row10[16+5].elevation = 2;
	
	row11[16+1].elevation = 1;
	row11[16+2].elevation = 1;
	row11[16+3] = new TreeHex(); row11[16+3].elevation = 1;
	row11[16+4] = new TreeHex(); row11[16+4].elevation = 1;
	row11[16+5].elevation = 1;
	
	row12[16+1].elevation = 1;
	row12[16+2] .elevation = 1;
	row12[16+3].elevation = 1;
	row12[16+4] = new TreeHex(); row12[16+4].elevation = 1;
	row12[16+5].elevation = 1;
	
	row13[16+4] = new TreeHex(); row13[16+4].elevation = 1;
	row13[16+5].elevation = 1;
	row13[16+7].elevation = 1;
	
	row14[16+5].elevation = 1;
	row14[16+6] = new TreeHex(); row14[16+6] .elevation = 1;
	row14[16+7] = new TreeHex(); row14[16+7].elevation = 1;
	row14[16+8].elevation = 1;
	row14[16+9].elevation = 1;
	
	row15[16+6].elevation = 1;
	row15[16+8].elevation = 1;
	
}


/**
 * creates a mech from the MTF array
 * @param preview set true when only interested in the basic information about this mech, such as name and tonnage
 */
function createMechFromMTF(index, previewOnly){
	if(index < 0 || index >= MECHS.length)
		return null;
	
	var preview = (previewOnly != null) ? previewOnly : false;
		
	var mech = new Mech();
	
	// storing the index and returning so this mech can be easily loaded fully later
	mech.mtfIndex = index;
	
	var mtfString = MECHS[index];
	var mtf = mtfString.split("<BR>");
	//debug.log(mtfString);
	
	// hatchets need to be added after all crits so they need to be stored first
	var hatchetLocations = [];
	
	var numLines = mtf.length;
	
	var sectionIndex = -1;
	var subIndex = -1;
	
	for(var i=0; i < numLines; i++){
		
		if(preview && sectionIndex > MTF_MASS){
			// preview mode only returns up to a certain amount of info
			return mech;
		}
		
		var line = mtf[i].trim();
		
		// determine if this line starts a new section by containing a colon character (but not also having a comma)
		var colon = line.search(":");
		var comma = line.search(",");
		
		if(line.indexOf("Source:") != -1){
			// ignore the "Source:" line, since its not included in all MTF files and isn't needed yet anyway
			continue;
		}
		else if(colon == -1 || comma != -1){
			// continue from previous section index
			if(line.length > 0)
				subIndex ++;
		}
		else{
			// the next section begins
			sectionIndex ++;
			subIndex = 0;
			
			// update the line to only contain the value after the colon
			line = line.substring(colon + 1).trim();
		}
		
		if(line.length == 0)
			continue;
			
		//debug.log(sectionIndex+": "+line);
		
		switch(sectionIndex){
			case(MTF_VERSION):
						// mech chassis and variant are directly under the version section before the next section
						if(subIndex == 1)
							mech.chassis = line;
						else if(subIndex == 2)
							mech.variant = line;
						break;
			case(MTF_MASS):	
						mech.tonnage = parseInt(line);
						break;
			case(MTF_HEATSINKS):	
						setHeatsinksFromMTF(mech, line);		
						break;
			case(MTF_WALKMP):
						mech.walkMP = parseInt(line);
						break;
			case(MTF_JUMPMP):
						mech.jumpMP = parseInt(line);
						break;
			case(MTF_ARMOR_LA):
						mech.armor[LEFT_ARM] = parseInt(line);
						break;
			case(MTF_ARMOR_RA):
						mech.armor[RIGHT_ARM] = parseInt(line);
						break;
			case(MTF_ARMOR_LT):
						mech.armor[LEFT_TORSO] = parseInt(line);
						break;
			case(MTF_ARMOR_RT):
						mech.armor[RIGHT_TORSO] = parseInt(line);
						break;
			case(MTF_ARMOR_CT):
						mech.armor[CENTER_TORSO] = parseInt(line);
						break;
			case(MTF_ARMOR_HD):
						mech.armor[HEAD] = parseInt(line);
						break;
			case(MTF_ARMOR_LL):
						mech.armor[LEFT_LEG] = parseInt(line);
						break;
			case(MTF_ARMOR_RL):
						mech.armor[RIGHT_LEG] = parseInt(line);
						break;
			case(MTF_ARMOR_RTL):
						mech.armor[LEFT_REAR] = parseInt(line);
						break;
			case(MTF_ARMOR_RTR):
						mech.armor[RIGHT_REAR] = parseInt(line);
						break;
			case(MTF_ARMOR_RTC):
						mech.armor[CENTER_REAR] = parseInt(line);
						break;
			case(MTF_WEAPONS):
						addWeaponFromMTF(mech, line);
						break;
			case(MTF_CRITS_LA):
			case(MTF_CRITS_RA):
			case(MTF_CRITS_LT):
			case(MTF_CRITS_RT):
			case(MTF_CRITS_CT):
			case(MTF_CRITS_HD):
			case(MTF_CRITS_LL):
			case(MTF_CRITS_RL):
						// add crits 
						addCriticalsFromMTF(mech, line, sectionIndex);
						
						// if Hatchet, add as weapon to this location
						if(line == "Hatchet"){
							var thisLocation = (sectionIndex == MTF_CRITS_LA) ? LEFT_ARM : RIGHT_ARM;
							if(hatchetLocations.indexOf(thisLocation) == -1){
								hatchetLocations.push(thisLocation);
							}
						}
							
						break;
		
			default: break;
		}
	}
	
	// add ammo counts from ammo crit slots
	for(var loc=0; loc<=RIGHT_LEG; loc++){
		var critSection = mech.crits[loc];
		if(critSection == null)
			continue;
		
		for(var i=0; i<critSection.length; i++){
			var thisCrit = critSection[i];
			if(thisCrit instanceof AmmoSlot){
				addAmmoFromMTF(mech, thisCrit.getWeaponShortName(), thisCrit.getAmmo());
			}
		}
	}
	
	// set the original armor array as a copy of the armor array
	mech.setOrigArmor();
	
	// set internal structure hit points based on mech tonnage
	addInternalArmor(mech);
	
	// load the melee weapons now that we can see its crits to set proper damage values
	createMeleeAsWeapons(mech);
	
	// load any stored hatchets since they also needed to see its crits to set proper damage values
	for(var i=0; i<hatchetLocations.length; i++){
		var hatchetLoc = hatchetLocations[i];
		var hatchet = createHatchet(mech, hatchetLoc);
		
		// The hatchet should be the first in the weapons list
		mech.weapons.splice(0, 0, hatchet);
	}
	
	// pre-fill all action/jump points
	mech.actionPoints = getMaxAP(mech);
	mech.jumpPoints = getMaxJP(mech);
	
	// pre-set heat dissipation
	mech.heatDiss = getHeatDissipation(mech);
	
	return mech;
}


// sets the internal structure hit points based on mech tonnage
function addInternalArmor(mech){
	if(mech != null && mech.tonnage != null && INTERNAL_STRUCTURE[mech.tonnage] != null){
		mech.setInternal(INTERNAL_STRUCTURE[mech.tonnage].getCopy());
	}
	else{
		debug.log("Internal structure for mech tonnage "+mech.tonnage+" not defined!");
	}
}


function addCriticalsFromMTF(mech, line, mtfIndex){
	// one crit is listed per line and in order, just push each entry after determining what it is
	if(mech == null || line == null || line.length == 0)
		return;
	
	var section = -1;
	switch(mtfIndex){
		case(MTF_CRITS_LA): section = LEFT_ARM;
							break;
		case(MTF_CRITS_RA): section = RIGHT_ARM;
							break;
		case(MTF_CRITS_LT): section = LEFT_TORSO;
							break;
		case(MTF_CRITS_RT): section = RIGHT_TORSO;
							break;
		case(MTF_CRITS_CT): section = CENTER_TORSO;
							break;
		case(MTF_CRITS_LL): section = LEFT_LEG;
							break;
		case(MTF_CRITS_RL): section = RIGHT_LEG;
							break;
		case(MTF_CRITS_HD): section = HEAD;
							break;
							
		default: break;
	}
	
	var critSection = mech.getCriticals(section);
	if(critSection == null){
		debug.log("unknown MTF index="+mtfIndex+", line:"+line);
		return;
	}
	
	var thisCrit = null;
	
	if(line == MTF_CRIT_EMPTY){
		thisCrit = new EmptySlot(line);
	}
	else if(line == MTF_CRIT_HEATSINK){
		thisCrit = new HeatsinkSlot(line);
	}
	else if(line == MTF_CRIT_JUMPJET){
		thisCrit = new JumpJetSlot(line);
	}
	else if(line.indexOf(MTF_CRIT_AMMO) != -1){
		// this is an ammo crit
		var ammoIndex = line.indexOf(MTF_CRIT_AMMO);
		
		var weaponSubStr = line.substring(0, ammoIndex-1);
		if(weaponSubStr == "IS"){
			// some MTF formats place the weapon for the ammo after the word AMMO instead
			var arr = line.substring(ammoIndex + MTF_CRIT_AMMO.length + 1).split(" ");
			weaponSubStr = arr[0];
		}
		
		// look up weapon string on weapon table
		var weaponClass = (MTF_WEAPON_TABLE[weaponSubStr] != null) ? MTF_WEAPON_TABLE[weaponSubStr].weapon : null;
		
		if(weaponClass == null){
			// unknown weapon class, just let it make a regular equipment slot out of it
		}
		else{
			// create a temporary weapon of the class to initialize some values from it
			var tmpWeapon = new this[weaponClass];
			
			thisCrit = new AmmoSlot(line, weaponClass, tmpWeapon); 
		}
	}
	else{
		// look up weapon table to see if this is a weapon slot
		var critName = line;
		
		var isRear = (critName.indexOf("(R)") != -1);
		if(isRear){
			critName = line.substring(0, critName.indexOf("(R)") - 1);
		}
		
		var weaponClass = (MTF_WEAPON_TABLE[critName] != null) ? MTF_WEAPON_TABLE[critName].weapon : null;
		
		if(weaponClass != null){
			thisCrit = new WeaponSlot(line, weaponClass, isRear);
			
			//debug.log(" Weapon crit, rear="+isRear+": "+critName);
			if(isRear){
				// set an appropriate weapon to the rear location
				for(var i=0; i<mech.weapons.length; i++){
					var thisWeapon = mech.weapons[i];
					
					if(thisWeapon instanceof this[weaponClass]
							&& thisWeapon.getLocation() == section){
						switch(section){
							case LEFT_TORSO:
											thisWeapon.location = LEFT_REAR;
											break;
							
							case RIGHT_TORSO:
											thisWeapon.location = RIGHT_REAR;
											break;
								
							case CENTER_TORSO:
											thisWeapon.location = CENTER_REAR;
											break;
								
							default: break;
						}
						
						// stop after the first weapon set to the rear
						break;
					}
				}
			}
		}
	}
	
	if(thisCrit == null){
		// all crit slots not already accounted for are standard equipment slots
		thisCrit = new EquipmentSlot(line);
	}
	
	critSection.push(thisCrit);
}


function addWeaponFromMTF(mech, line){
	// <QTY >WPN, LOC, <AMMO>
	// 1 ISLRM15, Right Arm, Ammo:16
	var arr = line.split(",");
	
	if(arr.length < 2)
		return;
	
	var qty = 0;
	var weaponName = "";
	var weaponLocation = "";
	var ammo = -1;
	
	for(var i=0; i<arr.length; i++){
		var subLine = arr[i].trim();
		switch(i){
			case(0): var qty_name = subLine.split(" ");
					 qty = parseInt(qty_name[0]);
					 
					 if(qty > 0){
						weaponName = qty_name[1];
					 }
					 else{
						// in some MTF files, it doesn't list quantity, so it will be Not a Number, 
						// so default to 1 and weapon name is the entire subLine
						qty = 1;
						weaponName = subLine;
					 }
					 
					 break;
					 
			case(1): weaponLocation = subLine;
					 break;
					 
			case(2): var ammo_qty = subLine.split(":");
					 // instead of generating ammo total from the weapon line, just wait until all crits are done and generate from ammo in crit spaces
					 //ammo = parseInt(ammo_qty[1]);
					 break;
					 
			default: break;
		}
	}
	
	// get location index from location name (location index properties are all upper case with an underscore)
	var locationClass = weaponLocation.toUpperCase().replace(" ", "_");
	if(locationClass.indexOf("(R)") != -1){
		// handle REAR weapons later by their criticals, for now just strip off the (R)
		locationClass = locationClass.substring(0, locationClass.indexOf("(R)") - 1);
	}
	
	var locationIndex = this[locationClass];
	
	if(locationIndex == null){
		debug.log(weaponName+" weapon location undefined: "+weaponLocation + " ["+locationClass+"]");
		return;
	}
	
	for(var i=0; i<qty; i++){
		// create weapon class from weapon name
		if(MTF_WEAPON_TABLE[weaponName] == null){
			debug.log(weaponName+": unknown weapon class @ "+weaponLocation + " ["+locationClass+"]");
			continue;
		}
			
		var weaponClass = MTF_WEAPON_TABLE[weaponName].weapon;
		var weapon = new this[weaponClass](locationIndex);
		
		if(ammo > 0){
			// add ammo on the mech, keyed by the weapon type (LRM, SRM are combined, where AC's are all separate from each other)
			addAmmoFromMTF(mech, weapon.shortName, ammo);
		}
		
		if(weapon instanceof WeaponHatchet){
			// Hatchets will be imported based on criticals instead of weapon listing
		}
		else{
			mech.weapons.push(weapon);
		}
	}
}

function addAmmoFromMTF(mech, ammoKey, ammoCount){
	if(mech.ammo[ammoKey] == null)
		mech.ammo[ammoKey] = 0;
	
	mech.ammo[ammoKey] += ammoCount;
}

function setHeatsinksFromMTF(mech, line){
	// split the line by the space, the first value is the number, second value is 'Single' or 'Double'
	var arr = line.split(" ");
	
	mech.heatSinks = parseInt(arr[0]);
	
	// TODO: double heat sinks @ arr[1] ("Single" | "Double")
}


/**
 * Peeks at each available MTF format mech and returns a list of preview mechs ordered by tonnage
 * @returns {Array}
 */
function getMechListFromMTF(){
	var mechList = [];
	
	var numMechs = MECHS.length;
	for(var i=0; i<numMechs; i++){
		
		var thisMech = createMechFromMTF(i, true);
		var listObject = new SortObject(thisMech, thisMech.tonnage);
		
		mechList.push(listObject);
	}
	
	mechList.sort(sortObjectCompare);
	
	return mechList;
}

/**
 * Returns the first mech object with the given chassis name
 * @param chassis
 * @returns
 */
function getMechByChassisName(chassis){
	var numMechs = MECHS.length;
	for(var i=0; i<numMechs; i++){
		var mech = createMechFromMTF(i, true);
		if(chassis == mech.chassis){
			return mech;
		}
	}
	
	return null;
}

function createPlayerMech(){
	var playerPilot = new Pilot(playerName);
	playerPilot.gunnery = 3;
	playerPilot.piloting = 4;
	
	var playerTeam = 1;
	if(playerMech != null){
		playerTeam = playerMech.team;
	}
	
	// 13 = Yen-lo-wang
	// MECHS.length - 6 = Stalker
	// playerMech = new createMechFromMTF(MECHS.length - 6);
	// playerMech = getMechByChassisName("Quickdraw");
	if(playerMech.chassis == ""){
		var numMechs = MECHS.length;
		var dieResult = getDieRollTotal(1, numMechs);
		playerMech = createMechFromMTF(dieResult - 1);
	}
	else{
		// regenerate the mech from MTF in case it was destroyed in previous game and not changed or not fully loaded from use of preview
		playerMech = createMechFromMTF(playerMech.mtfIndex);
	}
	playerMech.pilot = playerPilot;
	playerMech.type = PLAYER_TYPE;
	playerMech.team = playerTeam;
	
	// generate initial position
	generateStartLocation(playerMech);
	
	// clear player target
	targetMech = null;
	
	// set initial position point for reference
	commitMove(playerMech, playerMech.location, 0, false);
	
	turnOrder.push(playerMech);
}

function createBotMechs(){
	gameMechs = [];
	
	if(customBotMechs == null || customBotMechs.length == 0){
		// no pre-defined custom mechs means 7 random enemies
		customBotMechs = [null, null, null, null, null, null, null];
	}
	
	// create some mechs in random locations
	for(var i=0; i<customBotMechs.length; i++){
		var botMech = customBotMechs[i];
		
		if(botMech == null || botMech.chassis == ""){
			var botTeam = -1;
			if(botMech != null){
				botTeam = botMech.team;
			}
			
			// generate random mech for this entry
			var numMechs = MECHS.length;
			
			var dieResult = getDieRollTotal(1, numMechs);
			botMech = createMechFromMTF(dieResult - 1);
			botMech.team = botTeam;
		}
		
		// TODO: give bots random names and different skill levels
		var botPilot = new Pilot(playerName);
		botPilot.gunnery = 4;
		botPilot.piloting = 5;
		
		botMech.pilot = botPilot;
		botMech.type = ENEMY_TYPE;
		
		// generate initial position
		generateStartLocation(botMech);
		
		// set initial position point for reference
		commitMove(botMech, botMech.location, 0, false);
		
		gameMechs.push(botMech);
		turnOrder.push(botMech);
	}
	
	// clear out pre-defined enemies
	customBotMechs = null;
}

/**
 * generates random start location for the mech, may use its team to start them together
 */
function generateStartLocation(mech){
	var genLocation = null;
	var genHeading = 0;
	
	if(mech.team >= 1 && mech.team <= 9){
		// the areas are based on the team number and correspond to opposing cardinal directions
		//  5  1  7
		//   \ | /
		// 3-- 9 --4
		//   / | \
		//  8  2  6
		var xMin = 1;
		var yMin = 1;
		
		// the headings are based on the closest opposite direction of the area they are starting in
		switch(mech.team){
			case 1:
				// at N, face S
				genHeading =  3;
				
				xMin = Math.floor(numHexCols / 2) - 2;
				yMin = 0;
				break;
			case 2:
				// at S, face N
				genHeading = 0;
				
				xMin = Math.floor(numHexCols / 2) - 2;
				yMin = numHexRows - 5;
				break;
			case 3:
				// at W, face SE
				genHeading = 2;
				
				xMin = 0;
				yMin = Math.floor(numHexRows / 2) - 2;
				break;
			case 4:
				// at E, face NW
				genHeading = 5;
				
				xMin = numHexCols - 5;
				yMin = Math.floor(numHexRows / 2) - 2;
				break;
			case 5:
				// at NW, face SE
				genHeading = 2;
				
				xMin = 0;
				yMin = 0;
				break;
			case 6:
				// at SE, face NW
				genHeading = 5;
				
				xMin = numHexCols - 5;
				yMin = numHexRows - 5;
				break;	
			case 7:
				// at NE, face SW
				genHeading = 4;
				
				xMin = numHexCols - 5;
				yMin = 0;
				break;
			case 8:
				// at SW, face NE
				genHeading = 1;
				
				xMin = 0;
				yMin = numHexRows - 5;
				break;
			case 9:
				// at Center, face random
				genHeading = getDieRollTotal(1, 6) - 1;
				
				xMin = Math.floor(numHexCols / 2) - 2;
				yMin = Math.floor(numHexRows / 2) - 2;
				break;
				
			default: break;
		}
		
		var hexAvailable = false;
		while(!hexAvailable){
			var randomX = getDieRollTotal(1, 5) - 1;
			var randomY = getDieRollTotal(1, 5) - 1;
			
			genLocation = new Coords(randomX + xMin, randomY + yMin);
			
			hexAvailable = isHexAvailable(genLocation);
		}
	}
	else{
		// mechs with no team (-1) or team 0 have completely random starting locations and headings
		genLocation = new Coords(0,0);
		genHeading = getDieRollTotal(1, 6) - 1;
		
		var hexAvailable = false;
		while(!hexAvailable){
			var randomX = getDieRollTotal(1, numHexCols) - 1;
			var randomY = getDieRollTotal(1, numHexRows) - 1;
			
			genLocation = new Coords(randomX, randomY);
			
			hexAvailable = isHexAvailable(genLocation);
		}
	}
	
	mech.setHeading(genHeading);
	mech.setLocation(genLocation);
}

/** returns array of all mechs, enemy and player */
function getAllMechs(){
	var allMechs = gameMechs.getCopy();
	allMechs.push(playerMech);
	
	return allMechs;
}


/** returns array of other live mechs on the same team */
function getTeamMechs(mech){
	var teamMechs = [];
	if(mech.team == -1){
		return teamMechs;
	}
	
	var allMechs = getAllMechs();
	for(var i=0; i<allMechs.length; i++){
		var thisMech = allMechs[i];
		if(thisMech != mech && thisMech.isTeamMech(mech) && !thisMech.isDestroyed()){
			teamMechs.push(thisMech);
		}
	}
	
	return teamMechs;
}

/** returns array of other live mechs not on the same team */
function getEnemyMechs(mech){
	var enemyMechs = [];
	
	var allMechs = getAllMechs();
	for(var i=0; i<allMechs.length; i++){
		var thisMech = allMechs[i];
		if(thisMech != mech 
				&& !thisMech.isTeamMech(mech) 
				&& (mech == playerMech || !thisMech.isDestroyed())){
			// only include destroyed mechs when the player is the one targeting
			enemyMechs.push(thisMech);
		}
	}
	
	return enemyMechs;
}

/** returns array of all mechs, enemy and player sorted by range from the given mech (list will exclude that mech) */
function getEnemyMechsByRange(mech){
	var enemyMechs = getEnemyMechs(mech);
	
	var sortedArray = [];
	for(var i=0; i<enemyMechs.length; i++){
		var thisMech = enemyMechs[i];
		
		var sortObject = new SortObject(thisMech, getRange(mech.location, thisMech.location));
		sortedArray.push(sortObject);
	}
	
	// sort the objects, then dump them in a new array in the order given
	sortedArray.sort(sortObjectCompare);
	
	var sortedMechs = [];
	for(var i=0; i<sortedArray.length; i++){
		sortedMechs.push(sortedArray[i].getObj());
	}
		
	return sortedMechs;
}


// perform some things for before a mech begins the turn
function newTurn(mech){
	// reset damageThisTurn counter
	mech.setDamageThisTurn(0);

	var ammoExplosionRoll = getAmmoExplosionRoll(mech);
	if(ammoExplosionRoll > 2){
		// roll to see if the player gets ammo exploded
		var dieResult = getDieRollTotal(2, 6);
		if(dieResult < ammoExplosionRoll){
			// roll failed, find the most volatile ammo to blow up
			//destroyCritComponent(mech, hitLocation, critSlot);
			var volatileCrit = null;
			var volatileDamage = 0;
			var hitLocation = -1;
			var volatileCritSlot = -1;
			
			for(var loc=0; loc<8; loc++){
				var critSection = mech.crits[loc];
				
				for(var i=0; i<critSection.length; i++){
					var thisCrit = critSection[i];
					if(!thisCrit.isAmmo())
						continue;
					
					var ammoCount = thisCrit.getAmmo();
					if(ammoCount == 0)
						continue;
					
					var tmpWeapon = new this[thisCrit.getAmmoWeaponClass()];
					var ammoDamage = tmpWeapon.damage * tmpWeapon.getProjectiles() * ammoCount;
					
					if(ammoDamage > volatileDamage){
						volatileDamage = ammoDamage;
						volatileCrit = thisCrit;
						hitLocation = loc;
						volatileCritSlot = i;
					}
				}
			}
			
			if(volatileCrit != null){
				//debug.log("Auto exploding "+volatileCrit.getName()+" with ammo count "+volatileCrit.getAmmo()+" at location "+getLocationText(hitLocation)+": "+volatileCritSlot);
				destroyCritComponent(mech, hitLocation, volatileCritSlot);
			}
		}
	}
	
	
	var autoShutdownRoll = getAutoShutdownRoll(mech);
	if(autoShutdownRoll > 12){
		// shutdown cannot be avoided
		mech.actionPoints = 0;
		mech.shutdown = true;
	}
	else if(autoShutdownRoll > 2){
		// first, roll to see if the player automatically shutsdown
		var dieResult = getDieRollTotal(2, 6);
		if(dieResult < autoShutdownRoll){
			// roll failed, automatically shut down the player (give them zero action points)
			mech.actionPoints = 0;
			mech.shutdown = true;
		}
		else{
			mech.shutdown = false;
		}
		
		//debug.log("auto shutdown on "+autoShutdownRoll+", rolled:"+dieResult+", autoShutdown="+mech.shutdown);
	}
	else{
		mech.shutdown = false;
	}
	
	if(!mech.isShutdown() && !mech.isDestroyed()){
		// refill mech AP
		mech.actionPoints = getMechAP(mech);
		
		// refill mech JP
		mech.jumpPoints = getMechJP(mech);
		if(mech.jumpPoints > mech.actionPoints){
			// since each jump uses an AP, tie its allotment to it
			mech.jumpPoints = mech.actionPoints;
		}
	}
	
	// reset player movement with origin point of new turn
	mech.movement = [new Movement(mech.location, 0, false)];
	
	// update weapon cooldowns
	for(var i=0; i<mech.weapons.length; i++){
		var thisWeapon = mech.weapons[i];
		
		if(thisWeapon instanceof WeaponHatchet)
			// hatchets will be handled in the melee area
			continue;
			
		// update based on melee usage, or weapon usage in the same location
		for(var j=0; j<mech.melee.length; j++){
			var thisMelee = mech.melee[j];
			if(thisMelee != null 
					&& thisMelee.location == thisWeapon.location){
					
				if(thisMelee.used)
					// melee was used, set the weapon cooldown to it
					thisWeapon.cooldown = thisMelee.cooldown;
				else if(thisWeapon.cooldown > 0)
					// weapon was used, set the melee cooldown to it
					thisMelee.cooldown = thisWeapon.cooldown;
			}
		}
		
		if(thisWeapon.cooldown > 0)
			thisWeapon.cooldown -= 1;
	}
	
	// update melee cooldowns (only one melee can be used at a time, so each melee weapon gets the same cooldown)
	var allMeleeCooldown = 0;
	for(var i=0; i<mech.melee.length; i++){
		var thisMelee = mech.melee[i];
		
		if(thisMelee == null)
			continue;
		
		if(thisMelee.cooldown > 0){
			thisMelee.cooldown -= 1;
			
			if(thisMelee.used)
				// only set the all melee cooldown if a melee was actually used
				allMeleeCooldown = thisMelee.cooldown;
		}
		
		if(thisMelee.cooldown == 0){
			// reset used indicator
			thisMelee.used = false;
		}
	}
	if(allMeleeCooldown > 0){
		for(var i=0; i<mech.melee.length; i++){
			var thisMelee = mech.melee[i];
			if(thisMelee == null)
				continue;
				
			thisMelee.cooldown = allMeleeCooldown;
		}
	}
		
	// update heat level
	mech.heatGen = getBaseHeatGen(mech);
	mech.heatDiss = getHeatDissipation(mech);
	
	// clear range cache at beginning of player's new turn 
	// TODO: find a more efficient way of managing range cache
	if(isPlayerTurn()){
		rangeCache = [];
	}
	
	// check for end game conditions
	checkEndGameConditions();
}

// perform some things for just after the mech has made their turn
function endTurn(mech){
	// update the heat based on mech actions
	mech.heat += mech.heatGen - mech.heatDiss;
	if(mech.heat < 0) mech.heat = 0;
	
	// check for any mech that needs to roll for falling
	checkEndTurnPilotSkillRolls();
	
	// store previous turn mech
	prevTurnMech = mech;
	
	currentTurn ++;
	if(currentTurn >= turnOrder.length){
		currentTurn = 0;
	}
	
	// check for end game conditions
	checkEndGameConditions();
}

/**
 * for use at end of each turn, checks each mech to see if it needs to make a piloting skill roll or fall
 */
function checkEndTurnPilotSkillRolls(){
	var allMechs = getAllMechs();
	for(var i=0; i<allMechs.length; i++){
		var mech = allMechs[i];
		
		if(mech == null || mech.isDestroyed() || mech.isProne()){
			continue;
		}
		
		if(mech.getDamageThisTurn() >= 20){
			// damage >= 20, piloting skill +1 or fall
			debug.log(mech.chassis+" pilot skill roll modifier +1 for receiving "+mech.getDamageThisTurn()+" damage this turn");
			
			var damage20ThisTurnModifier = 1;
			doPilotSkillRoll(mech, damage20ThisTurnModifier);
			
			// set damage this turn off so each mech only needs to roll once until their next turn
			mech.setDamageThisTurn(-1);
		}
	}
}

/**
 * for use any time a pilot skill roll is needed to see if the mech falls
 */
function doPilotSkillRoll(mech, additionalModifier){
	if(mech == null || mech.isDestroyed()){
		return;
	}
	
	var pilotCheck = 0;
	
	var prevProne = mech.isProne();
	
	if(mech.isShutdown()){
		// immobile mechs automatically fall
		pilotCheck = AUTO_MISS;
		
		debug.log(mech.chassis+" pilot skill roll automatically fails for being immobile");
	}
	else{
		// base roll is the pilot skill value
		pilotCheck = mech.getPilot().getPiloting();
	}
	
	if(additionalModifier != null){
		pilotCheck += additionalModifier;
	}
	
	// account for modifiers from broken Gyros, leg actuators, etc.
	var lookupSections = [CENTER_TORSO, LEFT_LEG, RIGHT_LEG];
	
	for(var i=0; i<lookupSections.length; i++){
		var thisLoc = lookupSections[i];
		var critSection = mech.crits[thisLoc];
		
		if((LEFT_LEG == thisLoc || RIGHT_LEG == thisLoc) 
					&& mech.internal[thisLoc] == 0){
			// +5 modifier if the leg is destroyed, no need to consider destroyed components
			debug.log(mech.chassis+" pilot skill roll modifier +5 from destroyed leg");
			pilotCheck += 5;
			continue;
		}
		
		var sectionModifiers = 0;
		var numGryoHits = 0;
		
		for(var c=0; c<critSection.length; c++){
			var thisCrit = critSection[c];
			
			if(thisCrit != null && thisCrit.isDestroyed()){
				if(MTF_CRIT_GYRO == thisCrit.getName()){
					// +3 modifier from Gyro hit
					debug.log(mech.chassis+" pilot skill roll modifier +3 from gyro hit");
					sectionModifiers += 3;
					
					numGryoHits ++;
				}
				else if(MTF_CRIT_HIP == thisCrit.getName()){
					// +2 modifier from destroyed Hip actuator, and ignore modifiers from actuators
					debug.log(mech.chassis+" pilot skill roll modifier +2 from hip hit");
					sectionModifiers = 2;
					
					break;
				}
				else if(MTF_CRIT_UP_LEG_ACT == thisCrit.getName() 
						|| MTF_CRIT_LOW_LEG_ACT == thisCrit.getName() 
						|| MTF_CRIT_FOOT_ACT == thisCrit.getName()){
					// +1 modifier from each leg/foot actuator destroyed
					debug.log(mech.chassis+" pilot skill roll modifier +1 from actuator hit");
					sectionModifiers += 1;
				}
			}
		}
		
		if(numGryoHits >= 2){
			// Gyro destruction results in automatic falling
			sectionModifiers = AUTO_MISS;
			
			debug.log(mech.chassis+" pilot skill roll automatically fails due to Gyro destruction");
		}
		
		pilotCheck += sectionModifiers;
	}
	
	if(pilotCheck > 2){
		var dieTotal = getDieRollTotal(2, 6);
		
		if(dieTotal < pilotCheck){
			// mech falls due to failing pilot skill roll
			debug.log("    "+mech.chassis+" pilot skill roll failed and is falling! ["+dieTotal+"/"+pilotCheck+"]");
			
			mech.setProne(true);
			
			// set new random heading after fall
			dieTotal = getDieRollTotal(1, 6);
			
			switch(dieTotal){
				case 1:
					// same direction
					break;
				case 2:
					// 1 hexside CW
					mech.heading = (mech.heading + 1) % 6;
					break;
				case 3:
					// 2 hexsides CW
					mech.heading = (mech.heading + 2) % 6;
					break;
				case 4:
					// opposite direction
					mech.heading = (mech.heading + 3) % 6;
					break;	
				case 5:
					// 2 hexsides CCW
					mech.heading = (mech.heading + 4) % 6;
					break;
				case 6:
					// 1 hexside CCW
					mech.heading = (mech.heading + 5) % 6;
					break;
					
				default: break;
			}
			
			// apply damage from falling, 1 point of damage for every 10 tons of mech weight rounded up times height fallen plus one
			// TODO: account for extra damage when falling from higher to lower elevation
			var elevationDiff = 0;
			var fallDamage = Math.ceil(mech.tonnage / 10) * (elevationDiff + 1);
			
			// falling damage is applied in clusters of 5 points to random location
			// TODO: when should falling apply to side or rear hit locations?
			var fallingDamageResults = applyDamageGrouping(mech, fallDamage, 5, FRONT_HIT_LOCATIONS);
			
			var hitDamages = fallingDamageResults[0];
			var hitLocations = fallingDamageResults[1];
		
			var locText = getLocationArrayText(hitLocations);
			var dmgText = getArrayText(hitDamages);
			
			var fallenStr = (playerMech == mech) ? "Your mech has fallen " : mech.chassis+" has fallen ";
			fallenStr += "taking "+ dmgText +" damage in the "+ locText+".";
			
			var gm = new MechFallingGameMessage(mech, false, fallenStr, SEV_HIGH);
			gm.hitDamages = hitDamages;
			gm.hitLocations = hitLocations;
			messages.push(gm);
			return gm;
		}
		else{
			// mech stands or remains standing due to passing pilot skill roll
			debug.log("    "+mech.chassis+" pilot skill roll passed and is standing. ["+dieTotal+"/"+pilotCheck+"]");
			
			if(prevProne){
				mech.setProne(false);
				
				var gm = new MechFallingGameMessage(mech, false, (playerMech == mech) ? "Your mech is now standing on its own." : mech.chassis+" is now standing on its own.", SEV_HIGH);
				messages.push(gm);
				return gm;
			}
		}
	}
}

/**
 * applies damage grouping for falling, charging, etc.
 * @return damageResults array, where [0]=hitDamages, [1]=hitLocations
 * @param mech
 * @param damage
 * @param damageGrouping
 */
function applyDamageGrouping(mech, damage, grouping, HIT_TABLE){
	var damageResults = [];
	
	var hitDamages = [];
	var hitLocations = [];
	
	// falling damage is applied in clusters of 5 points to random location
	while(damage > 0){
		var thisDamage = grouping;
		if(thisDamage > damage){
			thisDamage = damage;
		}
		
		var dieResult = 0;
		if(HIT_TABLE.length == 6){
			dieResult = getDieRollTotal(1, 6);
		}
		else{
			dieResult = getDieRollTotal(2, 6);
		}
		
		// normal locations array starts at where the 2 is rolled
		var resultLocation = dieResult - 2;
		
		var thisLocation = HIT_TABLE[resultLocation];
		applyDamage(thisDamage, mech, thisLocation);
		
		hitDamages.push(thisDamage);
		hitLocations.push(thisLocation);
		
		damage -= thisDamage;
	}
	
	damageResults.push(hitDamages);
	damageResults.push(hitLocations);
	
	return damageResults;
}

/**
 * determine if the game is over
 */
function checkEndGameConditions(){
	if(gameOver == true){
		return;
	}
	
	if(playerMech.isDestroyed()){
		// flag that the game is over since the player is destroyed
		gameOver = true;
		
		// store the player mech so we can show later which it was
		prevPlayerMech = playerMech;
	}
	else{
		// determine if the game is over by checking to see that all enemy mechs are destroyed
		var enemies = getEnemyMechs(playerMech);
		var numAlive = 0;
		for(var i=0; i<enemies.length; i++){
			if(enemies[i] != null && !enemies[i].isDestroyed()){
				numAlive ++;
			}
		}
		if(numAlive == 0){
			gameOver = true;
			
			// store the player mech so we can show later which it was
			prevPlayerMech = playerMech;
		}
	}
}

// returns the mech for the current turn
var prevTurnMech = null;
function getTurnMech(){
	if(turnOrder.length == 0)
		return;
	
	var turnMech = turnOrder[currentTurn];
	
	while(turnMech.isDestroyed()){
		// destroyed mechs are skipped
		currentTurn ++;
		if(currentTurn >= turnOrder.length){
			currentTurn = 0;
		}
			
		turnMech = turnOrder[currentTurn];
	}
	
	return turnMech;
}

// returns true if the current turn is the player turn
function isPlayerTurn(){
	return getTurnMech() == playerMech;
}

// initializes the array of heat effects
function loadHeatEffects(){
	for(var i=40; i>=15; i--){
		var effect = null;
		switch(i){
			case 40: 
					effect = new CriticalEffect(EFFECT_SHUTDOWN_RISK, 13);//SD100%
					break;
			case 38: 
					effect = new CriticalEffect(EFFECT_AMMO_EXP_RISK, 7);//AE58%, die roll 7 or higher to avoid
					break;
			case 36: 
					effect = new CriticalEffect(EFFECT_SHUTDOWN_RISK, 9);//SD83%, die roll 9 or higher to avoid
					break;
			case 35: 
					effect = new CriticalEffect(EFFECT_MP_REDUCE, 5);// -5MP
					break;
			case 34: 
					effect = new CriticalEffect(EFFECT_TOHIT_INCREASE, 4);//+4HIT
					break;
			case 33: 
					effect = new CriticalEffect(EFFECT_AMMO_EXP_RISK, 5);//AE28%, die roll 5 or higher to avoid
					break;
			case 32:
					effect = new CriticalEffect(EFFECT_SHUTDOWN_RISK, 7);//SD58%, die roll 7 or higher to avoid
					break;
			case 30:
					effect = new CriticalEffect(EFFECT_MP_REDUCE, 4);// -4MP
					break;
			case 29:
					effect = new CriticalEffect(EFFECT_AMMO_EXP_RISK, 3);// AE8%, die roll 3 or higher to avoid
					break;
			case 28:
					effect = new CriticalEffect(EFFECT_SHUTDOWN_RISK, 5);//SD28%, die roll 5 or higher to avoid
					break;
			case 27:
					effect = new CriticalEffect(EFFECT_TOHIT_INCREASE, 3);//+3HIT
					break;
			case 25: 
					effect = new CriticalEffect(EFFECT_MP_REDUCE, 3);// -3MP
					break;
			case 24: 
					effect = new CriticalEffect(EFFECT_SHUTDOWN_RISK, 3);// SD8%, die roll 3 or higher to avoid
					break;
			case 23: 
					effect = new CriticalEffect(EFFECT_TOHIT_INCREASE, 2);//+2HIT
					break;
			case 20: 
					effect = new CriticalEffect(EFFECT_MP_REDUCE, 2);//-2MP
					break;
			case 18: 
					effect = new CriticalEffect(EFFECT_TOHIT_INCREASE, 1);//+1HIT
					break;
			case 15: 
					effect = new CriticalEffect(EFFECT_MP_REDUCE, 1);//-1MP
					break;
			default: 
					break;
		}
		
		if(effect != null){
			heatEffects[i] = effect;
		}
	}
}


// determines which melee weapons and how much damage they do based on the mech and stores in the mech's melee array
function createMeleeAsWeapons(mech){
	var leftRightPunch = [LEFT_ARM, RIGHT_ARM];

	for(var p=0; p<leftRightPunch.length; p++){
		var location = leftRightPunch[p];
		
		var armPunch = new WeaponPunch(location);
		
		// punch damage starts as mech tonnage divided by 10
		var punchDamage = Math.floor(mech.tonnage / 10);
		
		// punch damage decreases if upper/lower arm actuators are damaged or not present by half each
		// punch to hit increases by +2 for no lower arm actuator and +1 for no hand actuator
		
		var armCrits = mech.crits[location];
		
		var hasUpArm = false;
		var hasLowArm = false;
		var hasHand = false;
		for(var i=0; i<armCrits.length; i++){
			var thisCrit = armCrits[i];
			if(MTF_CRIT_UP_ARM_ACT == thisCrit.getName()){
				hasUpArm = true;
			}
			else if(MTF_CRIT_LOW_ARM_ACT == thisCrit.getName()){
				hasLowArm = true;
			}
			else if(MTF_CRIT_HAND_ACT == thisCrit.getName()){
				hasHand = true;
			}
		}
		
		if(!hasUpArm){
			punchDamage = Math.floor(punchDamage / 2);
		}
		
		if(!hasLowArm){
			punchDamage = Math.floor(punchDamage / 2);
			armPunch.addModifier(2);
		}
		
		if(!hasHand){
			armPunch.addModifier(1);
		}
		
		armPunch.damage = punchDamage;
		
		if(location == LEFT_ARM){
			mech.melee[PUNCH_LEFT_ARM] = armPunch;
		}
		else if(location == RIGHT_ARM){
			mech.melee[PUNCH_RIGHT_ARM] = armPunch;
		}
	}
	
	// kick damage is mech tonnage divided by 5
	var kick = new WeaponKick(RIGHT_LEG);
	kick.damage = Math.floor(mech.tonnage / 5);
	
	mech.melee[KICK] = kick;
}

// creates a hatchet weapon based with the amount of damage based on the mech and stores in the mech's melee array
function createHatchet(mech, location){
	// hatchet damage is 1 for every 5 tons of mech
	var hatchet = new WeaponHatchet(location);
	hatchet.damage = Math.floor(mech.tonnage / 5);
	
	if(location == LEFT_ARM)
		mech.melee[HATCHET_LEFT_ARM] = hatchet;
	else if(location == RIGHT_ARM)
		mech.melee[HATCHET_RIGHT_ARM] = hatchet;
		
	return hatchet;
}

// returns true if the weapon was melee (physical)
function isMeleeWeapon(weapon){
	return (weapon instanceof WeaponPunch 
			|| weapon instanceof WeaponKick 
			|| weapon instanceof WeaponHatchet);
}

// returns whichever punch arm is more likely to hit, or best available, or left by default
function getBestArmPunch(mech, tgtMech){
	var leftPunch = mech.melee[PUNCH_LEFT_ARM];
	var rightPunch = mech.melee[PUNCH_RIGHT_ARM];
	
	if(leftPunch.isDestroyed() && !rightPunch.isDestroyed()){
		// left is destroyed, use right
		return rightPunch;
	}
	else if((!leftPunch.isDestroyed() && rightPunch.isDestroyed())
			|| (leftPunch.isDestroyed() && rightPunch.isDestroyed())){
		// both or only right is destroyed, use left by default
		return leftPunch;
	}
	
	var bestPunchWeapon = leftPunch;
	
	var laPunchToHit = getToHitAsPercent(mech, leftPunch, tgtMech);
	var raPunchToHit = getToHitAsPercent(mech, rightPunch, tgtMech);
	
	if(leftPunch.cooldown == 0 && rightPunch.cooldown == 0
			&& laPunchToHit == raPunchToHit){
		// both punches otherwise equivalent, check mech arm weapons and use the arm which deals less potential weapon damage
		// also if there is an intact hatchet involved, choose the arm without the hatchet
		var leftArmWeaponDmg = 0;
		var rightArmWeaponDmg = 0;
		
		for(var i=0; i<mech.weapons.length; i++){
			var weapon = mech.weapons[i];
			if(weapon == null || weapon.isDestroyed()){
				continue;
			}
			
			if(weapon instanceof WeaponHatchet){
				// automatically use other arm instead of hatchet arm
				if(LEFT_ARM == weapon.getLocation()){
					return rightPunch;
				}
				else if(RIGHT_ARM == weapon.getLocation()){
					return leftPunch;
				}
			}
			
			var ammo = getAmmoCount(mech, weapon);
			if(ammo == 0){
				continue;
			}
			
			// since weapons with >1 projectile don't always hit with all, use an average number based on cluster hits rolls
			if(LEFT_ARM == weapon.getLocation()){
				leftArmWeaponDmg += weapon.getDamage() * expectedHitsByRackSize[weapon.getProjectiles()];	
			}
			else if(RIGHT_ARM == weapon.getLocation()){
				rightArmWeaponDmg += weapon.getDamage() * expectedHitsByRackSize[weapon.getProjectiles()];	
			}
		}
		
		if(rightArmWeaponDmg < leftArmWeaponDmg){
			bestPunchWeapon = rightPunch;
		}
		else{
			bestPunchWeapon = leftPunch;
		}
	}
	else if(leftPunch.cooldown > 0 
			|| raPunchToHit > laPunchToHit){
		// left punch is on cooldown, or target is on right arc, select the right punch
		bestPunchWeapon = rightPunch;
	}
	
	return bestPunchWeapon;
}

// returns the amount of mp to reduce from the mech's speed due to heat effects, leg damage, etc
function getReduceWalkMP(mech){
	var reduce = 0;
	
	// reductions for leg damage, engine damage, etc
	var hipHits = 0;		
	var upLegHits = 0;		
	var lowLegHits = 0;
	var footHits = 0;
	for(var c=0; c<LEGS.length; c++){
		var legIndex = LEGS[c];
		var sectionCrit = mech.crits[legIndex];
		
		for(var i=0; i<sectionCrit.length; i++){
			var thisCrit = sectionCrit[i];
			if(MTF_CRIT_HIP == thisCrit.getName()
					&& thisCrit.isDestroyed()){
				hipHits ++;
			}
			else if(MTF_CRIT_UP_LEG_ACT == thisCrit.getName()
					&& thisCrit.isDestroyed()){
				upLegHits ++;
			}
			else if(MTF_CRIT_LOW_LEG_ACT == thisCrit.getName()
					&& thisCrit.isDestroyed()){
				lowLegHits ++;
			}
			else if(MTF_CRIT_FOOT_ACT == thisCrit.getName()
					&& thisCrit.isDestroyed()){
				footHits ++;
			}
		}
	}
	
	if(hipHits == 2){
		// 0 WalkMP for 2 hips hits (supercedes any actuator hits)
		reduce = mech.walkMP;
	}
	else if(hipHits == 1){
		// 1/2 WalkMP  for 1 hip hit (supercedes any actuator hits)
		reduce = Math.floor(mech.walkMP / 2);
	}
	else{
		// -1 WalkMP for each actuator hit
		reduce = upLegHits + lowLegHits + footHits;
	}
	
	if(mech.heat >= 15){
		// find the first highest MP reduce effect since they don't stack
		for(var i=Math.floor(mech.heat); i>= 15; i--){
			var effect = heatEffects[i];
			
			if(effect != null && effect.type == EFFECT_MP_REDUCE){
				reduce += effect.amount;
				break;
			}
		}
	}
	
	if(reduce > mech.walkMP)
		reduce = mech.walkMP;
	
	return reduce;
}

// returns the toHit penalties incurred by the mech due to heat effects, arm/sensor damage, etc
function getToHitEffectPenalties(mech, weapon){
	var penaltyMods = [];
	if(mech.heat >= 15){
		// find the first highest toHit reduce effect since they don't stack
		for(var i=Math.floor(mech.heat); i>= 15; i--){
			var effect = heatEffects[i];
			
			if(effect != null && effect.type == EFFECT_TOHIT_INCREASE){
				penaltyMods.push(new Modifier(MODIFIER_HEAT, effect.amount));
				break;
			}
		}
	}
	
	//reductions for arm damage, sensor damage, etc
	if(isMeleeWeapon()){
		// any penalties for all melee attacks go here
	}
	else{
		// any penalties for all weapon attacks go here
		
		var headCrits = mech.crits[HEAD];
		for(var i=0; i<headCrits.length; i++){
			var thisCrit = headCrits[i];
			if(MTF_CRIT_SENSORS == thisCrit.getName() && thisCrit.isDestroyed()){
				// +2 HIT for weapons when Sensors are destroyed
				penaltyMods.push(new Modifier(MODIFIER_CRIT, 2));
			}
		}
	}
	
	// reductions for the specific weapon
	if(weapon.getModifier() > 0){
		penaltyMods.push(new Modifier(MODIFIER_CRIT, weapon.getModifier()));
	}
	
	return penaltyMods;
}

// returns the roll to be made to avoid automatic shutdown due to overheating
function getAutoShutdownRoll(mech){
	var roll = 0;
	
	// the first chance to shutdown begins at 24 heat
	if(mech.heat >= 24){
		// find the first highest shutdown risk since they don't stack
		for(var i=Math.floor(mech.heat); i>=24; i--){
			var effect = heatEffects[i];
			
			if(effect != null && effect.type == EFFECT_SHUTDOWN_RISK){
				roll = effect.amount;
				break;
			}
		}
	}
	
	return roll;
}

// returns the roll to be made to avoid ammo explosion due to overheating
function getAmmoExplosionRoll(mech){
	var roll = 0;
	
	// the first chance of ammo explosion begins at 29 heat
	if(mech.heat >= 29){
		// find the first highest explosion risk since they don't stack
		for(var i=Math.floor(mech.heat); i>=24; i--){
			var effect = heatEffects[i];
			
			if(effect != null && effect.type == EFFECT_AMMO_EXP_RISK){
				roll = effect.amount;
				break;
			}
		}
	}
	
	return roll;
}

// returns the direction of the target relative to the heading of the source using Mech objects as input
function getRelativeDirection(srcMech, tgtMech){
	return getRelativeDirectionFrom(srcMech.location, srcMech.heading, tgtMech.location);
}

//returns the direction of the target relative to the heading of the source
function getRelativeDirectionFrom(srcLocation, srcHeading, tgtLocation){
	if(srcLocation == null || srcHeading == null || tgtLocation == null){
		return null;
	}
	
	var toDegree = getDegree(srcLocation, tgtLocation);
	var srcDegree = getHeadingDegrees(srcHeading);
	
	var diffDegree = toDegree - srcDegree;
	if(diffDegree < 0){
		diffDegree = 360 + diffDegree;
	}
	
	var relDirection = REL_DIRECTION_FRONT;
	if(diffDegree >= 270 || diffDegree <= 90){
		relDirection = REL_DIRECTION_FRONT;
	}
	else if(diffDegree > 90 && diffDegree < 150){
		relDirection = REL_DIRECTION_RIGHT;
	}
	else if(diffDegree >= 150 && diffDegree <= 210){
		relDirection = REL_DIRECTION_REAR;
	}
	else if(diffDegree > 210 && diffDegree < 270){
		relDirection = REL_DIRECTION_LEFT;
	}
	
	return relDirection;
}

/**
 * gets the degree direction of the heading given
 */
function getHeadingDegrees(heading){
	var degrees = 0;
	
	switch(heading){
		case 0: //"N"
			degrees = 0;
			break;
			
		case 1: //"NE"
			degrees = 60;
			break;
			
		case 2: //"SE"
			degrees = 120;
			break;
			
		case 3: //"S"
			degrees = 180;
			break;
			
		case 4: //"SW"
			degrees = 240;
			break;
			
		case 5: //"NW"
			degrees = 300;
			break;
	}
	
	return degrees;
}

/**
 * returns the compass direction of the degrees given
 */
function getDegreesHeading(degrees){
	var heading = 0;
	
	if(degrees >= 330 || degrees <= 30){
		heading = 0;
	}
	else if(degrees > 30 && degrees <= 90){
		heading = 1;
	}
	else if(degrees > 90 && degrees < 150){
		heading = 2;
	}
	else if(degrees >= 150 && degrees <= 210){
		heading = 3;
	}
	else if(degrees > 210 && degrees < 270){
		heading = 4;
	}
	else{
		heading = 5;
	}
	
	return heading;
}

var AUTO_MISS = 1000;
// returns the 2d6 to hit
function getToHit(srcMech, weapon, tgtMech){
	if(!srcMech || !weapon || !tgtMech || srcMech.isDestroyed() || weapon.isDestroyed())
		return AUTO_MISS;
	
	// base to hit is from pilot gunnery skill
	var toHit = srcMech.getPilot().getGunnery();	
	
	if(isMeleeWeapon(weapon)){
		// base melee to hit is from piloting skill
		toHit = srcMech.getPilot().getPiloting();
		
		var srcHex = getHexAt(srcMech.location);
		var tgtHex = getHexAt(tgtMech.location);
		var elevationDiff = srcHex.elevation - tgtHex.elevation;
		
		if(Math.abs(elevationDiff) > 1){
			// melee weapons can not hit mechs at more than 1 elevation difference
			return AUTO_MISS;
		}
		else if(weapon instanceof WeaponKick 
				&& elevationDiff == -1){
			// kicks can not hit mechs at a higher elevation
			return AUTO_MISS;
		}
		else if(weapon instanceof WeaponPunch
				&& elevationDiff == 1){
			// punches can not hit mechs at a lower elevation
			return AUTO_MISS;
		}
	}
	
	//debug.log(weapon.shortName+" toHit from "+srcMech.variant+" to "+tgtMech.variant+" base="+toHit);
	
	// make sure target is in the firing arc for the weapon's location
	var relDirection = getRelativeDirection(srcMech, tgtMech);
	
	if(relDirection == REL_DIRECTION_REAR){
		// only rear firing weapons are allowed to hit
		
		var canFlipArms = true;
		var isArmWeapon = false;
		if(weapon.location == LEFT_ARM || weapon.location == RIGHT_ARM){
			// check if the mech has no Lower Arm or Hand actuators in BOTH arms, as it can reverse/flip the arms to fire in rear arc

			isArmWeapon = true;
			
			var leftRightArms = [LEFT_ARM, RIGHT_ARM];
			for(var loc=0; loc<leftRightArms.length; loc++){
				var armLocation = leftRightArms[loc];
				
				var critSection = srcMech.crits[armLocation];
				for(var i=0; i<critSection.length; i++){
					var thisCrit = critSection[i];
					
					if(thisCrit == null || !thisCrit.isEquipment()){
						continue;
					}
					
					if(MTF_CRIT_LOW_ARM_ACT == thisCrit.getName()
							|| MTF_CRIT_HAND_ACT == thisCrit.getName()){
						// actuator found, flipping arms not possible
						canFlipArms = false;
						break;
					}
				}
			}
		}
		
		if(isArmWeapon && canFlipArms){
			// allow flippable arms to fire in rear arc
		}
		else if(weapon.location != RIGHT_REAR 
				&& weapon.location != CENTER_REAR 
				&& weapon.location != LEFT_REAR){
			return AUTO_MISS;
		}
	}
	else if(relDirection == REL_DIRECTION_LEFT){
		// only left arm weapons are allowed to hit (maybe also allow left torso?)
		if(weapon.location != LEFT_ARM){
			return AUTO_MISS;
		}
	}
	else if(relDirection == REL_DIRECTION_RIGHT){
		// only right arm weapons are allowed to hit
		if(weapon.location != RIGHT_ARM){
			return AUTO_MISS;
		}
	}
	else{
		// any weapon can hit not located in a rear torso
		if(weapon.location == RIGHT_REAR 
				|| weapon.location == CENTER_REAR 
				|| weapon.location == LEFT_REAR){
			return AUTO_MISS;
		}
	}
	
	var modifiers = getToHitModifiers(srcMech, weapon, tgtMech);
	for(var i=0; i<modifiers.length; i++){
		var thisModifier = modifiers[i];
		toHit += thisModifier.getValue();
	}
	
	return toHit;
}

// modifier types that will be found in the Modifier objects
var MODIFIER_IMPOSSIBLE = "IMPOSSIBLE";
var MODIFIER_MIN_RANGE = "MIN RNG";
var MODIFIER_SHORT_RANGE = "SHORT RNG";
var MODIFIER_MEDIUM_RANGE = "MEDIUM RNG";
var MODIFIER_LONG_RANGE = "LONG RNG";
var MODIFIER_MAX_RANGE = "MAX RNG";
var MODIFIER_KICK = "KICK";
var MODIFIER_HATCHET = "HATCHET";
var MODIFIER_HEAT = "HEAT";
var MODIFIER_CRIT = "CRIT";
var MODIFIER_WALKING = "WALKING";
var MODIFIER_RUNNING = "RUNNING";
var MODIFIER_JUMPING = "JUMPING";
var MODIFIER_WATER = "WATER";
var MODIFIER_TARGET_WATER = "TGT WATER";
var MODIFIER_TARGET_IMMOBILE = "TGT IMMOBILE";
var MODIFIER_TARGET_PRONE = "TGT PRONE";
var MODIFIER_TARGET_JUMPING = "TGT JUMPING";
var MODIFIER_TARGET_MOVING = "TGT MOVING";
var MODIFIER_LIGHT_WOODS = "LT WOODS";
var MODIFIER_HEAVY_WOODS = "HVY WOODS";
var MODIFIER_PARTIAL_COVER = "PART COVER";

// Modifier object used to describe each individual to Hit modifier on a given target
var Modifier = Class.create({
	initialize: function(type, value) {
		this.type = type;
		this.value = value;
	},
	getType: function() {
		return this.type;
	},
	getValue: function() {
		return this.value;
	},
});

// returns objects describing each modifier to hit the target from the source with the given weapon
function getToHitModifiers(srcMech, weapon, tgtMech){
	var range = getRange(srcMech.location, tgtMech.location);
	
	var toHitMods = [];

	var rangeModifier = -1;
	for(var i=0; i<weapon.range.length; i++){
		var thisWpnRange = weapon.range[i];
		
		if(range <= thisWpnRange){
			rangeModifier = (i * 2);
			
			var rangeType = null;
			if(i==0){
				rangeType = MODIFIER_SHORT_RANGE;
			}
			else if(i==1){
				rangeType = MODIFIER_MEDIUM_RANGE;
			}
			else{
				rangeType = MODIFIER_LONG_RANGE;
			}
			
			toHitMods.push(new Modifier(rangeType, rangeModifier));
			
			break;
		}
	}
	
	
	if(rangeModifier == -1){
		// TODO: weapon is outside of long range, use maximum range rules? For now just return as auto miss
		toHitMods.push(new Modifier(MODIFIER_MAX_RANGE, AUTO_MISS));
	}
	
	
	if(weapon instanceof WeaponKick){
		// kicking has a -2 base modifier
		var kickModifier = -2;
		
		toHitMods.push(new Modifier(MODIFIER_KICK, kickModifier));
	}
	else if(weapon instanceof WeaponHatchet){
		// hatchets have a -1 base modifier
		var hatchetModifier = -1;

		toHitMods.push(new Modifier(MODIFIER_HATCHET, hatchetModifier));
	}
	
	
	if(weapon.minRange != null 
			&& weapon.minRange > 0 
			&& range <= weapon.minRange){
		// add in minimum range modifier
		var minRangeModifier = (weapon.minRange - range) + 1;
		
		toHitMods.push(new Modifier(MODIFIER_MIN_RANGE, minRangeModifier));
	}	
	
	
	// add in heat and other crit effect modifiers
	var penaltyModifiers = getToHitEffectPenalties(srcMech, weapon);
	toHitMods = toHitMods.concat(penaltyModifiers);
	
	
	// add movement modifiers from source
	var srcMoveStatus = getMechMovementStatus(srcMech);
	
	if(srcMoveStatus == MECH_STANDING){
		// no source modifier for standing
	}
	else if(srcMoveStatus == MECH_WALKING){
		var srcMoveModifier = 1;
		
		toHitMods.push(new Modifier(MODIFIER_WALKING, srcMoveModifier));
	}
	else if(srcMoveStatus == MECH_RUNNING){
		var srcMoveModifier = 2;
		
		toHitMods.push(new Modifier(MODIFIER_RUNNING, srcMoveModifier));
	}
	else if(srcMoveStatus == MECH_JUMPING){
		var srcMoveModifier = 3;
		
		toHitMods.push(new Modifier(MODIFIER_JUMPING, srcMoveModifier));
	}
	
	// add in location and target only type mods
	var fromLocationMods = getToHitModifiersFromLocation(srcMech.location, tgtMech);
	toHitMods = toHitMods.concat(fromLocationMods);
	
	return toHitMods;
}

/**
 * returns only the los modifiers and target movement modifiers from the location
 * @param srcLocation
 * @param tgtMech
 */
function getToHitModifiersFromLocation(srcLocation, tgtMech){
	var toHitMods = [];
	
	if(srcLocation == null || tgtMech == null || tgtMech.getLocation() == null){
		return toHitMods;
	}
	
	// add movement modifiers from target
	var tgtMoveStatus = getMechMovementStatus(tgtMech);
	var tgtSpeed = getSpeed(tgtMech);
	
	if(tgtMoveStatus == MECH_STANDING){
		// no target modifier for standing
	}
	else if(tgtMoveStatus == MECH_IMMOBILE){
		// immobile mech decreases to hit roll by 4
		toHitMods.push(new Modifier(MODIFIER_TARGET_IMMOBILE, -4));
	}
	else if(tgtMoveStatus == MECH_PRONE){
		// prone mech decreases to hit roll by 2 from adjacent hex (distance of 1), but increases by 1 from all others
		var range = getRange(srcLocation, tgtMech.getLocation());
		if(range <= 1){
			toHitMods.push(new Modifier(MODIFIER_TARGET_PRONE, -2));
		}
		else{
			toHitMods.push(new Modifier(MODIFIER_TARGET_PRONE, 1));
		}
	}
	else if(tgtMoveStatus == MECH_JUMPING){
		// jumping is normally from # of hexes moved + 1 additional
		// but since AP movement is based on running, speed from jumping will be halved then +1 additional will be counted
		toHitMods.push(new Modifier(MODIFIER_TARGET_JUMPING, Math.floor(tgtSpeed/2) + 1));
	}
	else{
		// +1 will be added for each hex moved since AP movement is less per turn than standard BT
		toHitMods.push(new Modifier(MODIFIER_TARGET_MOVING, tgtSpeed));
	}
	
	
	// add LOS obstacle modifiers
	var los = calculateLos(srcLocation, tgtMech.location);
		
	var losMods = losModifiers(los);
	toHitMods = toHitMods.concat(losMods);
	
	// add attacker terrain modifier
	var attackerMods = getAttackerTerrainModifier(srcLocation);
	toHitMods = toHitMods.concat(attackerMods);	
	
	// add target terrain modifier
	var targetMods = getTargetTerrainModifier(tgtMech.location);
	toHitMods = toHitMods.concat(targetMods);
	
	return toHitMods;
}


// returns the to hit as an approximate percentage based on the 2d6
function getToHitAsPercent(srcMech, weapon, tgtMech){
	if(srcMech == null || weapon == null || tgtMech == null || tgtMech.isDestroyed()){
		return -1;
	}
	
	var toHit = getToHit(srcMech, weapon, tgtMech);
	
	if(toHit == null || toHit == AUTO_MISS || toHit > 12){
		return 0;
	}
	else if(toHit < 0){
		return 100;
	}
	
	return ODDS[toHit];
}

function isClusterWeapon(weapon){
	return (weapon.getProjectiles() > 1);
}

// fires the weapon, deals the damage, updates the heatGen
// returns object with details on success, message
// NOTE: success doesn't mean the weapon hit, it only means that it fired!
function fireWeapon(srcMech, weapon, tgtMech){
	var message = "";
	
	/* Since mechs with 0 walk MP are allowed to fire, going to allow this
	 * if(srcMech.actionPoints == 0){
		message = null;	//"No AP remaining. Skip the turn to proceed."
		var gm = new GameMessage(false, message, SEV_HIGH);
		messages.push(gm);
		return gm;
	}*/
	
	if(tgtMech == null){
		message = "Press 't' to Target";
		var gm = new GameMessage(srcMech, false, (playerMech == srcMech) ? message : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
	
	if(tgtMech.isDestroyed()){
		message = tgtMech.chassis +" is already destroyed.";
		var gm = new GameMessage(srcMech, false, (playerMech == srcMech) ? message : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
	
	if(weapon.isDestroyed()){
		message = weapon.shortName +" is destroyed.";
		var gm = new GameMessage(srcMech, false, (playerMech == srcMech) ? message : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}

	if(weapon.cooldown > 0){
		message = weapon.shortName +" on cooldown for "+ weapon.cooldown +" turn(s).";
		var gm = new GameMessage(srcMech, false, (playerMech == srcMech) ? message : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
	
	if(getAmmoCount(srcMech, weapon) == 0){
		message = weapon.shortName +" has no ammo remaining.";
		var gm = new GameMessage(srcMech, false, (playerMech == srcMech) ? message : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
	
	var toHit = getToHit(srcMech, weapon, tgtMech);
	if(toHit == AUTO_MISS
			|| toHit > 12){
		message = weapon.shortName +" can not hit the target.";
		var gm = new GameMessage(srcMech, false, (playerMech == srcMech) ? message : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
	
	// automatic hit at 2
	var dieResult = (toHit == 2) ? 2 : getDieRollTotal(2, 6);
	//debug.log("dieResult: "+dieResult);
	
	var hitDamages = [];
	var hitLocations = [];
	if(dieResult >= toHit){
		var thisDamage = weapon.damage;
		
		var numHits = 1;
		if(isClusterWeapon(weapon)){
			// roll 2d6 then look up result on CLUSTER_HITS table
			var clusterDieResult = getDieRollTotal(2, 6);
			var clusterRow = CLUSTER_HITS[clusterDieResult];
			
			var numProjectiles = weapon.getProjectiles();
			
			if(numProjectiles == 2){ numHits = clusterRow[0]; }
			else if(numProjectiles == 4){ numHits = clusterRow[1]; }
			else if(numProjectiles == 5){ numHits = clusterRow[2]; }
			else if(numProjectiles == 6){ numHits = clusterRow[3]; }
			else if(numProjectiles == 10){ numHits = clusterRow[4]; }
			else if(numProjectiles == 15){ numHits = clusterRow[5]; }
			else if(numProjectiles == 20){ numHits = clusterRow[6]; }
		}
		
		// LRM clusters for every 5 missiles
		var isLRM = weapon.isLRM();
		
		var groupAdd = 1;
		if(isLRM) groupAdd = 5;
		for(var i=0; i<numHits; i+=groupAdd){
			// do the damage
			var numThisGroup = groupAdd;
			if(isLRM && groupAdd + i >= numHits){
				numThisGroup = numHits - i;
			}
			
			if(numThisGroup == 0){
				break;
			}
		
			// a hit, roll to determine hit location
			var hitLoc = getHitLocation(srcMech, weapon, tgtMech);
			if(hitLoc != null){
				hitLocations.push(hitLoc);
								
				applyDamage(thisDamage * numThisGroup, tgtMech, hitLoc);
				hitDamages.push(thisDamage * numThisGroup);
				
				// add heat damage effect, if any
				var damageHeat = weapon.getDamageHeat();
				if(damageHeat > 0){
					tgtMech.heat += damageHeat;
				}
			}
		}
		
		var locText = getLocationArrayText(hitLocations);
		var dmgText = (isLRM) ? getArrayText(hitDamages) : thisDamage;
		
		if(tgtMech == playerMech){
			message = weapon.shortName +" hits "+ playerName +" for "+ dmgText +" damage in the "+ locText+".";
		}
		else{
			message = weapon.shortName +" hits "+ tgtMech.chassis +" for "+ dmgText +" damage in the "+ locText+".";
		}
		
		if(weapon instanceof WeaponKick){
			// hitting with a kick requires a piloting skill roll of the defender
			doPilotSkillRoll(tgtMech);
		}
	}
	else{
		if(tgtMech == playerMech){
			message = weapon.shortName +" misses "+ playerName +"!";
		}
		else{
			message = weapon.shortName +" misses "+ tgtMech.chassis +"!";
		}
		
		if(weapon instanceof WeaponKick){
			// missing a kick requires a piloting skill roll of the attacker
			doPilotSkillRoll(srcMech);
		}
	}
	
	// consume ammo
	srcMech.consumeAmmo(weapon.shortName, 1, true);
	
	// add to the heat gen
	srcMech.heatGen += weapon.heat;
	
	// set the cooldown
	weapon.cooldown = weapon.getSpeed();
	
	// if melee, set that it was used
	if(isMeleeWeapon(weapon)){
		weapon.used = true;
	}
	
	// return results
	var results = new WeaponFireGameMessage(tgtMech, true, message, SEV_HIGH);
	results.hitDamages = hitDamages;
	results.hitLocations = hitLocations;
	
	messages.push(results);
	
	return results;
}

// mark any weapons destroyed in an area with no internals remaining
function updateDestroyedWeapons(mech){
	
	for(var i=0; i<mech.internal.length; i++){
		if(mech.internal[i] > 0)
			continue;
			
		for(var w=0; w<mech.weapons.length; w++){
			var thisWeapon = mech.weapons[w];
			
			if(thisWeapon != null && !thisWeapon.isDestroyed() && thisWeapon.location == i)
				thisWeapon.setDestroyed(true);
		}
		
		for(var w=0; w<mech.melee.length; w++){
			var thisMelee = mech.melee[w];
			
			if(thisMelee != null && !thisMelee.isDestroyed() && thisMelee.location == i){
				thisMelee.setDestroyed(true);
			}
			else if(thisMelee != null && !thisMelee.isDestroyed()
					&& (thisMelee.location == RIGHT_LEG || thisMelee.location == LEFT_LEG)
					&& (i == RIGHT_LEG || i == LEFT_LEG)){
				// remove ability to kick if either leg is destroyed
				thisMelee.setDestroyed(true);
			}
		}
	}
}

// performs the roll to determine the hit location taking into account the orientation of the target
function getHitLocation(srcMech, weapon, tgtMech){

	// account for the orientation of the target
	var mechLocations = FRONT_HIT_LOCATIONS;
	
	var isHatchet = (weapon instanceof WeaponHatchet);
	var isPunch = (weapon instanceof WeaponPunch);
	var isKick = (weapon instanceof WeaponKick);
	
	
	// account for punch/kick/hatchet hit location when target is different elevation
	var srcHex = getHexAt(srcMech.location);
	var tgtHex = getHexAt(tgtMech.location);
	var elevationDiff = srcHex.elevation - tgtHex.elevation;
	
	// use punch locations for punching at same elevation, or when above target by one elevation level for kick/hatchet
	var usePunchLocations = ((isPunch && elevationDiff == 0)
			|| (isKick && elevationDiff == 1)
			|| (isHatchet && elevationDiff == 1));
	
	// use kick locations for kicking at same elevation, or when below target by one elevation level for punch/hatchet
	var useKickLocations = ((isKick && elevationDiff == 0) 
			|| (isPunch && elevationDiff == -1)
			|| (isHatchet && elevationDiff == -1));
	
	
	// find out if the target has partial cover as it could effect the resulting hit location
	var targetHasCover = false;
	var fromLocationMods = getToHitModifiersFromLocation(srcMech.location, tgtMech);
	for(var i=0; i<fromLocationMods.length; i++){
		var modifier = fromLocationMods[i];
		if(modifier != null 
				&& modifier.getType() == MODIFIER_PARTIAL_COVER 
				&& modifier.getValue() > 0){
			
			targetHasCover= true;
		}
	}
	
	var fromDirection = getDirection(tgtMech.location, srcMech.location);
	var targetDirection = tgtMech.heading;
	
	var diff = Math.abs(fromDirection - targetDirection);
	
	if(diff == 3){
		// target is facing directly away from the source
		//debug.log(srcMech.variant+" on rear side of "+tgtMech.variant);
		if(usePunchLocations){
			mechLocations = REAR_PUNCH_LOCATIONS;
		}
		else if(useKickLocations){
			mechLocations = REAR_KICK_LOCATIONS;
		}
		else{
			mechLocations = REAR_HIT_LOCATIONS;
		}
	}
	else if((diff == 2 && fromDirection > targetDirection)
				|| (diff == 4 && fromDirection < targetDirection)){
		// target is on the right flank
		//debug.log(srcMech.variant+" on right flank of "+tgtMech.variant);
		if(usePunchLocations){
			mechLocations = RIGHT_PUNCH_LOCATIONS;
		}
		else if(useKickLocations){
			mechLocations = RIGHT_KICK_LOCATIONS;
		}
		else{
			mechLocations = RIGHT_HIT_LOCATIONS;
		}
	}
	else if((diff == 2 && fromDirection < targetDirection)
				|| (diff == 4 && fromDirection > targetDirection)){
		// target is on the left flank
		//debug.log(srcMech.variant+" on left flank of "+tgtMech.variant);
		if(usePunchLocations){
			mechLocations = LEFT_PUNCH_LOCATIONS;
		}
		else if(useKickLocations){
			mechLocations = LEFT_KICK_LOCATIONS;
		}
		else{
			mechLocations = LEFT_HIT_LOCATIONS;
		}
	}
	else{
		//debug.log(srcMech.variant+" on front side of "+tgtMech.variant);
		if(usePunchLocations){
			mechLocations = FRONT_PUNCH_LOCATIONS;
		}
		else if(useKickLocations){
			mechLocations = FRONT_KICK_LOCATIONS;
		}
		else{
			mechLocations = FRONT_HIT_LOCATIONS;
		}
	}
	
	if(mechLocations.length == 6){
		// punch and kick locations are 1d6 rolls
		var dieResult = getDieRollTotal(1, 6);
		var resultLocation = dieResult - 1;
		
		// normal locations array starts at where the 1 is rolled
		return mechLocations[resultLocation];
	}
	else{
		var dieResult = getDieRollTotal(2, 6);
		var resultLocation = dieResult - 2;
		//debug.log("dieResult: "+dieResult);
		
		if(targetHasCover &&
				(resultLocation == LEFT_LEG
				|| resultLocation == RIGHT_LEG)){
			// account for partial cover when roll to hit legs it does not hit the mech, rather the ground in front of it
			return null;
		}
		
		// normal locations array starts at where the 2 is rolled
		return mechLocations[resultLocation];
	}
}

// apply damage to hit location starting with armor, then internal, then use damage redirect from there if needed
function applyDamage(damage, mech, hitLocation){
	if(mech.isDestroyed()){
		return;
	}

	while(damage > 0 && mech.armor[hitLocation] > 0){
		mech.armor[hitLocation] --;
		damage --;
		
		mech.addDamageThisTurn(1);
	}
	
	if(damage == 0){
		// no damage remaining after hitting external armor, no need to go further
		return;
	}
	
	// rear hit locations hit internals at a different location index corresponding to their front counterpart
	var critLocation = hitLocation;
	if(hitLocation == LEFT_REAR){
		critLocation = LEFT_TORSO;
	}
	else if(hitLocation == RIGHT_REAR){
		critLocation = RIGHT_TORSO;
	}
	else if(hitLocation == CENTER_REAR){
		critLocation = CENTER_TORSO;
	}

	var critChance = false;
	while(damage > 0 && mech.internal[critLocation] > 0){
		mech.internal[critLocation] --;
		damage --;
		
		critChance = true;
		
		mech.addDamageThisTurn(1);
	}
	
	if(critChance){
		// send off to see what criticals might get hit
		applyCriticalHit(mech, critLocation);
	}
	
	if(mech.internal[HEAD] == 0 || mech.internal[CENTER_TORSO] == 0){
		// if head or center internal are gone, the mech is dead
		//debug.log("Head or CT internal destroyed!");
		mech.setDestroyed(true);
		
		// create destroyed message info
		var gm = new GameMessage(mech, true, ((playerMech == mech) ? playerName : mech.chassis) + " has been destroyed.", SEV_HIGH);
		messages.push(gm);
		
		return;
	}
	else if(mech.internal[LEFT_LEG] == 0 && mech.internal[RIGHT_LEG] == 0){
		// if both of the legs internal are gone, the mech is dead
		//debug.log("Both legs destroyed!");
		mech.setDestroyed(true);
		
		// create destroyed message info
		var gm = new GameMessage(mech, true, ((playerMech == mech) ? playerName : mech.chassis) + " has been destroyed.", SEV_HIGH);
		messages.push(gm);
		
		return;
	}
	
	if(mech.internal[LEFT_TORSO] == 0){
		// the LEFT_ARM and REAR needs to be gone if the torso is gone
		mech.armor[LEFT_REAR] = 0;
		mech.armor[LEFT_ARM] = 0;
		mech.internal[LEFT_ARM] = 0;
	}
	
	if(mech.internal[RIGHT_TORSO] == 0){
		// the RIGHT_ARM and REAR needs to be gone if the torso is gone
		mech.armor[RIGHT_REAR] = 0;
		mech.armor[RIGHT_ARM] = 0;
		mech.internal[RIGHT_ARM] = 0;
	}
	
	// update any destroyed weapons in locations with no remaining internal armor
	updateDestroyedWeapons(mech);
	
	// any damage remaining after internals needs spread to other parts unless it was the Head or Center Torso (in which case the mech was already pronounced dead)
	if(damage == 0 || mech.isDestroyed()){
		return;
	}
	else if(hitLocation == LEFT_ARM || hitLocation == LEFT_LEG || hitLocation == LEFT_REAR){
		return applyDamage(damage, mech, LEFT_TORSO);
	}
	else if(hitLocation == RIGHT_ARM || hitLocation == RIGHT_LEG || hitLocation == RIGHT_REAR){
		return applyDamage(damage, mech, RIGHT_TORSO);
	}
	else if(hitLocation == LEFT_TORSO || hitLocation == RIGHT_TORSO){
		return applyDamage(damage, mech, CENTER_TORSO);
	}
	else{
		debug.log("Who the hell did I hit?  Extra "+damage+" damage from location: "+hitLocation);
	}
}

// rolls to see if a critical hit takes effect then applies it
function applyCriticalHit(mech, hitLocation){
	if(hitLocation < 0)
		return;
		
	// Roll 2d6 to determine if a critical is to be made
	var dieResult = getDieRollTotal(2, 6);
	
	//debug.log("For crit, rolled: "+dieResult);
	
	var numCrits = 0;
	switch(dieResult){
		case 8:
		case 9:
				// rolls 1 crit hit location
				numCrits = 1;
				break;
				
		case 10:
		case 11:
				// rolls 2 crit hit locations
				numCrits = 2;
				break;
				
		case 12:
				numCrits = 3;
				break;
				
		default:break;
	}
	
	if(numCrits == 0){
		// better luck next time
		return;
	}
	else if(numCrits == 3 && (hitLocation == LEFT_ARM 
							||hitLocation == RIGHT_ARM
							||hitLocation == LEFT_LEG
							||hitLocation == RIGHT_LEG
							||hitLocation == HEAD)){
		// 3 crits on head/limb automatically makes the limb come off
		//debug.log("3 Crits! Off with the limb: "+getLocationText(hitLocation));
		
		mech.armor[hitLocation] = 0;
		mech.internal[hitLocation] = 0;
	}
	else{
		var thisCrits = mech.crits[hitLocation];
		
		for(var i=0; i<numCrits; i++){
			// first, make sure there's at least one non-empty/non-destroyed slot so there's no infinite roll loops
			var numActiveCrits = 0;
			for(var j=0; j<thisCrits.length; j++){
				var comp = thisCrits[j];
				if(!(comp.isEmpty() || comp.isDestroyed())){
					numActiveCrits ++;
				}
			}
			
			if(numActiveCrits == 0){
				break;
			}
		
			var critHit = false;
			while(!critHit){
				// roll for each crit hits' location
				var section;
				var slot;
				if(hitLocation == LEFT_LEG || hitLocation == RIGHT_LEG){
					// for legs, only roll 1d6
					dieResult = rollDice(1, 6);
					section = 0;
					slot = dieResult[0];
				}
				else{
					// roll 2d6
					dieResult = rollDice(2, 6);
					
					section = dieResult[0] <= 3 ? 0 : 1;
					slot = dieResult[1];
				}
				
				//debug.log("For location, section: "+section+", slot:"+slot);
				
				// destroy the component at that slot unless it is empty, in which case roll again
				var critSlot = (section * 6) + slot - 1;
				if(!(thisCrits[critSlot] == null || thisCrits[critSlot].isEmpty() || thisCrits[critSlot].isDestroyed())){
					critHit = true;
					
					destroyCritComponent(mech, hitLocation, critSlot);
				}
				else{
					//debug.log("    ROLLING AGAIN");
				}
			}
		}
	}
}


/** performs any secondary effects that destroying a critical slot might have (e.g. ammo explosion, etc) */
function destroyCritComponent(mech, hitLocation, critSlot){
	if(mech.isDestroyed())
		return;
	
	var critSection = mech.crits[hitLocation];
	var hitCrit = critSection[critSlot];

	hitCrit.setDestroyed(true);
	//debug.log("    Crit @ "+getLocationText(hitLocation)+": "+hitCrit.getName());
	
	if(hitCrit.isAmmo()){
		//debug.log("Ammo critical at "+getLocationText(hitLocation)+" on "+hitCrit.getName());
		if(hitCrit.getAmmo() > 0){
			// TODO: pilot takes 2 damage point
		
			var tmpWeapon = new this[hitCrit.getAmmoWeaponClass()];
			var ammoDamage = tmpWeapon.damage * tmpWeapon.getProjectiles() * hitCrit.getAmmo();
			
			// create critical message info
			var gm = new AmmoExplosionGameMessage(mech, true, ((playerMech == mech) ? playerName : mech.chassis) + " explosion at "+getLocationText(hitLocation)+" on "+hitCrit.getWeaponShortName()+" Ammo for "+ammoDamage+" damage", SEV_HIGH);
			gm.hitLocations = [hitLocation];
			gm.hitDamages = [ammoDamage];
			messages.push(gm);
			
			// apply ammo explosion damage
			applyDamage(ammoDamage, mech, hitLocation);
			
			// consume all remaining ammo from the exploded ammo bin
			mech.consumeAmmo(tmpWeapon.shortName, hitCrit.getAmmo(), false);
			hitCrit.consumeAmmo(hitCrit.getAmmo());
		}
	}
	else if(hitCrit.isWeapon()){
		//debug.log("Weapon critical at "+getLocationText(hitLocation)+" on "+hitCrit.getName());
		// TODO: properly handle destroyed weapons that use more than one crit slot
		
		if(hitCrit.isRearMounted()){
			// handle weapons that are mounted in the rear of the location
			switch(hitLocation){
				case LEFT_TORSO:
								hitLocation = LEFT_REAR;
								break;
				
				case RIGHT_TORSO:
								hitLocation = RIGHT_REAR;
								break;
				
				case CENTER_TORSO:
								hitLocation = CENTER_REAR;
								break;
				
				default: break;
			}
		}
		
		// find the weapon that needs to be set as destroyed
		for(var i=0; i<mech.weapons.length; i++){
			var thisWeapon = mech.weapons[i];
			if(thisWeapon.location != hitLocation 
					|| thisWeapon.isDestroyed())
				continue;
			
			if(thisWeapon instanceof this[hitCrit.getWeaponClass()]){
				thisWeapon.setDestroyed(true);
				break;
			}
		}
		
		var tmpWeapon = new this[hitCrit.getWeaponClass()];
		
		var gm = new CriticalHitGameMessage(mech, true, ((playerMech == mech) ? playerName : mech.chassis) + " weapon critical hit at "+getLocationText(hitLocation)+" on "+tmpWeapon.getShortName(), SEV_HIGH);
		gm.critLocation = hitLocation;
		gm.critComponent = hitCrit.getName();
		messages.push(gm);
	}
	else if(hitCrit.isHeatsink()){
		//debug.log("Heatsink critical at "+getLocationText(hitLocation)+" on "+hitCrit.getName());
		// TODO: when double heat sinks are implemented, need to check other crits to see if the same one was hit again
		mech.heatSinks -= 1;
		
		var gm = new CriticalHitGameMessage(mech, true, ((playerMech == mech) ? playerName : mech.chassis) + " heatsink critical hit at "+getLocationText(hitLocation), SEV_HIGH);
		gm.critLocation = hitLocation;
		gm.critComponent = hitCrit.getName();
		messages.push(gm);
	}
	else if(hitCrit.isJumpJet()){
		//debug.log("JumpJet critical at"+getLocationText(hitLocation)+" on "+hitCrit.getName());
		mech.jumpMP -= 1;
		
		var gm = new CriticalHitGameMessage(mech, true, ((playerMech == mech) ? playerName : mech.chassis) + " jump jet critical hit at "+getLocationText(hitLocation), SEV_HIGH);
		gm.critLocation = hitLocation;
		gm.critComponent = hitCrit.getName();
		messages.push(gm);
	}
	else if(hitCrit.isEquipment()){
		//debug.log("Equipment critical at "+getLocationText(hitLocation)+" on "+hitCrit.getName());
		
		if(hitLocation == LEFT_LEG || hitLocation == RIGHT_LEG){
			// check if it was an actuator or hip
			if(MTF_CRIT_HIP == hitCrit.getName()){
				// hip hit disables kicking and halves walking MP
				for(var i=0; i<mech.melee.length; i++){
					var thisMelee = mech.melee[i];
					if(thisMelee.location instanceof WeaponKick){
						thisMelee.setDestroyed(true);
						
						//debug.log("    Kicks disabled: "+thisMelee.name);
					}
				}
				
				// WalkMP reduction will be accounted for in the function getReduceWalkMP
			}
			else if(MTF_CRIT_UP_LEG_ACT == hitCrit.getName() || MTF_CRIT_LOW_LEG_ACT == hitCrit.getName()){
				// upper/lower leg actuator hit is +2 to hit and half damage kicking with that leg and -1 WalkMP
				for(var i=0; i<mech.melee.length; i++){
					var thisMelee = mech.melee[i];
					if(thisMelee.location == hitLocation){
						thisMelee.addModifier(2);
						thisMelee.damage = Math.floor(thisMelee.damage/2);
						
						//debug.log("    Kick +2 HIT, 1/2 DMG: "+thisMelee.name);
					}
				}
				
				// WalkMP reduction will be accounted for in the function getReduceWalkMP
			}
			else if(MTF_CRIT_FOOT_ACT == hitCrit.getName()){
				// foot hit is +1 to hit with that leg and -1 WalkMP
				for(var i=0; i<mech.melee.length; i++){
					var thisMelee = mech.melee[i];
					if(thisMelee.location == hitLocation){
						thisMelee.addModifier(1);
						
						//debug.log("    Kick +1 HIT, 1/2 DMG: "+thisMelee.name);
					}
				}
				
				// WalkMP reduction will be accounted for in the function getReduceWalkMP
			}
		}
		else if(hitLocation == LEFT_ARM || hitLocation == RIGHT_ARM){
			// check if it was an actuator or shoulder
			if(MTF_CRIT_SHOULDER == hitCrit.getName()){
				// shoulder hit, no punching or hatcheting with this arm
				for(var i=0; i<mech.melee.length; i++){
					var thisMelee = mech.melee[i];
					if(thisMelee.location == hitLocation){
						thisMelee.setDestroyed(true);
						
						//debug.log("    Melee disabled: "+thisMelee.name);
					}
				}
				
				// +4 for weapons in arm (not stacking with actuator damage)
				for(var i=0; i<mech.weapons.length; i++){
					var thisWeapon = mech.weapons[i];
					if(thisWeapon.location == hitLocation){
						thisWeapon.modifier = 4;
						//debug.log("    Weapon +4 HIT: "+thisWeapon.name);
					}
				}
			}
			else if(MTF_CRIT_UP_ARM_ACT == hitCrit.getName() 
					|| MTF_CRIT_LOW_ARM_ACT == hitCrit.getName()){
				// upper/lower actuator hit is +2 to attacks and half damage to melee attacks with this arm
				for(var i=0; i<mech.melee.length; i++){
					var thisMelee = mech.melee[i];
					if(thisMelee != null && thisMelee.location == hitLocation){
						// TODO: do not stack this modifier with a possible previous shoulder hit
						thisMelee.addModifier(2);
						thisMelee.damage = Math.floor(thisMelee.damage/2);
						
						//debug.log("    Melee +=2 HIT, 1/2 DMG: "+thisMelee.name);
					}
				}
				// +1 for weapons in arm
				for(var i=0; i<mech.weapons.length; i++){
					var thisWeapon = mech.weapons[i];
					if(thisWeapon.location == hitLocation){
						// TODO: do not stack this modifier with a possible previous shoulder hit
						thisWeapon.addModifier(1);
						//debug.log("    Weapon +=1 HIT: "+thisWeapon.name);
					}
				}
			}
			else if(MTF_CRIT_HAND_ACT == hitCrit.getName()){
				// hand actuator hit is +1 to punching but disabled hatcheting
				for(var i=0; i<mech.melee.length; i++){
					var thisMelee = mech.melee[i];
					if(thisMelee != null && thisMelee.location == hitLocation){
						thisMelee.addModifier(1);
						if(thisMelee instanceof WeaponHatchet){
							thisMelee.setDestroyed(true);
						}
						
						//debug.log("    Melee +1 HIT or Disabled Hatchet: "+thisMelee.name);
					}
				}
			}
		}
		else if(hitLocation == LEFT_TORSO || hitLocation == RIGHT_TORSO){
			// TODO: check if it was an XL engine (whenever that is supported)
			if(isEngineCrit(hitCrit.getName())){
				// each engine crit adds +5 base heat per (10) rounds
				var numEngineCrits = 0;
				for(var i=0; i<critSection.length; i++){
					var chkCrit = critSection[i];
					
					if(isEngineCrit(chkCrit.getName())
							&& chkCrit.isDestroyed()){
						numEngineCrits ++;
					}
				}
				
				//debug.log("    Engine Crit # "+numEngineCrits);
				
				if(numEngineCrits >= 3){
					// 3 engine crits destroys the mech
					mech.setDestroyed(true);
					
					// create destroyed message info
					var gm = new GameMessage(mech, true, ((playerMech == mech) ? playerName : mech.chassis) + " has been destroyed.", SEV_HIGH);
					messages.push(gm);
				}
				else{
					// base heatGen increase will be handled by the function getBaseHeatGen
				}
			}
		}
		else if(hitLocation == CENTER_TORSO){
			// check if it was a Gyro or engine
			if(isEngineCrit(hitCrit.getName())){
				// each engine crit adds +5 base heat per (10) rounds
				var numEngineCrits = 0;
				for(var i=0; i<critSection.length; i++){
					var chkCrit = critSection[i];
					
					if(isEngineCrit(chkCrit.getName())
							&& chkCrit.isDestroyed()){
						numEngineCrits ++;
					}
				}
				
				//debug.log("    Engine Crit # "+numEngineCrits);
				
				if(numEngineCrits >= 3){
					// 3 engine crits destroys the mech
					// TODO: when XL is supported, check left/right torso also
					mech.setDestroyed(true);
					
					// create destroyed message info
					var gm = new GameMessage(mech, true, ((playerMech == mech) ? playerName : mech.chassis) + " has been destroyed.", SEV_HIGH);
					messages.push(gm);
				}
				else{
					// base heatGen increase will be handled by the function getBaseHeatGen
				}
			}
			else if(MTF_CRIT_GYRO == hitCrit.getName()){
				// TODO: 1st crit Gyro adds +3 piloting rolls or falls, 2nd Gyro mech automatically falls and cannot stand up
				var numGyroCrits = 0;
				for(var i=0; i<critSection.length; i++){
					var chkCrit = critSection[i];
					
					if(MTF_CRIT_GYRO == chkCrit.getName()
							&& chkCrit.isDestroyed()){
						numGyroCrits ++;
					}
				}
				
				//debug.log("    Gyro Crit # "+numGyroCrits);
				
				if(numGyroCrits >= 2){
					// until falling/prone is implemented, mech will be considered destroyed after 2nd gyro hit
					mech.setDestroyed(true);
					
					// create destroyed message info
					var gm = new GameMessage(mech, true, ((playerMech == mech) ? playerName : mech.chassis) + " has been destroyed.", SEV_HIGH);
					messages.push(gm);
				}
			}
		}
		else if(hitLocation == HEAD){
			// check if it was a sensor, cockpit or life support
			if(MTF_CRIT_SENSORS == hitCrit.getName()){
				// +2 hit for ALL weapons (not melee)
				// This effect will be accounted for in the function getToHitEffectPenalties
				//debug.log("    All Weapons +2 HIT");
			}
			else if(MTF_CRIT_LIFE_SUPPORT == hitCrit.getName()){
				// TODO: life support damages the pilot when overheated or submerged
			}
			else if(MTF_CRIT_COCKPIT == hitCrit.getName()){
				// cockpit crit kills the mechwarrior
				//debug.log("    Cockpit hit, pilot killed");
				mech.setDestroyed(true);
				
				// create destroyed message info
				var gm = new GameMessage(mech, true, ((playerMech == mech) ? playerName : mech.chassis) + " has been destroyed.", SEV_HIGH);
				messages.push(gm);
			}
		}
		
		var gm = new CriticalHitGameMessage(mech, true, ((playerMech == mech) ? playerName : mech.chassis) + " equipment critical at "+getLocationText(hitLocation)+" on "+hitCrit.getName(), SEV_HIGH);
		gm.critLocation = hitLocation;
		gm.critComponent = hitCrit.getName();
		messages.push(gm);
	}
}

// returns the number of AP per round to give the mech, 1 AP is given per 2 walkMP
function getMechAP(mech){
	if(mech.isLegged())
		// a legged mech automatically only gets 1 MP
		return 1;
	
	var walkMPReduce = getReduceWalkMP(mech);
	var walkMPThisTurn = mech.walkMP - walkMPReduce;
	
	// TODO: when WalkMP is 0, make AP only usable for weapons fire
	if(walkMPThisTurn <= 0){
		return 0;
	}
	
	var ap = Math.floor(walkMPThisTurn / 2) + (walkMPThisTurn % 2);
	
	return ap;
}

// returns the max AP the mech can achieve, not counting any reductions from combat
function getMaxAP(mech){
	if(mech.walkMP == 0)	return 0;
	return Math.floor(mech.walkMP / 2) + (mech.walkMP % 2);
}

// returns the number of JP per round to give the mech based on its jump MP and 1 JP regained per round
function getMechJP(mech){
	if(mech.jumpMP == 0)
		return 0;
	
	var jumpMPReduce = getReduceJumpMP(mech);
	var jumpMPThisTurn = mech.jumpMP - jumpMPReduce;
	
	if(jumpMPThisTurn <= 0){
		return 0;
	}
	
	var maxJP = Math.floor(jumpMPThisTurn / 2) + (jumpMPThisTurn % 2);
	
	var jp = mech.jumpPoints + 1;
	if(jp > maxJP){
		jp = maxJP;
	}
	
	return jp;
}

// returns the temporary amount of jump reduction based on surroundings (such as water)
function getReduceJumpMP(mech){
	var jumpMPReduce = 0;
	
	var mechHex = getHexAt(mech.location);
	
	// if the mech is in Water, jump jets in legs do not function in level 1, no jump jets function deeper than that
	if(mechHex != null && mechHex.type == WATER_TYPE){
		if(mechHex.elevation < -1){
			jumpMPReduce = mech.jumpMP;
		}
		else{
			// only count jump jets in the legs
			for(var c=0; c<LEGS.length; c++){
				var loc = LEGS[c];
				var sectionCrits = mech.crits[loc];
				
				for(var i=0; i<sectionCrits.length; i++){
					var thisCrit = sectionCrits[i];
					if(thisCrit instanceof JumpJetSlot && !thisCrit.isDestroyed()){
						jumpMPReduce += 1;
					}
				}
			}
		}
	}
	
	return jumpMPReduce;
}

//returns the max JP the mech can achieve, not counting any reductions from combat
function getMaxJP(mech){
	if(mech.jumpMP == 0)	return 0; 
	return Math.floor(mech.jumpMP / 2) + (mech.jumpMP % 2);
}


// returns the amount of heat dissipated per turn
function getHeatDissipation(mech){
	
	var externalHeatDissipation = 0;
	
	var mechHex = getHexAt(mech.location);
	
	// if the mech is in Water, increase heat dissipation by double for each heat sink in the water (max of 6)
	if(mechHex != null && mechHex.type == WATER_TYPE){
		if(mechHex.level > 1){
			externalHeatDissipation += mech.heatSinks;
		}
		else{
			// only count heat sinks in the legs
			for(var c=0; c<LEGS.length; c++){
				var loc = LEGS[c];
				var sectionCrits = mech.crits[loc];
				
				for(var i=0; i<sectionCrits.length; i++){
					var thisCrit = sectionCrits[i];
					if(thisCrit instanceof HeatsinkSlot && !thisCrit.isDestroyed()){
						// TODO: double heat sinks would be more (only clan doubles go in legs though)
						externalHeatDissipation += 1;
					}
				}
			}
		}
		
		if(externalHeatDissipation > 6){
			externalHeatDissipation = 6;
		}
	}
	
	return ((mech.heatSinks + externalHeatDissipation) / turnsPerRound);
}

// returns the base amount of heat generated at the start of each turn (0 unless engine damage or in fire/lava)
function getBaseHeatGen(mech){
	var baseHeatGen = 0;
	
	// TODO: handle heat generated from being in fire/lava
	
	var torsoCrits = [LEFT_TORSO, RIGHT_TORSO, CENTER_TORSO];
	var numEngineHits = 0;
	for(var c=0; c<torsoCrits.length; c++){
		var sectionIndex = torsoCrits[c];
		var sectionCrits = mech.crits[sectionIndex];
		
		for(var i=0; i<sectionCrits.length; i++){
			var thisCrit = sectionCrits[i];
			if(isEngineCrit(thisCrit.getName())
					&& thisCrit.isDestroyed()){
					
				numEngineHits ++;
			}
		}
	}
	
	if(numEngineHits > 0){
		// add heat generated from engine damage (+5 per crit hit)
		baseHeatGen += (numEngineHits * 5) / turnsPerRound;
	}
	
	return baseHeatGen;
}

function getMechMovementStatus(mech){
	if(mech.isDestroyed()){
		return MECH_DESTROYED;
	}
	else if(mech.isShutdown()){
		return MECH_IMMOBILE;
	}
	else if(mech.isProne()){
		return MECH_PRONE;
	}

	var mechAP = getMechAP(mech);
	
	var numMoves = mech.movement.length;
	
	// check movement and held moves for MECH_JUMPING status
	var isJumping = false;
	for(var i=0; i<numMoves; i++){
		var thisMove = mech.movement[i];
		if(thisMove.cooldown <= -1)
			continue;
			
		if(thisMove.jumping){
			isJumping = true;
			break;
		}
	}
	for(var i=0; i<mech.heldMoves.length; i++){
		var thisMove = mech.heldMoves[i];
		if(thisMove.cooldown <= -1)
			continue;
			
		if(thisMove.jumping){
			isJumping = true;
			break;
		}
	}
	
	if(mech.actionPoints == mechAP){
		return MECH_STANDING;
	}
	else if(isJumping){
		return MECH_JUMPING;
	}
	else if(mech.actionPoints < (mechAP * 1/3)){
		// Running is defined as when your mech is moving at greater than or equal to 66% of your AP for the turn (33% remaining AP)
		return MECH_RUNNING;
	}
	else{
		return MECH_WALKING;
	}
}

// uses the mech's remaining AP and walkMP to determine if the mech is considered running (for heat and die rolls)
function isMechRunning(mech){
	return getMechMovementStatus(mech) == MECH_RUNNING;
}

// gets the hex object at the given Coords
function getHexAt(xyCoord){
	if(xyCoord == null){
		return null;
	}
	
	if(xyCoord.y >= 0 && xyCoord.y < hexMap.length){
		thisHexRow = hexMap[xyCoord.y];
		
		if(xyCoord.x >= 0 && xyCoord.x < thisHexRow.length){
			return thisHexRow[xyCoord.x];
		}
	}
	
	return null;
}

function setHexAt(xyCoord, hexObj){
	if(xyCoord.y >= 0 && xyCoord.y < hexMap.length){
		thisHexRow = hexMap[xyCoord.y];
		
		if(xyCoord.x >= 0 && xyCoord.x < thisHexRow.length){
			thisHexRow[xyCoord.x] = hexObj;
		}
	}
}

// gets the live mech object at the given Coords
function getMechAt(xyCoord){
	var allMechs = getAllMechs();
	
	for(var i=0; i<allMechs.length; i++){
		var thisMech = allMechs[i];
		
		if(!thisMech.isDestroyed() 
				&& xyCoord.equals(thisMech.location)){
			return thisMech;
		}
	}
	
	return null;
}

// performs simple check to make sure no object are present in the hex being moved to
function isHexAvailable(xyCoord){
	return (getMechAt(xyCoord) == null);
}

// checks to see if the location being moved to can be done with respect to elevation and impedence
// also the currentXY needs to be adjacent, otherwise it will not mean much
// returns the AP required (-1 if not possible)
function getHexRequiredAP(currentXY, newXY){
	var apRequired = 1;

	var newHex = getHexAt(newXY);
	var currentHex = getHexAt(currentXY);
	
	if(newHex == null || currentHex == null){
		return -1;
	}
	
	var currentElevation = currentHex.elevation;
	var newElevation = newHex.elevation;
	
	var elevDiff = Math.abs(newElevation - currentElevation);
	if(elevDiff > 2){
		// no more than 2 elevation changes can occur
		return -1;
	}
		
	apRequired += elevDiff;
	
	// now add impedence (level) of the terrain itself 
	if(currentHex instanceof WaterHex && newHex instanceof WaterHex){
		// moving from water to another water level doesn't stack impedence by level
		apRequired += Math.abs(newHex.level - currentHex.level);
	}
	else if(currentHex instanceof WaterHex){
		// moving out of water adds impedence of leaving water plus that of the new hex
		apRequired += currentHex.level + newHex.level;
	}
	else{
		// just the impedence of the new hex
		apRequired += newHex.level;
	}
	
	return apRequired;
}

// performs all needed tasks to make the move (does not perform the validation, that occurs before)
function commitMove(mech, newXY, points, jumping){
	// put the mech in the new location
	mech.setLocation(newXY);
	
	// add the location to the movement history stack
	var thisMove = new Movement(newXY, points, jumping);
	mech.movement.push(thisMove);
	
	// calculate total heatGen from movement for each step/jump
    var usedMovePoints = 0;
    var usedJumpPoints = 0;
    
	for(var i=0; i<mech.heldMoves.length; i++){
		var prevMove = mech.heldMoves[i];
		if(prevMove.points <= 0)
			continue;
		
        // tally up the number of moves by points
		if(prevMove.jumping){
            usedJumpPoints += prevMove.points;
		}
		else{
            usedMovePoints += prevMove.points;
		}
	}
	
	if(jumping){
        usedJumpPoints += points;
    
		mech.actionPoints -= points;
		mech.jumpPoints -= points;
		
		if(usedJumpPoints > 0){
            // Jumping uses 3 heat to start then +1 heat per hex moved per round
			mech.heatGen += (3 + usedJumpPoints) / turnsPerRound;
		}
		
		// add the held moves' JP to this movement then clear them
		for(var i=0; i<mech.heldMoves.length; i++){
			thisMove.points += mech.heldMoves[i].points;
		}
		mech.heldMoves = [];
	}
	else{
        usedMovePoints += points;
    
		// update the Movement Points
		mech.actionPoints -= points;
		
		if(usedMovePoints > 0){
			// Walking is 1 heat per round, Running is 2 heat per round
			mech.heatGen += (isMechRunning(mech) ? 2: 1) / turnsPerRound;
		}
		
		// add the held moves' AP to this movement then clear them
		for(var i=0; i<mech.heldMoves.length; i++){
			thisMove.points += mech.heldMoves[i].points;
		}
		mech.heldMoves = [];
	}
}

// holds a move for mechs that have additional movement points
function holdMove(mech, newXY, points, jumping){
	// put the mech in the new location
	mech.setLocation(newXY);
	
	// add the location to the movement history stack
	var thisMove = new Movement(newXY, points, jumping);
	mech.heldMoves.push(thisMove);
	
	// update the Movement Points
	mech.actionPoints -= points;
	
	if(jumping)
		mech.jumpPoints -= points;
}

// commits a stand move
function moveNowhere(mech, jumping){
	if(mech.heldMoves.length > 0 && !jumping){
		commitMove(mech, mech.location, 0, jumping);
	}
	else if(jumping){
		// need to indicate that the player actually moved to turn while jumping
		holdMove(mech, mech.location, 1, jumping);
	}
	else{
		var thisMove = new Movement(mech.location, 0, jumping);
		mech.movement.push(thisMove);
	}
	
	var gm = new GameMessage(mech, true, null, SEV_NORMAL);
	messages.push(gm);
	return gm;
}

// rotates the given heading Clockwise
function rotateHeadingCW(mech, jumping){
	return rotateHeading(mech, jumping, getRotateHeadingCW(mech.heading));
}
function getRotateHeadingCW(heading){
	return (heading + 1) % 6;
}

// rotates the given heading Counter Clockwise
function rotateHeadingCCW(mech, jumping){
	return rotateHeading(mech, jumping, getRotateHeadingCCW(mech.heading));
}
function getRotateHeadingCCW(heading){
	return (heading + 5) % 6;
}

function rotateHeading(mech, jumping, newHeading){
	
	if(mech.actionPoints == 0 && !jumping){
		var gm = new GameMessage(mech, false, (playerMech == mech) ? "No action points remaining." : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
	
	if(mech.heldMoves.length > 0){
		// make sure the player isn't trying to walk and jump in the same turn
		for(var i=0; i<mech.heldMoves.length; i++){
			var prevMove = mech.heldMoves[i];
			
			if(jumping && !prevMove.jumping
					|| !jumping && prevMove.jumping){
				var gm = new GameMessage(mech, false, (playerMech == mech) ? "You can not walk and jump in the same turn." : null, SEV_HIGH);
				messages.push(gm);
				return gm;
			}
		}
	}
	
	var message = null;
	
	if(jumping){
		message = "Jumping: Rotate then enter the location of the new hex.";
		
		// rotate allowed, update the heading
		mech.setHeading(newHeading);
		
		var gm = new GameMessage(mech, false, message, SEV_NORMAL);
		messages.push(gm);
		return gm;
	}
	else{
		if(mech.actionPoints > 1){
			holdMove(mech, mech.location, 1);
			
			// rotate allowed, update the heading
			mech.setHeading(newHeading);
			
			var gm = new GameMessage(mech, false, null, SEV_NORMAL);
			messages.push(gm);
			return gm;
		}
		
		commitMove(mech, mech.location, 1, false);
	}
	
	// rotate allowed, update the heading
	mech.setHeading(newHeading);
	
	var gm = new GameMessage(mech, true, message, SEV_NORMAL);
	messages.push(gm);
	return gm;

}

// jumps the mech in the given direction and gets the new x,y coords based on it
function jump(mech, direction){
	if(direction == -1){
		// player just wanted to jump spin in place
		var result = moveNowhere(mech, true);
		
		return result;
	}
	else{
		// use the movefoward function, but first store the current heading so it can be put back
		var currHeading = mech.heading;
		
		mech.setHeading(direction);
		var result = moveForward(mech, true);
		
		// put the heading back
		mech.setHeading(currHeading);
		
		return result;
	}
}

// gets the new hex x,y coords based on the forward heading and current hex x,y (0=N, 1=NE, 2=SE, 3=S, 4=SW, 5=NW)
// forward = true (backward = false)
function move(mech, forward, jumping){
	if(mech.actionPoints == 0){
		var gm = new GameMessage(mech, false, (playerMech == mech) ? "No action points remaining." : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
	
	if(jumping && mech.jumpPoints == 0){
		var gm = new GameMessage(mech, false, (playerMech == mech) ? "No jump points remaining." : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
		
	if(mech.heldMoves.length > 0){
		// make sure the player isn't trying to walk and jump in the same turn
		for(var i=0; i<mech.heldMoves.length; i++){
			var prevMove = mech.heldMoves[i];
			
			if(jumping && !prevMove.jumping
					|| !jumping && prevMove.jumping){
				var gm = new GameMessage(mech, false, (playerMech == mech) ? "You can not walk and jump in the same turn." : null, SEV_HIGH);
				messages.push(gm);
				return gm;
			}
		}
	}
	
	if(mech.isProne()){
		// mech is attempting to stand up, do a pilot skill roll to see if it stands up or falls again
		var gm = doPilotSkillRoll(mech);
		
		if(mech.actionPoints == 1){
			// end the turn by committing the move where it currently is
			commitMove(mech, mech.location, 1, jumping);
			gm.success = true;
		}
		else{
			// let the turn continue at its current location
			holdMove(mech, mech.location, 1, jumping);
		}
		
		// attempting to stand is the move
		return gm;
	}
	
	var heading = mech.heading;
	
	var direction = "forward";
	if(!forward){
		// moving backwards is mostly moving forwards in the opposite direction
		heading = (heading + 3) % 6;
		direction = "backward";
	}
	
	var mechAP = getMechAP(mech);
	var newXY = getForwardCoords(mech.location, heading);
	
	var notMoving = (newXY.equals(mech.location));

	if(notMoving){
		var gm = new GameMessage(mech, false, (playerMech == mech) ? "You have reached the edge of the combat zone." : null, SEV_NORMAL);
		messages.push(gm);
		return gm;
	}
		
		
	// make sure the new hex can be moved to (e.g. no enemy present, has enough AP, elevation is sufficient)
	var apRequired = 0;
	var jpRequired = 0;
	if(jumping){
		apRequired = 1;
		jpRequired = 1;
		
		// make sure the mech's JumpMP meets or exceeds the elevation difference from the jump starting point to the new destination
		var startLocation = mech.location;
		if(mech.movement != null && mech.movement.length > 0){
			var firstMove = mech.movement[0];
			if(firstMove != null){
				startLocation = firstMove.getCoords();
			}
		}
		
		var startHex = getHexAt(startLocation);
		var startElevation = startHex.elevation;
		
		var newHex = getHexAt(newXY);
		var newElevation = newHex.elevation;
		
		if(newElevation > startElevation 
				&& newElevation - startElevation > mech.jumpMP){
			var gm = new GameMessage(mech, false, (playerMech == mech) ? "You can not jump there, try another direction." : null, SEV_HIGH);
			messages.push(gm);
			return gm;
		}
	}
	else{
		apRequired = getHexRequiredAP(mech.location, newXY);
		
		var maxMechAP = getMechAP(mech);
		var walkMPReduce = getReduceWalkMP(mech);
		var walkMPThisTurn = mech.walkMP - walkMPReduce;
		if(apRequired > maxMechAP 
				&& walkMPThisTurn >= 2
				&& apRequired == maxMechAP + 1){
			// if a mech wants to move to a location that requires more than its max AP (only if walkMP >= 2) 
			// lets allow it, but make it require the full amount of AP and only up to one additional AP
			apRequired = maxMechAP;
		}
	}
	
	if(apRequired < 0){
		var gm = new GameMessage(mech, false, (playerMech == mech) ? "You can not move "+direction+", try another direction." : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
	
	/*if(apRequired > 0 && !forward){
		// moving backward no longer requires 2 AP
		apRequired += 1;
	}*/
	// instead, moving backward only requires that the mech is not currently or going to be considered running
	var moveStatus = getMechMovementStatus(mech);
	
	if(!forward 
			&& (moveStatus == MECH_RUNNING
				|| mech.actionPoints - apRequired < (mechAP * 1/3))){
		
		if(mech.walkMP == 2){
			// to allow really slow mechs (Annihilator, UrbanMech) the ability to walk backward normally, 
			// mechs with Walk MP of exactly 2 will be allowed to move backwards since they only get 1 AP per turn anyway
		}
		else{
			var gm = new GameMessage(mech, false, (playerMech == mech) ? "You can not move "+direction+" running." : null, SEV_HIGH);
			messages.push(gm);
			return gm;
		}
	}
	
	if(mech.actionPoints < apRequired){
		var gm = new GameMessage(mech, false, (playerMech == mech) ? apRequired+" AP required to move "+direction+"." : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
	
	if(mech.jumpPoints < jpRequired){
		var gm = new GameMessage(mech, false, (playerMech == mech) ? jpRequired+" JP required to jump." : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
	
	// looking for a mech present at the new location in case this is a charge/DFA
	var mechObstacle = getMechAt(newXY);
	
	if(mechObstacle == null){
		// no obstacles, moving into the new hex Coords
		var moveMessage = null;
		if(apRequired > 1){
			moveMessage = apRequired+" AP were used to move "+direction+".";
		}
		
		// TODO: if the terrain needs it, perform pilot skill roll to see if it fails (e.g. water, rough)
		
		if(playerMech.actionPoints > apRequired){
			// hold on to moves until all AP is used
			holdMove(mech, newXY, apRequired, jumping);
			
			var gm = new GameMessage(mech, false, (playerMech == mech) ? moveMessage : null, SEV_NORMAL);
			messages.push(gm);
			return gm;
		}
		
		commitMove(mech, newXY, apRequired, jumping);
		
		var gm = new GameMessage(mech, true, (playerMech == mech) ? moveMessage : null, SEV_NORMAL);
		messages.push(gm);
		return gm;
	}
	else{
		if(jumping){
			// the jumping mech is DFA'ing the mech at the new hex Coords
			// the to hit roll is the pilots piloting skill plus the difference between its target's piloting and its own piloting skill
			var toHit = mech.getPilot().getPiloting() 
					+ (mechObstacle.getPilot().getPiloting() - mech.getPilot().getPiloting());
			
			var dieResult = (toHit == 2) ? 2 : getDieRollTotal(2, 6);
			
			if(dieResult >= toHit){
				// DFA attack hit, attacker advances into target's hex and teh target is displaced opposite one hex
				// first make sure the target can advance into the new hex
				var displacedLocation = handleDisplacement(mechObstacle, heading);
				
				if(displacedLocation != null){
					// attacker advances to the new hex
					commitMove(mech, newXY, apRequired, jumping);
				}
				else{
					// no displacement could occur, so the attacker stays put
					commitMove(mech, mech.location, apRequired, jumping);
				}
				
				
				// Attacker takes 1 point of damage per 5 attacker tons. 
				// Damage is divided in 5-point damage groupings and is applied to the legs.
				var attackerDamage = Math.ceil(mech.tonnage / 5);
				var attackerDamageResults = applyDamageGrouping(mech, attackerDamage, 5, FRONT_KICK_LOCATIONS);
				
				var hitDamages = attackerDamageResults[0];
				var hitLocations = attackerDamageResults[1];
			
				var locText = getLocationArrayText(hitLocations);
				var dmgText = getArrayText(hitDamages);
				
				var attackerStr = (playerMech == mech) ? "Your mech DFA'd " : mech.chassis+" DFA'd ";
				attackerStr += "taking "+ dmgText +" damage in the "+ locText+".";
				
				var dfaGM = new DeathFromAboveGameMessage(mech, true, attackerStr, SEV_HIGH);
				dfaGM.hitDamages = hitDamages;
				dfaGM.hitLocations = hitLocations;
				messages.push(dfaGM);
				
				// Both attacker and defender must make pilot skill +2 rolls to avoid falling in their new hex
				var chargingAttackModifier = 2;
				doPilotSkillRoll(mech, chargingAttackModifier);
				doPilotSkillRoll(mechObstacle, chargingAttackModifier);
				
				
				// Defender takes 1 point of damage per 10 attacker tons, times 3. 
				// Damage is divided in 5-point damage groupings and is applied to the upper body.
				var defenderDamage = Math.ceil((mech.tonnage / 10) * 3);

				// if the defender is prone, the rear hit table is used
				var defenderHitLocationTable = mechObstacle.isProne() ? REAR_HIT_LOCATIONS : FRONT_PUNCH_LOCATIONS;
				
				var defenderDamageResults = applyDamageGrouping(mechObstacle, defenderDamage, 5, defenderHitLocationTable);
				
				hitDamages = defenderDamageResults[0];
				hitLocations = defenderDamageResults[1];
			
				locText = getLocationArrayText(hitLocations);
				dmgText = getArrayText(hitDamages);
				
				var defenderStr = (playerMech == mechObstacle) ? "Your mech has been DFA'd " : mechObstacle.chassis+" has been DFA'd ";
				defenderStr += "taking "+ dmgText +" damage in the "+ locText+".";
				
				var gm = new WeaponFireGameMessage(mechObstacle, false, defenderStr, SEV_HIGH);
				gm.hitDamages = hitDamages;
				gm.hitLocations = hitLocations;
				messages.push(gm);
				
				return dfaGM;
			}
			else{
				// DFA attack missed, the attacker falls automatically at its current position and takes falling damage
				commitMove(mech, mech.location, apRequired, jumping);
				
				doPilotSkillRoll(mech, AUTO_MISS);
				
				var attackerStr = (playerMech == mech) ? "Your mech failed the DFA." : mech.chassis+" failed the DFA.";
				
				var gm = new DeathFromAboveGameMessage(mech, true, attackerStr, SEV_HIGH);
				messages.push(gm);
				return gm;
			}
		}
		else{
			// the moving mech is Charging the mech at the new hex Coords
			// the to hit roll is the pilots piloting skill plus the difference between its target's piloting and its own piloting skill
			var toHit = mech.getPilot().getPiloting() 
					+ (mechObstacle.getPilot().getPiloting() - mech.getPilot().getPiloting());
			
			var dieResult = (toHit == 2) ? 2 : getDieRollTotal(2, 6);
			
			if(dieResult >= toHit){
				// charge attack hit, attacker advances into target's hex and the target is displaced opposite one hex
				// first make sure the target can advance into the new hex
				var displacedLocation = handleDisplacement(mechObstacle, heading);
				
				if(displacedLocation != null){
					// attacker advances to the new hex
					commitMove(mech, newXY, apRequired, jumping);
				}
				else{
					// no displacement could occur, attacker stays put
					commitMove(mech, mech.location, apRequired, jumping);
				}
				
				
				// Attacker takes 1 point of damage per 10 defender tons. 
				// Damage is divided in 5-point damage groupings.
				var attackerDamage = Math.ceil(mechObstacle.tonnage / 10);
				var attackerDamageResults = applyDamageGrouping(mech, attackerDamage, 5, FRONT_HIT_LOCATIONS);
				
				var hitDamages = attackerDamageResults[0];
				var hitLocations = attackerDamageResults[1];
			
				var locText = getLocationArrayText(hitLocations);
				var dmgText = getArrayText(hitDamages);
				
				var attackerStr = (playerMech == mech) ? "Your mech charged " : mech.chassis+" charged ";
				attackerStr += "taking "+ dmgText +" damage in the "+ locText+".";
				
				var chargingGM = new MechChargingGameMessage(mech, true, attackerStr, SEV_HIGH);
				chargingGM.hitDamages = hitDamages;
				chargingGM.hitLocations = hitLocations;
				messages.push(chargingGM);
				
				// Both attacker and defender must make pilot skill +2 rolls to avoid falling in their new hex
				var chargingAttackModifier = 2;
				doPilotSkillRoll(mech, chargingAttackModifier);
				doPilotSkillRoll(mechObstacle, chargingAttackModifier);
				
				
				// Defender takes 1 point of damage per 10 attacker tons, times number of hexes moved by attacker. 
				// Damage is divided in 5-point damage groupings.
				var defenderDamage = Math.ceil((mech.tonnage / 10) * getSpeed(mech));
				// TODO: determine what should be the actual hit locations to use on the defender based on where attacked came from
				var defenderDamageResults = applyDamageGrouping(mechObstacle, defenderDamage, 5, FRONT_HIT_LOCATIONS);
				
				hitDamages = defenderDamageResults[0];
				hitLocations = defenderDamageResults[1];
			
				locText = getLocationArrayText(hitLocations);
				dmgText = getArrayText(hitDamages);
				
				var defenderStr = (playerMech == mechObstacle) ? "Your mech has been charged " : mechObstacle.chassis+" has been charged ";
				defenderStr += "taking "+ dmgText +" damage in the "+ locText+".";
				
				var gm = new WeaponFireGameMessage(mechObstacle, false, defenderStr, SEV_HIGH);
				gm.hitDamages = hitDamages;
				gm.hitLocations = hitLocations;
				messages.push(gm);
				
				return chargingGM;
			}
			else{
				// charge attack missed, attacker is displaced in the hex to the right or left of attacker forward arc
				var origHex = getHexAt(mech.location);
				
				var headingLeft = getRotateHeadingCCW(heading);
				var displacedLeft = getForwardCoords(mech.location, headingLeft);
				
				var headingRight = getRotateHeadingCW(heading);
				var displacedRight = getForwardCoords(mech.location, headingRight);
				
				// handle if the new displaced location cannot be entered, or if an existing mech is in that location
				var displacedHeading = null;
				if(displacedLeft.equals(mech.location)){
					// left is not possible, use right
					displacedHeading = headingRight;
				}
				else if(displacedRight.equals(mech.location)){
					// right is not possible, use left
					displacedHeading = headingLeft;
				}
				else{
					// randomly pick left or right
					var coinToss = (getDieRollTotal(1, 2) == 1);
					if(coinToss){
						displacedHeading = headingLeft;
					}
					else{
						displacedHeading = headingRight;
					}
				}
				
				var displacedLocation = handleDisplacement(mech, displacedHeading);
				commitMove(mech, displacedLocation, apRequired, jumping);
				
				var attackerStr = (playerMech == mech) ? "Your mech missed the charge." : mech.chassis+" missed the charge.";
				
				var gm = new MechChargingGameMessage(mech, true, attackerStr, SEV_HIGH);
				messages.push(gm);
				return gm;
			}
		}
	}
	
	if(jumping){
		var gm = new GameMessage(mech, false, (playerMech == mech) ? "You can not jump there, try another direction." : null, SEV_HIGH);
		messages.push(gm);
		return gm;
	}
	
	var gm = new GameMessage(mech, false, (playerMech == mech) ? "You can not move "+direction+", try another direction." : null, SEV_HIGH);
	messages.push(gm);
	return gm;
}

// handles displacement for any mech being displaced
function handleDisplacement(mech, displaceHeading){
	var displacedLocation = getForwardCoords(mech.location, displaceHeading);
	
	var origHex = getHexAt(mech.location);
	var displacedHex = getHexAt(displacedLocation);
	
	if(!displacedLocation.equals(mech.location) && displacedHex != null && origHex.elevation + 1 >= displacedHex.elevation){
		// looking for a mech present at the new location in case this triggers a domino effect
		var mechObstacle = getMechAt(displacedLocation);
		
		if(mechObstacle != null){
			var obstacleDisplacedLocation = handleDisplacement(mechObstacle, displaceHeading);
			
			if(obstacleDisplacedLocation == null){
				// mech obstacle couldn't displace, so neither will this unit
				displacedLocation = null;
			}
			else{
				// TODO: handle potentially being force displacement from accidental falls from above (>1 elevation level above)
			}
			
			// mech obstacle must make a pilot skill roll to avoid falling from domino effect
			doPilotSkillRoll(mechObstacle);
		}
	}
	else{
		// unit cannot be displaced
		displacedLocation = null;
	}
	
	if(displacedLocation != null){
		// unit displaced to new location
		mech.location = displacedLocation;
		
		var gm = new GameMessage(mech, false, (playerMech == mech) ? "You have been displaced." : mech.chassis+" has been displaced.", SEV_HIGH);
		messages.push(gm);
	}
	
	return displacedLocation;
}

function getForwardCoords(fromCoords, heading){
	var x = fromCoords.x;
	var y = fromCoords.y;
	
	var newXY = new Coords(x, y);
	switch(heading){
		case 0:
			if(y > 0){
				newXY = new Coords(x,y-1);
			}
			break;
			
		case 1:
			if(x % 2 == 0 && x < numHexCols - 1 && y > 0){
				newXY = new Coords(x+1,y-1);
			}
			else if(x % 2 != 0 && x < numHexCols - 1){
				newXY = new Coords(x+1,y);
			}
			break;
			
		case 2:
			if(x % 2 == 0 && x < numHexCols - 1){
				newXY = new Coords(x+1,y);
			}
			else if(x % 2 != 0 && x < numHexCols - 1 && y < numHexRows - 1){
				newXY = new Coords(x+1,y+1);
			}
			break;
			
		case 3:
			if(y < numHexRows - 1){
				newXY = new Coords(x,y+1);
			}
			break;
			
		case 4:
			if(x % 2 == 0 && x > 0){
				newXY = new Coords(x-1,y);
			}
			else if(x % 2 != 0 && x > 0 && y < numHexRows - 1){
				newXY = new Coords(x-1,y+1);
			}
			break;
			
		case 5:
			if(x % 2 == 0 && x > 0 && y > 0){
				newXY = new Coords(x-1,y-1);
			}
			else if(x % 2 != 0 && x > 0){
				newXY = new Coords(x-1,y);
			}
			break;
	}
	
	return newXY;
}

// gets the new hex x,y based on the backward heading and current hex x,y
function moveForward(mech, jumping){
	return move(mech, true, jumping);
}

// gets the new hex x,y based on the forward heading and current hex x,y
function moveBackward(mech){
	return move(mech, false, false);
}

// targets the nearest live enemy mech
function targetNearest(srcMech){
	var tgtMech = null;
	if(srcMech == null){
		srcMech = playerMech;
	}
	
	var enemyMechs = getEnemyMechsByRange(srcMech);
	
	if(enemyMechs.length == 0){
		tgtMech = null;
	}
	else{
		for(var i=0; i<enemyMechs.length; i++){
			if(enemyMechs[i] != null && !enemyMechs[i].isDestroyed()){
				tgtMech = enemyMechs[i];
				break;
			}
		}
	}
	
	if(playerMech == srcMech){
		// set the target for the player
		targetMech = tgtMech;
	}
	
	return tgtMech;
}

// targets the next enemy based on distance from mech
function targetNext(srcMech, tgtMech){
	if(srcMech == null){
		srcMech = playerMech;
		tgtMech = targetMech;
	}
	
	var enemyMechs = getEnemyMechsByRange(srcMech);
	
	if(enemyMechs.length == 0){
		tgtMech = null;
	}
	else if(tgtMech == null){
		tgtMech = enemyMechs[0];
	}
	else if(tgtMech != null && enemyMechs.length == 1){
		// keep current target
	}
	else{
		targetIndex = 0;
		for(var i=0; i<enemyMechs.length; i++){
			if(enemyMechs[i] == tgtMech){
				targetIndex = i;
				break;
			}
		}
		
		if(targetIndex == enemyMechs.length - 1)
			targetIndex = 0;
		else
			targetIndex ++;
			
		tgtMech = enemyMechs[targetIndex];
	}
	
	if(playerMech == srcMech){
		// set the target for the player
		targetMech = tgtMech;
	}
	
	return tgtMech;
}

// targets the previous enemy based on distance from mech
function targetPrevious(srcMech, tgtMech){
	if(srcMech == null){
		srcMech = playerMech;
		tgtMech = targetMech;
	}
	
	var enemyMechs = getEnemyMechsByRange(srcMech);
	
	if(enemyMechs.length == 0){
		tgtMech = null;
	}
	else if(tgtMech == null){
		tgtMech = enemyMechs[0];
	}
	else if(tgtMech != null && enemyMechs.length == 1){
		// keep current target
	}
	else{
		targetIndex = 0;
		for(var i=enemyMechs.length - 1; i>=0; i--){
			if(enemyMechs[i] == tgtMech){
				targetIndex = i;
				break;
			}
		}
		
		if(targetIndex == 0)
			targetIndex = enemyMechs.length - 1;
		else
			targetIndex --;
			
		tgtMech = enemyMechs[targetIndex];
	}
	
	if(playerMech == srcMech){
		// set the target for the player
		targetMech = tgtMech;
	}
	
	return tgtMech;
}

// returns shortened text of the hit location index
function getLocationText(index){
	var locText = "";
	switch(index){
		case HEAD:
			locText = "HD";
			break;
		case LEFT_ARM:
			locText = "LA";
			break;
		case LEFT_TORSO:
			locText = "LT";
			break;
		case CENTER_TORSO:
			locText = "CT";
			break;
		case RIGHT_TORSO:
			locText = "RT";
			break;
		case RIGHT_ARM:
			locText = "RA";
			break;
		case LEFT_LEG:
			locText = "LL";
			break;
		case RIGHT_LEG:
			locText = "RL";
			break;
		case LEFT_REAR:
			locText = "LTR";
			break;
		case CENTER_REAR:
			locText = "CTR";
			break;
		case RIGHT_REAR:
			locText = "RTR";
			break;
	}
	return locText;
}

// returns full name of the hit location index
function getLocationName(index){
	var locText = "";
	switch(index){
		case HEAD:
			locText = "Head";
			break;
		case LEFT_ARM:
			locText = "Left Arm";
			break;
		case LEFT_TORSO:
			locText = "Left Torso";
			break;
		case CENTER_TORSO:
			locText = "Center Torso";
			break;
		case RIGHT_TORSO:
			locText = "Right Torso";
			break;
		case RIGHT_ARM:
			locText = "Right Arm";
			break;
		case LEFT_LEG:
			locText = "Left Leg";
			break;
		case RIGHT_LEG:
			locText = "Right Leg";
			break;
		case LEFT_REAR:
			locText = "Left Torso Rear";
			break;
		case CENTER_REAR:
			locText = "Center Torso Rear";
			break;
		case RIGHT_REAR:
			locText = "Right Torso Rear";
			break;
	}
	return locText;
}

function getLocationArrayText(indexArr){
	var locText = "";
	for(var i=0; i<indexArr.length; i++){
		var thisLoc = getLocationText(indexArr[i]);
		
		locText += thisLoc;
		
		if(i < indexArr.length - 1)
			locText += ",";
	}
	
	return locText;
}

function getArrayText(arr){
	var arrText = "";
	for(var i=0; i<arr.length; i++){
		arrText += arr[i];
		
		if(i < arr.length - 1)
			arrText += ",";
	}
	
	return arrText;
}

// gets the heading text based on the heading
function getHeadingText(heading){
	var headingText = "";
	
	switch(heading){
		case 0:
			headingText+="N";
			break;
			
		case 1:
			headingText+="NE";
			break;
			
		case 2:
			headingText+="SE";
			break;
			
		case 3:
			headingText+="S";
			break;
			
		case 4:
			headingText+="SW";
			break;
			
		case 5:
			headingText+="NW";
			break;
	}
	
	return headingText;
}

// returns messages in an array based on the messageReadIndex
function getUnreadMessages(){
	var unreadMessages = [];

	for(var i=messageReadIndex + 1; i<messages.length; i++){
		var thisMessage = messages[i];
		unreadMessages.push(thisMessage);
	}
	
	messageReadIndex = messages.length - 1;
	
	return unreadMessages;
}


// determines mech speed based on the number of hex distances moved over the previous turn (used for toHit %)
function getSpeed(mech){
	var speed = 0;

	var prevCoord = null;
	var numMoves = mech.movement.length;
	//debug.log("total moves:"+numMoves);
	
	for(var i=0; i<numMoves; i++){
		var thisMove = mech.movement[i];
		
		if(thisMove.cooldown <= -1)
			continue;
	
		var thisCoord = thisMove.c;
		
		if(prevCoord != null){
			speed += getRange(thisCoord, prevCoord);
		}
			
		//debug.log("    spd:"+speed+" @ X"+(thisCoord.x+1)+", Y"+(thisCoord.y+1));
		
		prevCoord = thisCoord;
	}
	
	return speed;
}

// just a roll of the dice
function rollDice(numDie, numSides){
	//defaults to 2 dice with 6 sides
	if (!numDie) numDie = 2;
	if (!numSides) numSides = 6;
	
	//results of the dice rolls
	var results = [];
	
	for(var i=0; i<numDie; i++){
		//generate a random number between 1 and the number of sides
		results[i] = Math.floor( (Math.random()*numSides) +1 );
	}

	return results;
}

// adds the resulting number of die together for you
function getDieRollTotal(numDie, numSides){
	var results = rollDice(numDie, numSides);
	
	var total = 0;
	for(var i=0; i<results.length; i++){
		total += results[i];
	}
	
	return total;
}


/**
 * generates all possible hex moves for the given mech based on its AP 
 * returns an array of arrays and SortObjects containing the hex location as Obj 
 * and AP remaining from moving there as Value
 * @param storePathing set true to include a .pathing array in each Coords object indicating how to get to that location
 * @param numAhead set an integer less than 3 for the number of turns to look into the future (do NOT set 3 or higher, it can trigger the max number of threads for some browsers!)
 */
function getAllValidMovesAP(mech, storePathing, numAhead){
	var hexMoves = [];
	
	if(mech.actionPoints == 0){
		// no moves are possible
		return hexMoves;
	}
	
	var numCurrent = 1;
	if(numAhead == null){
		numAhead = 0;
	}
	
	// sending these along so they only have to be calculated once
	var maxMechAP = getMechAP(mech);
	var walkMPReduce = getReduceWalkMP(mech);
	var walkMPThisTurn = mech.walkMP - walkMPReduce;
	
	//debug.log("Starting valid moves search from ["+mech.location.x+","+mech.location.y+"], heading="+mech.heading);
	
	// mostly for consideration by the bot, add in the current position and heading
	var currentCoords = new Coords(mech.location.x, mech.location.y);
	currentCoords.heading = mech.heading;
	
	var rotObject = new SortObject(currentCoords, mech.actionPoints);
	hexMoves.push(rotObject);
	
	// send off to the recursive method
	generateValidMoves(currentCoords, currentCoords.heading, walkMPThisTurn, maxMechAP, mech.actionPoints, hexMoves, storePathing, numAhead, numCurrent);
	
	// sort by AP to get to each hex
	hexMoves.sort(sortObjectCompare);
	
	return hexMoves;
}

/**
 * recursion method used by getAllValidMovesAP
 */
function generateValidMoves(fromCoords, heading, walkMP, maxAP, remainAP, hexMoves, storePathing, numAhead, numCurrent){
	if(remainAP == 0){
		if(numAhead > 0 && numCurrent < numAhead + 1){
			// start generating moves from this location as if it were the next turn's starting point
			generateValidMoves(fromCoords, heading, walkMP, maxAP, maxAP, hexMoves, storePathing, numAhead, numCurrent + 1);
		}
		
		return;
	}
	
	// indicates whether each coord should also contain a .pathing array of coords used to get there
	var includePathing = (storePathing != null) ? storePathing : false;
	
	//debug.log("Generating moves from ["+fromCoords.x+","+fromCoords.y+"], heading="+heading+", remainAP="+remainAP);
	
	var leftHeading = getRotateHeadingCCW(heading);
	var leftHeadingX2 = getRotateHeadingCCW(leftHeading);
	
	var rightHeading = getRotateHeadingCW(heading);
	var rightHeadingX2 = getRotateHeadingCW(rightHeading);
	
	var oppositeHeading = (heading + 3) % 6;	// indicates a 180 degree turn then forward move
	var backwardHeading = 6;					// indicates a walk backward move in same heading
	
	// cycle through each potential heading
	for(var i=0; i<=6; i++){
		var rotateAP = 0;
		var actualHeading = i;
		
		switch(i){
			case heading:
				rotateAP = 0;
				break;
			
			case leftHeading:
			case rightHeading:
				rotateAP = 1;
				break;
								
			case leftHeadingX2:
			case rightHeadingX2:
				rotateAP = 2;
				break;
			
			case oppositeHeading:
				rotateAP = 3;
				break;
			
			case backwardHeading:
				rotateAP = 0;
				actualHeading = heading;
				break;
		}
		
		//debug.log("    Trying heading "+rotateHeading+" from ["+fromCoords.x+","+fromCoords.y+"]");
		
		// if enough AP, add just the rotation in the current hex as a valid move as well (mostly just for bot consideration)
		if(rotateAP > 0 && rotateAP <= remainAP){
			var rotateInPlaceCoords = new Coords(fromCoords.x, fromCoords.y);
			rotateInPlaceCoords.heading = actualHeading;
			
			if(includePathing){
				if(fromCoords.pathing == null){
					rotateInPlaceCoords.pathing = [];
				}
				else{
					rotateInPlaceCoords.pathing = fromCoords.pathing.getCopy();
				}
				
				rotateInPlaceCoords.pathing.push(fromCoords);
			}
			
			var postMoveAP = (remainAP - rotateAP);
			if(numCurrent > 1){
				// account for future turns by making this a potentially negative number
				postMoveAP -= (maxAP * (numCurrent - 1));
			}
			
			var rotObject = new SortObject(rotateInPlaceCoords, postMoveAP);
			hexMoves.push(rotObject);
		}
		
		// try forward from this heading
		var headingCoords = getForwardCoords(fromCoords, (i == backwardHeading) ? oppositeHeading : i);
		var hexAvailable = isHexAvailable(headingCoords);
		
		if(!hexAvailable || headingCoords.equals(fromCoords)){
			// moving there not possible
			//debug.log("        Not possible");
		}
		else{
			var apRequired = getHexRequiredAP(fromCoords, headingCoords);
			if(apRequired > maxAP 
					&& walkMP >= 2
					&& apRequired == maxAP + 1){
				// if a mech wants to move to a location that requires more than its max AP (only if walkMP >= 2) 
				// lets allow it, but make it require the full amount of AP and only up to one additional AP
				apRequired = maxAP;
			}
			
			if(apRequired != -1){
				// add in AP from rotating to head towards the hex
				apRequired += rotateAP;
			}
			
			if(backwardHeading == i 
					&& remainAP - apRequired < (maxAP * 1/3)){
				// not allowed to move backwards if it would incur running
				apRequired = -1;
			}
			
			//debug.log("        apRequired="+apRequired);
			
			if(apRequired == -1 || apRequired > remainAP){
				// moving there not possible
				//debug.log("        Not possible");
			}
			else{
				// add this as a possible move, then go recursive on it
				//debug.log("            Moving further...");
				headingCoords.heading = actualHeading;
				
				if(includePathing){
					if(fromCoords.pathing == null){
						headingCoords.pathing = [];
					}
					else{
						headingCoords.pathing = fromCoords.pathing.getCopy();
					}
					
					headingCoords.pathing.push(fromCoords);
				}
				
				var postMoveAP = (remainAP - apRequired);
				if(numCurrent > 1){
					// account for future turns by making this a potentially negative number
					postMoveAP -= (maxAP * (numCurrent - 1));
				}
				
				var moveObject = new SortObject(headingCoords, postMoveAP);
				hexMoves.push(moveObject);
				
				generateValidMoves(headingCoords, actualHeading, walkMP, maxAP, (remainAP - apRequired), hexMoves, storePathing, numAhead, numCurrent);
			}
		}
	}
}


// gets the hex range from the source to the target
var rangeCache = [];
function getRange(sourceC, targetC){
	// based off of
	// http://www.rossmack.com/ab/RPG/traveller/AstroHexDistance.asp
	// since I'm too lazy to make my own
	
	if(sourceC == null || targetC == null)	return -1;
	
	// check the cache
	var srcKey = sourceC.getCacheKey();
	var tgtKey = targetC.getCacheKey();
	
	var srcCache = rangeCache[srcKey];
	var tgtCache = rangeCache[tgtKey];

	if(srcCache != null && srcCache[tgtKey] != null){
		// use source cache 
		//debug.log("used source cache @ "+sourceC.x+","+sourceC.y+"->"+targetC.x+","+targetC.y+" = "+srcCache[tgtKey]);
		return srcCache[tgtKey];
	}
	else if(tgtCache != null && tgtCache[srcKey] != null){
		// use target cache
		//debug.log("used target cache @ "+sourceC.x+","+sourceC.y+"->"+targetC.x+","+targetC.y+" = "+tgtCache[srcKey]);
		return tgtCache[srcKey];
	}
	
	var xd, ym, ymin, ymax, yo;
	xd = Math.abs(sourceC.x - targetC.x);
	yo = Math.floor(xd / 2) + (!sourceC.isXOdd() && targetC.isXOdd() ? 1 : 0);
	ymin = sourceC.y - yo;
	ymax = ymin + xd;
	ym = 0;
	if (targetC.y < ymin) {
		ym = ymin - targetC.y;
	}
	if (targetC.y > ymax) {
		ym = targetC.y - ymax;
	}
	
	var range = xd + ym;
	
	// add to cache from both src and tgt sides
	if(srcCache == null){
		srcCache = [];
	}
	
	if(tgtCache == null){
		tgtCache = [];
	}
	
	srcCache[tgtKey] = range;
	tgtCache[srcKey] = range;
	
	rangeCache[srcKey] = srcCache;
	rangeCache[tgtKey] = tgtCache;
	
	if(isPlayerTurn()){
		//debug.log("store source/target cache @ "+sourceC.x+","+sourceC.y+"->"+targetC.x+","+targetC.y+" = "+srcCache[tgtKey]);
		//debug.log("    cacheLength:"+rangeCache.length);
		//debug.log("    srcLength:"+srcCache.length);
		//debug.log("    tgtLength:"+tgtCache.length);
	}
	
	return range;
}

// some classes and constants based off those of the same name in MegaMek (Coords.java, IdealHex.java)
var HEXSIDE = Math.PI / 3.0;
var XCONST = Math.tan(Math.PI / 6.0);
// used for turns()
var LEFT = 1;
var STRAIGHT = 0;
var RIGHT = -1;

var IdealHex = Class.create({
	initialize: function(c) {
		// determine origin
		var ox = c.x * XCONST * 3;
		var oy = c.y * 2 + (c.isXOdd() ? 1 : 0);
		
		// center
		this.cx = ox + (XCONST * 2);
		this.cy = oy + 1;
		
		this.x = [];
		this.y = [];
		
		this.x[0] = ox + XCONST;
        this.x[1] = ox + (XCONST * 3);
        this.x[2] = ox + (XCONST * 4);
        this.x[3] = this.x[1];
        this.x[4] = this.x[0];
        this.x[5] = ox;
                
        this.y[0] = oy;
        this.y[1] = oy;
        this.y[2] = this.cy;
        this.y[3] = oy + 2;
        this.y[4] = this.y[3];
        this.y[5] = this.y[2];
	},
	
	/**
	 * Returns true if this hex is intersected by the line
	 */
	isIntersectedBy: function(x0, y0, x1, y1) {
		var side1 = parseInt(turns(x0, y0, x1, y1, this.x[0], this.y[0]));
		if (side1 == STRAIGHT) {
			return true;
		}
		for (var i = 1; i < 6; i++) {
			var j =  parseInt(turns(x0, y0, x1, y1, this.x[i], this.y[i]));
			if (j == STRAIGHT || j != side1) {
				return true;
			}
		}
		return false;
	}
});


/**
 * Tests whether a line intersects a point or the point passes
 * to the left or right of the line.
 *
 * Deals with floating point imprecision.  Thx deadeye00 (Derek Evans)
 */
function turns(x0, y0, x1, y1, x2, y2) {
	var cross = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
	return ((cross > 0.000001) ? LEFT : ((cross < -0.000001) ? RIGHT : STRAIGHT));
}

/**
 * Returns the absolute direction in which another coordinate lies; 0 if
 * the coordinates are equal.
 *
 * based off of the same method from MegaMek (Coords.java)
 */
function getDirection(sourceC, targetC){
	return parseInt(Math.round(radian(sourceC, targetC) / HEXSIDE)) % 6;
}

/**
 * Returns the radian direction of another Coords.
 *
 * based off of the same method from MegaMek (Coords.java)
 */
function radian(sourceC, targetC){
	var src = new IdealHex(sourceC);
	var dst = new IdealHex(targetC);

	// don't divide by 0
	if (src.cy == dst.cy) {
		return (src.cx < dst.cx) ? Math.PI / 2 : Math.PI * 1.5;
	}

	var r = Math.atan((dst.cx - src.cx) / (src.cy - dst.cy));
	// flip if we're upside down
	if (src.cy < dst.cy) {
		r = (r + Math.PI) % (Math.PI * 2);
	}
	// account for negative angles
	if (r < 0) {
		r += Math.PI * 2;
	}

	return r;
}

/**
 * Returns the degree direction of another Coords.
 * based off of the same method from MegaMek (Coords.java)
 */
function getDegree(sourceC, targetC){
	return parseInt(Math.round((180 / Math.PI) * radian(sourceC, targetC)));
}

/**
 * Returns a LosEffects object representing the LOS effects of interveing
 * terrain between the attacker and target.
 *
 * Checks to see if the attacker and target are at an angle where the LOS
 * line will pass between two hexes.  If so, calls losDivided, otherwise 
 * calls losStraight.
 *
 * based off of the same method from MegaMek (Compute.java)
 */
function calculateLos(sourceC, targetC) {

	if (sourceC == null || targetC == null) {
		var los = new LosEffects();
		los.blocked = true;
		return los;
	}
	
	var degree = getDegree(sourceC, targetC);
	if (degree % 60 == 30) {
		return losDivided(sourceC, targetC);
	} else {
		return losStraight(sourceC, targetC);
	}
}

/**
 * Returns LosEffects for a line that never passes exactly between two 
 * hexes.  Since intervening() returns all the coordinates, we just
 * add the effects of all those hexes.
 *
 * based off of the same method from MegaMek (Compute.java)
 */
function losStraight(sourceC, targetC) {
	var interveningCoords = intervening(sourceC, targetC);
	
	var los = new LosEffects();

	for (var i = 0; i < interveningCoords.length; i++) {
		los.add( losForCoords(sourceC, targetC, interveningCoords[i]) );
	}

	return los;
}

/**
 * Returns an array of the Coords of hexes that are crossed by a straight 
 * line from the center of src to the center of dest, including src & dest.
 *
 * The returned coordinates are in line order, and if the line passes
 * directly between two hexes, it returns them both.
 *
 * Based on the degree of the angle, the next hex is going to be one of
 * three hexes.  We check those three hexes, sides first, add the first one 
 * that intersects and continue from there.
 *
 * Based off of some of the formulas at Amit's game programming site.
 * (http://www-cs-students.stanford.edu/~amitp/gameprog.html)
 *
 * based off of the same method from MegaMek (Compute.java)
 */
function intervening(srcCoord, destCoord) {
	var iSrc = new IdealHex(srcCoord);
	var iDest = new IdealHex(destCoord);
	
	var directions = [];
	directions[2] = srcCoord.direction(destCoord); // center last
	directions[1] = (directions[2] + 5) % 6;
	directions[0] = (directions[2] + 1) % 6;
	
	var hexes = [];
	var currentCoord = srcCoord;
	
	hexes.push(currentCoord);
	while(!destCoord.equals(currentCoord)) {
		currentCoord = nextHex(currentCoord, iSrc, iDest, directions);
		hexes.push(currentCoord);
	}

	return hexes;
}

    
/**
 * Returns the first further hex found along the line from the centers of
 * src to dest.  Checks the three directions given and returns the closest.
 *
 * This relies on the side directions being given first.  If it checked the
 * center first, it would end up missing the side hexes sometimes.
 *
 * Not the most elegant solution, but it works.
 *
 * based off of the same method from MegaMek (Compute.java)
 */
function nextHex(currentCoord, iSrc, iDest, directions) {
	for (var i = 0; i < directions.length; i++) {
		var testing = currentCoord.translated(directions[i]);
		
		var testIdealHex = new IdealHex(testing);
		
		if (testIdealHex.isIntersectedBy(iSrc.cx, iSrc.cy, iDest.cx, iDest.cy)) {
			return testing;
		}
	}
	// if we're here then something's fishy!
	throw new RuntimeException("Couldn't find the next hex!");
}

/**
 * Returns LosEffects for a line that passes between two hexes at least
 * once.  The rules say that this situation is resolved in favor of the
 * defender.
 *
 * The intervening() function returns both hexes in these circumstances,
 * and, when they are in line order, it's not hard to figure out which hexes 
 * are split and which are not.
 *
 * The line always looks like:
 *       ___     ___
 *   ___/ 1 \___/...\___
 *  / 0 \___/ 3 \___/etc\
 *  \___/ 2 \___/...\___/
 *      \___/   \___/
 *
 * We go thru and figure out the modifiers for the non-split hexes first.
 * Then we go to each of the two split hexes and determine which gives us
 * the bigger modifier.  We use the bigger modifier.
 *
 * This is not perfect as it takes partial cover as soon as it can, when
 * perhaps later might be better.
 * Also, it doesn't account for the fact that attacker partial cover blocks
 * leg weapons, as we want to return the same sequence regardless of
 * what weapon is attacking.
 *
 * based off of the same method from MegaMek (Compute.java)
 */
function losDivided(sourceC, targetC) {
	var interveningCoords = intervening(sourceC, targetC);
	
	var los = new LosEffects();
	
	var sourceHex = getHexAt(sourceC);
	var targetHex = getHexAt(targetC);
	
	//TODO: something needed for elevation difference?
	var isElevDiff = ( sourceHex.elevation != targetHex.elevation );

	// add non-divided line segments
	for (var i = 3; i < interveningCoords.length - 2; i += 3) {
		los.add( losForCoords(sourceC, targetC, interveningCoords[i]) );
	}
	
	// if blocked already, return that
	var losMods = losModifiers(los);
	if (getSumModifiers(losMods) == -1) {
		return los;
	}
	
	// go through divided line segments
	for (var i = 1; i < interveningCoords.length - 2; i += 3) {
		// get effects of each side
		var left = losForCoords( sourceC, targetC, interveningCoords[i] );
		var right = losForCoords( sourceC, targetC, interveningCoords[i+1] );

		// Include all previous LOS effects.
		left.add(los);
		right.add(los);

		// which is better?
		var lMods = losModifiers(left);
		var rMods = losModifiers(right);
		
		var lVal = getSumModifiers(lMods);
		var rVal = getSumModifiers(rMods);
		
		if (lVal > rVal || (lVal == rVal && left.attackerCover == 1)) {
			los = left;
		} else {
			los = right;
		}
	}
	
	return los;
}

/**
 * Returns a LosEffects object representing the LOS effects of anything at
 * the specified coordinate.  
 *
 * based off of the same method from MegaMek (Compute.java)
 */
function losForCoords(sourceC, targetC, thisCoord) {
	var los = new LosEffects();        

	// ignore hexes the attacker or target are in
	if ( thisCoord.equals(sourceC) ||
		 thisCoord.equals(targetC) ) {
		return los;
	}
	
	var sourceHex = getHexAt(sourceC);
	var targetHex = getHexAt(targetC);
	var thisHex = getHexAt(thisCoord);
	
	if(thisHex == null){
		return los;
	}
	
	// set up elevations
	var srcEl = sourceHex.elevation + 1;	//TODO: the +1 for source represents it is standing, prone would be +0
	var targEl = targetHex.elevation + 1;	//TODO: the +1 for target represents it is standing, prone would be +0
	var hexEl = thisHex.elevation;
	
	// TODO: buildings?
	var bldgEl = 0;

	// check for block by terrain
	if ((hexEl + bldgEl > srcEl && hexEl + bldgEl > targEl)
			|| (hexEl + bldgEl > srcEl && sourceC.distance(thisCoord) == 1)
			|| (hexEl + bldgEl > targEl && targetC.distance(thisCoord) == 1)) {
		los.blocked = true;
	}

	// check for woods or smoke
	if ((hexEl + 2 > srcEl && hexEl + 2 > targEl)
			|| (hexEl + 2 > srcEl && sourceC.distance(thisCoord) == 1)
			|| (hexEl + 2 > targEl && targetC.distance(thisCoord) == 1)) {
		// smoke overrides any woods in the hex
		if (false) {
			//TODO: implement smoke
			los.smoke++;
		} 
		else if (thisHex instanceof TreeHex) {
			los.lightWoods++;
		} 
		else if (thisHex instanceof HeavyTreeHex) {
			los.heavyWoods++;
		}
	}
	
	//debug.log("los through: "+"["+(thisCoord.x+1)+","+(thisCoord.y+1)+"]");
	
	// check for target partial cover
	if (targetC.distance(thisCoord) == 1 &&
			hexEl + bldgEl == targEl &&
			srcEl <= targEl) {
			//srcEl <= targEl && target.getHeight() > 0) {	// TODO: implement height 0 as prone
		//debug.log("    target cover!");
		los.targetCover = true;
	}

	// check for attacker partial cover
	if (sourceC.distance(thisCoord) == 1 &&
			hexEl + bldgEl == srcEl &&
			srcEl >= targEl) {
			//srcEl >= targEl && ae.height() > 0) {			// TODO: implement height 0 as prone
		//debug.log("    source cover!");
		los.attackerCover = true;
	}
	
	return los;
}

/**
 * Returns ToHitData indicating the modifiers to fire for the specified
 * LOS effects data.
 *
 * based off of the same method from MegaMek (Compute.java)
 */
function losModifiers(los) {
	
	var losMods = [];

	if (los.blocked) {
		losMods.push(new Modifier(MODIFIER_IMPOSSIBLE, AUTO_MISS));	//"LOS blocked by terrain."
		return losMods;
	}
	
	if (los.lightWoods + (los.heavyWoods * 2) > 2) {
		losMods.push(new Modifier(MODIFIER_IMPOSSIBLE, AUTO_MISS));	//"LOS blocked by woods."
		return losMods;
	}
	
	if (los.smoke > 1) {
		losMods.push(new Modifier(MODIFIER_IMPOSSIBLE, AUTO_MISS));	//"LOS blocked by smoke."
		return losMods;
	}
	
	if (los.smoke == 1) {
		if (los.lightWoods + los.heavyWoods > 0) {
			losMods.push(new Modifier(MODIFIER_IMPOSSIBLE, AUTO_MISS));	//"LOS blocked by smoke and woods."
			return losMods;
		} else {
			//modifiers.addModifier(2, "intervening smoke");		// TODO: smoke modifier
		}
	}
	
	if (los.lightWoods > 0) {
		losMods.push(new Modifier(MODIFIER_LIGHT_WOODS, los.lightWoods));	//.addModifier(los.lightWoods, los.lightWoods + " intervening light woods");
	}
	
	if (los.heavyWoods > 0) {
		losMods.push(new Modifier(MODIFIER_HEAVY_WOODS, los.heavyWoods));	//.addModifier(los.heavyWoods * 2, los.heavyWoods + " intervening heavy woods");
	}
	
	if (los.targetCover) {
		losMods.push(new Modifier(MODIFIER_PARTIAL_COVER, 1));	//.addModifier(1, "target has partial cover");
	}
	
	return losMods;
}

// returns the sum of the modifiers of a given Modifier object array
function getSumModifiers(mods){
	if(mods == null || mods.length == 0){
		return 0;
	}
	
	var sum = 0;
	for(var i=0; i<mods.length; i++){
		var thisModifier = mods[i];
		sum += thisModifier.getValue();
	}
	
	return sum;
}

 
/**
 * Modifier to attacks due to attacker terrain
 *
 * based off of the same method from MegaMek (Compute.java)
 */
function getAttackerTerrainModifier(location) {
	var hex = getHexAt(location);

	var toHitMods = [];
	if (hex instanceof WaterHex){
		// attacker is in the water and not hovering
		toHitMods.push(new Modifier(MODIFIER_WATER, 1));
	}
	
	return toHitMods;
}
    
/**
 * Modifier to attacks due to target terrain
 *
 * based off of the same method from MegaMek (Compute.java)
 */
function getTargetTerrainModifier(location) {
	var hex = getHexAt(location);

	var toHitMods = [];
	
	// TODO: you don't get terrain modifiers in midair
	/*if (entityTarget != null && entityTarget.isMakingDfa()) {
		return new ToHitData();
	}*/
	
	if (hex instanceof WaterHex) {
		// target is in the water and not hovering
		toHitMods.push(new Modifier(MODIFIER_TARGET_WATER, 1));
	}

	/*if (hex.contains(Terrain.SMOKE)) {
		toHit.addModifier(2, "target in smoke");
	}*/
	if (hex instanceof TreeHex) {
		//target in light woods
		toHitMods.push(new Modifier(MODIFIER_LIGHT_WOODS, 1));
	} 
	else if (hex instanceof HeavyTreeHex) {
		//target in heavy woods
		toHitMods.push(new Modifier(MODIFIER_HEAVY_WOODS, 2));
	}
	
	return toHitMods;
}

    
/**
 * Returns the x parameter of the coordinates in the direction
 *
 * based off of the same method from MegaMek (Coords.java)
 */
function xInDirection(x, y, direction) {
	 switch (direction) {
		 case 1 :
		 case 2 :
			 return x + 1;
		 case 4 :
		 case 5 :
			 return x - 1;
		 default :
			 return x;
	 }
}

/**
 * Returns the y parameter of the coordinates in the direction
 *
 * based off of the same method from MegaMek (Coords.java)
 */
function yInDirection(x, y, direction) {
	switch (direction) {
		case 0 : 
			return y - 1;
		case 1 : 
		case 5 :
			return y - ((x + 1) & 1);
		case 2 : 
		case 4 : 
			return y + (x & 1);
		case 3 : 
			return y + 1;
		default :
			return y;
	}
}

/* MapSettings variables from MegaMek (MapSettings.java) */

/** how much hills there should be, Range 0..99 */
var map_hilliness = 40;
/** how many elevation levels will be flattened to elevation 0 */
var map_flatElevation = 1;
/** how much cliffs should there be, range 0-100 (% chance for each cliff candidate) */
var map_cliffs = 0;
/** Maximum difference between highest elevation and lowest sink */
var map_range = 4;
/** Probabiltity for inversion of the map, Range 0..100 */
var map_probInvert = 5;
var map_invertNegativeTerrain = 1;
/** which landscape generation Algortihm to use */
/** atm there are 2 different: 0= first, 1=second */
var map_algorithmToUse = 0;

/** how much Lakes at least */
var map_minWaterSpots = 1;
/** how much Lakes at most */
var map_maxWaterSpots = 3;
/** minimum size of a lake */
var map_minWaterSize = 5;
/** maximum Size of a lake */
var map_maxWaterSize = 10;
/** probability for water deeper than lvl1, Range 0..100 */
var map_probDeep = 33;

/** probability for a river, range 0..100 */
var map_probRiver = 0;

/** how much forests at least */
var map_minForestSpots = 3;
/** how much forests at most */
var map_maxForestSpots = 8;
/** minimum size of a forest */
var map_minForestSize = 4;
/** maximum Size of a forest */
var map_maxForestSize = 12;
/** probability for heavy woods, Range 0..100 */
var map_probHeavy = 30;

/** how much rough spots at least */
var map_minRoughSpots = 2;
/** how much rough spots at most */
var map_maxRoughSpots = 10;
/** minimum size of a rough spot */
var map_minRoughSize = 1;
/** maximum Size of a rough spot */
var map_maxRoughSize = 2;

var map_mountainPeaks = 0;
var map_mountainWidthMin = 7;
var map_mountainWidthMax = 20;
var map_mountainHeightMin = 5;
var map_mountainHeightMax = 8;
var map_mountainStyle = 0;//MOUNTAIN_PLAIN;

/**
 * Generates a random board
 * 
 * based off of the generateRandom method from MegaMek (BoardUtilities.java)
 */
function generateRandomBoard(cols, rows) {
	numHexCols = cols;
	numHexRows = rows;
	
	hexMap = [];
	for(var y=0; y<numHexRows; y++){
		var thisHexRow = [];
	
		for(var x=0; x<numHexCols; x++){
            var thisHex = new Hex();
			thisHexRow[x] = thisHex;
		}
		
		hexMap[y] = thisHexRow;
	}
	
	var sizeScale = (numHexCols * numHexRows) / (16 * 17);
	
	generateElevation(map_hilliness, numHexCols, numHexRows, 
			map_range + 1, map_probInvert, map_invertNegativeTerrain,
			map_algorithmToUse);

	
	// TODO: add mountain
    var peaks = map_mountainPeaks;
    while (peaks > 0) {
        peaks--;
        var mountainHeight = map_mountainHeightMin
                + randomInt(1 + map_mountainHeightMax
                        - map_mountainHeightMin);
        var mountainWidth = map_mountainWidthMin
                + randomInt(1 + map_mountainWidthMax
                        - map_mountainWidthMin);
        var mapWidth = numHexCols;
        var mapHeight = numHexRows;

        // put the peak somewhere in the middle of the map...
        var peak = new Coords(mapWidth / 4
                + randomInt((mapWidth + 1) / 2), mapHeight / 4
                + randomInt((mapHeight + 1) / 2));

        //generateMountain(mountainWidth, peak, mountainHeight, map_mountainStyle);
    }

    // TODO: addCliffs
    if (map_cliffs > 0) {
        //addCliffs(result, map_cliffs);
    }

    /* Add the woods */
    var count = map_minForestSpots;
    if (map_maxForestSpots > 0) {
        count += randomInt(map_maxForestSpots);
    }
    count *= sizeScale;
    for (var i = 0; i < count; i++) {
        placeSomeTerrain(TREE_TYPE, map_probHeavy, 
        		map_minForestSize, map_maxForestSize, true);
    }
    
    /* Add the rough */
    count = map_minRoughSpots;
    if (map_maxRoughSpots > 0) {
        count += randomInt(map_maxRoughSpots);
    }
    count *= sizeScale;
    for (var i = 0; i < count; i++) {
        placeSomeTerrain(ROCK_TYPE, 0, 
        		map_minRoughSize, map_maxRoughSize,  true);
    }
    
    /* Add the sand */
    /*count = mapSettings.getMinSandSpots();
    if (mapSettings.getMaxSandSpots() > 0) {
        count += randomInt(mapSettings.getMaxSandSpots());
    }
    count *= sizeScale;
    for (int i = 0; i < count; i++) {
        placeSomeTerrain(result, Terrains.SAND, 0, mapSettings
                .getMinSandSize(), mapSettings.getMaxSandSize(),
                true);
    }*/
    
    /* Add the planted field */
    /*count = mapSettings.getMinPlantedFieldSpots();
    if (mapSettings.getMaxPlantedFieldSpots() > 0) {
        count += randomInt(mapSettings.getMaxPlantedFieldSpots());
    }
    count *= sizeScale;
    for (int i = 0; i < count; i++) {
        placeSomeTerrain(result, Terrains.FIELDS, 0, mapSettings
                .getMinPlantedFieldSize(), mapSettings.getMaxPlantedFieldSize(),
                true);
    }*/
    
    /* Add the swamp */
    /*count = mapSettings.getMinSwampSpots();
    if (mapSettings.getMaxSwampSpots() > 0) {
        count += randomInt(mapSettings.getMaxSwampSpots());
    }
    count *= sizeScale;
    for (int i = 0; i < count; i++) {
        placeSomeTerrain(result, Terrains.SWAMP, 0, mapSettings
                .getMinSwampSize(), mapSettings.getMaxSwampSize(),
                false); // can stack with woods or roughs
    }*/

    // Add the Fortified hexes
    /*count = mapSettings.getMinFortifiedSpots();
    if (mapSettings.getMaxFortifiedSpots() > 0) {
        count += randomInt(mapSettings.getMaxFortifiedSpots());
    }
    count *= sizeScale;
    for (int i = 0; i < count; i++) {
        placeSomeTerrain(result, Terrains.FORTIFIED, 0, mapSettings
                .getMinFortifiedSize(), mapSettings.getMaxFortifiedSize(),
                false);
    }*/

    // Add the rubble
    /*count = mapSettings.getMinRubbleSpots();
    if (mapSettings.getMaxRubbleSpots() > 0) {
        count += randomInt(mapSettings.getMaxRubbleSpots());
    }
    count *= sizeScale;
    for (var i = 0; i < count; i++) {
        placeSomeTerrain(result, Terrains.RUBBLE, 0, mapSettings
                .getMinRubbleSize(), mapSettings.getMaxRubbleSize(),
                true);
    }*/

    /* Add the water */
    count = map_minWaterSpots;
    if (map_maxWaterSpots > 0) {
        count += randomInt(map_maxWaterSpots);
    }
    count *= sizeScale;
    for (var i = 0; i < count; i++) {
        placeSomeTerrain(WATER_TYPE, map_probDeep,
        		map_minWaterSize, map_maxWaterSize, true);
    }
    /* Add the pavements */
    /*count = mapSettings.getMinPavementSpots();
    if (mapSettings.getMaxPavementSpots() > 0) {
        count += randomInt(mapSettings.getMaxPavementSpots());
    }
    count *= sizeScale;
    for (int i = 0; i < count; i++) {
        placeSomeTerrain(result, Terrains.PAVEMENT, 0, mapSettings
                .getMinPavementSize(), mapSettings.getMaxPavementSize(),
                true);
    }*/

    /* Add the ice */
    /*count = mapSettings.getMinIceSpots();
    if (mapSettings.getMaxIceSpots() > 0) {
        count += randomInt(mapSettings.getMaxIceSpots());
    }
    count *= sizeScale;
    for (int i = 0; i < count; i++) {
        placeSomeTerrain(result, Terrains.ICE, 0, mapSettings
                .getMinIceSize(), mapSettings.getMaxIceSize(),
                true);
    }*/

    /* TODO: Add the craters */
    /*if (randomInt(100) < mapSettings.getProbCrater()) {
        addCraters(result, mapSettings.getMinRadius(), mapSettings
                .getMaxRadius(),
                (int) (mapSettings.getMinCraters() * sizeScale),
                (int) (mapSettings.getMaxCraters() * sizeScale));
    }*/

    /* TODO: Add the river */
    if (randomInt(100) < map_probRiver) {
        //addRiver();
    }

    /* Add special effects */
    /*
    if (randomInt(100) < mapSettings.getProbFlood()) {
        postProcessFlood(nb, mapSettings.getFxMod());
    }
    if (randomInt(100) < mapSettings.getProbDrought()) {
        postProcessDrought(nb, mapSettings.getFxMod());
    }
    if (randomInt(100) < mapSettings.getProbFreeze()) {
        postProcessDeepFreeze(nb, mapSettings.getFxMod());
    }
    if (randomInt(100) < mapSettings.getProbForestFire()) {
        postProcessForestFire(nb, mapSettings.getFxMod());
    }*/

    // Add the road
    /*boolean roadNeeded = false;
    if (randomInt(100) < mapSettings.getProbRoad()) {
        roadNeeded = true;
    }*/

    // add buildings
    /*ArrayList<BuildingTemplate> buildings = mapSettings.getBoardBuildings();
    CityBuilder cityBuilder = new CityBuilder(mapSettings, result);
    if (buildings.size() == 0) {
        buildings = cityBuilder.generateCity(roadNeeded);
    }
    for (int i = 0; i < buildings.size(); i++) {
        placeBuilding(result, (buildings.get(i)));
    }*/
}

/**
 * Generates the elevations
 * 
 * based off o the method of the same name from MegaMek (BoardUtilities.java)
 *
 * @param hilliness The Hilliness
 * @param width The Width of the map.
 * @param height The Height of the map.
 * @param range Max difference betweenn highest and lowest level.
 * @param invertProb Probability for the invertion of the map (0..100)
 * @param invertNegate If 1, invert negative hexes, else do nothing
 */
function generateElevation(hilliness, width, height,
        					range, invertProb, invertNegative, algorithm) {
	
    var minLevel = 0;
    var maxLevel = range;
    var invert = (randomInt(100) < invertProb);

    /* map already initialized with 0 height */

    /* generate landscape */
    switch (algorithm) {
        case 0:
            cutSteps(hilliness, width, height);
            break;
        case 1:
            //TODO: midPoint(hilliness, width, height);
            break;
        case 2:
            cutSteps(hilliness, width, height);
            // midPoint(hilliness, width, height);
            break;
    }

    /* and now normalize it */
    var min = hexMap[0][0].elevation;
    var max = hexMap[0][0].elevation;
    for (var w = 0; w < width; w++) {
        for (var h = 0; h < height; h++) {
            if (hexMap[h][w].elevation > max) {
                max = hexMap[h][w].elevation;
            }
            if (hexMap[h][w].elevation < min) {
                min = hexMap[h][w].elevation;
            }
        }
    }

    var scale = (maxLevel - minLevel) / (max - min);
    var inc = (-scale * min + minLevel);
    var elevationCount = [];
    for (var w = 0; w < width; w++) {
        for (var h = 0; h < height; h++) {
        	hexMap[h][w].elevation *= scale;
        	hexMap[h][w].elevation += inc;
            elevationCount[hexMap[h][w].elevation]++;
        }
    }
    var mostElevation = 0;
    for (var lvl = 1; lvl <= range; lvl++) {
        if (elevationCount[lvl] > elevationCount[mostElevation]) {
            mostElevation = lvl;
        }
    }
    for (var w = 0; w < width; w++) {
        for (var h = 0; h < height; h++) {
        	hexMap[h][w].elevation -= mostElevation;
            if (invert) {
            	hexMap[h][w].elevation *= -1;
            }
        }
    }
    // invert negative terrain?
    if (invertNegative == 1) {
        for (var w = 0; w < width; w++) {
            for (var h = 0; h < height; h++) {
                if (hexMap[h][w].elevation < 0) {
                	hexMap[h][w].elevation *= -1;
                }
            }
        }
    }
    
    // convert elevation to integers
    for (var w = 0; w < width; w++) {
        for (var h = 0; h < height; h++) {
        	var finalElevation = Math.floor(hexMap[h][w].elevation);
            
            if(map_flatElevation > 0 && finalElevation > 0){
            	// use the map_flatElevation to decrease elevation by that amount to a 
            	// baseline of 0 elevation for flatter base terrain
            	finalElevation -= map_flatElevation;
            	if(finalElevation < 0){
            		finalElevation = 0;
            	}
            }
            
            hexMap[h][w].elevation = finalElevation;
        }
    }
}


/**
 * one of the landscape generation algorithms
 */
function cutSteps(hilliness, width, height) {
	
    var p1, p2;
    var sideA, sideB;
    var type;

    p1 = new Coords(0, 0);
    p2 = new Coords(0, 0);
    for (var step = 0; step < hilliness * 20; step++) {
        /*
         * select which side should be decremented, and which increemented
         */
        sideA = (randomInt(2) == 0) ? -1 : 1;
        sideB = -sideA;
        type = randomInt(6);
        /*
         * 6 different lines in rectangular area from border to border
         * possible
         */
        switch (type) {
            case 0: /* left to upper border */
                p1.setLocation(0, randomInt(height));
                p2.setLocation(randomInt(width), height - 1);
                markSides(p1, p2, sideB, sideA, height);
                markRect(p2.x, width, sideA, height);
                break;
            case 1: /* upper to lower border */
                p1.setLocation(randomInt(width), 0);
                p2.setLocation(randomInt(width), height - 1);
                if (p1.x < p2.x) {
                    markSides(p1, p2, sideA, sideB,  height);
                } else {
                    markSides(p2, p1, sideB, sideA, height);
                }
                markRect(0, p1.x, sideA, height);
                markRect(p2.x, width, sideB, height);
                break;
            case 2: /* upper to right border */
                p1.setLocation(randomInt(width), height - 1);
                p2.setLocation(width, randomInt(height));
                markSides(p1, p2, sideB, sideA, height);
                markRect(0, p1.x, sideA, height);
                break;
            case 3: /* left to right border */
                p1.setLocation(0, randomInt(height));
                p2.setLocation(width, randomInt(height));
                markSides(p1, p2, sideA, sideB, height);
                break;
            case 4: /* left to lower border */
                p1.setLocation(0, randomInt(height));
                p2.setLocation(randomInt(width), 0);
                markSides(p1, p2, sideB, sideA, height);
                markRect(p2.x, width, sideB,height);
                break;
            case 5: /* lower to right border */
                p1.setLocation(randomInt(width), 0);
                p2.setLocation(width, randomInt(height));
                markSides(p1, p2, sideB, sideA, height);
                markRect(0, p1.x, sideB, height);
                break;
        }

    }
}

/**
 * Helper function for the map generator increased a heightmap my a given
 * value
 */
function markRect(x1, x2, inc, height) {
    for (var x = x1; x < x2; x++) {
        for (var y = 0; y < height; y++) {
            hexMap[y][x].elevation += inc;
        }
    }
}

/**
 * Helper function for map generator inreases all of one side and decreased
 * on other side
 */
function markSides(p1, p2, upperInc, lowerInc, height) {
    for (var x = p1.x; x < p2.x; x++) {
        for (var y = 0; y < height; y++) {
            var point = (p2.y - p1.y) / (p2.x - p1.x) * (x - p1.x) + p1.y;
            if (y > point) {
                hexMap[y][x].elevation += upperInc;
            } else if (y < point) {
                hexMap[y][x].elevation += lowerInc;
            }
        }
    }
}


/**
 * Places randomly some connected Woods.
 *
 * @param probHeavy The probability that a wood is a heavy wood (in %).
 * @param maxWoods Maximum Number of Woods placed.
 */
function placeSomeTerrain(terrainType, probMore, minHexes, maxHexes, exclusive) {
	
    var p = new Coords(randomInt(numHexCols), randomInt(numHexRows));
    var field = getHexAt(p);
    
    var count = minHexes;
    if ((maxHexes - minHexes) > 0) {
        count += randomInt(maxHexes - minHexes);
    }

    var alreadyUsed = {};
    var unUsed = {};
    
    
    if (field.type != terrainType) {
        unUsed[hash(p)] = p;
    } else {
        findAllUnused(terrainType, alreadyUsed, unUsed, p);
    }

    for (var i = 0; i < count; i++) {
        if (isHashEmpty(unUsed)) {
            return;
        }
        var which = randomInt(getHashSize(unUsed));
        var iter = new MapIterator(unUsed);
        for (var n = 0; n < (which - 1); n++) {
            iter.next();
        }
        p = iter.next();
        field = getHexAt(p);
        
        if (exclusive) {
        	// all implemented terrain types for this game are exclusive, so nothing TODO yet...
        	//field.removeAllTerrains();
        }
        
        var tempInt = (randomInt(100) < probMore) ? 2 : 1;
        
        var newField = null;
        if(terrainType == TREE_TYPE){
        	if(tempInt == 2){
        		newField = new HeavyTreeHex();
        	}
        	else{
        		newField = new TreeHex();
        	}
        }
        else if(terrainType == WATER_TYPE){
        	newField = new WaterHex();
        	newField.level = tempInt;
        }
        else if(terrainType == ROCK_TYPE){
        	newField = new RockHex();
        }
        
        if(newField != null){
        	newField.elevation = field.elevation;
        	setHexAt(p, newField);
        }
        
        unUsed[hash(p)] = null;	// remove from hash
        findAllUnused(terrainType, alreadyUsed, unUsed, p);
    }

    if (terrainType == WATER_TYPE) {
        /*
         * if next to an Water Hex is an lower lvl lower the hex. First we
         * search for lowest Hex next to the lake
         */
        var min = 1000;
        var unUsedIter = new MapIterator(unUsed);
        while (unUsedIter.hasNext()) {
            p = unUsedIter.next();
            field = getHexAt(p);
            if (field != null && field.elevation < min) {
                min = field.elevation;
            }
        }

        var alreadyUsedIter = new MapIterator(alreadyUsed);
        while (alreadyUsedIter.hasNext()) {
        	p = alreadyUsedIter.next();
        	field = getHexAt(p);
            if (field != null){
            	field.elevation = min;
            }
        }

    }
}

/**
 * Searching starting from one Hex, all Terrains not matching terrainType,
 * next to one of terrainType.
 *
 * @param terrainType The terrainType which the searching hexes should not
 *            have.
 * @param alreadyUsed The hexes which should not looked at (because they are
 *            already supposed to visited in some way)
 * @param unUsed In this set the resulting hexes are stored. They are stored
 *            in addition to all previously stored.
 * @param searchFrom The Coord where to start
 */
function findAllUnused(terrainType, alreadyUsed, unUsed, searchFrom) {
	var p = null;
    var field = null;
    var notYetUsed = {};

    notYetUsed[hash(searchFrom)] = searchFrom;
    
    do {
    	var iter = new MapIterator(notYetUsed);
    	p = iter.next();
    	field = getHexAt(p);
        if (field == null) {
            continue;
        }
        
        for (var dir = 0; dir < 6; dir++) {
        	var newCoord = p.translated(dir);
            var newHex = getHexAt(newCoord);
            if ((newHex != null) && (alreadyUsed[hash(newCoord)] == null)
                    && (notYetUsed[hash(newCoord)] == null)
                    && (unUsed[hash(newCoord)] == null)) {
            	
            	if(newHex.type == terrainType){
            		notYetUsed[hash(newCoord)] = newCoord;
            	}
            	else{
            		unUsed[hash(newCoord)] = newCoord;
            	}
            }
        }
        
        notYetUsed[hash(p)] = null;	// remove from hash
        alreadyUsed[hash(p)] = p;
        
    } while (!isHashEmpty(notYetUsed));
}
