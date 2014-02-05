define([
	'./Vec2'
], function(
	Vec2
) {
	function Body() {
		this.mass = 1;
		this.pos = new Vec2();
		this.vel = new Vec2();
		this.acc = new Vec2();
		this.accumulatedForce = new Vec2();
	}

	Body.prototype.applyForce = function(vecForce) {
		this.accumulatedForce.x += vecForce.x;
		this.accumulatedForce.y += vecForce.y;
	};

	return Body;
});