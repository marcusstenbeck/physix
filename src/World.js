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

				var dir = new Vec2(ff.pos.x - body.pos.x, ff.pos.y - body.pos.y);
				dir.normalize();

				body.accumulatedForce.x += dir.x * ff.magnitude / body.mass;
				body.accumulatedForce.y += dir.y * ff.magnitude / body.mass;
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
				// TODO: Don't stop all shizz!
				bodies[i].vel.x = 0;
				bodies[i].vel.y = 0;
				bodies[j].vel.x = 0;
				bodies[j].vel.y = 0;

				collisions.push(bodies[i]);
				collisions.push(bodies[j]);
			}
		}

		return collisions;
	};

	World.prototype._resolveCollisions = function(collisions) {
		if(collisions.length > 0) {
			var col;

			while(col = collisions.shift()) {
				// Resolve collision
			}
		}
	};

	return World;
});