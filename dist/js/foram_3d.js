var Chamber,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chamber = (function(superClass) {
  extend(Chamber, superClass);

  Chamber.prototype.DEFAULT_TEXTURE = "../assets/images/texture.gif";

  function Chamber(center, radius) {
    var geometry, material;
    this.center = center;
    this.radius = radius;
    geometry = this.buildChamberGeometry();
    material = this.buildChamberMaterial();
    THREE.Mesh.call(this, geometry, material);
    this.vertices = geometry.vertices;
    this.origin = this.center;
    this.aperture = this.calculateAperture();
  }

  Chamber.prototype.buildChamberGeometry = function() {
    var centerTranslationMatrix, geometry;
    centerTranslationMatrix = this.buildCenterTranslationMatrix();
    geometry = new THREE.SphereGeometry(this.radius, 32, 32);
    geometry.applyMatrix(centerTranslationMatrix);
    return geometry;
  };

  Chamber.prototype.buildChamberMaterial = function() {
    return new THREE.MeshLambertMaterial({
      color: 0xffffff
    });
  };

  Chamber.prototype.buildCenterTranslationMatrix = function() {
    return new THREE.Matrix4().makeTranslation(this.center.x, this.center.y, this.center.z);
  };

  Chamber.prototype.calculateAperture = function() {
    var aperture, currentDistance, i, len, newDistance, ref, vertex;
    aperture = this.vertices[0];
    currentDistance = aperture.distanceTo(this.center);
    ref = this.vertices.slice(1);
    for (i = 0, len = ref.length; i < len; i++) {
      vertex = ref[i];
      newDistance = vertex.distanceTo(this.center);
      if (newDistance < currentDistance) {
        aperture = vertex;
        currentDistance = newDistance;
      }
    }
    return aperture;
  };

  Chamber.prototype.setAperture = function(aperture) {
    return this.aperture = aperture;
  };

  Chamber.prototype.setAncestor = function(ancestor) {
    this.ancestor = ancestor;
    if (ancestor) {
      if (ancestor) {
        this.origin = ancestor.aperture;
      }
      return ancestor.child = this;
    }
  };

  Chamber.prototype.calculateGeometryRing = function() {
    var i, len, ref, results, vertex;
    ref = this.geometry.vertices;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      vertex = ref[i];
      if (vertex.z === 0) {
        results.push(vertex);
      }
    }
    return results;
  };

  return Chamber;

})(THREE.Mesh);

