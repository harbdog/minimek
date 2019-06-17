// base module of a Bot used to set up some common functions
var Bot = {
	getMech: function() {
		return this.mech;
	},
	beginTurn: function() {
		// intializes some values for starting a bot's turn
		this.turnIndex = 0;
		this.clearWeaponsFired();
		newTurn(this.mech);
	},
	finishTurn: function() {
		// ends the bot's turn
		endTurn(this.mech);
		this.turnIndex = -1;
	},
	getTurnIndex: function() {
		return this.turnIndex;
	},
	isPlaying: function() {
		// when the bot sets the turn index back to -1 it is done with it's turn
		return (this.turnIndex != -1);
	},
	getWeaponsFired: function() {
		return this.weaponsFired;
	},
	addWeaponFired: function(weapon, result) {
		this.weaponsFired.push(new WeaponsFire(weapon, result));
	},
	clearWeaponsFired: function() {
		this.weaponsFired = [];
	},
	getTarget: function() {
		return this.target;
	},
	setAwake: function(awake) {
		this.awake = awake;
	},
	isAwake: function() {
		return (this.awake != null && this.awake == true);
	},
};

// Stores a weapon's fire and results for that fire
var WeaponsFire = Class.create({
	initialize: function(weapon, result) {
		this.weapon = weapon;
		this.result = result;
	},
	getWeapon: function() {
		return this.weapon;
	},
	getResult: function() {
		return this.result;
	}
});


// CircleBot is a test Bot that only goes in circles
var CircleBot = Class.create(Bot, {
	initialize: function(mech) {
		this.mech = mech;
		this.turnIndex = -1;
		this.intervalId = 0;
		this.result = null;
	},
	doAction: function(){
		if(this.turnIndex == -1) return;
		
		if(this.turnIndex == 0){
			// initialize some new turn values
			this.clearWeaponsFired();
		}
		
		if(this.mech.actionPoints == 0)
			this.turnIndex = -1;
	
		// perform actions during the turn (one at a time)
		if(this.turnIndex == 0){
			// just rotate for the first step
			var moveResult = rotateHeadingCW(this.mech);
		}
		else if(this.turnIndex == 1){
			// just move forward for the second step
			var moveResult = moveForward(this.mech, false);
		}
		else{
			// end the turn
			this.finishTurn();
			return;
		}
		
		this.turnIndex ++;
	},
	
});


// TurretBot is a test Bot that only turns towards and shoots at the player
var TurretBot = Class.create(Bot, {
	initialize: function(mech) {
		this.mech = mech;
		this.turnIndex = -1;
		this.intervalId = 0;
		this.result = null;
		this.weaponFired = null;
		this.target = playerMech;
	},
	doAction: function(){
		if(this.turnIndex == -1) return;
		
		if(this.mech.actionPoints == 0)
			this.turnIndex = -1;
			
		if(this.target.destroyed)
			this.turnIndex = -1;
		
		if(this.turnIndex == 0){
			// initialize some new turn values
			this.clearWeaponsFired();
		}
	
		var tgtDirection = getDirection(this.mech.location, this.getTarget().location);
		if(this.turnIndex == 0 && tgtDirection == this.mech.heading){
			// already in the direction of the player, bot proceeds directly to firing
			this.turnIndex = 1;
		}
	
		// perform actions during the turn (one at a time)
		if(this.turnIndex == 0){
			// determine if clockwise or ccw is closer to the player direction
			var moveResult = rotateToMech(this.mech, this.getTarget());
		}
		else if(this.turnIndex == 1){
			// shoot the first available weapon that can hit the player with >25% accuracy, but only if heat not over (18 - weapon heat)
			var bestWeapon = null;
			var bestToHit = 0;
			for(var i=0; i<this.mech.weapons.length; i++){
				var weapon = this.mech.weapons[i];
				
				if(weapon.cooldown > 0)
					continue;
					
				if(this.mech.heat + weapon.heat > 18)
					continue;
					
				var toHitPercent = getToHitAsPercent(this.mech, weapon, this.getTarget());
				if(toHitPercent > 25 && toHitPercent > bestToHit){
					bestWeapon = weapon;
					bestToHit = toHitPercent;
				}
			}
			
			if(bestWeapon == null){
				// bot doesn't want to fire any weapons, end the turn
				this.finishTurn();
				return;
			}
			
			var result = fireWeapon(this.mech, bestWeapon, this.getTarget());
			
			if(result.success){
				this.addWeaponFired(bestWeapon, result);
			}
		}
		else{
			// end the turn
			this.finishTurn();
			return;
		}
		
		this.turnIndex ++;
	},
	
});


