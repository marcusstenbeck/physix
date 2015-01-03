define([
	'./Vec2',
	'./Body'
], function(
	Vec2,
	Body
) {

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
	}

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

		var i, j, ba, bb, l1, r1, t1, b1, l2, r2, t2, b2, vecAtoB, collisionVector;
		for(i = 0; i < bodies.length; i++) {
			ba = bodies[i].getBounds();

			for(j = i+1; j < bodies.length; j++) {
				bb = bodies[j].getBounds();

				l1 = ba.left;
				r1 = ba.right;
				t1 = ba.top;
				b1 = ba.bottom;

				l2 = bb.left;
				r2 = bb.right;
				t2 = bb.top;
				b2 = bb.bottom;

				if(l1 > r2 || r1 < l2 || t1 < b2 || b1 > t2) continue;

				// If we've come here, there has to be a collision

				vecAtoB = new Vec2(bodies[i].pos.x - bodies[j].pos.x, bodies[i].pos.y - bodies[j].pos.y);

				// Determine collision axis
				if( Math.abs(vecAtoB.x) > Math.abs(vecAtoB.y) ) {
					// horizontal collision
					collisionVector = new Vec2(vecAtoB.x, 0);
				} else {
					// vertical collision
					collisionVector = new Vec2(0, vecAtoB.y);
				}

				collisions.push( [ bodies[i], bodies[j], collisionVector ] );
			}
		}

		return collisions;
	};

	World.prototype._resolveCollisions = function(collisions) {
		if(collisions.length == 0) return;
		
		var col;

		while(col = collisions.shift()) {
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

						// Right now the collisionVector is pointing in the
						// opposite direction of what will be expected later.
						// Reverse the direction of the vector
						col[2].x *= -1;
						col[2].y *= -1;

						this._resolveDynamicKinematic(col[1], col[0], col[2]);  // col[0]: kinematic, col[1]: dynamic, col[2]: vectorAtoB
						break;

					case Body.KINEMATIC:
						// kinematic - kinematic
						console.log('lol, kinematic kinematic');
						break;
				}
			}
		}
		return this._resolveCollisions(this._detectCollisions(this.bodies));
	};

	World.prototype._resolveDynamicDynamic = function(dynamicBody1, dynamicBody2) {
		// absolute distance
		var dist = new Vec2(Math.abs(dynamicBody1.pos.x - dynamicBody2.pos.x), Math.abs(dynamicBody1.pos.y - dynamicBody2.pos.y));

		if(dist.x > dist.y) {
			/**
			 * Moving along horizontal axis (the boxes are closest horizontally)
			 */
/*								
			// find out sign
			var sign = (dynamicBody1.pos.x - dynamicBody1.pos.x) < 0 ? -1 : 1;
			
			// calc relative position to move
			var moveDiff = 0.5 * dist.x * sign / 2;

			// move the bodies
			dynamicBody1.pos.x += moveDiff;
			dynamicBody2.pos.x -= moveDiff;

			// reverse their velocities
			dynamicBody1.vel.x *= -1;
			dynamicBody2.vel.x *= -1;
*/		
		} else if(dist.x < dist.y) {
			/**
			 *  Moving along vertical axis (the boxes are closest vertically)
			 */
			
			// find out sign
			var sign = (dynamicBody1.pos.y - dynamicBody2.pos.y) < 0 ? -1 : 1;

			// calc relative position to move
			var moveDiff = sign*(0.5*(dynamicBody1.shape.height + dynamicBody2.shape.height) - dist.y + 0.000000001);

			// move the bodies
			dynamicBody1.pos.y += moveDiff;
			dynamicBody2.pos.y -= moveDiff;

			// reverse their velocities
			dynamicBody1.vel.y *= -.98;
			dynamicBody2.vel.y *= -.98;
		} else {
			// corner collision
		}
	};

	World.prototype._resolveDynamicKinematic = function(dynamicBody, kinematicBody) {
		// absolute distance
		var dist = new Vec2(Math.abs(dynamicBody.pos.x - kinematicBody.pos.x), Math.abs(dynamicBody.pos.y - kinematicBody.pos.y));

		// find out sign
		var sign = (dynamicBody.pos.y - kinematicBody.pos.y) < 0 ? -1 : 1;
		
		dynamicBody.pos.y += sign*(0.5*(kinematicBody.shape.height + dynamicBody.shape.height) - dist.y + 0.000000001);
		dynamicBody.vel.y *= -.98;
	};

	return World;
});