var Foram,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Foram = (function(superClass) {
  extend(Foram, superClass);

  function Foram(genotype) {
    var initialChamber;
    this.genotype = genotype;
    THREE.Object3D.call(this);
    initialChamber = this.buildInitialChamber();
    this.chambers = [initialChamber];
    this.currentChamber = initialChamber;
  }

  Foram.prototype.buildInitialChamber = function() {
    return new Chamber(new THREE.Vector3(0, 0, 0), this.genotype.initialRadius);
  };

  Foram.prototype.buildChambers = function(numChambers) {
    var i, j, ref;
    for (i = j = 1, ref = numChambers - 1; 1 <= ref ? j <= ref : j >= ref; i = 1 <= ref ? ++j : --j) {
      this.calculateNextChamber();
    }
    return this.build();
  };

  Foram.prototype.evolve = function() {
    var child;
    child = this.currentChamber.child;
    if (child) {
      this.currentChamber = child;
      return this.currentChamber.visible = true;
    } else {
      this.calculateNextChamber();
      return this.build();
    }
  };

  Foram.prototype.regress = function() {
    var ancestor;
    ancestor = this.currentChamber.ancestor;
    if (ancestor) {
      this.currentChamber.visible = false;
      return this.currentChamber = ancestor;
    }
  };

  Foram.prototype.calculateNextChamber = function() {
    var newAperture, newCenter, newChamber, newRadius;
    newCenter = this.calculateNewCenter();
    newRadius = this.calculateNewRadius();
    newChamber = new Chamber(newCenter, newRadius);
    newAperture = this.calculateNewAperture(newChamber);
    newChamber.setAperture(newAperture);
    newChamber.setAncestor(this.currentChamber);
    this.chambers.push(newChamber);
    return this.currentChamber = newChamber;
  };

  Foram.prototype.calculateNewCenter = function() {
    var currentAperture, currentOrigin, growthVector, horizontalRotationAxis, newCenter, verticalRotationAxis;
    currentOrigin = this.currentChamber.origin;
    currentAperture = this.currentChamber.aperture;
    growthVector = new THREE.Vector3;
    growthVector.subVectors(currentAperture, currentOrigin);
    horizontalRotationAxis = new THREE.Vector3(0, 0, 1);
    verticalRotationAxis = new THREE.Vector3(1, 0, 0);
    growthVector.applyAxisAngle(horizontalRotationAxis, this.genotype.phi);
    growthVector.applyAxisAngle(verticalRotationAxis, this.genotype.beta);
    growthVector.normalize();
    growthVector.multiplyScalar(this.genotype.translationFactor);
    newCenter = new THREE.Vector3;
    newCenter.copy(currentAperture);
    newCenter.add(growthVector);
    return newCenter;
  };

  Foram.prototype.calculateNewRadius = function() {
    return (this.currentChamber.ancestor || this.currentChamber).radius * this.genotype.growthFactor;
  };

  Foram.prototype.calculateNewAperture = function(newChamber) {
    var chamber, contains, currentDistance, j, k, len, len1, newAperture, newCenter, newDistance, ref, ref1, vertex;
    newCenter = newChamber.center;
    newAperture = newChamber.vertices[0];
    currentDistance = newAperture.distanceTo(newCenter);
    ref = newChamber.vertices.slice(1);
    for (j = 0, len = ref.length; j < len; j++) {
      vertex = ref[j];
      newDistance = vertex.distanceTo(newCenter);
      if (newDistance < currentDistance) {
        contains = false;
        ref1 = this.chambers;
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          chamber = ref1[k];
          if (chamber.radius > newAperture.distanceTo(chamber.center)) {
            contains = true;
            break;
          }
        }
        if (!contains) {
          newAperture = vertex;
          currentDistance = newDistance;
        }
      }
    }
    return newAperture;
  };

  Foram.prototype.build = function() {
    var chamber, j, len, ref, results;
    ref = this.chambers;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      chamber = ref[j];
      results.push(this.add(chamber));
    }
    return results;
  };

  return Foram;

})(THREE.Object3D);

