define([
	'./Vec2',
	'./Body'
], function(
	Vec2,
	Body
) {
	'use strict';

	/**
	 *  Update positions
	 *  Check for collisions
	 *  While(collisions) 
	 *    Resolve
	 *    Check for collisions
	 */

	function World() {
		this.bodies = [];
		this.forceFields = [];
		this.gravity = new Vec2();

		this.iterationCount = 0;
	}

	World.prototype.MAX_ITERATIONS = 10;

	World.prototype.update = function(timestep) {
		if(!timestep) {
			console.warn('Bad timestep value', timestep);
			return;
		}

		// Make sure timestep never exceeds 10 ms
		for(var dt = 10, timeleft = timestep; timeleft > 0; timeleft -= dt) {
			var step = timeleft < dt ? timeleft : dt;
			this._updateFixedTimeStep(step);
		}
	};

	World.prototype._updateFixedTimeStep = function(timestep) {
		/**
		 *  Update positions, velocities, accelerations
		 */
		this._integrate(timestep);

		/**
		 *  Check for collisions
		 */
		var collisions = this._detectCollisions(this.bodies);

		/**
		 *  Resolve collisions
		 */
		this.iterationCount = 0;
		this._resolveCollisions(collisions);
	};

	World.prototype._integrate = function(timestep) {
		var body;

		for(var i = 0; i < this.bodies.length; i++) {
			body = this.bodies[i];

			/* TODO: Remove this?
			for(var j = 0; j < this.forceFields.length; j++) {
				var ff = this.forceFields[j];

				var dist = new Vec2(ff.pos.x - body.pos.x, ff.pos.y - body.pos.y);
				dist.normalize();

				body.accumulatedForce.x += dist.x * ff.magnitude / body.mass;
				body.accumulatedForce.y += dist.y * ff.magnitude / body.mass;
			}
			*/

			// Calculate acceleration
			switch(body.type) {
				case Body.DYNAMIC:
					body.acc.x = (this.gravity.x + body.accumulatedForce.x) / body.mass;
					body.acc.y = (this.gravity.y + body.accumulatedForce.y) / body.mass;
					break;
				case Body.KINEMATIC:
					body.acc.x = body.accumulatedForce.x / body.mass;
					body.acc.y = body.accumulatedForce.y / body.mass;
					break;
			}

			// Zero out accumulated force
			body.accumulatedForce.x = 0;
			body.accumulatedForce.y = 0;

			// Calculate velocity
			body.vel.x += body.acc.x * timestep;
			body.vel.y += body.acc.y * timestep;

			// Calculate position
			body.pos.x += body.vel.x * timestep;
			body.pos.y += body.vel.y * timestep;
		}
	};

	World.prototype._detectCollisions = function(bodies) {
		/**
		 *  AABB collision detection
		 */
		var collisions = [];

		var i, j, ba, bb, dh1, dh2, dv1, dv2, collisionVector;
		for(i = 0; i < bodies.length; i++) {
			ba = bodies[i].getBounds();

			for(j = i+1; j < bodies.length; j++) {
				bb = bodies[j].getBounds();

				dh1 = ba.right - bb.left;
				dh2 = bb.right - ba.left;
				dv1 = ba.top - bb.bottom;
				dv2 = bb.top - ba.bottom;

				if(dh1 <= 0 || dh2 <= 0 || dv1 <= 0 || dv2 <= 0) continue;  // no collision
				

				// ----- If we've come here, there has to be a collision ------ //


				var intersectionDepth = {
					x: (dh1 < dh2 ? dh1 : dh2),
					y: (dv1 < dv2 ? dv1 : dv2)
				};

				// Determine collision axis
				if(intersectionDepth.x < intersectionDepth.y) {
					// horizontal collision
					collisionVector = new Vec2(bodies[i].pos.x - bodies[j].pos.x, 0);
				} else {
					// vertical collision
					collisionVector = new Vec2(0, bodies[i].pos.y - bodies[j].pos.y);
				}

				collisions.push( [ bodies[i], bodies[j], collisionVector ] );

				// Run onCollision callback
				bodies[i].onCollision(bodies[j]);
				bodies[j].onCollision(bodies[i]);
			}
		}

		return collisions;
	};

	World.prototype._resolveCollisions = function(collisions) {
		if(this.iterationCount > this.MAX_ITERATIONS) {
			// Bail out!
			throw 'Too many iterations: ' +  this.iterationCount;
		} else {
			this.iterationCount += 1;
		}

		if(collisions.length === 0) return;
		
		var col;

		while(collisions.length > 0) {
			col = collisions.shift();

			// Resolve collision
			
			if(col[0].type == Body.DYNAMIC) {

				switch(col[1].type) {
					case Body.DYNAMIC:
						// dynamic - dynamic
						this._resolveDynamicDynamic(col[0], col[1], col[2]);  // col[2]: vectorAtoB
						break;

					case Body.KINEMATIC:
						// dynamic - kinematic
						this._resolveDynamicKinematic(col[0], col[1], col[2]);  // col[0]: dynamic, col[1]: kinematic, col[2]: vectorAtoB
						break;
				}
			} else if(col[0].type == Body.KINEMATIC) {
				switch(col[1].type) {
					case Body.DYNAMIC:
						// kinematic - dynamic

						// Right now the collisionVector is pointing in the opposite
						// direction of what _resolveDynamicKinematic() expects.
						// Reverse the direction of the vector
						col[2].x *= -1;
						col[2].y *= -1;

						this._resolveDynamicKinematic(col[1], col[0], col[2]);  // col[0]: kinematic, col[1]: dynamic, col[2]: vectorAtoB
						break;

					case Body.KINEMATIC:
						// kinematic - kinematic
						this._resolveKinematicKinematic(col[0], col[1], col[2]);
						break;
				}
			}
		}
		return this._resolveCollisions(this._detectCollisions(this.bodies));
	};

	World.prototype._resolveDynamicDynamic = function(dynamicBody1, dynamicBody2, vectorAtoB) {
		var stabilityHack = 0.000000001;

		var vecSolve = new Vec2(
			(0.5 * (dynamicBody1.shape.width + dynamicBody2.shape.width) - Math.abs(vectorAtoB.x) + stabilityHack) * Math.sign(vectorAtoB.x),
			(0.5 * (dynamicBody1.shape.height + dynamicBody2.shape.height) - Math.abs(vectorAtoB.y) + stabilityHack) * Math.sign(vectorAtoB.y)
		);

		// Add solving vector
		dynamicBody1.pos.x += vecSolve.x;
		dynamicBody1.pos.y += vecSolve.y;
		dynamicBody2.pos.x -= vecSolve.x;
		dynamicBody2.pos.y -= vecSolve.y;

		// Reverse velocity and a some artificial energy loss
		if(vectorAtoB.x !== 0) dynamicBody1.vel.x *= -0.98;
		if(vectorAtoB.y !== 0) dynamicBody1.vel.y *= -0.98;
		if(vectorAtoB.x !== 0) dynamicBody2.vel.x *= -0.98;
		if(vectorAtoB.y !== 0) dynamicBody2.vel.y *= -0.98;
	};

	World.prototype._resolveDynamicKinematic = function(dynamicBody, kinematicBody, vectorAtoB) {

		var stabilityHack = 0.000000001;

		var vecSolve = new Vec2(
			(0.5 * (dynamicBody.shape.width + kinematicBody.shape.width) - Math.abs(vectorAtoB.x) + stabilityHack) * Math.sign(vectorAtoB.x),
			(0.5 * (dynamicBody.shape.height + kinematicBody.shape.height) - Math.abs(vectorAtoB.y) + stabilityHack) * Math.sign(vectorAtoB.y)
		);

		// Add solving vector
		dynamicBody.pos.x += vecSolve.x;
		dynamicBody.pos.y += vecSolve.y;

		// Reverse velocity and a some artificial energy loss
		if(vectorAtoB.x !== 0) {
			if(Math.sign(vectorAtoB.x) === Math.sign(kinematicBody.vel.x)) {
				dynamicBody.vel.x = kinematicBody.vel.x;
			} else {
				dynamicBody.vel.x *= -0.98;
			}
		}

		if(vectorAtoB.y !== 0) {
			if(Math.sign(vectorAtoB.y) === Math.sign(kinematicBody.vel.y)) {
				dynamicBody.vel.y = kinematicBody.vel.y;
			} else {
				dynamicBody.vel.y *= -0.98;
			}
		}
	};

	World.prototype._resolveKinematicKinematic = function(body1, body2, vectorAtoB) {

		// TODO: This shows up a lot, DRY
		var stabilityHack = 0.000000001;

		// TODO: This shows up a lot, DRY
		var vecSolve = new Vec2(
			(0.5 * (body1.shape.width + body2.shape.width) - Math.abs(vectorAtoB.x) + stabilityHack) * Math.sign(vectorAtoB.x),
			(0.5 * (body1.shape.height + body2.shape.height) - Math.abs(vectorAtoB.y) + stabilityHack) * Math.sign(vectorAtoB.y)
		);

		var ratio;
		if(vectorAtoB.x !== 0 && vectorAtoB.y !== 0) {
			// TODO: Diagonal collision
		} else if(vectorAtoB.x === 0) {
			// TODO: Vertical collision
		} else if(vectorAtoB.y === 0) {
			// Horizontal collision
			if(body1.vel.x === 0) ratio = 0;
			else if(body2.vel.x === 0) ratio = 1;
			else {
				ratio = Math.abs(body1.vel.x) / (Math.abs(body1.vel.x) + Math.abs(body2.vel.x));
			}

			// "Reverse time"
			body1.pos.x += vecSolve.x * ratio;
			body1.pos.y += vecSolve.y * ratio;
			body2.pos.x -= vecSolve.x * (1 - ratio);
			body2.pos.y -= vecSolve.y * (1 - ratio);
		}
	};

	return World;
});