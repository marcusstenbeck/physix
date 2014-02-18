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
		var bodyA;
		var bodyB;

		for(var i = 0; i < bodies.length; i++) {
			for(var j = i+1; j < bodies.length; j++) {
				bodyA = bodies[i];
				bodyB = bodies[j];

				var BtoA = new Vec2(bodyA.pos.x - bodyB.pos.x, bodyA.pos.y - bodyB.pos.y);

				// TODO: get this hardcoded stuff out of here
				if(BtoA.getLength() < 10) collisions.push({
					bodyA: bodyA,
					bodyB: bodyB,
					vector: BtoA
				});
			}
		}

		return collisions;
	};

	World.prototype._resolveCollisions = function(collisions) {
		if(collisions.length > 0) {
			var col;
			while(col = collisions.shift()) {
				console.log(col);
				var zz = 500;
				col.bodyB.applyForce(new Vec2(col.vector.x/zz, col.vector.y/zz));
				col.bodyA.applyForce(new Vec2(-col.vector.x/zz, -col.vector.y/zz));
			}
		}
	};

	return World;
});