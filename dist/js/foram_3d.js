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
  function Simulation(canvas, options) {
    var base, defaults, option;
    this.canvas = canvas;
    this.options = options;
    this.animate = bind(this.animate, this);
    defaults = {
      dev: false
    };
    this.options || (this.options = {});
    for (option in defaults) {
      (base = this.options)[option] || (base[option] = defaults[option]);
    }
    this.setupScene();
    this.setupControls();
    if (this.options.dev) {
      this.setupGUI();
    }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2NoYW1iZXIuY29mZmVlIiwianMvZm9yYW0uY29mZmVlIiwianMvc2ltdWxhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxPQUFBO0VBQUE7OztBQUFNOzs7b0JBRUosZUFBQSxHQUFpQjs7RUFFSixpQkFBQyxNQUFELEVBQVUsTUFBVjtBQUNYLFFBQUE7SUFEWSxJQUFDLENBQUEsU0FBRDtJQUFTLElBQUMsQ0FBQSxTQUFEO0lBQ3JCLFFBQUEsR0FBVyxJQUFDLENBQUEsb0JBQUQsQ0FBQTtJQUNYLFFBQUEsR0FBVyxJQUFDLENBQUEsb0JBQUQsQ0FBQTtJQUVYLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWCxDQUFnQixJQUFoQixFQUFtQixRQUFuQixFQUE2QixRQUE3QjtJQUVBLElBQUMsQ0FBQSxRQUFELEdBQVksUUFBUSxDQUFDO0lBQ3JCLElBQUMsQ0FBQSxNQUFELEdBQVksSUFBQyxDQUFBO0lBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBWSxJQUFDLENBQUEsaUJBQUQsQ0FBQTtFQVJEOztvQkFVYixvQkFBQSxHQUFzQixTQUFBO0FBQ3BCLFFBQUE7SUFBQSx1QkFBQSxHQUEwQixJQUFDLENBQUEsNEJBQUQsQ0FBQTtJQUUxQixRQUFBLEdBQWUsSUFBQSxLQUFLLENBQUMsY0FBTixDQUFxQixJQUFDLENBQUEsTUFBdEIsRUFBOEIsRUFBOUIsRUFBa0MsRUFBbEM7SUFDZixRQUFRLENBQUMsV0FBVCxDQUFxQix1QkFBckI7V0FDQTtFQUxvQjs7b0JBT3RCLG9CQUFBLEdBQXNCLFNBQUE7V0FDaEIsSUFBQSxLQUFLLENBQUMsbUJBQU4sQ0FBMEI7TUFBRSxLQUFBLEVBQU8sUUFBVDtLQUExQjtFQURnQjs7b0JBR3RCLDRCQUFBLEdBQThCLFNBQUE7V0FDeEIsSUFBQSxLQUFLLENBQUMsT0FBTixDQUFBLENBQWUsQ0FBQyxlQUFoQixDQUFnQyxJQUFDLENBQUEsTUFBTSxDQUFDLENBQXhDLEVBQTJDLElBQUMsQ0FBQSxNQUFNLENBQUMsQ0FBbkQsRUFBc0QsSUFBQyxDQUFBLE1BQU0sQ0FBQyxDQUE5RDtFQUR3Qjs7b0JBRzlCLGlCQUFBLEdBQW1CLFNBQUE7QUFDakIsUUFBQTtJQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsUUFBUyxDQUFBLENBQUE7SUFDckIsZUFBQSxHQUFrQixRQUFRLENBQUMsVUFBVCxDQUFvQixJQUFDLENBQUEsTUFBckI7QUFFbEI7QUFBQSxTQUFBLHFDQUFBOztNQUNFLFdBQUEsR0FBYyxNQUFNLENBQUMsVUFBUCxDQUFrQixJQUFDLENBQUEsTUFBbkI7TUFFZCxJQUFHLFdBQUEsR0FBYyxlQUFqQjtRQUNFLFFBQUEsR0FBVztRQUNYLGVBQUEsR0FBa0IsWUFGcEI7O0FBSEY7V0FPQTtFQVhpQjs7b0JBYW5CLFdBQUEsR0FBYSxTQUFDLFFBQUQ7V0FDWCxJQUFDLENBQUEsUUFBRCxHQUFZO0VBREQ7O29CQUdiLFdBQUEsR0FBYSxTQUFDLFFBQUQ7SUFDWCxJQUFDLENBQUEsUUFBRCxHQUFZO0lBRVosSUFBRyxRQUFIO01BQ0UsSUFBK0IsUUFBL0I7UUFBQSxJQUFDLENBQUEsTUFBRCxHQUFVLFFBQVEsQ0FBQyxTQUFuQjs7YUFDQSxRQUFRLENBQUMsS0FBVCxHQUFpQixLQUZuQjs7RUFIVzs7b0JBT2IscUJBQUEsR0FBdUIsU0FBQTtBQUNyQixRQUFBO0FBQUE7QUFBQTtTQUFBLHFDQUFBOztVQUE4QyxNQUFNLENBQUMsQ0FBUCxLQUFZO3FCQUExRDs7QUFBQTs7RUFEcUI7Ozs7R0FsREgsS0FBSyxDQUFDOztBQ0E1QixJQUFBLEtBQUE7RUFBQTs7O0FBQU07OztFQUVTLGVBQUMsUUFBRDtBQUNYLFFBQUE7SUFEWSxJQUFDLENBQUEsV0FBRDtJQUNaLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBZixDQUFvQixJQUFwQjtJQUVBLGNBQUEsR0FBaUIsSUFBQyxDQUFBLG1CQUFELENBQUE7SUFFakIsSUFBQyxDQUFBLFFBQUQsR0FBWSxDQUFDLGNBQUQ7SUFDWixJQUFDLENBQUEsY0FBRCxHQUFrQjtFQU5QOztrQkFRYixtQkFBQSxHQUFxQixTQUFBO1dBQ2YsSUFBQSxPQUFBLENBQVksSUFBQSxLQUFLLENBQUMsT0FBTixDQUFjLENBQWQsRUFBaUIsQ0FBakIsRUFBb0IsQ0FBcEIsQ0FBWixFQUFvQyxJQUFDLENBQUEsUUFBUSxDQUFDLGFBQTlDO0VBRGU7O2tCQUdyQixhQUFBLEdBQWUsU0FBQyxXQUFEO0FBQ2IsUUFBQTtBQUFBLFNBQWlDLDBGQUFqQztNQUFBLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0FBQUE7V0FDQSxJQUFDLENBQUEsS0FBRCxDQUFBO0VBRmE7O2tCQUlmLE1BQUEsR0FBUSxTQUFBO0FBQ04sUUFBQTtJQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsY0FBYyxDQUFDO0lBRXhCLElBQUcsS0FBSDtNQUNFLElBQUMsQ0FBQSxjQUFELEdBQWtCO2FBQ2xCLElBQUMsQ0FBQSxjQUFjLENBQUMsT0FBaEIsR0FBMEIsS0FGNUI7S0FBQSxNQUFBO01BSUUsSUFBQyxDQUFBLG9CQUFELENBQUE7YUFDQSxJQUFDLENBQUEsS0FBRCxDQUFBLEVBTEY7O0VBSE07O2tCQVVSLE9BQUEsR0FBUyxTQUFBO0FBQ1AsUUFBQTtJQUFBLFFBQUEsR0FBVyxJQUFDLENBQUEsY0FBYyxDQUFDO0lBRTNCLElBQUcsUUFBSDtNQUNFLElBQUMsQ0FBQSxjQUFjLENBQUMsT0FBaEIsR0FBMEI7YUFDMUIsSUFBQyxDQUFBLGNBQUQsR0FBa0IsU0FGcEI7O0VBSE87O2tCQU9ULG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsUUFBQTtJQUFBLFNBQUEsR0FBWSxJQUFDLENBQUEsa0JBQUQsQ0FBQTtJQUNaLFNBQUEsR0FBWSxJQUFDLENBQUEsa0JBQUQsQ0FBQTtJQUVaLFVBQUEsR0FBaUIsSUFBQSxPQUFBLENBQVEsU0FBUixFQUFtQixTQUFuQjtJQUVqQixXQUFBLEdBQWMsSUFBQyxDQUFBLG9CQUFELENBQXNCLFVBQXRCO0lBRWQsVUFBVSxDQUFDLFdBQVgsQ0FBdUIsV0FBdkI7SUFDQSxVQUFVLENBQUMsV0FBWCxDQUF1QixJQUFDLENBQUEsY0FBeEI7SUFFQSxJQUFDLENBQUEsUUFBUSxDQUFDLElBQVYsQ0FBZSxVQUFmO1dBRUEsSUFBQyxDQUFBLGNBQUQsR0FBa0I7RUFiRTs7a0JBZXRCLGtCQUFBLEdBQW9CLFNBQUE7QUFDbEIsUUFBQTtJQUFBLGFBQUEsR0FBa0IsSUFBQyxDQUFBLGNBQWMsQ0FBQztJQUNsQyxlQUFBLEdBQWtCLElBQUMsQ0FBQSxjQUFjLENBQUM7SUFJbEMsWUFBQSxHQUFlLElBQUksS0FBSyxDQUFDO0lBQ3pCLFlBQVksQ0FBQyxVQUFiLENBQXdCLGVBQXhCLEVBQXlDLGFBQXpDO0lBSUEsc0JBQUEsR0FBNkIsSUFBQSxLQUFLLENBQUMsT0FBTixDQUFjLENBQWQsRUFBaUIsQ0FBakIsRUFBb0IsQ0FBcEI7SUFDN0Isb0JBQUEsR0FBNkIsSUFBQSxLQUFLLENBQUMsT0FBTixDQUFjLENBQWQsRUFBaUIsQ0FBakIsRUFBb0IsQ0FBcEI7SUFFN0IsWUFBWSxDQUFDLGNBQWIsQ0FBNEIsc0JBQTVCLEVBQW9ELElBQUMsQ0FBQSxRQUFRLENBQUMsR0FBOUQ7SUFDQSxZQUFZLENBQUMsY0FBYixDQUE0QixvQkFBNUIsRUFBb0QsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUE5RDtJQUlBLFlBQVksQ0FBQyxTQUFiLENBQUE7SUFDQSxZQUFZLENBQUMsY0FBYixDQUE0QixJQUFDLENBQUEsUUFBUSxDQUFDLGlCQUF0QztJQUlBLFNBQUEsR0FBWSxJQUFJLEtBQUssQ0FBQztJQUN0QixTQUFTLENBQUMsSUFBVixDQUFlLGVBQWY7SUFDQSxTQUFTLENBQUMsR0FBVixDQUFjLFlBQWQ7V0FFQTtFQTVCa0I7O2tCQThCcEIsa0JBQUEsR0FBb0IsU0FBQTtXQUNsQixDQUFDLElBQUMsQ0FBQSxjQUFjLENBQUMsUUFBaEIsSUFBNEIsSUFBQyxDQUFBLGNBQTlCLENBQTZDLENBQUMsTUFBOUMsR0FBdUQsSUFBQyxDQUFBLFFBQVEsQ0FBQztFQUQvQzs7a0JBR3BCLG9CQUFBLEdBQXNCLFNBQUMsVUFBRDtBQUNwQixRQUFBO0lBQUEsU0FBQSxHQUFjLFVBQVUsQ0FBQztJQUN6QixXQUFBLEdBQWMsVUFBVSxDQUFDLFFBQVMsQ0FBQSxDQUFBO0lBRWxDLGVBQUEsR0FBa0IsV0FBVyxDQUFDLFVBQVosQ0FBdUIsU0FBdkI7QUFFbEI7QUFBQSxTQUFBLHFDQUFBOztNQUNFLFdBQUEsR0FBYyxNQUFNLENBQUMsVUFBUCxDQUFrQixTQUFsQjtNQUVkLElBQUcsV0FBQSxHQUFjLGVBQWpCO1FBQ0UsUUFBQSxHQUFXO0FBRVg7QUFBQSxhQUFBLHdDQUFBOztVQUNFLElBQUcsT0FBTyxDQUFDLE1BQVIsR0FBaUIsV0FBVyxDQUFDLFVBQVosQ0FBdUIsT0FBTyxDQUFDLE1BQS9CLENBQXBCO1lBQ0UsUUFBQSxHQUFXO0FBQ1gsa0JBRkY7O0FBREY7UUFLQSxJQUFBLENBQU8sUUFBUDtVQUNFLFdBQUEsR0FBYztVQUNkLGVBQUEsR0FBa0IsWUFGcEI7U0FSRjs7QUFIRjtXQWVBO0VBckJvQjs7a0JBdUJ0QixLQUFBLEdBQU8sU0FBQTtBQUNMLFFBQUE7QUFBQTtBQUFBO1NBQUEscUNBQUE7O21CQUFBLElBQUMsQ0FBQyxHQUFGLENBQU0sT0FBTjtBQUFBOztFQURLOzs7O0dBekdXLEtBQUssQ0FBQzs7QUNRMUIsSUFBQSxVQUFBO0VBQUE7O0FBQU07RUFFUyxvQkFBQyxNQUFELEVBQVUsT0FBVjtBQUNYLFFBQUE7SUFEWSxJQUFDLENBQUEsU0FBRDtJQUFTLElBQUMsQ0FBQSxVQUFEOztJQUNyQixRQUFBLEdBQVc7TUFBRSxHQUFBLEVBQUssS0FBUDs7SUFFWCxJQUFDLENBQUEsWUFBRCxJQUFDLENBQUEsVUFBWTtBQUViLFNBQUEsa0JBQUE7Y0FDRSxJQUFDLENBQUEsUUFBUSxDQUFBLE1BQUEsVUFBQSxDQUFBLE1BQUEsSUFBWSxRQUFTLENBQUEsTUFBQTtBQURoQztJQUdBLElBQUMsQ0FBQSxVQUFELENBQUE7SUFDQSxJQUFDLENBQUEsYUFBRCxDQUFBO0lBQ0EsSUFBZSxJQUFDLENBQUEsT0FBTyxDQUFDLEdBQXhCO01BQUEsSUFBQyxDQUFBLFFBQUQsQ0FBQSxFQUFBOztFQVZXOzt1QkFZYixVQUFBLEdBQVksU0FBQTtBQUNWLFFBQUE7SUFBQSxJQUFDLENBQUEsS0FBRCxHQUFhLElBQUEsS0FBSyxDQUFDLEtBQU4sQ0FBQTtJQUliLElBQUMsQ0FBQSxNQUFELEdBQWMsSUFBQSxLQUFLLENBQUMsaUJBQU4sQ0FBd0IsRUFBeEIsRUFBNEIsTUFBTSxDQUFDLFVBQVAsR0FBb0IsTUFBTSxDQUFDLFdBQXZELEVBQW9FLEdBQXBFLEVBQXlFLElBQXpFO0lBQ2QsSUFBQyxDQUFBLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBakIsQ0FBcUIsQ0FBckIsRUFBd0IsQ0FBeEIsRUFBMkIsRUFBM0I7SUFDQSxJQUFDLENBQUEsS0FBSyxDQUFDLEdBQVAsQ0FBVyxJQUFDLENBQUEsTUFBWjtJQUlBLElBQUMsQ0FBQSxRQUFELEdBQWdCLElBQUEsS0FBSyxDQUFDLGFBQU4sQ0FBb0I7TUFBRSxLQUFBLEVBQU8sSUFBVDtNQUFlLFNBQUEsRUFBVyxJQUExQjtLQUFwQjtJQUNoQixJQUFDLENBQUEsUUFBUSxDQUFDLGFBQVYsQ0FBd0IsUUFBeEIsRUFBa0MsQ0FBbEM7SUFDQSxJQUFDLENBQUEsUUFBUSxDQUFDLE9BQVYsQ0FBa0IsTUFBTSxDQUFDLFVBQXpCLEVBQXFDLE1BQU0sQ0FBQyxXQUE1QztJQUlBLFNBQUEsR0FBZ0IsSUFBQSxLQUFLLENBQUMsU0FBTixDQUFnQixRQUFoQjtJQUNoQixJQUFDLENBQUEsTUFBTSxDQUFDLEdBQVIsQ0FBWSxTQUFaO1dBRUEsSUFBQyxDQUFBLE1BQU0sQ0FBQyxNQUFSLENBQWUsSUFBQyxDQUFBLFFBQVEsQ0FBQyxVQUF6QjtFQXBCVTs7dUJBc0JaLGFBQUEsR0FBZSxTQUFBO0lBQ2IsSUFBQyxDQUFBLFFBQUQsR0FBZ0IsSUFBQSxLQUFLLENBQUMsaUJBQU4sQ0FBd0IsSUFBQyxDQUFBLE1BQXpCLEVBQWlDLElBQUMsQ0FBQSxRQUFRLENBQUMsVUFBM0M7SUFFaEIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxXQUFWLEdBQXdCO0lBQ3hCLElBQUMsQ0FBQSxRQUFRLENBQUMsU0FBVixHQUF3QjtJQUN4QixJQUFDLENBQUEsUUFBUSxDQUFDLFFBQVYsR0FBd0I7SUFFeEIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLEdBQW1CO0lBQ25CLElBQUMsQ0FBQSxRQUFRLENBQUMsS0FBVixHQUFtQjtJQUVuQixJQUFDLENBQUEsUUFBUSxDQUFDLFlBQVYsR0FBeUI7SUFFekIsSUFBQyxDQUFBLFFBQVEsQ0FBQyxvQkFBVixHQUFpQztXQUVqQyxJQUFDLENBQUEsUUFBUSxDQUFDLElBQVYsR0FBaUIsQ0FBQyxFQUFELEVBQUssRUFBTCxFQUFTLEVBQVQ7RUFkSjs7dUJBZ0JmLFFBQUEsR0FBVSxTQUFBO0FBQ1IsUUFBQTtJQUFBLElBQUMsQ0FBQSxHQUFELEdBQU8sSUFBSSxHQUFHLENBQUM7SUFFZixRQUFBLEdBQ0U7TUFBQSxHQUFBLEVBQW1CLEdBQW5CO01BQ0EsSUFBQSxFQUFtQixHQURuQjtNQUVBLGlCQUFBLEVBQW1CLEdBRm5CO01BR0EsWUFBQSxFQUFtQixHQUhuQjtNQUlBLGFBQUEsRUFBbUIsQ0FKbkI7TUFLQSxXQUFBLEVBQW1CLENBTG5CO01BTUEsUUFBQSxFQUFtQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQUcsS0FBQyxDQUFBLFFBQUQsQ0FBVSxRQUFWO1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBTm5COztJQVFGLGlCQUFBLEdBQ0U7TUFBQSxNQUFBLEVBQVMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFBO1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQVQ7TUFDQSxPQUFBLEVBQVMsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUFHLEtBQUMsQ0FBQSxLQUFLLENBQUMsT0FBUCxDQUFBO1FBQUg7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBRFQ7O0lBR0YsSUFBQyxDQUFBLEdBQUcsQ0FBQyxHQUFMLENBQVMsUUFBVCxFQUFtQixLQUFuQixDQUF5QixDQUFDLElBQTFCLENBQStCLElBQS9CO0lBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxHQUFMLENBQVMsUUFBVCxFQUFtQixNQUFuQixDQUEwQixDQUFDLElBQTNCLENBQWdDLElBQWhDO0lBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxHQUFMLENBQVMsUUFBVCxFQUFtQixtQkFBbkIsQ0FBdUMsQ0FBQyxJQUF4QyxDQUE2QyxJQUE3QztJQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsR0FBTCxDQUFTLFFBQVQsRUFBbUIsY0FBbkIsQ0FBa0MsQ0FBQyxJQUFuQyxDQUF3QyxJQUF4QztJQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsR0FBTCxDQUFTLFFBQVQsRUFBbUIsZUFBbkI7SUFDQSxJQUFDLENBQUEsR0FBRyxDQUFDLEdBQUwsQ0FBUyxRQUFULEVBQW1CLGFBQW5CO0lBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxHQUFMLENBQVMsUUFBVCxFQUFtQixVQUFuQjtJQUVBLElBQUMsQ0FBQSxHQUFHLENBQUMsR0FBTCxDQUFTLGlCQUFULEVBQTRCLFFBQTVCO1dBQ0EsSUFBQyxDQUFBLEdBQUcsQ0FBQyxHQUFMLENBQVMsaUJBQVQsRUFBNEIsU0FBNUI7RUF6QlE7O3VCQTJCVixRQUFBLEdBQVUsU0FBQyxRQUFEO0lBQ1IsSUFBd0IsSUFBQyxDQUFBLEtBQXpCO01BQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLENBQWMsSUFBQyxDQUFBLEtBQWYsRUFBQTs7SUFFQSxJQUFDLENBQUEsS0FBRCxHQUFhLElBQUEsS0FBQSxDQUFNLFFBQU47SUFDYixJQUFDLENBQUEsS0FBSyxDQUFDLGFBQVAsQ0FBcUIsUUFBUSxDQUFDLFdBQTlCO1dBRUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFQLENBQVcsSUFBQyxDQUFBLEtBQVo7RUFOUTs7dUJBUVYsT0FBQSxHQUFTLFNBQUE7SUFDUCxxQkFBQSxDQUFzQixJQUFDLENBQUEsT0FBdkI7SUFFQSxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBQTtXQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7RUFKTzs7dUJBTVQsTUFBQSxHQUFRLFNBQUE7V0FDTixJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBaUIsSUFBQyxDQUFBLEtBQWxCLEVBQXlCLElBQUMsQ0FBQSxNQUExQjtFQURNIiwiZmlsZSI6ImZvcmFtXzNkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgQ2hhbWJlciBleHRlbmRzIFRIUkVFLk1lc2hcblxuICBERUZBVUxUX1RFWFRVUkU6IFwiLi4vYXNzZXRzL2ltYWdlcy90ZXh0dXJlLmdpZlwiXG5cbiAgY29uc3RydWN0b3I6IChAY2VudGVyLCBAcmFkaXVzKSAtPlxuICAgIGdlb21ldHJ5ID0gQGJ1aWxkQ2hhbWJlckdlb21ldHJ5KClcbiAgICBtYXRlcmlhbCA9IEBidWlsZENoYW1iZXJNYXRlcmlhbCgpXG5cbiAgICBUSFJFRS5NZXNoLmNhbGwgQCwgZ2VvbWV0cnksIG1hdGVyaWFsXG5cbiAgICBAdmVydGljZXMgPSBnZW9tZXRyeS52ZXJ0aWNlc1xuICAgIEBvcmlnaW4gICA9IEBjZW50ZXJcbiAgICBAYXBlcnR1cmUgPSBAY2FsY3VsYXRlQXBlcnR1cmUoKVxuXG4gIGJ1aWxkQ2hhbWJlckdlb21ldHJ5OiAtPlxuICAgIGNlbnRlclRyYW5zbGF0aW9uTWF0cml4ID0gQGJ1aWxkQ2VudGVyVHJhbnNsYXRpb25NYXRyaXgoKVxuXG4gICAgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkgQHJhZGl1cywgMzIsIDMyXG4gICAgZ2VvbWV0cnkuYXBwbHlNYXRyaXggY2VudGVyVHJhbnNsYXRpb25NYXRyaXhcbiAgICBnZW9tZXRyeVxuXG4gIGJ1aWxkQ2hhbWJlck1hdGVyaWFsOiAtPlxuICAgIG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsIHsgY29sb3I6IDB4ZmZmZmZmIH1cblxuICBidWlsZENlbnRlclRyYW5zbGF0aW9uTWF0cml4OiAtPlxuICAgIG5ldyBUSFJFRS5NYXRyaXg0KCkubWFrZVRyYW5zbGF0aW9uIEBjZW50ZXIueCwgQGNlbnRlci55LCBAY2VudGVyLnpcblxuICBjYWxjdWxhdGVBcGVydHVyZTogLT5cbiAgICBhcGVydHVyZSA9IEB2ZXJ0aWNlc1swXVxuICAgIGN1cnJlbnREaXN0YW5jZSA9IGFwZXJ0dXJlLmRpc3RhbmNlVG8gQGNlbnRlclxuXG4gICAgZm9yIHZlcnRleCBpbiBAdmVydGljZXNbMS4uLTFdXG4gICAgICBuZXdEaXN0YW5jZSA9IHZlcnRleC5kaXN0YW5jZVRvIEBjZW50ZXJcblxuICAgICAgaWYgbmV3RGlzdGFuY2UgPCBjdXJyZW50RGlzdGFuY2VcbiAgICAgICAgYXBlcnR1cmUgPSB2ZXJ0ZXhcbiAgICAgICAgY3VycmVudERpc3RhbmNlID0gbmV3RGlzdGFuY2VcblxuICAgIGFwZXJ0dXJlXG5cbiAgc2V0QXBlcnR1cmU6IChhcGVydHVyZSkgLT5cbiAgICBAYXBlcnR1cmUgPSBhcGVydHVyZVxuXG4gIHNldEFuY2VzdG9yOiAoYW5jZXN0b3IpIC0+XG4gICAgQGFuY2VzdG9yID0gYW5jZXN0b3JcblxuICAgIGlmIGFuY2VzdG9yXG4gICAgICBAb3JpZ2luID0gYW5jZXN0b3IuYXBlcnR1cmUgaWYgYW5jZXN0b3JcbiAgICAgIGFuY2VzdG9yLmNoaWxkID0gQFxuXG4gIGNhbGN1bGF0ZUdlb21ldHJ5UmluZzogLT5cbiAgICB2ZXJ0ZXggZm9yIHZlcnRleCBpbiBALmdlb21ldHJ5LnZlcnRpY2VzIHdoZW4gdmVydGV4LnogPT0gMFxuIiwiY2xhc3MgRm9yYW0gZXh0ZW5kcyBUSFJFRS5PYmplY3QzRFxuXG4gIGNvbnN0cnVjdG9yOiAoQGdlbm90eXBlKSAtPlxuICAgIFRIUkVFLk9iamVjdDNELmNhbGwgQFxuXG4gICAgaW5pdGlhbENoYW1iZXIgPSBAYnVpbGRJbml0aWFsQ2hhbWJlcigpXG5cbiAgICBAY2hhbWJlcnMgPSBbaW5pdGlhbENoYW1iZXJdXG4gICAgQGN1cnJlbnRDaGFtYmVyID0gaW5pdGlhbENoYW1iZXJcblxuICBidWlsZEluaXRpYWxDaGFtYmVyOiAtPlxuICAgIG5ldyBDaGFtYmVyKG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApLCBAZ2Vub3R5cGUuaW5pdGlhbFJhZGl1cylcblxuICBidWlsZENoYW1iZXJzOiAobnVtQ2hhbWJlcnMpIC0+XG4gICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKCkgZm9yIGkgaW4gWzEuLm51bUNoYW1iZXJzLTFdXG4gICAgQGJ1aWxkKClcblxuICBldm9sdmU6IC0+XG4gICAgY2hpbGQgPSBAY3VycmVudENoYW1iZXIuY2hpbGRcblxuICAgIGlmIGNoaWxkXG4gICAgICBAY3VycmVudENoYW1iZXIgPSBjaGlsZFxuICAgICAgQGN1cnJlbnRDaGFtYmVyLnZpc2libGUgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKClcbiAgICAgIEBidWlsZCgpXG5cbiAgcmVncmVzczogLT5cbiAgICBhbmNlc3RvciA9IEBjdXJyZW50Q2hhbWJlci5hbmNlc3RvclxuXG4gICAgaWYgYW5jZXN0b3JcbiAgICAgIEBjdXJyZW50Q2hhbWJlci52aXNpYmxlID0gZmFsc2VcbiAgICAgIEBjdXJyZW50Q2hhbWJlciA9IGFuY2VzdG9yXG5cbiAgY2FsY3VsYXRlTmV4dENoYW1iZXI6IC0+XG4gICAgbmV3Q2VudGVyID0gQGNhbGN1bGF0ZU5ld0NlbnRlcigpXG4gICAgbmV3UmFkaXVzID0gQGNhbGN1bGF0ZU5ld1JhZGl1cygpXG5cbiAgICBuZXdDaGFtYmVyID0gbmV3IENoYW1iZXIgbmV3Q2VudGVyLCBuZXdSYWRpdXNcblxuICAgIG5ld0FwZXJ0dXJlID0gQGNhbGN1bGF0ZU5ld0FwZXJ0dXJlIG5ld0NoYW1iZXJcblxuICAgIG5ld0NoYW1iZXIuc2V0QXBlcnR1cmUgbmV3QXBlcnR1cmVcbiAgICBuZXdDaGFtYmVyLnNldEFuY2VzdG9yIEBjdXJyZW50Q2hhbWJlclxuXG4gICAgQGNoYW1iZXJzLnB1c2ggbmV3Q2hhbWJlclxuXG4gICAgQGN1cnJlbnRDaGFtYmVyID0gbmV3Q2hhbWJlclxuXG4gIGNhbGN1bGF0ZU5ld0NlbnRlcjogLT5cbiAgICBjdXJyZW50T3JpZ2luICAgPSBAY3VycmVudENoYW1iZXIub3JpZ2luXG4gICAgY3VycmVudEFwZXJ0dXJlID0gQGN1cnJlbnRDaGFtYmVyLmFwZXJ0dXJlXG5cbiAgICAjIGNhbGN1bGF0ZSBpbml0aWFsIGdyb3d0aCB2ZWN0b3IgKHJlZmVyZW5jZSBsaW5lKVxuXG4gICAgZ3Jvd3RoVmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjNcbiAgICBncm93dGhWZWN0b3Iuc3ViVmVjdG9ycyBjdXJyZW50QXBlcnR1cmUsIGN1cnJlbnRPcmlnaW5cblxuICAgICMgZGV2aWF0ZSBncm93dGggdmVjdG9yIGZyb20gcmVmZXJlbmNlIGxpbmVcblxuICAgIGhvcml6b250YWxSb3RhdGlvbkF4aXMgPSBuZXcgVEhSRUUuVmVjdG9yMyAwLCAwLCAxXG4gICAgdmVydGljYWxSb3RhdGlvbkF4aXMgICA9IG5ldyBUSFJFRS5WZWN0b3IzIDEsIDAsIDBcblxuICAgIGdyb3d0aFZlY3Rvci5hcHBseUF4aXNBbmdsZSBob3Jpem9udGFsUm90YXRpb25BeGlzLCBAZ2Vub3R5cGUucGhpXG4gICAgZ3Jvd3RoVmVjdG9yLmFwcGx5QXhpc0FuZ2xlIHZlcnRpY2FsUm90YXRpb25BeGlzLCAgIEBnZW5vdHlwZS5iZXRhXG5cbiAgICAjIG11bHRpcGx5IGdyb3d0aCB2ZWN0b3IgYnkgdHJhbnNsYWN0aW9uIGZhY3RvclxuXG4gICAgZ3Jvd3RoVmVjdG9yLm5vcm1hbGl6ZSgpXG4gICAgZ3Jvd3RoVmVjdG9yLm11bHRpcGx5U2NhbGFyIEBnZW5vdHlwZS50cmFuc2xhdGlvbkZhY3RvclxuXG4gICAgIyBjYWxjdWxhdGUgY2VudGVyIG9mIG5ldyBjaGFtYmVyXG5cbiAgICBuZXdDZW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yM1xuICAgIG5ld0NlbnRlci5jb3B5IGN1cnJlbnRBcGVydHVyZVxuICAgIG5ld0NlbnRlci5hZGQgZ3Jvd3RoVmVjdG9yXG5cbiAgICBuZXdDZW50ZXJcblxuICBjYWxjdWxhdGVOZXdSYWRpdXM6IC0+XG4gICAgKEBjdXJyZW50Q2hhbWJlci5hbmNlc3RvciB8fCBAY3VycmVudENoYW1iZXIpLnJhZGl1cyAqIEBnZW5vdHlwZS5ncm93dGhGYWN0b3JcblxuICBjYWxjdWxhdGVOZXdBcGVydHVyZTogKG5ld0NoYW1iZXIpIC0+XG4gICAgbmV3Q2VudGVyICAgPSBuZXdDaGFtYmVyLmNlbnRlclxuICAgIG5ld0FwZXJ0dXJlID0gbmV3Q2hhbWJlci52ZXJ0aWNlc1swXVxuXG4gICAgY3VycmVudERpc3RhbmNlID0gbmV3QXBlcnR1cmUuZGlzdGFuY2VUbyBuZXdDZW50ZXJcblxuICAgIGZvciB2ZXJ0ZXggaW4gbmV3Q2hhbWJlci52ZXJ0aWNlc1sxLi4tMV1cbiAgICAgIG5ld0Rpc3RhbmNlID0gdmVydGV4LmRpc3RhbmNlVG8gbmV3Q2VudGVyXG5cbiAgICAgIGlmIG5ld0Rpc3RhbmNlIDwgY3VycmVudERpc3RhbmNlXG4gICAgICAgIGNvbnRhaW5zID0gZmFsc2VcblxuICAgICAgICBmb3IgY2hhbWJlciBpbiBAY2hhbWJlcnNcbiAgICAgICAgICBpZiBjaGFtYmVyLnJhZGl1cyA+IG5ld0FwZXJ0dXJlLmRpc3RhbmNlVG8gY2hhbWJlci5jZW50ZXJcbiAgICAgICAgICAgIGNvbnRhaW5zID0gdHJ1ZVxuICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICB1bmxlc3MgY29udGFpbnNcbiAgICAgICAgICBuZXdBcGVydHVyZSA9IHZlcnRleFxuICAgICAgICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0Rpc3RhbmNlXG5cbiAgICBuZXdBcGVydHVyZVxuXG4gIGJ1aWxkOiAtPlxuICAgIEAuYWRkIGNoYW1iZXIgZm9yIGNoYW1iZXIgaW4gQGNoYW1iZXJzXG4iLCIjICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGb3IgTXIgV2hpdGUuLi4gWypdXG4jXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfX3x8fHx8fF9fXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgfFxuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXl1bXl1cbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBfXyB8XG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxfX19ffFxuXG5jbGFzcyBTaW11bGF0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAY2FudmFzLCBAb3B0aW9ucykgLT5cbiAgICBkZWZhdWx0cyA9IHsgZGV2OiBmYWxzZSB9XG5cbiAgICBAb3B0aW9ucyB8fD0ge31cblxuICAgIGZvciBvcHRpb24gb2YgZGVmYXVsdHNcbiAgICAgIEBvcHRpb25zW29wdGlvbl0gfHw9IGRlZmF1bHRzW29wdGlvbl1cblxuICAgIEBzZXR1cFNjZW5lKClcbiAgICBAc2V0dXBDb250cm9scygpXG4gICAgQHNldHVwR1VJKCkgaWYgQG9wdGlvbnMuZGV2XG5cbiAgc2V0dXBTY2VuZTogLT5cbiAgICBAc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKVxuXG4gICAgIyBjYW1lcmFcblxuICAgIEBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNDUsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwMDApXG4gICAgQGNhbWVyYS5wb3NpdGlvbi5zZXQgMCwgMCwgNzBcbiAgICBAc2NlbmUuYWRkIEBjYW1lcmFcblxuICAgICMgcmVuZGVyZXJcblxuICAgIEByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyIHsgYWxwaGE6IHRydWUsIGFudGlhbGlhczogdHJ1ZSB9XG4gICAgQHJlbmRlcmVyLnNldENsZWFyQ29sb3IgMHgxMTExMTEsIDFcbiAgICBAcmVuZGVyZXIuc2V0U2l6ZSB3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0XG5cbiAgICAjIGxpZ2h0aW5nXG5cbiAgICBzcG90TGlnaHQgPSBuZXcgVEhSRUUuU3BvdExpZ2h0IDB4ZmZmZmZmXG4gICAgQGNhbWVyYS5hZGQgc3BvdExpZ2h0XG5cbiAgICBAY2FudmFzLmFwcGVuZCBAcmVuZGVyZXIuZG9tRWxlbWVudFxuXG4gIHNldHVwQ29udHJvbHM6IC0+XG4gICAgQGNvbnRyb2xzID0gbmV3IFRIUkVFLlRyYWNrYmFsbENvbnRyb2xzIEBjYW1lcmEsIEByZW5kZXJlci5kb21FbGVtZW50XG5cbiAgICBAY29udHJvbHMucm90YXRlU3BlZWQgPSA1LjBcbiAgICBAY29udHJvbHMuem9vbVNwZWVkICAgPSAxLjJcbiAgICBAY29udHJvbHMucGFuU3BlZWQgICAgPSAwLjhcblxuICAgIEBjb250cm9scy5ub1pvb20gPSBmYWxzZVxuICAgIEBjb250cm9scy5ub1BhbiAgPSBmYWxzZVxuXG4gICAgQGNvbnRyb2xzLnN0YXRpY01vdmluZyA9IHRydWVcblxuICAgIEBjb250cm9scy5keW5hbWljRGFtcGluZ0ZhY3RvciA9IDAuM1xuXG4gICAgQGNvbnRyb2xzLmtleXMgPSBbNjUsIDgzLCA2OF1cblxuICBzZXR1cEdVSTogLT5cbiAgICBAZ3VpID0gbmV3IGRhdC5HVUlcblxuICAgIGdlbm90eXBlID1cbiAgICAgIHBoaTogICAgICAgICAgICAgICAwLjVcbiAgICAgIGJldGE6ICAgICAgICAgICAgICAwLjVcbiAgICAgIHRyYW5zbGF0aW9uRmFjdG9yOiAwLjVcbiAgICAgIGdyb3d0aEZhY3RvcjogICAgICAxLjFcbiAgICAgIGluaXRpYWxSYWRpdXM6ICAgICA1XG4gICAgICBudW1DaGFtYmVyczogICAgICAgN1xuICAgICAgc2ltdWxhdGU6ICAgICAgICAgID0+IEBzaW11bGF0ZShnZW5vdHlwZSlcblxuICAgIHN0cnVjdHVyZUFuYWx5emVyID1cbiAgICAgIGV2b2x2ZTogID0+IEBmb3JhbS5ldm9sdmUoKVxuICAgICAgcmVncmVzczogPT4gQGZvcmFtLnJlZ3Jlc3MoKVxuXG4gICAgQGd1aS5hZGQoZ2Vub3R5cGUsICdwaGknKS5zdGVwIDAuMDFcbiAgICBAZ3VpLmFkZChnZW5vdHlwZSwgJ2JldGEnKS5zdGVwIDAuMDFcbiAgICBAZ3VpLmFkZChnZW5vdHlwZSwgJ3RyYW5zbGF0aW9uRmFjdG9yJykuc3RlcCAwLjAxXG4gICAgQGd1aS5hZGQoZ2Vub3R5cGUsICdncm93dGhGYWN0b3InKS5zdGVwIDAuMDFcbiAgICBAZ3VpLmFkZChnZW5vdHlwZSwgJ2luaXRpYWxSYWRpdXMnKVxuICAgIEBndWkuYWRkKGdlbm90eXBlLCAnbnVtQ2hhbWJlcnMnKVxuICAgIEBndWkuYWRkKGdlbm90eXBlLCAnc2ltdWxhdGUnKVxuXG4gICAgQGd1aS5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdldm9sdmUnKVxuICAgIEBndWkuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAncmVncmVzcycpXG5cbiAgc2ltdWxhdGU6IChnZW5vdHlwZSkgLT5cbiAgICBAc2NlbmUucmVtb3ZlIEBmb3JhbSBpZiBAZm9yYW1cblxuICAgIEBmb3JhbSA9IG5ldyBGb3JhbSBnZW5vdHlwZVxuICAgIEBmb3JhbS5idWlsZENoYW1iZXJzIGdlbm90eXBlLm51bUNoYW1iZXJzXG5cbiAgICBAc2NlbmUuYWRkIEBmb3JhbVxuXG4gIGFuaW1hdGU6ID0+XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIEBhbmltYXRlXG5cbiAgICBAY29udHJvbHMudXBkYXRlKClcbiAgICBAcmVuZGVyKClcblxuICByZW5kZXI6IC0+XG4gICAgQHJlbmRlcmVyLnJlbmRlciBAc2NlbmUsIEBjYW1lcmFcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==