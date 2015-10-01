var CentroidsLine,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

CentroidsLine = (function(superClass) {
  extend(CentroidsLine, superClass);

  CentroidsLine.prototype.MAX_POINTS = 100;

  function CentroidsLine(foram) {
    this.foram = foram;
    this.positionsBuffer = this.buildPositionsBuffer();
    this.geometry = this.buildLineGometry(this.positionsBuffer);
    this.material = this.buildLineMaterial();
    this.rebuild();
    THREE.Line.call(this, this.geometry, this.material);
  }

  CentroidsLine.prototype.buildPositionsBuffer = function() {
    var buffer;
    buffer = new Float32Array(this.MAX_POINTS * 3);
    return new THREE.BufferAttribute(buffer, 3);
  };

  CentroidsLine.prototype.buildLineGometry = function(positionsBuffer) {
    var geometry;
    geometry = new THREE.BufferGeometry();
    geometry.addAttribute("position", positionsBuffer);
    return geometry;
  };

  CentroidsLine.prototype.buildLineMaterial = function() {
    return new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 10
    });
  };

  CentroidsLine.prototype.rebuild = function() {
    var activeChambers, centroid, chamber, i, index, len, positions;
    activeChambers = this.filterActiveChambers();
    positions = this.positionsBuffer.array;
    index = 0;
    for (i = 0, len = activeChambers.length; i < len; i++) {
      chamber = activeChambers[i];
      centroid = chamber.center;
      positions[index++] = centroid.x;
      positions[index++] = centroid.y;
      positions[index++] = centroid.z;
    }
    this.geometry.setDrawRange(0, activeChambers.length);
    return this.positionsBuffer.needsUpdate = true;
  };

  CentroidsLine.prototype.filterActiveChambers = function() {
    var chamber, i, len, ref, results;
    ref = this.foram.chambers;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      chamber = ref[i];
      if (chamber.visible) {
        results.push(chamber);
      }
    }
    return results;
  };

  return CentroidsLine;

})(THREE.Line);

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

  Foram.prototype.INITIAL_RADIUS = 5;

  function Foram(genotype) {
    var initialChamber;
    this.genotype = genotype;
    THREE.Object3D.call(this);
    initialChamber = this.buildInitialChamber();
    this.chambers = [initialChamber];
    this.currentChamber = initialChamber;
  }

  Foram.prototype.buildInitialChamber = function() {
    return new Chamber(new THREE.Vector3(0, 0, 0), this.INITIAL_RADIUS);
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
  function Simulation(canvas, options1) {
    var base, defaults, option;
    this.canvas = canvas;
    this.options = options1;
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
    var genotype, simulationOptions, structureAnalyzer;
    this.gui = new dat.GUI;
    genotype = {
      phi: 0.5,
      beta: 0.5,
      translationFactor: 0.5,
      growthFactor: 1.1
    };
    simulationOptions = {
      numChambers: 7
    };
    structureAnalyzer = {
      simulate: (function(_this) {
        return function() {
          return _this.simulate(genotype, simulationOptions);
        };
      })(this),
      evolve: (function(_this) {
        return function() {
          return _this.evolve();
        };
      })(this),
      regress: (function(_this) {
        return function() {
          return _this.regress();
        };
      })(this),
      centroidsLine: (function(_this) {
        return function() {
          return _this.toggleCentroidsLine();
        };
      })(this),
      toggleChambers: (function(_this) {
        return function() {
          return _this.toggleChambers();
        };
      })(this)
    };
    this.gui.add(genotype, 'phi').step(0.01);
    this.gui.add(genotype, 'beta').step(0.01);
    this.gui.add(genotype, 'translationFactor').step(0.01);
    this.gui.add(genotype, 'growthFactor').step(0.01);
    this.gui.add(simulationOptions, 'numChambers');
    this.gui.add(structureAnalyzer, 'simulate');
    this.gui.add(structureAnalyzer, 'evolve');
    this.gui.add(structureAnalyzer, 'regress');
    this.gui.add(structureAnalyzer, 'centroidsLine');
    return this.gui.add(structureAnalyzer, 'toggleChambers');
  };

  Simulation.prototype.simulate = function(genotype, options) {
    if (this.foram) {
      this.scene.remove(this.foram);
    }
    this.foram = new Foram(genotype);
    this.foram.buildChambers(options.numChambers);
    return this.scene.add(this.foram);
  };

  Simulation.prototype.evolve = function() {
    if (!this.foram) {
      return;
    }
    this.foram.evolve();
    if (this.centroidsLine) {
      return this.centroidsLine.rebuild();
    }
  };

  Simulation.prototype.regress = function() {
    if (!this.foram) {
      return;
    }
    this.foram.regress();
    if (this.centroidsLine) {
      return this.centroidsLine.rebuild();
    }
  };

  Simulation.prototype.toggleCentroidsLine = function() {
    if (!this.foram) {
      return;
    }
    if (!this.centroidsLine) {
      this.centroidsLine = new CentroidsLine(this.foram);
      this.centroidsLine.visible = false;
      this.scene.add(this.centroidsLine);
    }
    return this.centroidsLine.visible = !this.centroidsLine.visible;
  };

  Simulation.prototype.toggleChambers = function() {
    if (this.foram) {
      return this.foram.visible = !this.foram.visible;
    }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2NlbnRyb2lkc19saW5lLmNvZmZlZSIsImpzL2NoYW1iZXIuY29mZmVlIiwianMvZm9yYW0uY29mZmVlIiwianMvc2ltdWxhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxhQUFBO0VBQUE7OztBQUFNOzs7MEJBRUosVUFBQSxHQUFZOztFQUVDLHVCQUFDLEtBQUQ7SUFBQyxJQUFDLENBQUEsUUFBRDtJQUNaLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0lBRW5CLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLGdCQUFELENBQWtCLElBQUMsQ0FBQSxlQUFuQjtJQUNaLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLGlCQUFELENBQUE7SUFFWixJQUFDLENBQUEsT0FBRCxDQUFBO0lBRUEsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFYLENBQWdCLElBQWhCLEVBQW1CLElBQUMsQ0FBQSxRQUFwQixFQUE4QixJQUFDLENBQUEsUUFBL0I7RUFSVzs7MEJBVWIsb0JBQUEsR0FBc0IsU0FBQTtBQUNwQixRQUFBO0lBQUEsTUFBQSxHQUFhLElBQUEsWUFBQSxDQUFhLElBQUMsQ0FBQSxVQUFELEdBQWMsQ0FBM0I7V0FFVCxJQUFBLEtBQUssQ0FBQyxlQUFOLENBQXNCLE1BQXRCLEVBQThCLENBQTlCO0VBSGdCOzswQkFLdEIsZ0JBQUEsR0FBa0IsU0FBQyxlQUFEO0FBQ2hCLFFBQUE7SUFBQSxRQUFBLEdBQWUsSUFBQSxLQUFLLENBQUMsY0FBTixDQUFBO0lBQ2YsUUFBUSxDQUFDLFlBQVQsQ0FBc0IsVUFBdEIsRUFBa0MsZUFBbEM7V0FFQTtFQUpnQjs7MEJBTWxCLGlCQUFBLEdBQW1CLFNBQUE7V0FDYixJQUFBLEtBQUssQ0FBQyxpQkFBTixDQUF3QjtNQUFFLEtBQUEsRUFBTyxRQUFUO01BQW1CLFNBQUEsRUFBVyxFQUE5QjtLQUF4QjtFQURhOzswQkFHbkIsT0FBQSxHQUFT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QSxhQUE3QjthQUFBLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBLEVBQUE7O0VBSk87O3VCQU1ULG1CQUFBLEdBQXFCLFNBQUE7SUFDbkIsSUFBQSxDQUFjLElBQUMsQ0FBQSxLQUFmO0FBQUEsYUFBQTs7SUFFQSxJQUFBLENBQU8sSUFBQyxDQUFBLGFBQVI7TUFDRSxJQUFDLENBQUEsYUFBRCxHQUFxQixJQUFBLGFBQUEsQ0FBYyxJQUFDLENBQUEsS0FBZjtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsR0FBeUI7TUFFekIsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFQLENBQVcsSUFBQyxDQUFBLGFBQVosRUFKRjs7V0FNQSxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsR0FBeUIsQ0FBQyxJQUFDLENBQUEsYUFBYSxDQUFDO0VBVHRCOzt1QkFXckIsY0FBQSxHQUFnQixTQUFBO0lBQ2QsSUFBb0MsSUFBQyxDQUFBLEtBQXJDO2FBQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxPQUFQLEdBQWlCLENBQUMsSUFBQyxDQUFBLEtBQUssQ0FBQyxRQUF6Qjs7RUFEYzs7dUJBR2hCLE9BQUEsR0FBUyxTQUFBO0lBQ1AscUJBQUEsQ0FBc0IsSUFBQyxDQUFBLE9BQXZCO0lBRUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLENBQUE7V0FDQSxJQUFDLENBQUEsTUFBRCxDQUFBO0VBSk87O3VCQU1ULE1BQUEsR0FBUSxTQUFBO1dBQ04sSUFBQyxDQUFBLFFBQVEsQ0FBQyxNQUFWLENBQWlCLElBQUMsQ0FBQSxLQUFsQixFQUF5QixJQUFDLENBQUEsTUFBMUI7RUFETSIsImZpbGUiOiJmb3JhbV8zZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIENlbnRyb2lkc0xpbmUgZXh0ZW5kcyBUSFJFRS5MaW5lXG5cbiAgTUFYX1BPSU5UUzogMTAwXG5cbiAgY29uc3RydWN0b3I6IChAZm9yYW0pIC0+XG4gICAgQHBvc2l0aW9uc0J1ZmZlciA9IEBidWlsZFBvc2l0aW9uc0J1ZmZlcigpXG5cbiAgICBAZ2VvbWV0cnkgPSBAYnVpbGRMaW5lR29tZXRyeSBAcG9zaXRpb25zQnVmZmVyXG4gICAgQG1hdGVyaWFsID0gQGJ1aWxkTGluZU1hdGVyaWFsKClcblxuICAgIEByZWJ1aWxkKClcblxuICAgIFRIUkVFLkxpbmUuY2FsbCBALCBAZ2VvbWV0cnksIEBtYXRlcmlhbFxuXG4gIGJ1aWxkUG9zaXRpb25zQnVmZmVyOiAtPlxuICAgIGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkgQE1BWF9QT0lOVFMgKiAzXG5cbiAgICBuZXcgVEhSRUUuQnVmZmVyQXR0cmlidXRlIGJ1ZmZlciwgM1xuXG4gIGJ1aWxkTGluZUdvbWV0cnk6IChwb3NpdGlvbnNCdWZmZXIpIC0+XG4gICAgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQnVmZmVyR2VvbWV0cnkoKVxuICAgIGdlb21ldHJ5LmFkZEF0dHJpYnV0ZSBcInBvc2l0aW9uXCIsIHBvc2l0aW9uc0J1ZmZlclxuXG4gICAgZ2VvbWV0cnlcblxuICBidWlsZExpbmVNYXRlcmlhbDogLT5cbiAgICBuZXcgVEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwgeyBjb2xvcjogMHhmZjAwMDAsIGxpbmV3aWR0aDogMTAgfVxuXG4gIHJlYnVpbGQ6IC0+XG4gICAgYWN0aXZlQ2hhbWJlcnMgPSBAZmlsdGVyQWN0aXZlQ2hhbWJlcnMoKVxuXG4gICAgcG9zaXRpb25zID0gQHBvc2l0aW9uc0J1ZmZlci5hcnJheVxuICAgIGluZGV4ID0gMFxuXG4gICAgZm9yIGNoYW1iZXIgaW4gYWN0aXZlQ2hhbWJlcnNcbiAgICAgIGNlbnRyb2lkID0gY2hhbWJlci5jZW50ZXJcblxuICAgICAgcG9zaXRpb25zW2luZGV4KytdID0gY2VudHJvaWQueFxuICAgICAgcG9zaXRpb25zW2luZGV4KytdID0gY2VudHJvaWQueVxuICAgICAgcG9zaXRpb25zW2luZGV4KytdID0gY2VudHJvaWQuelxuXG4gICAgQGdlb21ldHJ5LnNldERyYXdSYW5nZSAwLCBhY3RpdmVDaGFtYmVycy5sZW5ndGhcblxuICAgIEBwb3NpdGlvbnNCdWZmZXIubmVlZHNVcGRhdGUgPSB0cnVlXG5cbiAgZmlsdGVyQWN0aXZlQ2hhbWJlcnM6IC0+XG4gICAgY2hhbWJlciBmb3IgY2hhbWJlciBpbiBAZm9yYW0uY2hhbWJlcnMgd2hlbiBjaGFtYmVyLnZpc2libGVcbiIsImNsYXNzIENoYW1iZXIgZXh0ZW5kcyBUSFJFRS5NZXNoXG5cbiAgREVGQVVMVF9URVhUVVJFOiBcIi4uL2Fzc2V0cy9pbWFnZXMvdGV4dHVyZS5naWZcIlxuXG4gIGNvbnN0cnVjdG9yOiAoQGNlbnRlciwgQHJhZGl1cykgLT5cbiAgICBnZW9tZXRyeSA9IEBidWlsZENoYW1iZXJHZW9tZXRyeSgpXG4gICAgbWF0ZXJpYWwgPSBAYnVpbGRDaGFtYmVyTWF0ZXJpYWwoKVxuXG4gICAgVEhSRUUuTWVzaC5jYWxsIEAsIGdlb21ldHJ5LCBtYXRlcmlhbFxuXG4gICAgQHZlcnRpY2VzID0gZ2VvbWV0cnkudmVydGljZXNcbiAgICBAb3JpZ2luICAgPSBAY2VudGVyXG4gICAgQGFwZXJ0dXJlID0gQGNhbGN1bGF0ZUFwZXJ0dXJlKClcblxuICBidWlsZENoYW1iZXJHZW9tZXRyeTogLT5cbiAgICBjZW50ZXJUcmFuc2xhdGlvbk1hdHJpeCA9IEBidWlsZENlbnRlclRyYW5zbGF0aW9uTWF0cml4KClcblxuICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5IEByYWRpdXMsIDMyLCAzMlxuICAgIGdlb21ldHJ5LmFwcGx5TWF0cml4IGNlbnRlclRyYW5zbGF0aW9uTWF0cml4XG4gICAgZ2VvbWV0cnlcblxuICBidWlsZENoYW1iZXJNYXRlcmlhbDogLT5cbiAgICBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCB7IGNvbG9yOiAweGZmZmZmZiB9XG5cbiAgYnVpbGRDZW50ZXJUcmFuc2xhdGlvbk1hdHJpeDogLT5cbiAgICBuZXcgVEhSRUUuTWF0cml4NCgpLm1ha2VUcmFuc2xhdGlvbiBAY2VudGVyLngsIEBjZW50ZXIueSwgQGNlbnRlci56XG5cbiAgY2FsY3VsYXRlQXBlcnR1cmU6IC0+XG4gICAgYXBlcnR1cmUgPSBAdmVydGljZXNbMF1cbiAgICBjdXJyZW50RGlzdGFuY2UgPSBhcGVydHVyZS5kaXN0YW5jZVRvIEBjZW50ZXJcblxuICAgIGZvciB2ZXJ0ZXggaW4gQHZlcnRpY2VzWzEuLi0xXVxuICAgICAgbmV3RGlzdGFuY2UgPSB2ZXJ0ZXguZGlzdGFuY2VUbyBAY2VudGVyXG5cbiAgICAgIGlmIG5ld0Rpc3RhbmNlIDwgY3VycmVudERpc3RhbmNlXG4gICAgICAgIGFwZXJ0dXJlID0gdmVydGV4XG4gICAgICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0Rpc3RhbmNlXG5cbiAgICBhcGVydHVyZVxuXG4gIHNldEFwZXJ0dXJlOiAoYXBlcnR1cmUpIC0+XG4gICAgQGFwZXJ0dXJlID0gYXBlcnR1cmVcblxuICBzZXRBbmNlc3RvcjogKGFuY2VzdG9yKSAtPlxuICAgIEBhbmNlc3RvciA9IGFuY2VzdG9yXG5cbiAgICBpZiBhbmNlc3RvclxuICAgICAgQG9yaWdpbiA9IGFuY2VzdG9yLmFwZXJ0dXJlIGlmIGFuY2VzdG9yXG4gICAgICBhbmNlc3Rvci5jaGlsZCA9IEBcblxuICBjYWxjdWxhdGVHZW9tZXRyeVJpbmc6IC0+XG4gICAgdmVydGV4IGZvciB2ZXJ0ZXggaW4gQC5nZW9tZXRyeS52ZXJ0aWNlcyB3aGVuIHZlcnRleC56ID09IDBcbiIsImNsYXNzIEZvcmFtIGV4dGVuZHMgVEhSRUUuT2JqZWN0M0RcblxuICBJTklUSUFMX1JBRElVUzogNVxuXG4gIGNvbnN0cnVjdG9yOiAoQGdlbm90eXBlKSAtPlxuICAgIFRIUkVFLk9iamVjdDNELmNhbGwgQFxuXG4gICAgaW5pdGlhbENoYW1iZXIgPSBAYnVpbGRJbml0aWFsQ2hhbWJlcigpXG5cbiAgICBAY2hhbWJlcnMgPSBbaW5pdGlhbENoYW1iZXJdXG4gICAgQGN1cnJlbnRDaGFtYmVyID0gaW5pdGlhbENoYW1iZXJcblxuICBidWlsZEluaXRpYWxDaGFtYmVyOiAtPlxuICAgIG5ldyBDaGFtYmVyKG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApLCBASU5JVElBTF9SQURJVVMpXG5cbiAgYnVpbGRDaGFtYmVyczogKG51bUNoYW1iZXJzKSAtPlxuICAgIEBjYWxjdWxhdGVOZXh0Q2hhbWJlcigpIGZvciBpIGluIFsxLi5udW1DaGFtYmVycy0xXVxuICAgIEBidWlsZCgpXG5cbiAgZXZvbHZlOiAtPlxuICAgIGNoaWxkID0gQGN1cnJlbnRDaGFtYmVyLmNoaWxkXG5cbiAgICBpZiBjaGlsZFxuICAgICAgQGN1cnJlbnRDaGFtYmVyID0gY2hpbGRcbiAgICAgIEBjdXJyZW50Q2hhbWJlci52aXNpYmxlID0gdHJ1ZVxuICAgIGVsc2VcbiAgICAgIEBjYWxjdWxhdGVOZXh0Q2hhbWJlcigpXG4gICAgICBAYnVpbGQoKVxuXG4gIHJlZ3Jlc3M6IC0+XG4gICAgYW5jZXN0b3IgPSBAY3VycmVudENoYW1iZXIuYW5jZXN0b3JcblxuICAgIGlmIGFuY2VzdG9yXG4gICAgICBAY3VycmVudENoYW1iZXIudmlzaWJsZSA9IGZhbHNlXG4gICAgICBAY3VycmVudENoYW1iZXIgPSBhbmNlc3RvclxuXG4gIGNhbGN1bGF0ZU5leHRDaGFtYmVyOiAtPlxuICAgIG5ld0NlbnRlciA9IEBjYWxjdWxhdGVOZXdDZW50ZXIoKVxuICAgIG5ld1JhZGl1cyA9IEBjYWxjdWxhdGVOZXdSYWRpdXMoKVxuXG4gICAgbmV3Q2hhbWJlciA9IG5ldyBDaGFtYmVyIG5ld0NlbnRlciwgbmV3UmFkaXVzXG5cbiAgICBuZXdBcGVydHVyZSA9IEBjYWxjdWxhdGVOZXdBcGVydHVyZSBuZXdDaGFtYmVyXG5cbiAgICBuZXdDaGFtYmVyLnNldEFwZXJ0dXJlIG5ld0FwZXJ0dXJlXG4gICAgbmV3Q2hhbWJlci5zZXRBbmNlc3RvciBAY3VycmVudENoYW1iZXJcblxuICAgIEBjaGFtYmVycy5wdXNoIG5ld0NoYW1iZXJcblxuICAgIEBjdXJyZW50Q2hhbWJlciA9IG5ld0NoYW1iZXJcblxuICBjYWxjdWxhdGVOZXdDZW50ZXI6IC0+XG4gICAgY3VycmVudE9yaWdpbiAgID0gQGN1cnJlbnRDaGFtYmVyLm9yaWdpblxuICAgIGN1cnJlbnRBcGVydHVyZSA9IEBjdXJyZW50Q2hhbWJlci5hcGVydHVyZVxuXG4gICAgIyBjYWxjdWxhdGUgaW5pdGlhbCBncm93dGggdmVjdG9yIChyZWZlcmVuY2UgbGluZSlcblxuICAgIGdyb3d0aFZlY3RvciA9IG5ldyBUSFJFRS5WZWN0b3IzXG4gICAgZ3Jvd3RoVmVjdG9yLnN1YlZlY3RvcnMgY3VycmVudEFwZXJ0dXJlLCBjdXJyZW50T3JpZ2luXG5cbiAgICAjIGRldmlhdGUgZ3Jvd3RoIHZlY3RvciBmcm9tIHJlZmVyZW5jZSBsaW5lXG5cbiAgICBob3Jpem9udGFsUm90YXRpb25BeGlzID0gbmV3IFRIUkVFLlZlY3RvcjMgMCwgMCwgMVxuICAgIHZlcnRpY2FsUm90YXRpb25BeGlzICAgPSBuZXcgVEhSRUUuVmVjdG9yMyAxLCAwLCAwXG5cbiAgICBncm93dGhWZWN0b3IuYXBwbHlBeGlzQW5nbGUgaG9yaXpvbnRhbFJvdGF0aW9uQXhpcywgQGdlbm90eXBlLnBoaVxuICAgIGdyb3d0aFZlY3Rvci5hcHBseUF4aXNBbmdsZSB2ZXJ0aWNhbFJvdGF0aW9uQXhpcywgICBAZ2Vub3R5cGUuYmV0YVxuXG4gICAgIyBtdWx0aXBseSBncm93dGggdmVjdG9yIGJ5IHRyYW5zbGFjdGlvbiBmYWN0b3JcblxuICAgIGdyb3d0aFZlY3Rvci5ub3JtYWxpemUoKVxuICAgIGdyb3d0aFZlY3Rvci5tdWx0aXBseVNjYWxhciBAZ2Vub3R5cGUudHJhbnNsYXRpb25GYWN0b3JcblxuICAgICMgY2FsY3VsYXRlIGNlbnRlciBvZiBuZXcgY2hhbWJlclxuXG4gICAgbmV3Q2VudGVyID0gbmV3IFRIUkVFLlZlY3RvcjNcbiAgICBuZXdDZW50ZXIuY29weSBjdXJyZW50QXBlcnR1cmVcbiAgICBuZXdDZW50ZXIuYWRkIGdyb3d0aFZlY3RvclxuXG4gICAgbmV3Q2VudGVyXG5cbiAgY2FsY3VsYXRlTmV3UmFkaXVzOiAtPlxuICAgIChAY3VycmVudENoYW1iZXIuYW5jZXN0b3IgfHwgQGN1cnJlbnRDaGFtYmVyKS5yYWRpdXMgKiBAZ2Vub3R5cGUuZ3Jvd3RoRmFjdG9yXG5cbiAgY2FsY3VsYXRlTmV3QXBlcnR1cmU6IChuZXdDaGFtYmVyKSAtPlxuICAgIG5ld0NlbnRlciAgID0gbmV3Q2hhbWJlci5jZW50ZXJcbiAgICBuZXdBcGVydHVyZSA9IG5ld0NoYW1iZXIudmVydGljZXNbMF1cblxuICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0FwZXJ0dXJlLmRpc3RhbmNlVG8gbmV3Q2VudGVyXG5cbiAgICBmb3IgdmVydGV4IGluIG5ld0NoYW1iZXIudmVydGljZXNbMS4uLTFdXG4gICAgICBuZXdEaXN0YW5jZSA9IHZlcnRleC5kaXN0YW5jZVRvIG5ld0NlbnRlclxuXG4gICAgICBpZiBuZXdEaXN0YW5jZSA8IGN1cnJlbnREaXN0YW5jZVxuICAgICAgICBjb250YWlucyA9IGZhbHNlXG5cbiAgICAgICAgZm9yIGNoYW1iZXIgaW4gQGNoYW1iZXJzXG4gICAgICAgICAgaWYgY2hhbWJlci5yYWRpdXMgPiBuZXdBcGVydHVyZS5kaXN0YW5jZVRvIGNoYW1iZXIuY2VudGVyXG4gICAgICAgICAgICBjb250YWlucyA9IHRydWVcbiAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgdW5sZXNzIGNvbnRhaW5zXG4gICAgICAgICAgbmV3QXBlcnR1cmUgPSB2ZXJ0ZXhcbiAgICAgICAgICBjdXJyZW50RGlzdGFuY2UgPSBuZXdEaXN0YW5jZVxuXG4gICAgbmV3QXBlcnR1cmVcblxuICBidWlsZDogLT5cbiAgICBALmFkZCBjaGFtYmVyIGZvciBjaGFtYmVyIGluIEBjaGFtYmVyc1xuIiwiIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRm9yIE1yIFdoaXRlLi4uIFsqXVxuI1xuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX198fHx8fHxfX1xuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgIHxcbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW15dW15dXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgX18gfFxuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X19fX3xcblxuY2xhc3MgU2ltdWxhdGlvblxuXG4gIGNvbnN0cnVjdG9yOiAoQGNhbnZhcywgQG9wdGlvbnMpIC0+XG4gICAgZGVmYXVsdHMgPSB7IGRldjogZmFsc2UgfVxuXG4gICAgQG9wdGlvbnMgfHw9IHt9XG5cbiAgICBmb3Igb3B0aW9uIG9mIGRlZmF1bHRzXG4gICAgICBAb3B0aW9uc1tvcHRpb25dIHx8PSBkZWZhdWx0c1tvcHRpb25dXG5cbiAgICBAc2V0dXBTY2VuZSgpXG4gICAgQHNldHVwQ29udHJvbHMoKVxuICAgIEBzZXR1cEdVSSgpIGlmIEBvcHRpb25zLmRldlxuXG4gIHNldHVwU2NlbmU6IC0+XG4gICAgQHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKClcblxuICAgICMgY2FtZXJhXG5cbiAgICBAY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDQ1LCB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodCwgMC4xLCAxMDAwKVxuICAgIEBjYW1lcmEucG9zaXRpb24uc2V0IDAsIDAsIDcwXG4gICAgQHNjZW5lLmFkZCBAY2FtZXJhXG5cbiAgICAjIHJlbmRlcmVyXG5cbiAgICBAcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlciB7IGFscGhhOiB0cnVlLCBhbnRpYWxpYXM6IHRydWUgfVxuICAgIEByZW5kZXJlci5zZXRDbGVhckNvbG9yIDB4MTExMTExLCAxXG4gICAgQHJlbmRlcmVyLnNldFNpemUgd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodFxuXG4gICAgIyBsaWdodGluZ1xuXG4gICAgc3BvdExpZ2h0ID0gbmV3IFRIUkVFLlNwb3RMaWdodCAweGZmZmZmZlxuICAgIEBjYW1lcmEuYWRkIHNwb3RMaWdodFxuXG4gICAgQGNhbnZhcy5hcHBlbmQgQHJlbmRlcmVyLmRvbUVsZW1lbnRcblxuICBzZXR1cENvbnRyb2xzOiAtPlxuICAgIEBjb250cm9scyA9IG5ldyBUSFJFRS5UcmFja2JhbGxDb250cm9scyBAY2FtZXJhLCBAcmVuZGVyZXIuZG9tRWxlbWVudFxuXG4gICAgQGNvbnRyb2xzLnJvdGF0ZVNwZWVkID0gNS4wXG4gICAgQGNvbnRyb2xzLnpvb21TcGVlZCAgID0gMS4yXG4gICAgQGNvbnRyb2xzLnBhblNwZWVkICAgID0gMC44XG5cbiAgICBAY29udHJvbHMubm9ab29tID0gZmFsc2VcbiAgICBAY29udHJvbHMubm9QYW4gID0gZmFsc2VcblxuICAgIEBjb250cm9scy5zdGF0aWNNb3ZpbmcgPSB0cnVlXG5cbiAgICBAY29udHJvbHMuZHluYW1pY0RhbXBpbmdGYWN0b3IgPSAwLjNcblxuICAgIEBjb250cm9scy5rZXlzID0gWzY1LCA4MywgNjhdXG5cbiAgc2V0dXBHVUk6IC0+XG4gICAgQGd1aSA9IG5ldyBkYXQuR1VJXG5cbiAgICBnZW5vdHlwZSA9XG4gICAgICBwaGk6ICAgICAgICAgICAgICAgMC41XG4gICAgICBiZXRhOiAgICAgICAgICAgICAgMC41XG4gICAgICB0cmFuc2xhdGlvbkZhY3RvcjogMC41XG4gICAgICBncm93dGhGYWN0b3I6ICAgICAgMS4xXG5cbiAgICBzaW11bGF0aW9uT3B0aW9ucyA9XG4gICAgICBudW1DaGFtYmVyczogN1xuXG4gICAgc3RydWN0dXJlQW5hbHl6ZXIgPVxuICAgICAgc2ltdWxhdGU6ICAgICAgID0+IEBzaW11bGF0ZShnZW5vdHlwZSwgc2ltdWxhdGlvbk9wdGlvbnMpXG4gICAgICBldm9sdmU6ICAgICAgICAgPT4gQGV2b2x2ZSgpXG4gICAgICByZWdyZXNzOiAgICAgICAgPT4gQHJlZ3Jlc3MoKVxuICAgICAgY2VudHJvaWRzTGluZTogID0+IEB0b2dnbGVDZW50cm9pZHNMaW5lKClcbiAgICAgIHRvZ2dsZUNoYW1iZXJzOiA9PiBAdG9nZ2xlQ2hhbWJlcnMoKVxuXG4gICAgQGd1aS5hZGQoZ2Vub3R5cGUsICdwaGknKS5zdGVwIDAuMDFcbiAgICBAZ3VpLmFkZChnZW5vdHlwZSwgJ2JldGEnKS5zdGVwIDAuMDFcbiAgICBAZ3VpLmFkZChnZW5vdHlwZSwgJ3RyYW5zbGF0aW9uRmFjdG9yJykuc3RlcCAwLjAxXG4gICAgQGd1aS5hZGQoZ2Vub3R5cGUsICdncm93dGhGYWN0b3InKS5zdGVwIDAuMDFcblxuICAgIEBndWkuYWRkKHNpbXVsYXRpb25PcHRpb25zLCAnbnVtQ2hhbWJlcnMnKVxuXG4gICAgQGd1aS5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdzaW11bGF0ZScpXG4gICAgQGd1aS5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdldm9sdmUnKVxuICAgIEBndWkuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAncmVncmVzcycpXG4gICAgQGd1aS5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdjZW50cm9pZHNMaW5lJylcbiAgICBAZ3VpLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ3RvZ2dsZUNoYW1iZXJzJylcblxuICBzaW11bGF0ZTogKGdlbm90eXBlLCBvcHRpb25zKSAtPlxuICAgIEBzY2VuZS5yZW1vdmUgQGZvcmFtIGlmIEBmb3JhbVxuXG4gICAgQGZvcmFtID0gbmV3IEZvcmFtIGdlbm90eXBlXG4gICAgQGZvcmFtLmJ1aWxkQ2hhbWJlcnMgb3B0aW9ucy5udW1DaGFtYmVyc1xuXG4gICAgQHNjZW5lLmFkZCBAZm9yYW1cblxuICBldm9sdmU6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIEBmb3JhbS5ldm9sdmUoKVxuICAgIEBjZW50cm9pZHNMaW5lLnJlYnVpbGQoKSBpZiBAY2VudHJvaWRzTGluZVxuXG4gIHJlZ3Jlc3M6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIEBmb3JhbS5yZWdyZXNzKClcbiAgICBAY2VudHJvaWRzTGluZS5yZWJ1aWxkKCkgaWYgQGNlbnRyb2lkc0xpbmVcblxuICB0b2dnbGVDZW50cm9pZHNMaW5lOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICB1bmxlc3MgQGNlbnRyb2lkc0xpbmVcbiAgICAgIEBjZW50cm9pZHNMaW5lID0gbmV3IENlbnRyb2lkc0xpbmUoQGZvcmFtKVxuICAgICAgQGNlbnRyb2lkc0xpbmUudmlzaWJsZSA9IGZhbHNlXG5cbiAgICAgIEBzY2VuZS5hZGQgQGNlbnRyb2lkc0xpbmVcblxuICAgIEBjZW50cm9pZHNMaW5lLnZpc2libGUgPSAhQGNlbnRyb2lkc0xpbmUudmlzaWJsZVxuXG4gIHRvZ2dsZUNoYW1iZXJzOiAtPlxuICAgIEBmb3JhbS52aXNpYmxlID0gIUBmb3JhbS52aXNpYmxlIGlmIEBmb3JhbVxuXG4gIGFuaW1hdGU6ID0+XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIEBhbmltYXRlXG5cbiAgICBAY29udHJvbHMudXBkYXRlKClcbiAgICBAcmVuZGVyKClcblxuICByZW5kZXI6IC0+XG4gICAgQHJlbmRlcmVyLnJlbmRlciBAc2NlbmUsIEBjYW1lcmFcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==