// RushBot is a test Bot that only moves/turns towards and shoots at the target
var RushBot = Class.create(Bot, {
	initialize: function(mech) {
		this.mech = mech;
		this.turnIndex = -1;
		this.intervalId = 0;
		this.result = null;
		this.weaponFired = null;
		this.target = null;
	},
	doAction: function(){
		if(this.turnIndex == -1) return;
		
		if(this.turnIndex == 0){
			// initialize some new turn values
			this.clearWeaponsFired();
			
			if(this.getTarget() == null || this.getTarget().isDestroyed()){
				// pick an appropriate new target that is not on the same team
				this.target = targetNearest(this.mech);
				
				if(this.target != null){
					debug.log(this.mech.chassis+" Bot: my target is now "+this.target.chassis);
				}
				else{
					debug.log(this.mech.chassis+" Bot: no more targets.");
				}
			}
		}
		
		if(this.mech.actionPoints == 0){
			this.turnIndex = -1;
		}
		else if(this.target == null){
			// end the turn
			this.turnIndex = -1;
		}
		else if(this.target.isDestroyed()){
			/** make the bot do a victory dance around the player's scrap heap */
			
			// determine if need to be closer to the player
			var range = getRange(this.mech.location, this.getTarget().location);
			var relDirection = getRelativeDirection(this.mech, this.getTarget());
			
			if(this.turnIndex < 2 && relDirection == REL_DIRECTION_FRONT && range > 1){
				var moveResult = moveForward(this.mech, false);
			}
			else if(this.turnIndex < 2 && relDirection != REL_DIRECTION_FRONT && range > 1){
				var moveResult = rotateToMech(this.mech, this.getTarget());
			}
			else if(this.turnIndex == 0){
				// just rotate for the first step
				var moveResult = rotateHeadingCW(this.mech);
			}
			else if(this.turnIndex == 1){
				// just move forward for the second step
				var moveResult = moveForward(this.mech, false);
			}
			else{
				// end the turn
				this.turnIndex = -1;
			}
		}
		else{
			var tgtDirection = getDirection(this.mech.location, this.getTarget().location);
			
			if(this.turnIndex == 0 && tgtDirection == this.mech.heading){
				// already in the direction of the player, bot proceeds to next step
				this.turnIndex = 1;
			}
		
			// perform actions during the turn (one at a time)
			if(this.turnIndex == 0){
				// determine if clockwise or ccw is closer to the player direction
				var moveResult = rotateToMech(this.mech, this.getTarget());
			}
			else if(this.turnIndex == 1){
				// determine if need to be closer to the player
				var range = getRange(this.mech.location, this.getTarget().location);
				var relDirection = getRelativeDirection(this.mech, this.getTarget());
				
				if(relDirection == REL_DIRECTION_FRONT && range > 2){
					var moveResult = moveForward(this.mech, false);
				}
				else if(relDirection != REL_DIRECTION_FRONT){
					var moveResult = rotateToMech(this.mech, this.getTarget());
				}
			}
			else if(this.turnIndex == 2){
				// shoot the first available weapon that can hit the player with >15% accuracy, but only if heat not over (18 - weapon heat)
				var bestWeapon = null;
				var bestToHit = 0;
				for(var i=0; i<this.mech.weapons.length; i++){
					var weapon = this.mech.weapons[i];
					
					if(weapon.cooldown > 0)
						continue;
						
					if(this.mech.heat + weapon.heat > 18)
						continue;
						
					var toHitPercent = getToHitAsPercent(this.mech, weapon, this.getTarget());
					if(toHitPercent > 15 && toHitPercent> bestToHit){
						bestWeapon = weapon;
						bestToHit = toHitPercent;
					}
				}
				
				if(bestWeapon == null){
					// bot doesn't want to fire any weapons, instead just move/turn better towards the target again
					// determine if need to be closer to the target then end the turn
					var range = getRange(this.mech.location, this.getTarget().location);
					var relDirection = getRelativeDirection(this.mech, this.getTarget());
					
					if(relDirection == REL_DIRECTION_FRONT && range > 3){
						var moveResult = moveForward(this.mech, false);
					}
					else if(relDirection != REL_DIRECTION_FRONT){
						var moveResult = rotateToMech(this.mech, this.getTarget());
					}
					
					// end the turn
					this.turnIndex = -1;
				}
				else{
					var result = fireWeapon(this.mech, bestWeapon, this.getTarget());
					
					if(result.success){
						this.addWeaponFired(bestWeapon, result);
					}
				}
			}
			else{
				// end the turn
				this.turnIndex = -1;
			}
		}
		
		if(this.turnIndex == -1){
			// end the turn
			this.finishTurn();
			return;
		}
		
		this.turnIndex ++;
	},
	
});


