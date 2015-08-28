var Chamber,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chamber = (function(superClass) {
  extend(Chamber, superClass);

  Chamber.prototype.DEFAULT_TEXTURE = "assets/images/texture.gif";

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
    var texture;
    texture = THREE.ImageUtils.loadTexture(this.DEFAULT_TEXTURE);
    return new THREE.MeshLambertMaterial({
      color: 0xffffff,
      map: texture
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYW1iZXIuY29mZmVlIiwiZm9yYW0uY29mZmVlIiwic2ltdWxhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxPQUFBO0VBQUE7OztBQUFNOzs7b0JBRUosZUFBQSxHQUFpQjs7RUFFSixpQkFBQyxNQUFELEVBQVUsTUFBVjtBQUNYLFFBQUE7SUFEWSxJQUFDLENBQUEsU0FBRDtJQUFTLElBQUMsQ0FBQSxTQUFEO0lBQ3JCLFFBQUEsR0FBVyxJQUFDLENBQUEsb0JBQUQsQ0FBQTtJQUNYLFFBQUEsR0FBVyxJQUFDLENBQUEsb0JBQUQsQ0FBQTtJQUVYLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWCxDQUFnQixJQUFoQixFQUFtQixRQUFuQixFQUE2QixRQUE3QjtJQUVBLElBQUMsQ0FBQSxRQUFELEdBQVksUUFBUSxDQUFDO0lBQ3JCLElBQUMsQ0FBQSxNQUFELEdBQVksSUFBQyxDQUFBO0lBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsaUJBQUQsQ0FBQTtFQVJEOztvQkFVYixvQkFBQSxHQUFzQixTQUFBO0FBQ3BCLFFBQUE7SUFBQSx1QkFBQSxHQUEwQixJQUFDLENBQUEsNEJBQUQsQ0FBQTtJQUUxQixRQUFBLEdBQWUsSUFBQSxLQUFLLENBQUMsY0FBTixDQUFxQixJQUFDLENBQUEsTUFBdEIsRUFBOEIsRUFBOUIsRUFBa0MsRUFBbEM7SUFDZixRQUFRLENBQUMsV0FBVCxDQUFxQix1QkFBckI7V0FDQTtFQUxvQjs7b0JBT3RCLG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsUUFBQTtJQUFBLE9BQUEsR0FBVSxLQUFLLENBQUMsVUFBVSxDQUFDLFdBQWpCLENBQTZCLElBQUMsQ0FBQSxlQUE5QjtXQUVOLElBQUEsS0FBSyxDQUFDLG1CQUFOLENBQTBCO01BQUUsS0FBQSxFQUFPLFFBQVQ7TUFBbUIsR0FBQSxFQUFLLE9BQXhCO0tBQTFCO0VBSGdCOztvQkFLdEIsNEJBQUEsR0FBOEIsU0FBQTtXQUN4QixJQUFBLEtBQUssQ0FBQyxPQUFOLENBQUEsQ0FBZSxDQUFDLGVBQWhCLENBQWdDLElBQUMsQ0FBQSxNQUFNLENBQUMsQ0FBeEMsRUFBMkMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxDQUFuRCxFQUFzRCxJQUFDLENBQUEsTUFBTSxDQUFDLENBQTlEO0VBRHdCOztvQkFHOUIsaUJBQUEsR0FBbUIsU0FBQTtBQUNqQixRQUFBO0lBQUEsUUFBQSxHQUFXLElBQUMsQ0FBQSxRQUFTLENBQUEsQ0FBQTtJQUNyQixlQUFBLEdBQWtCLFFBQVEsQ0FBQyxVQUFULENBQW9CLElBQUMsQ0FBQSxNQUFyQjtBQUVsQjtBQUFBLFNBQUEscUNBQUE7O01BQ0UsV0FBQSxHQUFjLE1BQU0sQ0FBQyxVQUFQLENBQWtCLElBQUMsQ0FBQSxNQUFuQjtNQUVkLElBQUcsV0FBQSxHQUFjLGVBQWpCO1FBQ0UsUUFBQSxHQUFXO1FBQ1gsZUFBQSxHQUFrQixZQUZwQjs7QUFIRjtXQU9BO0VBWGlCOztvQkFhbkIsV0FBQSxHQUFhLFNBQUMsUUFBRDtXQUNYLElBQUMsQ0FBQSxRQUFELEdBQVk7RUFERDs7b0JBR2IsV0FBQSxHQUFhLFNBQUMsUUFBRDtJQUNYLElBQUMsQ0FBQSxRQUFELEdBQVk7SUFFWixJQUFHLFFBQUg7TUFDRSxJQUErQixRQUEvQjtRQUFBLElBQUMsQ0FBQSxNQUFELEdBQVUsUUFBUSxDQUFDLFNBQW5COzthQUNBLFFBQVEsQ0FBQyxLQUFULEdBQWlCLEtBRm5COztFQUhXOztvQkFPYixxQkFBQSxHQUF1QixTQUFBO0FBQ3JCLFFBQUE7QUFBQTtBQUFBO1NBQUEscUNBQUE7O1VBQThDLE1BQU0sQ0FBQyxDQUFQLEtBQVk7cUJBQTFEOztBQUFBOztFQURxQjs7OztHQXBESCxLQUFLLENBQUM7O0FDQTVCLElBQUEsS0FBQTtFQUFBOzs7QUFBTTs7O0VBRVMsZUFBQyxRQUFEO0FBQ1gsUUFBQTtJQURZLElBQUMsQ0FBQSxXQUFEO0lBQ1osS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFmLENBQW9CLElBQXBCO0lBRUEsY0FBQSxHQUFpQixJQUFDLENBQUEsbUJBQUQsQ0FBQTtJQUVqQixJQUFDLENBQUEsUUFBRCxHQUFZLENBQUMsY0FBRDtJQUNaLElBQUMsQ0FBQSxjQUFELEdBQWtCO0VBTlA7O2tCQVFiLG1CQUFBLEdBQXFCLFNBQUE7V0FDZixJQUFBLE9BQUEsQ0FBWSxJQUFBLEtBQUssQ0FBQyxPQUFOLENBQWMsQ0FBZCxFQUFpQixDQUFqQixFQUFvQixDQUFwQixDQUFaLEVBQW9DLElBQUMsQ0FBQSxRQUFRLENBQUMsYUFBOUM7RUFEZTs7a0JBR3JCLGFBQUEsR0FBZSxTQUFDLFdBQUQ7QUFDYixRQUFBO0FBQUEsU0FBaUMsMEZBQWpDO01BQUEsSUFBQyxDQUFBLG9CQUFELENBQUE7QUFBQTtXQUNBLElBQUMsQ0FBQSxLQUFELENBQUE7RUFGYTs7a0JBSWYsTUFBQSxHQUFRLFNBQUE7QUFDTixRQUFBO0lBQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxjQUFjLENBQUM7SUFFeEIsSUFBRyxLQUFIO01BQ0UsSUFBQyxDQUFBLGNBQUQsR0FBa0I7YUFDbEIsSUFBQyxDQUFBLGNBQWMsQ0FBQyxPQUFoQixHQUEwQixLQUY1QjtLQUFBLE1BQUE7TUFJRSxJQUFDLENBQUEsb0JBQUQsQ0FBQTthQUNBLElBQUMsQ0FBQSxLQUFELENBQUEsRUFMRjs7RUFITTs7a0JBVVIsT0FBQSxHQUFTLFNBQUE7QUFDUCxRQUFBO0lBQUEsUUFBQSxHQUFXLElBQUMsQ0FBQSxjQUFjLENBQUM7SUFFM0IsSUFBRyxRQUFIO01BQ0UsSUFBQyxDQUFBLGNBQWMsQ0FBQyxPQUFoQixHQUEwQjthQUMxQixJQUFDLENBQUEsY0FBRCxHQUFrQixTQUZwQjs7RUFITzs7a0JBT1Qsb0JBQUEsR0FBc0IsU0FBQTtBQUNwQixRQUFBO0lBQUEsU0FBQSxHQUFZLElBQUMsQ0FBQSxrQkFBRCxDQUFBO0lBQ1osU0FBQSxHQUFZLElBQUMsQ0FBQSxrQkFBRCxDQUFBO0lBRVosVUFBQSxHQUFpQixJQUFBLE9BQUEsQ0FBUSxTQUFSLEVBQW1CLFNBQW5CO0lBRWpCLFdBQUEsR0FBYyxJQUFDLENBQUEsb0JBQUQsQ0FBc0IsVUFBdEI7SUFFZCxVQUFVLENBQUMsV0FBWCxDQUF1QixXQUF2QjtJQUNBLFVBQVUsQ0FBQyxXQUFYLENBQXVCLElBQUMsQ0FBQSxjQUF4QjtJQUVBLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBVixDQUFlLFVBQWY7V0FFQSxJQUFDLENBQUEsY0FBRCxHQUFrQjtFQWJFOztrQkFldEIsa0JBQUEsR0FBb0IsU0FBQTtBQUNsQixRQUFBO0lBQUEsYUFBQSxHQUFrQixJQUFDLENBQUEsY0FBYyxDQUFDO0lBQ2xDLGVBQUEsR0FBa0IsSUFBQyxDQUFBLGNBQWMsQ0FBQztJQUlsQyxZQUFBLEdBQWUsSUFBSSxLQUFLLENBQUM7SUFDekIsWUFBWSxDQUFDLFVBQWIsQ0FBd0IsZUFBeEIsRUFBeUMsYUFBekM7SUFJQSxzQkFBQSxHQUE2QixJQUFBLEtBQUssQ0FBQyxPQUFOLENBQWMsQ0FBZCxFQUFpQixDQUFqQixFQUFvQixDQUFwQjtJQUM3QixvQkFBQSxHQUE2QixJQUFBLEtBQUssQ0FBQyxPQUFOLENBQWMsQ0FBZCxFQUFpQixDQUFqQixFQUFvQixDQUFwQjtJQUU3QixZQUFZLENBQUMsY0FBYixDQUE0QixzQkFBNUIsRUFBb0QsSUFBQyxDQUFBLFFBQVEsQ0FBQyxHQUE5RDtJQUNBLFlBQVksQ0FBQyxjQUFiLENBQTRCLG9CQUE1QixFQUFvRCxJQUFDLENBQUEsUUFBUSxDQUFDLElBQTlEO0lBSUEsWUFBWSxDQUFDLFNBQWIsQ0FBQTtJQUNBLFlBQVksQ0FBQyxjQUFiLENBQTRCLElBQUMsQ0FBQSxRQUFRLENBQUMsaUJBQXRDO0lBSUEsU0FBQSxHQUFZLElBQUksS0FBSyxDQUFDO0lBQ3RCLFNBQVMsQ0FBQyxJQUFWLENBQWUsZUFBZjtJQUNBLFNBQVMsQ0FBQyxHQUFWLENBQWMsWUFBZDtXQUVBO0VBNUJrQjs7a0JBOEJwQixrQkFBQSxHQUFvQixTQUFBO1dBQ2xCLENBQUMsSUFBQyxDQUFBLGNBQWMsQ0FBQyxRQUFoQixJQUE0QixJQUFDLENBQUEsY0FBOUIsQ0FBNkMsQ0FBQyxNQUE5QyxHQUF1RCxJQUFDLENBQUEsUUFBUSxDQUFDO0VBRC9DOztrQkFHcEIsb0JBQUEsR0FBc0IsU0FBQyxVQUFEO0FBQ3BCLFFBQUE7SUFBQSxTQUFBLEdBQWMsVUFBVSxDQUFDO0lBQ3pCLFdBQUEsR0FBYyxVQUFVLENBQUMsUUFBUyxDQUFBLENBQUE7SUFFbEMsZUFBQSxHQUFrQixXQUFXLENBQUMsVUFBWixDQUF1QixTQUF2QjtBQUVsQjtBQUFBLFNBQUEscUNBQUE7O01BQ0UsV0FBQSxHQUFjLE1BQU0sQ0FBQyxVQUFQLENBQWtCLFNBQWxCO01BRWQsSUFBRyxXQUFBLEdBQWMsZUFBakI7UUFDRSxRQUFBLEdBQVc7QUFFWDtBQUFBLGFBQUEsd0NBQUE7O1VBQ0UsSUFBRyxPQUFPLENBQUMsTUFBUixHQUFpQixXQUFXLENBQUMsVUFBWixDQUF1QixPQUFPLENBQUMsTUFBL0IsQ0FBcEI7WUFDRSxRQUFBLEdBQVc7QUFDWCxrQkFGRjs7QUFERjtRQUtBLElBQUEsQ0FBTyxRQUFQO1VBQ0UsV0FBQSxHQUFjO1VBQ2QsZUFBQSxHQUFrQixZQUZwQjtTQVJGOztBQUhGO1dBZUE7RUFyQm9COztrQkF1QnRCLEtBQUEsR0FBTyxTQUFBO0FBQ0wsUUFBQTtBQUFBO0FBQUE7U0FBQSxxQ0FBQTs7bUJBQUEsSUFBQyxDQUFDLEdBQUYsQ0FBTSxPQUFOO0FBQUE7O0VBREs7Ozs7R0F6R1csS0FBSyxDQUFDOztBQ1ExQixJQUFBLFVBQUE7RUFBQTs7QUFBTTtFQUVTLG9CQUFDLE1BQUQ7SUFBQyxJQUFDLENBQUEsU0FBRDs7SUFDWixJQUFDLENBQUEsVUFBRCxDQUFBO0lBQ0EsSUFBQyxDQUFBLGFBQUQsQ0FBQTtJQUNBLElBQUMsQ0FBQSxRQUFELENBQUE7RUFIVzs7dUJBS2IsVUFBQSxHQUFZLFNBQUE7QUFDVixRQUFBO0lBQUEsSUFBQyxDQUFBLEtBQUQsR0FBYSxJQUFBLEtBQUssQ0FBQyxLQUFOLENBQUE7SUFJYixJQUFDLENBQUEsTUFBRCxHQUFjLElBQUEsS0FBSyxDQUFDLGlCQUFOLENBQXdCLEVBQXhCLEVBQTRCLE1BQU0sQ0FBQyxVQUFQLEdBQW9CLE1BQU0sQ0FBQyxXQUF2RCxFQUFvRSxHQUFwRSxFQUF5RSxJQUF6RTtJQUNkLElBQUMsQ0FBQSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQWpCLENBQXFCLENBQXJCLEVBQXdCLENBQXhCLEVBQTJCLEVBQTNCO0lBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFQLENBQVcsSUFBQyxDQUFBLE1BQVo7SUFJQSxJQUFDLENBQUEsUUFBRCxHQUFnQixJQUFBLEtBQUssQ0FBQyxhQUFOLENBQW9CO01BQUUsS0FBQSxFQUFPLElBQVQ7TUFBZSxTQUFBLEVBQVcsSUFBMUI7S0FBcEI7SUFDaEIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxhQUFWLENBQXdCLFFBQXhCLEVBQWtDLENBQWxDO0lBQ0EsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFWLENBQWtCLE1BQU0sQ0FBQyxVQUF6QixFQUFxQyxNQUFNLENBQUMsV0FBNUM7SUFJQSxTQUFBLEdBQWdCLElBQUEsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsUUFBaEI7SUFDaEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxHQUFSLENBQVksU0FBWjtXQUVBLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixDQUFlLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFBekI7RUFwQlU7O3VCQXNCWixhQUFBLEdBQWUsU0FBQTtJQUNiLElBQUMsQ0FBQSxRQUFELEdBQWdCLElBQUEsS0FBSyxDQUFDLGlCQUFOLENBQXdCLElBQUMsQ0FBQSxNQUF6QixFQUFpQyxJQUFDLENBQUEsUUFBUSxDQUFDLFVBQTNDO0lBRWhCLElBQUMsQ0FBQSxRQUFRLENBQUMsV0FBVixHQUF3QjtJQUN4QixJQUFDLENBQUEsUUFBUSxDQUFDLFNBQVYsR0FBd0I7SUFDeEIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxRQUFWLEdBQXdCO0lBRXhCLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixHQUFtQjtJQUNuQixJQUFDLENBQUEsUUFBUSxDQUFDLEtBQVYsR0FBbUI7SUFFbkIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxZQUFWLEdBQXlCO0lBRXpCLElBQUMsQ0FBQSxRQUFRLENBQUMsb0JBQVYsR0FBaUM7V0FFakMsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUFWLEdBQWlCLENBQUMsRUFBRCxFQUFLLEVBQUwsRUFBUyxFQUFUO0VBZEo7O3VCQWdCZixRQUFBLEdBQVUsU0FBQTtBQUNSLFFBQUE7SUFBQSxJQUFDLENBQUEsR0FBRCxHQUFPLElBQUksR0FBRyxDQUFDO0lBRWYsUUFBQSxHQUNFO01BQUEsR0FBQSxFQUFtQixHQUFuQjtNQUNBLElBQUEsRUFBbUIsR0FEbkI7TUFFQSxpQkFBQSxFQUFtQixHQUZuQjtNQUdBLFlBQUEsRUFBbUIsR0FIbkI7TUFJQSxhQUFBLEVBQW1CLENBSm5CO01BS0EsV0FBQSxFQUFtQixDQUxuQjtNQU1BLFFBQUEsRUFBbUIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxRQUFELENBQVUsUUFBVjtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQU5uQjs7SUFRRixpQkFBQSxHQUNFO01BQUEsTUFBQSxFQUFTLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsS0FBSyxDQUFDLE1BQVAsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFUO01BQ0EsT0FBQSxFQUFTLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFBRyxLQUFDLENBQUEsS0FBSyxDQUFDLE9BQVAsQ0FBQTtRQUFIO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQURUOztJQUdGLElBQUMsQ0FBQSxHQUFHLENBQUMsR0FBTCxDQUFTLFFBQVQsRUFBbUIsS0FBbkIsQ0FBeUIsQ0FBQyxJQUExQixDQUErQixJQUEvQjtJQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsR0FBTCxDQUFTLFFBQVQsRUFBbUIsTUFBbkIsQ0FBMEIsQ0FBQyxJQUEzQixDQUFnQyxJQUFoQztJQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsR0FBTCxDQUFTLFFBQVQsRUFBbUIsbUJBQW5CLENBQXVDLENBQUMsSUFBeEMsQ0FBNkMsSUFBN0M7SUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLEdBQUwsQ0FBUyxRQUFULEVBQW1CLGNBQW5CLENBQWtDLENBQUMsSUFBbkMsQ0FBd0MsSUFBeEM7SUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLEdBQUwsQ0FBUyxRQUFULEVBQW1CLGVBQW5CO0lBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxHQUFMLENBQVMsUUFBVCxFQUFtQixhQUFuQjtJQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsR0FBTCxDQUFTLFFBQVQsRUFBbUIsVUFBbkI7SUFFQSxJQUFDLENBQUEsR0FBRyxDQUFDLEdBQUwsQ0FBUyxpQkFBVCxFQUE0QixRQUE1QjtXQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsR0FBTCxDQUFTLGlCQUFULEVBQTRCLFNBQTVCO0VBekJROzt1QkEyQlYsUUFBQSxHQUFVLFNBQUMsUUFBRDtJQUNSLElBQXdCLElBQUMsQ0FBQSxLQUF6QjtNQUFBLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFjLElBQUMsQ0FBQSxLQUFmLEVBQUE7O0lBRUEsSUFBQyxDQUFBLEtBQUQsR0FBYSxJQUFBLEtBQUEsQ0FBTSxRQUFOO0lBQ2IsSUFBQyxDQUFBLEtBQUssQ0FBQyxhQUFQLENBQXFCLFFBQVEsQ0FBQyxXQUE5QjtXQUVBLElBQUMsQ0FBQSxLQUFLLENBQUMsR0FBUCxDQUFXLElBQUMsQ0FBQSxLQUFaO0VBTlE7O3VCQVFWLE9BQUEsR0FBUyxTQUFBO0lBQ1AscUJBQUEsQ0FBc0IsSUFBQyxDQUFBLE9BQXZCO0lBRUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLENBQUE7V0FDQSxJQUFDLENBQUEsTUFBRCxDQUFBO0VBSk87O3VCQU1ULE1BQUEsR0FBUSxTQUFBO1dBQ04sSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLENBQWlCLElBQUMsQ0FBQSxLQUFsQixFQUF5QixJQUFDLENBQUEsTUFBMUI7RUFETSIsImZpbGUiOiJmb3JhbV8zZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIENoYW1iZXIgZXh0ZW5kcyBUSFJFRS5NZXNoXG5cbiAgREVGQVVMVF9URVhUVVJFOiBcImFzc2V0cy9pbWFnZXMvdGV4dHVyZS5naWZcIlxuXG4gIGNvbnN0cnVjdG9yOiAoQGNlbnRlciwgQHJhZGl1cykgLT5cbiAgICBnZW9tZXRyeSA9IEBidWlsZENoYW1iZXJHZW9tZXRyeSgpXG4gICAgbWF0ZXJpYWwgPSBAYnVpbGRDaGFtYmVyTWF0ZXJpYWwoKVxuXG4gICAgVEhSRUUuTWVzaC5jYWxsIEAsIGdlb21ldHJ5LCBtYXRlcmlhbFxuXG4gICAgQHZlcnRpY2VzID0gZ2VvbWV0cnkudmVydGljZXNcbiAgICBAb3JpZ2luICAgPSBAY2VudGVyXG4gICAgQGFwZXJ0dXJlID0gQGNhbGN1bGF0ZUFwZXJ0dXJlKClcblxuICBidWlsZENoYW1iZXJHZW9tZXRyeTogLT5cbiAgICBjZW50ZXJUcmFuc2xhdGlvbk1hdHJpeCA9IEBidWlsZENlbnRlclRyYW5zbGF0aW9uTWF0cml4KClcblxuICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5IEByYWRpdXMsIDMyLCAzMlxuICAgIGdlb21ldHJ5LmFwcGx5TWF0cml4IGNlbnRlclRyYW5zbGF0aW9uTWF0cml4XG4gICAgZ2VvbWV0cnlcblxuICBidWlsZENoYW1iZXJNYXRlcmlhbDogLT5cbiAgICB0ZXh0dXJlID0gVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSBAREVGQVVMVF9URVhUVVJFXG5cbiAgICBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCB7IGNvbG9yOiAweGZmZmZmZiwgbWFwOiB0ZXh0dXJlIH1cblxuICBidWlsZENlbnRlclRyYW5zbGF0aW9uTWF0cml4OiAtPlxuICAgIG5ldyBUSFJFRS5NYXRyaXg0KCkubWFrZVRyYW5zbGF0aW9uIEBjZW50ZXIueCwgQGNlbnRlci55LCBAY2VudGVyLnpcblxuICBjYWxjdWxhdGVBcGVydHVyZTogLT5cbiAgICBhcGVydHVyZSA9IEB2ZXJ0aWNlc1swXVxuICAgIGN1cnJlbnREaXN0YW5jZSA9IGFwZXJ0dXJlLmRpc3RhbmNlVG8gQGNlbnRlclxuXG4gICAgZm9yIHZlcnRleCBpbiBAdmVydGljZXNbMS4uLTFdXG4gICAgICBuZXdEaXN0YW5jZSA9IHZlcnRleC5kaXN0YW5jZVRvIEBjZW50ZXJcblxuICAgICAgaWYgbmV3RGlzdGFuY2UgPCBjdXJyZW50RGlzdGFuY2VcbiAgICAgICAgYXBlcnR1cmUgPSB2ZXJ0ZXhcbiAgICAgICAgY3VycmVudERpc3RhbmNlID0gbmV3RGlzdGFuY2VcblxuICAgIGFwZXJ0dXJlXG5cbiAgc2V0QXBlcnR1cmU6IChhcGVydHVyZSkgLT5cbiAgICBAYXBlcnR1cmUgPSBhcGVydHVyZVxuXG4gIHNldEFuY2VzdG9yOiAoYW5jZXN0b3IpIC0+XG4gICAgQGFuY2VzdG9yID0gYW5jZXN0b3JcblxuICAgIGlmIGFuY2VzdG9yXG4gICAgICBAb3JpZ2luID0gYW5jZXN0b3IuYXBlcnR1cmUgaWYgYW5jZXN0b3JcbiAgICAgIGFuY2VzdG9yLmNoaWxkID0gQFxuXG4gIGNhbGN1bGF0ZUdlb21ldHJ5UmluZzogLT5cbiAgICB2ZXJ0ZXggZm9yIHZlcnRleCBpbiBALmdlb21ldHJ5LnZlcnRpY2VzIHdoZW4gdmVydGV4LnogPT0gMFxuIiwiY2xhc3MgRm9yYW0gZXh0ZW5kcyBUSFJFRS5PYmplY3QzRFxuXG4gIGNvbnN0cnVjdG9yOiAoQGdlbm90eXBlKSAtPlxuICAgIFRIUkVFLk9iamVjdDNELmNhbGwgQFxuXG4gICAgaW5pdGlhbENoYW1iZXIgPSBAYnVpbGRJbml0aWFsQ2hhbWJlcigpXG5cbiAgICBAY2hhbWJlcnMgPSBbaW5pdGlhbENoYW1iZXJdXG4gICAgQGN1cnJlbnRDaGFtYmVyID0gaW5pdGlhbENoYW1iZXJcblxuICBidWlsZEluaXRpYWxDaGFtYmVyOiAtPlxuICAgIG5ldyBDaGFtYmVyKG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApLCBAZ2Vub3R5cGUuaW5pdGlhbFJhZGl1cylcblxuICBidWlsZENoYW1iZXJzOiAobnVtQ2hhbWJlcnMpIC0+XG4gICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKCkgZm9yIGkgaW4gWzEuLm51bUNoYW1iZXJzLTFdXG4gICAgQGJ1aWxkKClcblxuICBldm9sdmU6IC0+XG4gICAgY2hpbGQgPSBAY3VycmVudENoYW1iZXIuY2hpbGRcblxuICAgIGlmIGNoaWxkXG4gICAgICBAY3VycmVudENoYW1iZXIgPSBjaGlsZFxuICAgICAgQGN1cnJlbnRDaGFtYmVyLnZpc2libGUgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKClcbiAgICAgIEBidWlsZCgpXG5cbiAgcmVncmVzczogLT5cbiAgICBhbmNlc3RvciA9IEBjdXJyZW50Q2hhbWJlci5hbmNlc3RvclxuXG4gICAgaWYgYW5jZXN0b3JcbiAgICAgIEBjdXJyZW50Q2hhbWJlci52aXNpYmxlID0gZmFsc2VcbiAgICAgIEBjdXJyZW50Q2hhbWJlciA9IGFuY2VzdG9yXG5cbiAgY2FsY3VsYXRlTmV4dENoYW1iZXI6IC0+XG4gICAgbmV3Q2VudGVyID0gQGNhbGN1bGF0ZU5ld0NlbnRlcigpXG4gICAgbmV3UmFkaXVzID0gQGNhbGN1bGF0ZU5ld1JhZGl1cygpXG5cbiAgICBuZXdDaGFtYmVyID0gbmV3IENoYW1iZXIgbmV3Q2VudGVyLCBuZXdSYWRpdXNcblxuICAgIG5ld0FwZXJ0dXJlID0gQGNhbGN1bGF0ZU5ld0FwZXJ0dXJlIG5ld0NoYW1iZXJcblxuICAgIG5ld0NoYW1iZXIuc2V0QXBlcnR1cmUgbmV3QXBlcnR1cmVcbiAgICBuZXdDaGFtYmVyLnNldEFuY2VzdG9yIEBjdXJyZW50Q2hhbWJlclxuXG4gICAgQGNoYW1iZXJzLnB1c2ggbmV3Q2hhbWJlclxuXG4gICAgQGN1cnJlbnRDaGFtYmVyID0gbmV3Q2hhbWJlclxuXG4gIGNhbGN1bGF0ZU5ld0NlbnRlcjogLT5cbiAgICBjdXJyZW50T3JpZ2luICAgPSBAY3VycmVudENoYW1iZXIub3JpZ2luXG4gICAgY3VycmVudEFwZXJ0dXJlID0gQGN1cnJlbnRDaGFtYmVyLmFwZXJ0dXJlXG5cbiAgICAjIGNhbGN1bGF0ZSBpbml0aWFsIGdyb3d0aCB2ZWN0b3IgKHJlZmVyZW5jZSBsaW5lKVxuXG4gICAgZ3Jvd3RoVmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjNcbiAgICBncm93dGhWZWN0b3Iuc3ViVmVjdG9ycyBjdXJyZW50QXBlcnR1cmUsIGN1cnJlbnRPcmlnaW5cblxuICAgICMgZGV2aWF0ZSBncm93dGggdmVjdG9yIGZyb20gcmVmZXJlbmNlIGxpbmVcblxuICAgIGhvcml6b250YWxSb3RhdGlvbkF4aXMgPSBuZXcgVEhSRUUuVmVjdG9yMyAwLCAwLCAxXG4gICAgdmVydGljYWxSb3RhdGlvbkF4aXMgICA9IG5ldyBUSFJFRS5WZWN0b3IzIDEsIDAsIDBcblxuICAgIGdyb3d0aFZlY3Rvci5hcHBseUF4aXNBbmdsZSBob3Jpem9udGFsUm90YXRpb25BeGlzLCBAZ2Vub3R5cGUucGhpXG4gICAgZ3Jvd3RoVmVjdG9yLmFwcGx5QXhpc0FuZ2xlIHZlcnRpY2FsUm90YXRpb25BeGlzLCAgIEBnZW5vdHlwZS5iZXRhXG5cbiAgICAjIG11bHRpcGx5IGdyb3d0aCB2ZWN0b3IgYnkgdHJhbnNsYWN0aW9uIGZhY3RvclxuXG4gICAgZ3Jvd3RoVmVjdG9yLm5vcm1hbGl6ZSgpXG4gICAgZ3Jvd3RoVmVjdG9yLm11bHRpcGx5U2NhbGFyIEBnZW5vdHlwZS50cmFuc2xhdGlvbkZhY3RvclxuXG4gICAgIyBjYWxjdWxhdGUgY2VudGVyIG9mIG5ldyBjaGFtYmVyXG5cbiAgICBuZXdDZW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yM1xuICAgIG5ld0NlbnRlci5jb3B5IGN1cnJlbnRBcGVydHVyZVxuICAgIG5ld0NlbnRlci5hZGQgZ3Jvd3RoVmVjdG9yXG5cbiAgICBuZXdDZW50ZXJcblxuICBjYWxjdWxhdGVOZXdSYWRpdXM6IC0+XG4gICAgKEBjdXJyZW50Q2hhbWJlci5hbmNlc3RvciB8fCBAY3VycmVudENoYW1iZXIpLnJhZGl1cyAqIEBnZW5vdHlwZS5ncm93dGhGYWN0b3JcblxuICBjYWxjdWxhdGVOZXdBcGVydHVyZTogKG5ld0NoYW1iZXIpIC0+XG4gICAgbmV3Q2VudGVyICAgPSBuZXdDaGFtYmVyLmNlbnRlclxuICAgIG5ld0FwZXJ0dXJlID0gbmV3Q2hhbWJlci52ZXJ0aWNlc1swXVxuXG4gICAgY3VycmVudERpc3RhbmNlID0gbmV3QXBlcnR1cmUuZGlzdGFuY2VUbyBuZXdDZW50ZXJcblxuICAgIGZvciB2ZXJ0ZXggaW4gbmV3Q2hhbWJlci52ZXJ0aWNlc1sxLi4tMV1cbiAgICAgIG5ld0Rpc3RhbmNlID0gdmVydGV4LmRpc3RhbmNlVG8gbmV3Q2VudGVyXG5cbiAgICAgIGlmIG5ld0Rpc3RhbmNlIDwgY3VycmVudERpc3RhbmNlXG4gICAgICAgIGNvbnRhaW5zID0gZmFsc2VcblxuICAgICAgICBmb3IgY2hhbWJlciBpbiBAY2hhbWJlcnNcbiAgICAgICAgICBpZiBjaGFtYmVyLnJhZGl1cyA+IG5ld0FwZXJ0dXJlLmRpc3RhbmNlVG8gY2hhbWJlci5jZW50ZXJcbiAgICAgICAgICAgIGNvbnRhaW5zID0gdHJ1ZVxuICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICB1bmxlc3MgY29udGFpbnNcbiAgICAgICAgICBuZXdBcGVydHVyZSA9IHZlcnRleFxuICAgICAgICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0Rpc3RhbmNlXG5cbiAgICBuZXdBcGVydHVyZVxuXG4gIGJ1aWxkOiAtPlxuICAgIEAuYWRkIGNoYW1iZXIgZm9yIGNoYW1iZXIgaW4gQGNoYW1iZXJzXG4iLCIjICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGb3IgTXIgV2hpdGUuLi4gWypdXG4jXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfX3x8fHx8fF9fXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgfFxuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXl1bXl1cbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBfXyB8XG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxfX19ffFxuXG5jbGFzcyBTaW11bGF0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAY2FudmFzKSAtPlxuICAgIEBzZXR1cFNjZW5lKClcbiAgICBAc2V0dXBDb250cm9scygpXG4gICAgQHNldHVwR1VJKClcblxuICBzZXR1cFNjZW5lOiAtPlxuICAgIEBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpXG5cbiAgICAjIGNhbWVyYVxuXG4gICAgQGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg0NSwgd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQsIDAuMSwgMTAwMClcbiAgICBAY2FtZXJhLnBvc2l0aW9uLnNldCAwLCAwLCA3MFxuICAgIEBzY2VuZS5hZGQgQGNhbWVyYVxuXG4gICAgIyByZW5kZXJlclxuXG4gICAgQHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIgeyBhbHBoYTogdHJ1ZSwgYW50aWFsaWFzOiB0cnVlIH1cbiAgICBAcmVuZGVyZXIuc2V0Q2xlYXJDb2xvciAweDExMTExMSwgMVxuICAgIEByZW5kZXJlci5zZXRTaXplIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHRcblxuICAgICMgbGlnaHRpbmdcblxuICAgIHNwb3RMaWdodCA9IG5ldyBUSFJFRS5TcG90TGlnaHQgMHhmZmZmZmZcbiAgICBAY2FtZXJhLmFkZCBzcG90TGlnaHRcblxuICAgIEBjYW52YXMuYXBwZW5kIEByZW5kZXJlci5kb21FbGVtZW50XG5cbiAgc2V0dXBDb250cm9sczogLT5cbiAgICBAY29udHJvbHMgPSBuZXcgVEhSRUUuVHJhY2tiYWxsQ29udHJvbHMgQGNhbWVyYSwgQHJlbmRlcmVyLmRvbUVsZW1lbnRcblxuICAgIEBjb250cm9scy5yb3RhdGVTcGVlZCA9IDUuMFxuICAgIEBjb250cm9scy56b29tU3BlZWQgICA9IDEuMlxuICAgIEBjb250cm9scy5wYW5TcGVlZCAgICA9IDAuOFxuXG4gICAgQGNvbnRyb2xzLm5vWm9vbSA9IGZhbHNlXG4gICAgQGNvbnRyb2xzLm5vUGFuICA9IGZhbHNlXG5cbiAgICBAY29udHJvbHMuc3RhdGljTW92aW5nID0gdHJ1ZVxuXG4gICAgQGNvbnRyb2xzLmR5bmFtaWNEYW1waW5nRmFjdG9yID0gMC4zXG5cbiAgICBAY29udHJvbHMua2V5cyA9IFs2NSwgODMsIDY4XVxuXG4gIHNldHVwR1VJOiAtPlxuICAgIEBndWkgPSBuZXcgZGF0LkdVSVxuXG4gICAgZ2Vub3R5cGUgPVxuICAgICAgcGhpOiAgICAgICAgICAgICAgIDAuNVxuICAgICAgYmV0YTogICAgICAgICAgICAgIDAuNVxuICAgICAgdHJhbnNsYXRpb25GYWN0b3I6IDAuNVxuICAgICAgZ3Jvd3RoRmFjdG9yOiAgICAgIDEuMVxuICAgICAgaW5pdGlhbFJhZGl1czogICAgIDVcbiAgICAgIG51bUNoYW1iZXJzOiAgICAgICA3XG4gICAgICBzaW11bGF0ZTogICAgICAgICAgPT4gQHNpbXVsYXRlKGdlbm90eXBlKVxuXG4gICAgc3RydWN0dXJlQW5hbHl6ZXIgPVxuICAgICAgZXZvbHZlOiAgPT4gQGZvcmFtLmV2b2x2ZSgpXG4gICAgICByZWdyZXNzOiA9PiBAZm9yYW0ucmVncmVzcygpXG5cbiAgICBAZ3VpLmFkZChnZW5vdHlwZSwgJ3BoaScpLnN0ZXAgMC4wMVxuICAgIEBndWkuYWRkKGdlbm90eXBlLCAnYmV0YScpLnN0ZXAgMC4wMVxuICAgIEBndWkuYWRkKGdlbm90eXBlLCAndHJhbnNsYXRpb25GYWN0b3InKS5zdGVwIDAuMDFcbiAgICBAZ3VpLmFkZChnZW5vdHlwZSwgJ2dyb3d0aEZhY3RvcicpLnN0ZXAgMC4wMVxuICAgIEBndWkuYWRkKGdlbm90eXBlLCAnaW5pdGlhbFJhZGl1cycpXG4gICAgQGd1aS5hZGQoZ2Vub3R5cGUsICdudW1DaGFtYmVycycpXG4gICAgQGd1aS5hZGQoZ2Vub3R5cGUsICdzaW11bGF0ZScpXG5cbiAgICBAZ3VpLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ2V2b2x2ZScpXG4gICAgQGd1aS5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdyZWdyZXNzJylcblxuICBzaW11bGF0ZTogKGdlbm90eXBlKSAtPlxuICAgIEBzY2VuZS5yZW1vdmUgQGZvcmFtIGlmIEBmb3JhbVxuXG4gICAgQGZvcmFtID0gbmV3IEZvcmFtIGdlbm90eXBlXG4gICAgQGZvcmFtLmJ1aWxkQ2hhbWJlcnMgZ2Vub3R5cGUubnVtQ2hhbWJlcnNcblxuICAgIEBzY2VuZS5hZGQgQGZvcmFtXG5cbiAgYW5pbWF0ZTogPT5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgQGFuaW1hdGVcblxuICAgIEBjb250cm9scy51cGRhdGUoKVxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAcmVuZGVyZXIucmVuZGVyIEBzY2VuZSwgQGNhbWVyYVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9