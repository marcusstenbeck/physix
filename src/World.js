define([
	'./Vec2'
], function(
	Vec2
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
		if(!timestep) return;

		var _len, body;
		_len = this.bodies.length;
		for(var i = 0; i < _len; i++) {
			body = this.bodies[i];

			for(var j = 0; j < this.forceFields.length; j++) {
				var ff = this.forceFields[j];

				var dir = new Vec2(ff.pos.x - body.pos.x, ff.pos.y - body.pos.y);
				dir.normalize();

				body.accumulatedForce.x += dir.x * ff.magnitude / body.mass;
				body.accumulatedForce.y += dir.y * ff.magnitude / body.mass;
			}

			// Calculate acceleration
			body.acc.x = (this.gravity.x + body.accumulatedForce.x) / body.mass;
			body.acc.y = (this.gravity.y + body.accumulatedForce.y) / body.mass;

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

	return World;
});