/** 
 * MekBot is the generic Mech pilot AI 
 * 
 * The general order the AI processing will take are: 
 * 1. Determine ideal target
 * 2. Determine behavior for the turn
 * 3..N. Determine movement to accomplish behavior
 * N+1. Determine weapons fire
 * 
 */

// initialize the different AI phases
// var PHASE_MOVE = 2...N;
var PHASE_FIRE = 100;	//N+1
var PHASE_END_TURN = -1;

// initialize the AI behaviors
var BEHAVIOR_BRAWL = "brawl";			// for moving to physical combat range
var BEHAVIOR_ENGAGE = "engage";			// for moving to close weapon range
var BEHAVIOR_ENGAGE_RANGE = "range";	// for moving to specific weapon range
var BEHAVIOR_EVADE = "evade";			// for moving for evasion (little to no weapon fire)

var MekBot = Class.create(Bot, {
	initialize: function(mech) {
		this.mech = mech;
		this.turnIndex = -1;
		this.intervalId = 0;
		this.result = null;
		this.weaponFired = null;
		this.target = null;
		this.behavior = BEHAVIOR_ENGAGE;
		
		this.longRange = 1;
		this.mediumRange = 1;
		this.shortRange = 1;
		this.idealRange = 1;
		this.idealCoord = null;
	},
	getBehavior: function() {
		return this.behavior;
	},
	doAction: function(){
		if(this.turnIndex == -1){
			return;
		}
		else if(this.turnIndex == 0){
			// initialize some new turn values
			this.clearWeaponsFired();
			
			debug.log(this.mech.chassis+" bot beginning turn with heat level "+this.mech.heat+", armor at "+this.mech.getPercentRemainingTotal()+"%");
			
			
			// 1. Determine ideal target
			idealTargetForBot(this);
			
			if(this.getTarget() != null){
				//debug.log("    Target chosen: "+this.getTarget().chassis);
			}
			else{
				//debug.log("    No targets remain.");
				this.turnIndex = PHASE_END_TURN;
			}
			
			
			// 2. Determine behavior for the turn
			idealRangeOnTargetForBot(this);
			
			if(this.idealRange < 0){
				this.behavior = BEHAVIOR_EVADE;
				this.idealRange = Math.abs(this.idealRange);
			}
			else if(this.idealRange == 0){
				this.behavior = BEHAVIOR_BRAWL;
			}
			else if(this.idealRange == 1){
				this.behavior = BEHAVIOR_ENGAGE;
			}
			else{
				this.behavior = BEHAVIOR_ENGAGE_RANGE;
			}
			
			//debug.log("    Behavior chosen: "+this.getBehavior()+", idealRange="+this.idealRange+", shortRange="+this.shortRange+", mediumRange="+this.mediumRange+", longRange="+this.longRange);
			
			
			// Pre-3..N determine hex location to move into
			idealMoveForBot(this);
			
			if(this.idealCoord != null){
				debug.log("    Destination chosen: ["+this.idealCoord.x+","+this.idealCoord.y+"] heading="+this.idealCoord.heading);
				
				if(this.idealCoord.pathing != null){
					//debug.log("    Destination pathing:");
					for(var i=0; i<this.idealCoord.pathing.length; i++){
						var pathCoord = this.idealCoord.pathing[i];
						//debug.log("        "+i+": ["+pathCoord.x+","+pathCoord.y+"] heading="+pathCoord.heading);
					}
				}
				else{
					//debug.log("    No pathing info");
				}
			}
			else{
				debug.log("    Destination nowhere");
			}
		}
		
		if(this.turnIndex >= PHASE_FIRE){
			// N+1. weapons fire
			idealWeaponsFireForBot(this);

			this.turnIndex = PHASE_END_TURN;
		}
		else{
			// 3..N. perform movement 
			var preMoveAP = this.mech.actionPoints;
			
			var moveResult = moveMechToCoord(this.mech, this.idealCoord);
			
			if(moveResult == null || preMoveAP == this.mech.actionPoints){
				this.turnIndex = PHASE_FIRE;
			}
			
			if(this.mech.actionPoints == 0){
				// TODO: account for when the bot has 0 AP to start the round, in which case it can fire, but not move
				this.turnIndex = PHASE_END_TURN;
			}
		}

		if(this.turnIndex == PHASE_END_TURN){
			// end the turn
			this.finishTurn();
			return;
		}
		
		this.turnIndex ++;
	},
	
});

