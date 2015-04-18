define([
	'./Vec2'
], function(
	Vec2
) {
	'use strict';

	function Body(params) {
		if(!params) params = {};

		this.mass = 1;
		this.pos = new Vec2();
		this.vel = new Vec2();
		this.acc = new Vec2();
		this.accumulatedForce = new Vec2();
		this.isSensor = !!params.isSensor;
		this.layer = typeof params.layer === 'number' ? params.layer : 0b01;

		this.type = params.type || Body.DYNAMIC;

		// TODO: Refactor out of here. Shape class?
		this.shape = {
			name: 'rectangle',
			width: 10,
			height: 10
		};

		this.tag = params.tag || '';
	}

	Body.prototype.getBounds = function() {
		return {
			left: this.pos.x - this.shape.width/2,
			right: this.pos.x + this.shape.width/2,
			top: this.pos.y + this.shape.height/2,
			bottom: this.pos.y - this.shape.height/2
		};
	};

	Body.prototype.applyForce = function(vecForce) {
		this.accumulatedForce.x += vecForce.x;
		this.accumulatedForce.y += vecForce.y;
	};

	Body.prototype.onCollision = function(otherBody) { /*  override this  */ };

	Body.DYNAMIC = 'dynamic';
	Body.KINEMATIC = 'kinematic';

	return Body;
});