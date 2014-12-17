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
		var collisions = [];

		for(var i = 0; i < bodies.length; i++) {
			var ba = bodies[i].getBounds();

			for(var j = i+1; j < bodies.length; j++) {
				var bb = bodies[j].getBounds();

				var l1 = ba.left;
				var r1 = ba.right;
				var t1 = ba.top;
				var b1 = ba.bottom;

				var l2 = bb.left;
				var r2 = bb.right;
				var t2 = bb.top;
				var b2 = bb.bottom;

				if(l1 > r2 || r1 < l2 || t1 < b2 || b1 > t2) continue;

				// If we've come here, there has to be a collision
				collisions.push([bodies[i], bodies[j]]);
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
				
				// absolute distance
				var dist = new Vec2(Math.abs(col[0].pos.x - col[1].pos.x), Math.abs(col[0].pos.y - col[1].pos.y));

				switch(col[1].type) {
					case Body.DYNAMIC:
						// dynamic - dynamic
						if(dist.x > dist.y) {

							/**
							 * Move along horizontal axis (the boxes are closest horizontally)
							 */
/*								
							// find out sign
							var sign = (col[0].pos.x - col[0].pos.x) < 0 ? -1 : 1;
							
							// calc relative position to move
							var moveDiff = 0.5 * dist.x * sign / 2;

							// move the bodies
							col[0].pos.x += moveDiff;
							col[1].pos.x -= moveDiff;

							// reverse their velocities
							col[0].vel.x *= -1;
							col[1].vel.x *= -1;

*/							} else if(dist.x < dist.y) {
							/**
							 *  Move along vertical axis (the boxes are closest vertically)
							 */
							
							// find out sign
							var sign = (col[0].pos.y - col[0].pos.y) < 0 ? -1 : 1;
							
							// calc relative position to move
							var moveDiff = sign*(0.5*(col[0].shape.height + col[1].shape.height) - dist.y + 0.000000001);

							// move the bodies
							col[0].pos.y += moveDiff;
							col[1].pos.y -= moveDiff;

							// reverse their velocities
							col[0].vel.y *= -.98;
							col[1].vel.y *= -.98;
						} else {
							// corner collision
						}
						break;

					case Body.KINEMATIC:
						// dynamic - kinematic
						col[0].pos.y += 0.5*(col[0].shape.height + col[1].shape.height) - dist.y + 0.000000001;
						col[0].vel.y *= -.98;
						break;
				}
			} else if(col[0].type == Body.KINEMATIC) {
				switch(col[1].type) {
					case Body.DYNAMIC:
						// kinematic - dynamic
						col[1].pos.y += 0.5*(col[0].shape.height + col[1].shape.height) - dist.y + 0.000000001;
						col[1].vel.y *= -.98;
						break;

					case Body.KINEMATIC:
						// kinematic - kinematic
						break;
				}
			}
		}
		return this._resolveCollisions(this._detectCollisions(this.bodies));
	};

	return World;
});