var Simulation,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Simulation = (function() {
  function Simulation(canvas) {
    this.canvas = canvas;
    this.animate = bind(this.animate, this);
    this.setupScene();
    this.setupControls();
    this.setupGUI();
  }

  Simulation.prototype.setupScene = function() {
    var spotLight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 70);
    this.scene.add(this.camera);
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setClearColor(0x111111, 1);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    spotLight = new THREE.SpotLight(0xffffff);
    this.camera.add(spotLight);
    return this.canvas.append(this.renderer.domElement);
  };

  Simulation.prototype.setupControls = function() {
    this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
    this.controls.rotateSpeed = 5.0;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    return this.controls.keys = [65, 83, 68];
  };

  Simulation.prototype.setupGUI = function() {
    var genotype, structureAnalyzer;
    this.gui = new dat.GUI;
    genotype = {
      phi: 0.5,
      beta: 0.5,
      translationFactor: 0.5,
      growthFactor: 1.1,
      initialRadius: 5,
      numChambers: 7,
      simulate: (function(_this) {
        return function() {
          return _this.simulate(genotype);
        };
      })(this)
    };
    structureAnalyzer = {
      evolve: (function(_this) {
        return function() {
          return _this.foram.evolve();
        };
      })(this),
      regress: (function(_this) {
        return function() {
          return _this.foram.regress();
        };
      })(this)
    };
    this.gui.add(genotype, 'phi').step(0.01);
    this.gui.add(genotype, 'beta').step(0.01);
    this.gui.add(genotype, 'translationFactor').step(0.01);
    this.gui.add(genotype, 'growthFactor').step(0.01);
    this.gui.add(genotype, 'initialRadius');
    this.gui.add(genotype, 'numChambers');
    this.gui.add(genotype, 'simulate');
    this.gui.add(structureAnalyzer, 'evolve');
    return this.gui.add(structureAnalyzer, 'regress');
  };

  Simulation.prototype.simulate = function(genotype) {
    if (this.foram) {
      this.scene.remove(this.foram);
    }
    this.foram = new Foram(genotype);
    this.foram.buildChambers(genotype.numChambers);
    return this.scene.add(this.foram);
  };

  Simulation.prototype.animate = function() {
    requestAnimationFrame(this.animate);
    this.controls.update();
    return this.render();
  };

  Simulation.prototype.render = function() {
    return this.renderer.render(this.scene, this.camera);
  };

  return Simulation;

})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2NoYW1iZXIuY29mZmVlIiwianMvZm9yYW0uY29mZmVlIiwianMvc2ltdWxhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxPQUFBO0VBQUE7OztBQUFNOzs7b0JBRUosZUFBQSxHQUFpQjs7RUFFSixpQkFBQyxNQUFELEVBQVUsTUFBVjtBQUNYLFFBQUE7SUFEWSxJQUFDLENBQUEsU0FBRDtJQUFTLElBQUMsQ0FBQSxTQUFEO0lBQ3JCLFFBQUEsR0FBVyxJQUFDLENBQUEsb0JBQUQsQ0FBQTtJQUNYLFFBQUEsR0FBVyxJQUFDLENBQUEsb0JBQUQsQ0FBQTtJQUVYLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWCxDQUFnQixJQUFoQixFQUFtQixRQUFuQixFQUE2QixRQUE3QjtJQUVBLElBQUMsQ0FBQSxRQUFELEdBQVksUUFBUSxDQUFDO0lBQ3JCLElBQUMsQ0FBQSxNQUFELEdBQVksSUFBQyxDQUFBO0lBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsaUJBQUQsQ0FBQTtFQVJEOztvQkFVYixvQkFBQSxHQUFzQixTQUFBO0FBQ3BCLFFBQUE7SUFBQSx1QkFBQSxHQUEwQixJQUFDLENBQUEsNEJBQUQsQ0FBQTtJQUUxQixRQUFBLEdBQWUsSUFBQSxLQUFLLENBQUMsY0FBTixDQUFxQixJQUFDLENBQUEsTUFBdEIsRUFBOEIsRUFBOUIsRUFBa0MsRUFBbEM7SUFDZixRQUFRLENBQUMsV0FBVCxDQUFxQix1QkFBckI7V0FDQTtFQUxvQjs7b0JBT3RCLG9CQUFBLEdBQXNCLFNBQUE7V0FDaEIsSUFBQSxLQUFLLENBQUMsbUJBQU4sQ0FBMEI7TUFBRSxLQUFBLEVBQU8sUUFBVDtLQUExQjtFQURnQjs7b0JBR3RCLDRCQUFBLEdBQThCLFNBQUE7V0FDeEIsSUFBQSxLQUFLLENBQUMsT0FBTixDQUFBLENBQWUsQ0FBQyxlQUFoQixDQUFnQyxJQUFDLENBQUEsTUFBTSxDQUFDLENBQXhDLEVBQTJDLElBQUMsQ0FB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Q0FBQyxHQUFMLENBQVMsUUFBVCxFQUFtQixjQUFuQixDQUFrQyxDQUFDLElBQW5DLENBQXdDLElBQXhDO0lBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxHQUFMLENBQVMsUUFBVCxFQUFtQixlQUFuQjtJQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsR0FBTCxDQUFTLFFBQVQsRUFBbUIsYUFBbkI7SUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLEdBQUwsQ0FBUyxRQUFULEVBQW1CLFVBQW5CO0lBRUEsSUFBQyxDQUFBLEdBQUcsQ0FBQyxHQUFMLENBQVMsaUJBQVQsRUFBNEIsUUFBNUI7V0FDQSxJQUFDLENBQUEsR0FBRyxDQUFDLEdBQUwsQ0FBUyxpQkFBVCxFQUE0QixTQUE1QjtFQXpCUTs7dUJBMkJWLFFBQUEsR0FBVSxTQUFDLFFBQUQ7SUFDUixJQUF3QixJQUFDLENBQUEsS0FBekI7TUFBQSxJQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsQ0FBYyxJQUFDLENBQUEsS0FBZixFQUFBOztJQUVBLElBQUMsQ0FBQSxLQUFELEdBQWEsSUFBQSxLQUFBLENBQU0sUUFBTjtJQUNiLElBQUMsQ0FBQSxLQUFLLENBQUMsYUFBUCxDQUFxQixRQUFRLENBQUMsV0FBOUI7V0FFQSxJQUFDLENBQUEsS0FBSyxDQUFDLEdBQVAsQ0FBVyxJQUFDLENBQUEsS0FBWjtFQU5ROzt1QkFRVixPQUFBLEdBQVMsU0FBQTtJQUNQLHFCQUFBLENBQXNCLElBQUMsQ0FBQSxPQUF2QjtJQUVBLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixDQUFBO1dBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBQTtFQUpPOzt1QkFNVCxNQUFBLEdBQVEsU0FBQTtXQUNOLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixDQUFpQixJQUFDLENBQUEsS0FBbEIsRUFBeUIsSUFBQyxDQUFBLE1BQTFCO0VBRE0iLCJmaWxlIjoiZm9yYW1fM2QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBDaGFtYmVyIGV4dGVuZHMgVEhSRUUuTWVzaFxuXG4gIERFRkFVTFRfVEVYVFVSRTogXCIuLi9hc3NldHMvaW1hZ2VzL3RleHR1cmUuZ2lmXCJcblxuICBjb25zdHJ1Y3RvcjogKEBjZW50ZXIsIEByYWRpdXMpIC0+XG4gICAgZ2VvbWV0cnkgPSBAYnVpbGRDaGFtYmVyR2VvbWV0cnkoKVxuICAgIG1hdGVyaWFsID0gQGJ1aWxkQ2hhbWJlck1hdGVyaWFsKClcblxuICAgIFRIUkVFLk1lc2guY2FsbCBALCBnZW9tZXRyeSwgbWF0ZXJpYWxcblxuICAgIEB2ZXJ0aWNlcyA9IGdlb21ldHJ5LnZlcnRpY2VzXG4gICAgQG9yaWdpbiAgID0gQGNlbnRlclxuICAgIEBhcGVydHVyZSA9IEBjYWxjdWxhdGVBcGVydHVyZSgpXG5cbiAgYnVpbGRDaGFtYmVyR2VvbWV0cnk6IC0+XG4gICAgY2VudGVyVHJhbnNsYXRpb25NYXRyaXggPSBAYnVpbGRDZW50ZXJUcmFuc2xhdGlvbk1hdHJpeCgpXG5cbiAgICBnZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSBAcmFkaXVzLCAzMiwgMzJcbiAgICBnZW9tZXRyeS5hcHBseU1hdHJpeCBjZW50ZXJUcmFuc2xhdGlvbk1hdHJpeFxuICAgIGdlb21ldHJ5XG5cbiAgYnVpbGRDaGFtYmVyTWF0ZXJpYWw6IC0+XG4gICAgbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwgeyBjb2xvcjogMHhmZmZmZmYgfVxuXG4gIGJ1aWxkQ2VudGVyVHJhbnNsYXRpb25NYXRyaXg6IC0+XG4gICAgbmV3IFRIUkVFLk1hdHJpeDQoKS5tYWtlVHJhbnNsYXRpb24gQGNlbnRlci54LCBAY2VudGVyLnksIEBjZW50ZXIuelxuXG4gIGNhbGN1bGF0ZUFwZXJ0dXJlOiAtPlxuICAgIGFwZXJ0dXJlID0gQHZlcnRpY2VzWzBdXG4gICAgY3VycmVudERpc3RhbmNlID0gYXBlcnR1cmUuZGlzdGFuY2VUbyBAY2VudGVyXG5cbiAgICBmb3IgdmVydGV4IGluIEB2ZXJ0aWNlc1sxLi4tMV1cbiAgICAgIG5ld0Rpc3RhbmNlID0gdmVydGV4LmRpc3RhbmNlVG8gQGNlbnRlclxuXG4gICAgICBpZiBuZXdEaXN0YW5jZSA8IGN1cnJlbnREaXN0YW5jZVxuICAgICAgICBhcGVydHVyZSA9IHZlcnRleFxuICAgICAgICBjdXJyZW50RGlzdGFuY2UgPSBuZXdEaXN0YW5jZVxuXG4gICAgYXBlcnR1cmVcblxuICBzZXRBcGVydHVyZTogKGFwZXJ0dXJlKSAtPlxuICAgIEBhcGVydHVyZSA9IGFwZXJ0dXJlXG5cbiAgc2V0QW5jZXN0b3I6IChhbmNlc3RvcikgLT5cbiAgICBAYW5jZXN0b3IgPSBhbmNlc3RvclxuXG4gICAgaWYgYW5jZXN0b3JcbiAgICAgIEBvcmlnaW4gPSBhbmNlc3Rvci5hcGVydHVyZSBpZiBhbmNlc3RvclxuICAgICAgYW5jZXN0b3IuY2hpbGQgPSBAXG5cbiAgY2FsY3VsYXRlR2VvbWV0cnlSaW5nOiAtPlxuICAgIHZlcnRleCBmb3IgdmVydGV4IGluIEAuZ2VvbWV0cnkudmVydGljZXMgd2hlbiB2ZXJ0ZXgueiA9PSAwXG4iLCJjbGFzcyBGb3JhbSBleHRlbmRzIFRIUkVFLk9iamVjdDNEXG5cbiAgY29uc3RydWN0b3I6IChAZ2Vub3R5cGUpIC0+XG4gICAgVEhSRUUuT2JqZWN0M0QuY2FsbCBAXG5cbiAgICBpbml0aWFsQ2hhbWJlciA9IEBidWlsZEluaXRpYWxDaGFtYmVyKClcblxuICAgIEBjaGFtYmVycyA9IFtpbml0aWFsQ2hhbWJlcl1cbiAgICBAY3VycmVudENoYW1iZXIgPSBpbml0aWFsQ2hhbWJlclxuXG4gIGJ1aWxkSW5pdGlhbENoYW1iZXI6IC0+XG4gICAgbmV3IENoYW1iZXIobmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCksIEBnZW5vdHlwZS5pbml0aWFsUmFkaXVzKVxuXG4gIGJ1aWxkQ2hhbWJlcnM6IChudW1DaGFtYmVycykgLT5cbiAgICBAY2FsY3VsYXRlTmV4dENoYW1iZXIoKSBmb3IgaSBpbiBbMS4ubnVtQ2hhbWJlcnMtMV1cbiAgICBAYnVpbGQoKVxuXG4gIGV2b2x2ZTogLT5cbiAgICBjaGlsZCA9IEBjdXJyZW50Q2hhbWJlci5jaGlsZFxuXG4gICAgaWYgY2hpbGRcbiAgICAgIEBjdXJyZW50Q2hhbWJlciA9IGNoaWxkXG4gICAgICBAY3VycmVudENoYW1iZXIudmlzaWJsZSA9IHRydWVcbiAgICBlbHNlXG4gICAgICBAY2FsY3VsYXRlTmV4dENoYW1iZXIoKVxuICAgICAgQGJ1aWxkKClcblxuICByZWdyZXNzOiAtPlxuICAgIGFuY2VzdG9yID0gQGN1cnJlbnRDaGFtYmVyLmFuY2VzdG9yXG5cbiAgICBpZiBhbmNlc3RvclxuICAgICAgQGN1cnJlbnRDaGFtYmVyLnZpc2libGUgPSBmYWxzZVxuICAgICAgQGN1cnJlbnRDaGFtYmVyID0gYW5jZXN0b3JcblxuICBjYWxjdWxhdGVOZXh0Q2hhbWJlcjogLT5cbiAgICBuZXdDZW50ZXIgPSBAY2FsY3VsYXRlTmV3Q2VudGVyKClcbiAgICBuZXdSYWRpdXMgPSBAY2FsY3VsYXRlTmV3UmFkaXVzKClcblxuICAgIG5ld0NoYW1iZXIgPSBuZXcgQ2hhbWJlciBuZXdDZW50ZXIsIG5ld1JhZGl1c1xuXG4gICAgbmV3QXBlcnR1cmUgPSBAY2FsY3VsYXRlTmV3QXBlcnR1cmUgbmV3Q2hhbWJlclxuXG4gICAgbmV3Q2hhbWJlci5zZXRBcGVydHVyZSBuZXdBcGVydHVyZVxuICAgIG5ld0NoYW1iZXIuc2V0QW5jZXN0b3IgQGN1cnJlbnRDaGFtYmVyXG5cbiAgICBAY2hhbWJlcnMucHVzaCBuZXdDaGFtYmVyXG5cbiAgICBAY3VycmVudENoYW1iZXIgPSBuZXdDaGFtYmVyXG5cbiAgY2FsY3VsYXRlTmV3Q2VudGVyOiAtPlxuICAgIGN1cnJlbnRPcmlnaW4gICA9IEBjdXJyZW50Q2hhbWJlci5vcmlnaW5cbiAgICBjdXJyZW50QXBlcnR1cmUgPSBAY3VycmVudENoYW1iZXIuYXBlcnR1cmVcblxuICAgICMgY2FsY3VsYXRlIGluaXRpYWwgZ3Jvd3RoIHZlY3RvciAocmVmZXJlbmNlIGxpbmUpXG5cbiAgICBncm93dGhWZWN0b3IgPSBuZXcgVEhSRUUuVmVjdG9yM1xuICAgIGdyb3d0aFZlY3Rvci5zdWJWZWN0b3JzIGN1cnJlbnRBcGVydHVyZSwgY3VycmVudE9yaWdpblxuXG4gICAgIyBkZXZpYXRlIGdyb3d0aCB2ZWN0b3IgZnJvbSByZWZlcmVuY2UgbGluZVxuXG4gICAgaG9yaXpvbnRhbFJvdGF0aW9uQXhpcyA9IG5ldyBUSFJFRS5WZWN0b3IzIDAsIDAsIDFcbiAgICB2ZXJ0aWNhbFJvdGF0aW9uQXhpcyAgID0gbmV3IFRIUkVFLlZlY3RvcjMgMSwgMCwgMFxuXG4gICAgZ3Jvd3RoVmVjdG9yLmFwcGx5QXhpc0FuZ2xlIGhvcml6b250YWxSb3RhdGlvbkF4aXMsIEBnZW5vdHlwZS5waGlcbiAgICBncm93dGhWZWN0b3IuYXBwbHlBeGlzQW5nbGUgdmVydGljYWxSb3RhdGlvbkF4aXMsICAgQGdlbm90eXBlLmJldGFcblxuICAgICMgbXVsdGlwbHkgZ3Jvd3RoIHZlY3RvciBieSB0cmFuc2xhY3Rpb24gZmFjdG9yXG5cbiAgICBncm93dGhWZWN0b3Iubm9ybWFsaXplKClcbiAgICBncm93dGhWZWN0b3IubXVsdGlwbHlTY2FsYXIgQGdlbm90eXBlLnRyYW5zbGF0aW9uRmFjdG9yXG5cbiAgICAjIGNhbGN1bGF0ZSBjZW50ZXIgb2YgbmV3IGNoYW1iZXJcblxuICAgIG5ld0NlbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IzXG4gICAgbmV3Q2VudGVyLmNvcHkgY3VycmVudEFwZXJ0dXJlXG4gICAgbmV3Q2VudGVyLmFkZCBncm93dGhWZWN0b3JcblxuICAgIG5ld0NlbnRlclxuXG4gIGNhbGN1bGF0ZU5ld1JhZGl1czogLT5cbiAgICAoQGN1cnJlbnRDaGFtYmVyLmFuY2VzdG9yIHx8IEBjdXJyZW50Q2hhbWJlcikucmFkaXVzICogQGdlbm90eXBlLmdyb3d0aEZhY3RvclxuXG4gIGNhbGN1bGF0ZU5ld0FwZXJ0dXJlOiAobmV3Q2hhbWJlcikgLT5cbiAgICBuZXdDZW50ZXIgICA9IG5ld0NoYW1iZXIuY2VudGVyXG4gICAgbmV3QXBlcnR1cmUgPSBuZXdDaGFtYmVyLnZlcnRpY2VzWzBdXG5cbiAgICBjdXJyZW50RGlzdGFuY2UgPSBuZXdBcGVydHVyZS5kaXN0YW5jZVRvIG5ld0NlbnRlclxuXG4gICAgZm9yIHZlcnRleCBpbiBuZXdDaGFtYmVyLnZlcnRpY2VzWzEuLi0xXVxuICAgICAgbmV3RGlzdGFuY2UgPSB2ZXJ0ZXguZGlzdGFuY2VUbyBuZXdDZW50ZXJcblxuICAgICAgaWYgbmV3RGlzdGFuY2UgPCBjdXJyZW50RGlzdGFuY2VcbiAgICAgICAgY29udGFpbnMgPSBmYWxzZVxuXG4gICAgICAgIGZvciBjaGFtYmVyIGluIEBjaGFtYmVyc1xuICAgICAgICAgIGlmIGNoYW1iZXIucmFkaXVzID4gbmV3QXBlcnR1cmUuZGlzdGFuY2VUbyBjaGFtYmVyLmNlbnRlclxuICAgICAgICAgICAgY29udGFpbnMgPSB0cnVlXG4gICAgICAgICAgICBicmVha1xuXG4gICAgICAgIHVubGVzcyBjb250YWluc1xuICAgICAgICAgIG5ld0FwZXJ0dXJlID0gdmVydGV4XG4gICAgICAgICAgY3VycmVudERpc3RhbmNlID0gbmV3RGlzdGFuY2VcblxuICAgIG5ld0FwZXJ0dXJlXG5cbiAgYnVpbGQ6IC0+XG4gICAgQC5hZGQgY2hhbWJlciBmb3IgY2hhbWJlciBpbiBAY2hhbWJlcnNcbiIsIiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZvciBNciBXaGl0ZS4uLiBbKl1cbiNcbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9ffHx8fHx8X19cbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICB8XG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFteXVteXVxuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IF9fIHxcbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfF9fX198XG5cbmNsYXNzIFNpbXVsYXRpb25cblxuICBjb25zdHJ1Y3RvcjogKEBjYW52YXMpIC0+XG4gICAgQHNldHVwU2NlbmUoKVxuICAgIEBzZXR1cENvbnRyb2xzKClcbiAgICBAc2V0dXBHVUkoKVxuXG4gIHNldHVwU2NlbmU6IC0+XG4gICAgQHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKClcblxuICAgICMgY2FtZXJhXG5cbiAgICBAY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDQ1LCB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodCwgMC4xLCAxMDAwKVxuICAgIEBjYW1lcmEucG9zaXRpb24uc2V0IDAsIDAsIDcwXG4gICAgQHNjZW5lLmFkZCBAY2FtZXJhXG5cbiAgICAjIHJlbmRlcmVyXG5cbiAgICBAcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlciB7IGFscGhhOiB0cnVlLCBhbnRpYWxpYXM6IHRydWUgfVxuICAgIEByZW5kZXJlci5zZXRDbGVhckNvbG9yIDB4MTExMTExLCAxXG4gICAgQHJlbmRlcmVyLnNldFNpemUgd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodFxuXG4gICAgIyBsaWdodGluZ1xuXG4gICAgc3BvdExpZ2h0ID0gbmV3IFRIUkVFLlNwb3RMaWdodCAweGZmZmZmZlxuICAgIEBjYW1lcmEuYWRkIHNwb3RMaWdodFxuXG4gICAgQGNhbnZhcy5hcHBlbmQgQHJlbmRlcmVyLmRvbUVsZW1lbnRcblxuICBzZXR1cENvbnRyb2xzOiAtPlxuICAgIEBjb250cm9scyA9IG5ldyBUSFJFRS5UcmFja2JhbGxDb250cm9scyBAY2FtZXJhLCBAcmVuZGVyZXIuZG9tRWxlbWVudFxuXG4gICAgQGNvbnRyb2xzLnJvdGF0ZVNwZWVkID0gNS4wXG4gICAgQGNvbnRyb2xzLnpvb21TcGVlZCAgID0gMS4yXG4gICAgQGNvbnRyb2xzLnBhblNwZWVkICAgID0gMC44XG5cbiAgICBAY29udHJvbHMubm9ab29tID0gZmFsc2VcbiAgICBAY29udHJvbHMubm9QYW4gID0gZmFsc2VcblxuICAgIEBjb250cm9scy5zdGF0aWNNb3ZpbmcgPSB0cnVlXG5cbiAgICBAY29udHJvbHMuZHluYW1pY0RhbXBpbmdGYWN0b3IgPSAwLjNcblxuICAgIEBjb250cm9scy5rZXlzID0gWzY1LCA4MywgNjhdXG5cbiAgc2V0dXBHVUk6IC0+XG4gICAgQGd1aSA9IG5ldyBkYXQuR1VJXG5cbiAgICBnZW5vdHlwZSA9XG4gICAgICBwaGk6ICAgICAgICAgICAgICAgMC41XG4gICAgICBiZXRhOiAgICAgICAgICAgICAgMC41XG4gICAgICB0cmFuc2xhdGlvbkZhY3RvcjogMC41XG4gICAgICBncm93dGhGYWN0b3I6ICAgICAgMS4xXG4gICAgICBpbml0aWFsUmFkaXVzOiAgICAgNVxuICAgICAgbnVtQ2hhbWJlcnM6ICAgICAgIDdcbiAgICAgIHNpbXVsYXRlOiAgICAgICAgICA9PiBAc2ltdWxhdGUoZ2Vub3R5cGUpXG5cbiAgICBzdHJ1Y3R1cmVBbmFseXplciA9XG4gICAgICBldm9sdmU6ICA9PiBAZm9yYW0uZXZvbHZlKClcbiAgICAgIHJlZ3Jlc3M6ID0+IEBmb3JhbS5yZWdyZXNzKClcblxuICAgIEBndWkuYWRkKGdlbm90eXBlLCAncGhpJykuc3RlcCAwLjAxXG4gICAgQGd1aS5hZGQoZ2Vub3R5cGUsICdiZXRhJykuc3RlcCAwLjAxXG4gICAgQGd1aS5hZGQoZ2Vub3R5cGUsICd0cmFuc2xhdGlvbkZhY3RvcicpLnN0ZXAgMC4wMVxuICAgIEBndWkuYWRkKGdlbm90eXBlLCAnZ3Jvd3RoRmFjdG9yJykuc3RlcCAwLjAxXG4gICAgQGd1aS5hZGQoZ2Vub3R5cGUsICdpbml0aWFsUmFkaXVzJylcbiAgICBAZ3VpLmFkZChnZW5vdHlwZSwgJ251bUNoYW1iZXJzJylcbiAgICBAZ3VpLmFkZChnZW5vdHlwZSwgJ3NpbXVsYXRlJylcblxuICAgIEBndWkuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAnZXZvbHZlJylcbiAgICBAZ3VpLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ3JlZ3Jlc3MnKVxuXG4gIHNpbXVsYXRlOiAoZ2Vub3R5cGUpIC0+XG4gICAgQHNjZW5lLnJlbW92ZSBAZm9yYW0gaWYgQGZvcmFtXG5cbiAgICBAZm9yYW0gPSBuZXcgRm9yYW0gZ2Vub3R5cGVcbiAgICBAZm9yYW0uYnVpbGRDaGFtYmVycyBnZW5vdHlwZS5udW1DaGFtYmVyc1xuXG4gICAgQHNjZW5lLmFkZCBAZm9yYW1cblxuICBhbmltYXRlOiA9PlxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSBAYW5pbWF0ZVxuXG4gICAgQGNvbnRyb2xzLnVwZGF0ZSgpXG4gICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEByZW5kZXJlci5yZW5kZXIgQHNjZW5lLCBAY2FtZXJhXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=