function idealWeaponsFireForBot(bot){
	var mech = bot.getMech();
	var target = bot.getTarget();
	
	var consideredWeapons = [];
	
	for(var i=0; i<mech.weapons.length; i++){
		var weapon = mech.weapons[i];
		var ammo = getAmmoCount(mech, weapon);
		
		if(weapon.isDestroyed() || weapon.cooldown > 0 || ammo == 0){
			continue;
		}
		
		var toHitPercent = getToHitAsPercent(mech, weapon, target);
		if(toHitPercent <= 25){
			continue;
		}
		
		var weaponWeight = 1;
		
		// give worse weight to lower % hit
		weaponWeight += (100 - toHitPercent) / 10;
		
		
		// give worse weight to lower damage weapons
		var dmg = weapon.getDamage() * expectedHitsByRackSize[weapon.getProjectiles()];	
		weaponWeight += (20 - dmg) / 4; 
		
		
		// give slightly worse weight to weapons with limited ammo (and worse for ones that are almost depleted)
		if(ammo > 0){
			weaponWeight += (ammo < 10) ? (10 - ammo + 1) : 1;
		}
			
		var weightObj = new SortObject(weapon, weaponWeight);
		consideredWeapons.push(weightObj);
	}
	
	consideredWeapons.sort(sortObjectCompare);
	
	for(var i=0; i<consideredWeapons.length; i++){
		var weapon = consideredWeapons[i].getObj();
		
		if(mech.heat + mech.heatGen - mech.heatDiss + weapon.heat > 23){
			// keep firing ideal weapons so long as the heat doesn't get too high
			continue;
		}

		// for now, bot will just never fire when over 25 percent chance to hit
		var result = fireWeapon(mech, weapon, target);
		
		if(result.success){
			bot.addWeaponFired(weapon, result);
		}
	}
}


// generates the ideal target for the mech based on range, threat, etc.
function idealTargetForBot(bot){
	
	var mech = bot.getMech();
	var currentTarget = bot.getTarget();
	
	var enemyMechs = getEnemyMechsByRange(mech);
	var numEnemies = enemyMechs.length;
	
	if(numEnemies == 0){
		bot.target = null;
	}
	else if(numEnemies == 1){
		bot.target = (enemyMechs[0] != null && !enemyMechs[0].isDestroyed()) ? enemyMechs[0] : null;
	}
	else{
		// handle >1 target, considering mechs that are bigger threats, closer, targeting this mech, etc
		var liveEnemies = [];
		
		debug.log("Determining enemy targets for "+mech.chassis);
		
		for(var i=0; i<numEnemies; i++){
			var thisEnemy = enemyMechs[i];
			if(thisEnemy == null || thisEnemy.isDestroyed()){
				continue;
			}
			
			var targetWeight = 1;
			
			if(currentTarget == thisEnemy){
				// give better weight if the mech is the current target
			}
			else{
				targetWeight += 5;
			}
			
			
			var enemyBot = getMechBot(thisEnemy);
			if((thisEnemy == playerMech && targetMech == mech)
					|| (enemyBot != null && enemyBot.getTarget() == mech)){
				// give better weight if the mech is targeting this bot
			}
			else{
				targetWeight += 5;
			}
			
			// give worse weight to further ranged enemies
			var range = getRange(mech.location, thisEnemy.location);
			targetWeight += Math.round(range / 2);
			
			// give worse weight to mechs lighter than this mech (want to take out heavier mechs first)
			if(mech.tonnage > thisEnemy.tonnage){
				targetWeight += Math.round((mech.tonnage - thisEnemy.tonnage) / 10);
			}
			
			// give better weight to enemies that are very damaged
			var remainHealth = thisEnemy.getPercentRemainingTotal();
			targetWeight += Math.round(remainHealth / 20);
			
			debug.log("    "+thisEnemy.chassis+" targetting weight="+targetWeight);
			
			var enemyObject = new SortObject(thisEnemy, targetWeight);
			liveEnemies.push(enemyObject);
		}
		
		liveEnemies.sort(sortObjectCompare);
		
		if(liveEnemies.length == 0){
			bot.target = null;
		}
		else{
			// target the best weighted enemy
			bot.target = liveEnemies[0].getObj();
			
			if(currentTarget == bot.target){
				debug.log("        Current target remains as new target");
			}
		}
	}
}

