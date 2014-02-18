require([
	'src/World',
	'src/Body',
	'src/Vec2'
], function(
	World,
	Body,
	Vec2
) {
	var w;

	window.requestAnimFrame =
	    window.requestAnimationFrame ||
	    window.webkitRequestAnimationFrame ||
	    window.mozRequestAnimationFrame ||
	    window.oRequestAnimationFrame ||
	    window.msRequestAnimationFrame ||
	    function(callback) {
	        window.setTimeout(callback, 1000 / 60);
	};

	var canvas = document.getElementById('c');
	var ctx = canvas.getContext('2d');

	function resize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	var dt = 0, lastTime = 0;
	function update(time) {
		requestAnimFrame(update);

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		dt = Math.min(60, time - lastTime);

		w.update(dt);
		var bodies = w.bodies;
		for(var i = 0; i < bodies.length; i++) {
			var x = bodies[i].pos.x;
			var y = canvas.height - bodies[i].pos.y;
			ctx.beginPath();
			ctx.strokeStyle = "magenta";
			ctx.arc(x, y, 10, 0, 2*Math.PI);
			ctx.stroke();
			ctx.restore();
		}
		
		var ff = w.forceFields;
		for(var i = 0; i < ff.length; i++) {
			ctx.beginPath();
			ctx.strokeStyle = "red";
			ctx.arc(ff[i].pos.x, canvas.height - ff[i].pos.y, 10, 0, 2*Math.PI);
			ctx.stroke();
			ctx.restore();
		}

		lastTime = time;
	}

	function init() {
		resize();
		window.addEventListener('resize', resize);

		w = new World();
		//w.gravity.y = -0.001;
		w.forceFields.push({
			pos: new Vec2(canvas.width/2, canvas.height/2, 10),
			magnitude: 0.001
		});

		var b;
		for(var i = 0; i < 3; i++) {
			b = new Body();
			b.pos.x = 0.4*canvas.width + 0.2*i*canvas.width/2;
			b.pos.y = 0.45*canvas.height;
			w.bodies.push(b);	
		}

		w.bodies[0].vel.x = 0.3;
		w.bodies[1].vel.x = 0.5;
		w.bodies[2].vel.x = 0.5;

		update();
	}

	init();
});