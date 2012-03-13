MCO = function() {};

MCO.prototype = {
  intToColor: function(i) {
    var r = (i >> 16) & 0xff;
    var g = (i >> 8) & 0xff;
    var b = (i >> 0) & 0xff;
    return 'rgb('+r+','+b+','+g+')';
  },
  
  rainbow: function(hue) {
    return 'hsl('+hue+', 80%, 50%)';
  },
  
  gravity: function(objects, dt) {
    var minD = 1.5;
    for (var step=0; step<3; step++) {
      for (var i=0; i<objects.length; i++) {
        var o = objects[i];
        for (var j=i+1; j<objects.length; j++) {
          var k = objects[j];
          var dx = k.x-o.x;
          var dy = k.y-o.y;
          var dz = k.z-o.z;
          var d = Math.sqrt(dx*dx+dy*dy+dz*dz);
          if (d < minD) {
            var ox = 0.5-Math.random();
            var oy = 0.5-Math.random();
            var oz = 0.5-Math.random();
            var od = Math.sqrt(ox*ox+oy*oy+oz*oz);
            k.x += minD*ox/od;
            k.y += minD*oy/od;
            k.z += minD*oz/od;
            d = minD;
          }
          var F = (o.mass*k.mass*0.1)/(0.5*d*d);
          var Fx = F * dx/d;
          var Fy = F * dy/d;
          var Fz = F * dz/d;
          o.vx += Fx/o.mass * dt;
          o.vy += Fy/o.mass * dt;
          o.vz += Fz/o.mass * dt;
          k.vx += -Fx/k.mass * dt;
          k.vy += -Fy/k.mass * dt;
          k.vz += -Fz/k.mass * dt;
        }
      }
    }
  },
  
  drawRibbon: function(ctx, o) {
    /*
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(o.x-o.vx*3, o.y-o.vy*3);
    var dz = o.z <= -398 ? 0 : 400 / (o.z - -400);
    ctx.lineCap = 'round';
    ctx.lineWidth = o.size * dz;
    ctx.strokeStyle = o.color;
    ctx.stroke();
    */
    var d = Math.max(o.size, 6*Math.sqrt(o.vx*o.vx+o.vy*o.vy));
    var s = o.element.style;
    s.backgroundColor = o.color;
    s.webkitTransform = new WebKitCSSMatrix()
      .translate(o.x, o.y)
      .rotate(Math.atan2(o.vy, o.vx)*180/Math.PI)
      .scale(d/10, o.size/10);
  },

  clear: function() {
    /*
    this.ctx.fillStyle = 'rgba(255,250,245,0.2)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    */
  },
  
  drawObjects: function(objects, ctx) {
    for (var i=0; i<objects.length; i++) {
      var o = objects[i];
      this.drawRibbon(ctx, o);
    }
  },

  drawExplosions: function(explosions, ctx) {
    for (var i=0; i<explosions.length; i++) {
      var o = explosions[i];
      if (!o.element) {
        o.size = 50;
        o.vx = o.vy = 0;
        o.element = this.createElement(o);
        o.zIndex = 0;
        this.canvas.appendChild(o.element);
      }
      this.drawRibbon(ctx, o);
      /*
      ctx.beginPath();
      ctx.fillStyle = 'black';
      ctx.arc(o.x, o.y, 20, 0, Math.PI*2, true);
      ctx.fill();
      */
    }
  },
  
  updateObjects: function(objects, t, dt, explosions, newExplosions, w, h) {
    for (var i=0; i<objects.length; i++) {
      var o = objects[i];
      if (o.age >= 10) {
        newExplosions.push({x: o.x, y: o.y, color: o.color});
        this.removeObjectAt(objects, i);
        i--;
        continue;
      }
      var sz = o.size/2;
      
      o.vx *= 0.99;
      o.vy *= 0.99;
      o.vz *= 0.99;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.z += o.vz * dt;
      for (var j=0; j<explosions.length; j++) {
        var e = explosions[j];
        var ex = e.x-o.x;
        var ey = e.y-o.y;
        var de = Math.sqrt(ex*ex+ey*ey);
        if (de < 80) {
          var f = -3;
          o.vx = f * ex/de;
          o.vy = f * ey/de;
        }
      }
    }
  },
  
  newObject: function(a,cx,cy) {
    var obj = {
      x: Math.cos(a)*100+cx,
      y: Math.sin(a)*100+cy,
      z: Math.random()*5,
      mass: 1,
      vx: 0,//Math.cos(a)*0.5,
      vy: 0,//Math.sin(a)*0.5,
      vz: 0,
      size: 2,
      age: 0,
      sendTime: new Date,
      color: this.rainbow(360*Math.random())
    };
    return obj;
  },

  createElement: function(obj) {
    var e = document.createElement('div');
    e.style.pointerEvents = 'none';
    e.style.position = 'absolute';
    e.style.left = '0px';
    e.style.top = '0px';
    e.style.borderRadius = '5px';
    e.style.width = e.style.height = '10px';
    e.style.backgroundColor = obj.color;
    return e;
  },

  addObject: function() {
    var obj = this.newObject(this.angleC, this.canvas.width/2, this.canvas.height/2);
    this.angleC += 0.01*2*Math.PI;
    obj.element = this.createElement(obj);
    this.drawRibbon(this.ctx, obj);
    this.canvas.appendChild(obj.element);
    this.objects.push(obj);
    return obj;
  },

  removeObjectAt: function(objects, idx) {
    var o = objects[idx];
    o.element.parentNode.removeChild(o.element);
    objects.splice(idx,1);
  },

  removeObject: function(obj) {
    var idx = this.objects.indexOf(obj);
    if (idx > -1) {
      this.removeObjectAt(this.objects, idx);
    }
    return idx > -1;
  },
  
  init: function() {
    var c = document.createElement('div');
    c.style.backgroundColor = 'rgb(255,250,245)';
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    c.style.width = c.width + 'px';
    c.style.height = c.height + 'px';
    c.style.position = 'absolute';
    c.style.overflow = 'hidden';
    c.style.left = c.style.top = '0px';
    this.canvas = c;
    
//    var ctx = c.getContext('2d');
    document.body.appendChild(c);
//    this.ctx = ctx;
    
    this.objects = [];
    
    this.angleC = -0.5*Math.PI;
    
    this.explosions = [];
    this.newExplosions = [];
    
    this.pt = 0;
    this.mx = c.width/2;
    this.my = c.height/2;
    this.t = 0;
    this.n = 30;

    for (var i=0; i<this.n; i++) {
      var o = this.addObject();
      o.x = this.mx;
      o.y = this.my;
      o.z = 0;
      o.color = '#00ddff';
      o.vx = o.vy = o.vz = 0;
    }

    this.addEventListeners();    

    var self = this;

    this.ticker = function(T) { 
      self.tick(T); 
      requestAnimationFrame(self.ticker, self.canvas);
    };
    
    requestAnimationFrame(this.ticker, c);
  },
  
  addEventListeners: function() {
    var mco = this;
    var c = this.canvas;

    c.addEventListener('mousemove', function(ev) {
      mco.mx = ev.clientX;
      mco.my = ev.clientY;
    }, false);
    
    c.addEventListener('click', function(ev) {
      mco.newExplosions.push({
        x: ev.clientX,
        y: ev.clientY,
        color: 'black'
      });
      ev.preventDefault();
    }, false);
    
    c.addEventListener('mouseout', function(ev) {
      mco.mx = -1;
      mco.my = -1;
    }, false);
  },
    
  tick: function(T) {
    if (this.objects.length < this.n+100) {
      this.addObject();
    }

    this.t+=16;
    var dt = Math.min(60, (this.t - this.pt)) / 8;
    var ctx = this.ctx;
    var c = this.canvas;
    this.pt = this.t;
    while (this.explosions.length > 0) {
      this.removeObjectAt(this.explosions, 0);
    }
    this.explosions.push.apply(this.explosions, this.newExplosions);
    this.newExplosions.splice(0);

    var i,o;

    if (this.mx > 0) {
      for (i=0; i<this.n; i++) {
        var a = this.t/200 + i/this.n * 2*Math.PI;
        o = this.objects[i];
        var tx = this.mx + Math.cos(a)*16;
        var ty = this.my + Math.sin(a)*16;
        var dx = tx-o.x;
        var dy = ty-o.y;
        o.x += (tx-o.x) * 0.5;
        o.y += (ty-o.y) * 0.5;
        o.z += (0-o.z) * 0.5;
      }
    }

    this.gravity(this.objects, dt);
    this.updateObjects(this.objects, this.t, dt, this.explosions,this.newExplosions, c.width, c.height);

    if (this.mx > 0) {
      for (i=0; i<this.n; i++) {
        o = this.objects[i];
        o.vx *= 0.85;// (0.5-Math.random()) * 5;
        o.vy *= 0.85;// (0.5-Math.random()) * 5;
        o.vz *= 0.85;// (0.5-Math.random()) * 5;
      }
    }

    this.clear();
    this.drawObjects(this.objects, ctx);
    this.drawExplosions(this.explosions, ctx);
  }

};

