define([
], function(
) {
	function Vec2(x,y) {
		this.x = isNaN(x) ? 0 : x;
		this.y = isNaN(y) ? 0 : y;
	}

	Vec2.prototype.normalize = function() {
		var mag = Math.sqrt(this.x*this.x + this.y*this.y);
		this.x /= mag;
		this.y /= mag;
	};

	return Vec2;
});