// generates the ideal range to be from the target (where >0 is # of hexes, 0=brawl/melee)
function idealRangeOnTargetForBot(bot){
	var mech = bot.getMech();
	var target = bot.getTarget();
	
	if(mech == null || target == null){
		return 0;
	}
	
	// reset ideal/max ranges in case ammo runs out or weapon gets destroyed before this new turn
	bot.idealRange = 1;
	bot.longRange = 1;
	bot.mediumRange = 1;
	bot.shortRange = 1;
	
	// start by determining self weapons capabilities from ranges, cooldowns, etc by damage
	var selfRanges = [];
	
	var numWeapons = 0;
	var availWeapons = 0;
	
	for(var i=0; i<mech.weapons.length; i++){
		var thisWeapon = mech.weapons[i];
		var ammo = getAmmoCount(mech, thisWeapon);
		
		if(thisWeapon == null || thisWeapon.isDestroyed() || ammo == 0){
			continue;
		}
		
		numWeapons ++;
		if(thisWeapon.cooldown == 0){
			availWeapons ++;
		}
		
		// since weapons with >1 projectile don't always hit with all, use an average number based on cluster hits rolls
		var dmg = thisWeapon.getDamage() * expectedHitsByRackSize[thisWeapon.getProjectiles()];	
		var min = thisWeapon.getMinRange();
		
		// using the damage as the weight, tally up each weight by range and determine from the highest weight
		var rangeVal = 1;
		if(min > 0){
			// use the minimum range + 1 value for this weapon as ideal
			rangeVal = min + 1;
		}
		
		if(selfRanges[rangeVal] == null){
			selfRanges[rangeVal] = 0;
		}
		
		selfRanges[rangeVal] += dmg;
		
		
		// while we're here, determine the intermediate ranges for all weapons
		// TODO: use an average instead of highest
		var longRange = thisWeapon.getLongRange();
		var mediumRange = thisWeapon.getMediumRange();
		var shortRange = thisWeapon.getShortRange();
		
		if(longRange > bot.longRange){
			bot.longRange = longRange;
		}
		
		if(mediumRange > bot.mediumRange){
			bot.mediumRange = mediumRange;
		}
		
		if(shortRange > bot.shortRange){
			bot.shortRange = shortRange;
		}
	}
	
	
	// determine the highest weighted range value, in the event of a tie, just use the lower range
	// TODO: use a more accurate method to determine in case there's many different weapon types with different ranges
	var bestSelfRange = 0;
	var bestSelfDamage = 0;
	for(var r=0; r<selfRanges.length; r++){
		if(selfRanges[r] == null)
			continue;
		
		var thisDamage = selfRanges[r];
		if(thisDamage > bestSelfDamage){
			bestSelfRange = r;
			bestSelfDamage = thisDamage;
		}
	}
	
	
	// TODO: analyze target capabilities in case it may make it change its mind 
	// for example, if the target has much better long range firepower versus this long range mech, it may bet best to close in instead
	// var tgtRange = 0;
	
	
	// evade sometimes, like when most weapons on cooldown, or waiting for heat to dissipate
	if(availWeapons < (numWeapons / 2)
			|| mech.heat > 18){
		// TODO: make melee be ideal not just when there's no weapons remaining to shoot with, for instance when there's a Hatchet to use
		
		if(bestSelfRange > 0){
			// negative number indicates evasion at the range given
			bestSelfRange *= -1;
		}
		else if(bestSelfRange == 0){
			bestSelfRange -= 1;
		}
	}
	
	
	bot.idealRange = bestSelfRange;
}

