requirejs.config({
    //By default load any module IDs from ../js
    baseUrl: '../src',
    //except, if the module ID starts with "app",
    //load it from the ./examples directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        examples: '../examples'
    }
});
require([
    'World',
    'Body',
    'Vec2'
], function(
    World,
    Body,
    Vec2
) {
    var worlds = [];  // hold physics worlds

    // TODO: Move this someplace better
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

        worlds.forEach(function(world) {
            world.update(dt);

            var bodies = world.bodies;
            for(var i = 0; i < bodies.length; i++) {
                var bound = bodies[i].getBounds();
                ctx.beginPath();
                ctx.strokeStyle = "magenta";
                ctx.strokeRect(bound.left, canvas.height - bound.top, bodies[i].shape.width, bodies[i].shape.height);
                ctx.restore();
            }
        });

        lastTime = time;
    }

    function init() {
        resize();
        window.addEventListener('resize', resize);

        var w;

        // ---------------------------------

        w = new World();
        w.gravity.y = -0.001;

        var b;
        for(var i = 0; i < 3; i++) {
            b = new Body();
            b.pos.x = 0.5*canvas.width + i*20 - 20;
            b.pos.y = 0.55*canvas.height + 0.3*i*canvas.height/2;
            w.bodies.push(b);
        }

        w.bodies[1].shape.height = 20;

        b = new Body({
            type: Body.KINEMATIC
        });
        b.pos.x = 0.5*canvas.width;
        b.pos.y = 0.5*canvas.height;
        b.shape.width = 100;
        w.bodies.push(b);

        worlds.push(w);

        // ----------------------------------

        w = new World();
        w.gravity.y = 0.001;

        var b;
        for(var i = 0; i < 3; i++) {
            b = new Body();
            b.pos.x = 0.5*canvas.width - i*20 + 20;
            b.pos.y = 0.45*canvas.height - 0.3*i*canvas.height/2;
            w.bodies.push(b);
        }

        w.bodies[1].shape.height = 20;

        b = new Body({
            type: Body.KINEMATIC
        });
        b.pos.x = 0.5*canvas.width;
        b.pos.y = 0.5*canvas.height;
        b.shape.width = 100;
        w.bodies.push(b);

        worlds.push(w);

        // -----------------------------------

        w = new World();
        w.gravity.x = -0.001;

        var b;
        for(var i = 0; i < 3; i++) {
            b = new Body();
            b.pos.x = 0.55*canvas.width + 0.3*i*canvas.width/2;
            b.pos.y = 0.5*canvas.height + i*20 - 20;
            w.bodies.push(b);
        }

        w.bodies[1].shape.width = 20;

        b = new Body({
            type: Body.KINEMATIC
        });
        b.pos.x = 0.5*canvas.width;
        b.pos.y = 0.5*canvas.height;
        b.shape.height = 100;
        w.bodies.push(b);

        worlds.push(w);

        // --------------------------------------

        w = new World();
        w.gravity.x = 0.001;

        var b;
        for(var i = 0; i < 3; i++) {
            b = new Body();
            b.pos.x = 0.45*canvas.width - 0.3*i*canvas.width/2;
            b.pos.y = 0.5*canvas.height - i*20 + 20;
            w.bodies.push(b);
        }

        w.bodies[1].shape.width = 20;

        b = new Body({
            type: Body.KINEMATIC
        });
        b.pos.x = 0.5*canvas.width;
        b.pos.y = 0.5*canvas.height;
        b.shape.height = 100;
        w.bodies.push(b);

        worlds.push(w);

        // --------------------------------------

        update();
    }

    init();
});