// generates the ideal move on the target, taking into account the range that is desired to be at
var ignoredModifierTypes = [MODIFIER_MIN_RANGE, MODIFIER_SHORT_RANGE, MODIFIER_MEDIUM_RANGE, MODIFIER_LONG_RANGE, MODIFIER_MAX_RANGE, 
                            MODIFIER_KICK, MODIFIER_HATCHET];
var AUTO_MISS_WEIGHT = 20;
function idealMoveForBot(bot){
	var mech = bot.getMech();
	var target = bot.getTarget();
	
	if(mech == null || target == null){
		bot.idealCoord = null;
		return null;
	}
	
	debug.log("    In ideal move");	
	
	var numMovesAhead = 1;
	var mechAP = getMechAP(mech);
	// look ahead more turns for mechs with low AP
	if(mechAP > 0){
		numMovesAhead = Math.floor(10 / mechAP);
	}
	
	var allMoves = getAllValidMovesAP(mech, true, numMovesAhead);
	var numMoves = allMoves.length;
	
	// use a new sorted array to get the best weighted move
	var consideredMoves = [];
	
	for(var i=0; i<numMoves; i++){
		var moveObj = allMoves[i];
		
		var moveCoords = moveObj.getObj();
		var moveHeading = moveCoords.heading;
		var apRemain = moveObj.getValue();
		
		var rangeToTarget = getRange(moveCoords, target.location);
		var toDirection = getDirection(moveCoords, target.location);
		var relDirection = getRelativeDirectionFrom(moveCoords, moveHeading, target.location);
		
		debug.log("    Possible move to ["+moveCoords.x+","+moveCoords.y+"] @ heading "+moveHeading+", apRemain="+apRemain+", rangeToTarget="+rangeToTarget+", relDirection="+relDirection);
		
		// best weighting = 1
		var moveWeight = 1;
		
		// give weighting based on which LOS based modifiers will be present for any weapon
		var modifiers = getToHitModifiersFromLocation(moveCoords, target);
		var modSum = 0;
		for(var m=0; m<modifiers.length; m++){
			var thisModifier = modifiers[m];
			if(ignoredModifierTypes.indexOf(thisModifier.getType()) != -1){
				continue;
			}
			
			if(MODIFIER_IMPOSSIBLE == thisModifier.getType()){
				modSum += AUTO_MISS;
			}
			else{
				modSum += thisModifier.getValue();
			}
		}
		
		if(BEHAVIOR_EVADE == bot.getBehavior()){
			// while evading, using all AP and LOS blocking is actually preferred
			if(modSum < AUTO_MISS){
				moveWeight += (10 - modSum);
			}
			
			// TODO: while evading, prefer moves which have fewer turns to increase hexes moved
			
			if(apRemain > 0){
				moveWeight += apRemain;
			}
		}
		else if(modSum >= AUTO_MISS){
			// give worse weighting to moves that put the mech somewhere it cannot shoot
			moveWeight += AUTO_MISS_WEIGHT;
		}
		else{
			moveWeight += modSum;
			
			if(apRemain <= 0){
				// give worse weighting to moves that do not allow for a weapon to fire by having at least 1 AP remaining
				moveWeight += Math.abs(apRemain) + 1;
			}
			
			// give better weighting to moves at an ideal range of weapons
			if(rangeToTarget != bot.idealRange){
				// give worse weighting if inside the ideal range
				moveWeight += ((rangeToTarget < bot.idealRange) ? 2 : 1) * Math.abs(bot.idealRange - rangeToTarget);
			}
			
			if(rangeToTarget > bot.longRange){
				// give worse weighting to moves outside the max range of all weapons
				moveWeight += 5;
			}
			else if(rangeToTarget > bot.mediumRange){
				moveWeight += 3;
			}
			else if(rangeToTarget > bot.shortRange){
				moveWeight += 1;
			}
		}
		
		if(BEHAVIOR_EVADE == bot.getBehavior() || modSum < AUTO_MISS){
			if(toDirection == moveHeading){
				// give the best weighting to moves in the exact heading of target
			}
			else if(relDirection == REL_DIRECTION_FRONT){
				// give good weighting to other moves in the front firing arc
				var rightHeading = getRotateHeadingCW(toDirection);
				var leftHeading = getRotateHeadingCCW(toDirection);
				
				if(BEHAVIOR_EVADE == bot.getBehavior()){
					moveWeight += 1;
				}
				else if(moveHeading == rightHeading || moveHeading == leftHeading){
					// slightly better weighting if its only one turn to get to heading instead of 2
					moveWeight += 1;
				}
				else{
					moveWeight += 3;
				}
			}
			else if(relDirection == REL_DIRECTION_RIGHT
					|| relDirection == REL_DIRECTION_LEFT){
				
				if(BEHAVIOR_EVADE == bot.getBehavior()){
					// TODO: give slightly better weighting than this if there's no or fewer weapons in that LEFT/RIGHT side to expose (or if other side is injured)
					moveWeight += 1;
				}
				else{
					// TODO: give slightly better weighting than this if there's good weapons in the LEFT/RIGHT arm in certain cases
					moveWeight += 3;
				}
			}
			else{
				// give worse weighting to exposing the rear torso
				moveWeight += 5;
			}
		}
		
		debug.log("        MoveWeight="+moveWeight);
		
		var considerObject = new SortObject(moveCoords, moveWeight);
		consideredMoves.push(considerObject);
	
	}
	
	// sort by weight to get the best possible move
	consideredMoves.sort(sortObjectCompare);
	
	// TODO: add use of jump jets where applicable
	if(consideredMoves.length == 0){
		bot.idealCoord = null;
	}
	else{
		bot.idealCoord = consideredMoves[0].getObj();
	}
}

//use the given coord and its pathing information to move the mech incrementally to the destination
function moveMechToCoord(mech, destCoords){
	var moveResult = null;
	
	if(mech == null || destCoords == null){
		return moveResult;
	}
	else if(mech.location.equals(destCoords) 
			&& mech.heading == destCoords.heading){
		// already there
		debug.log("       Arrived at destination");
		return moveResult;
	}
	
	// start by checking to see if the next move should be a rotate, forward, or backward move
	var nextMoveCoords = destCoords;
	if(destCoords.pathing != null && destCoords.pathing.length > 0){
		nextMoveCoords = destCoords.pathing[0];
		
		// if the current heading is the same as the next move, go ahead and remove it from the beginning of the array
		if(mech.heading == nextMoveCoords.heading){
			// get this coord out of the pathing so its not looked at again
			destCoords.pathing.shift();
			
			if(mech.location.equals(nextMoveCoords)){
				// already in this position, move on to next pathing location
				return moveMechToCoord(mech, destCoords);
			}
		}
		
		debug.log("        Now moving on path to destination");
	}
	else{
		debug.log("        Now moving on actual destination");
	}
	
	if(mech.heading != nextMoveCoords.heading){
		// rotate towards the next heading
		moveResult = rotateToHeading(mech, nextMoveCoords.heading);
	}
	else{
		// determine if this is a forward or backward move
		var headingCoords = getForwardCoords(mech.location, mech.heading);
		if(headingCoords.equals(nextMoveCoords)){
			// forward
			moveResult = moveForward(mech, false);
		}
		else{
			moveResult = moveBackward(mech, false);
		}
	}
	
	return moveResult;
}

// rotates the given bot towards the location of the given mech and returns the results
function rotateToMech(srcMech, toMech){
	var toDirection = getDirection(srcMech.location, toMech.location);
	
	return rotateToHeading(srcMech, toDirection);
}

//rotates the given bot towards the given location and returns the results
function rotateToHeading(srcMech, toHeading){
	
	if(toHeading == srcMech.heading)
		return null;
	
	var cwHeadings = [(srcMech.heading + 1) % 6, (srcMech.heading + 2) % 6];
    var ccwHeadings = [(srcMech.heading - 1) % 6, (srcMech.heading - 2) % 6];
	
	if(jQuery.inArray(toHeading, cwHeadings) >= 0){
        return rotateHeadingCW(srcMech);
    }
    else if(jQuery.inArray(toHeading, ccwHeadings) >= 0){
        return rotateHeadingCCW(srcMech);
    }
    else{
        // toHeading is 180 degrees, doesn't matter which direction (randomize?)
        return rotateHeadingCW(srcMech);
    }
}


