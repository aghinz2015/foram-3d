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

  function Chamber(center, radius, material) {
    var geometry;
    this.center = center;
    this.radius = radius;
    geometry = this.buildChamberGeometry();
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
    this.material = this.buildChamberMaterial();
    initialChamber = this.buildInitialChamber();
    this.chambers = [initialChamber];
    this.currentChamber = initialChamber;
  }

  Foram.prototype.buildChamberMaterial = function() {
    return new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true
    });
  };

  Foram.prototype.buildInitialChamber = function() {
    return this.buildChamber(new THREE.Vector3(0, 0, 0), this.INITIAL_RADIUS);
  };

  Foram.prototype.buildChamber = function(center, radius) {
    return new Chamber(center, radius, this.material);
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
    newChamber = this.buildChamber(newCenter, newRadius);
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
    this.material = {
      opacity: 1.0
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
    this.gui.add(structureAnalyzer, 'toggleChambers');
    return this.gui.add(this.material, 'opacity');
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
    if (this.foram) {
      this.foram.material.opacity = this.material.opacity;
    }
    this.controls.update();
    return this.render();
  };

  Simulation.prototype.render = function() {
    return this.renderer.render(this.scene, this.camera);
  };

  return Simulation;

})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2NlbnRyb2lkc19saW5lLmNvZmZlZSIsImpzL2NoYW1iZXIuY29mZmVlIiwianMvZm9yYW0uY29mZmVlIiwianMvc2ltdWxhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxhQUFBO0VBQUE7OztBQUFNOzs7MEJBRUosVUFBQSxHQUFZOztFQUVDLHVCQUFDLEtBQUQ7SUFBQyxJQUFDLENBQUEsUUFBRDtJQUNaLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0lBRW5CLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLGdCQUFELENBQWtCLElBQUMsQ0FBQSxlQUFuQjtJQUNaLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLGlCQUFELENBQUE7SUFFWixJQUFDLENBQUEsT0FBRCxDQUFBO0lBRUEsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFYLENBQWdCLElBQWhCLEVBQW1CLElBQUMsQ0FBQSxRQUFwQixFQUE4QixJQUFDLENBQUEsUUFBL0I7RUFSVzs7MEJBVWIsb0JBQUEsR0FBc0IsU0FBQTtBQUNwQixRQUFBO0lBQUEsTUFBQSxHQUFhLElBQUEsWUFBQSxDQUFhLElBQUMsQ0FBQSxVQUFELEdBQWMsQ0FBM0I7V0FFVCxJQUFBLEtBQUssQ0FBQyxlQUFOLENBQXNCLE1BQXRCLEVBQThCLENBQTlCO0VBSGdCOzswQkFLdEIsZ0JBQUEsR0FBa0IsU0FBQyxlQUFEO0FBQ2hCLFFBQUE7SUFBQSxRQUFBLEdBQWUsSUFBQSxLQUFLLENBQUMsY0FBTixDQUFBO0lBQ2YsUUFBUSxDQUFDLFlBQVQsQ0FBc0IsVUFBdEIsRUFBa0MsZUFBbEM7V0FFQTtFQUpnQjs7MEJBTWxCLGlCQUFBLEdBQW1CLFNBQUE7V0FDYixJQUFBLEtBQUssQ0FBQyxpQkFBTixDQUF3QjtNQUFFLEtBQUEsRUFBTyxRQUFUO01BQW1CLFNBQUEsRUFBVyxFQUE5QjtLQUF4QjtFQURhOzswQkFHbkIsT0FBQSxHQUFT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QUFDLFFBRHRDOztJQUdBLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixDQUFBO1dBQ0EsSUFBQyxDQUFBLE1BQUQsQ0FBQTtFQVBPOzt1QkFTVCxNQUFBLEdBQVEsU0FBQTtXQUNOLElBQUMsQ0FBQSxRQUFRLENBQUMsTUFBVixDQUFpQixJQUFDLENBQUEsS0FBbEIsRUFBeUIsSUFBQyxDQUFBLE1BQTFCO0VBRE0iLCJmaWxlIjoiZm9yYW1fM2QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBDZW50cm9pZHNMaW5lIGV4dGVuZHMgVEhSRUUuTGluZVxuXG4gIE1BWF9QT0lOVFM6IDEwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQGZvcmFtKSAtPlxuICAgIEBwb3NpdGlvbnNCdWZmZXIgPSBAYnVpbGRQb3NpdGlvbnNCdWZmZXIoKVxuXG4gICAgQGdlb21ldHJ5ID0gQGJ1aWxkTGluZUdvbWV0cnkgQHBvc2l0aW9uc0J1ZmZlclxuICAgIEBtYXRlcmlhbCA9IEBidWlsZExpbmVNYXRlcmlhbCgpXG5cbiAgICBAcmVidWlsZCgpXG5cbiAgICBUSFJFRS5MaW5lLmNhbGwgQCwgQGdlb21ldHJ5LCBAbWF0ZXJpYWxcblxuICBidWlsZFBvc2l0aW9uc0J1ZmZlcjogLT5cbiAgICBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5IEBNQVhfUE9JTlRTICogM1xuXG4gICAgbmV3IFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBidWZmZXIsIDNcblxuICBidWlsZExpbmVHb21ldHJ5OiAocG9zaXRpb25zQnVmZmVyKSAtPlxuICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkJ1ZmZlckdlb21ldHJ5KClcbiAgICBnZW9tZXRyeS5hZGRBdHRyaWJ1dGUgXCJwb3NpdGlvblwiLCBwb3NpdGlvbnNCdWZmZXJcblxuICAgIGdlb21ldHJ5XG5cbiAgYnVpbGRMaW5lTWF0ZXJpYWw6IC0+XG4gICAgbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsIHsgY29sb3I6IDB4ZmYwMDAwLCBsaW5ld2lkdGg6IDEwIH1cblxuICByZWJ1aWxkOiAtPlxuICAgIGFjdGl2ZUNoYW1iZXJzID0gQGZpbHRlckFjdGl2ZUNoYW1iZXJzKClcblxuICAgIHBvc2l0aW9ucyA9IEBwb3NpdGlvbnNCdWZmZXIuYXJyYXlcbiAgICBpbmRleCA9IDBcblxuICAgIGZvciBjaGFtYmVyIGluIGFjdGl2ZUNoYW1iZXJzXG4gICAgICBjZW50cm9pZCA9IGNoYW1iZXIuY2VudGVyXG5cbiAgICAgIHBvc2l0aW9uc1tpbmRleCsrXSA9IGNlbnRyb2lkLnhcbiAgICAgIHBvc2l0aW9uc1tpbmRleCsrXSA9IGNlbnRyb2lkLnlcbiAgICAgIHBvc2l0aW9uc1tpbmRleCsrXSA9IGNlbnRyb2lkLnpcblxuICAgIEBnZW9tZXRyeS5zZXREcmF3UmFuZ2UgMCwgYWN0aXZlQ2hhbWJlcnMubGVuZ3RoXG5cbiAgICBAcG9zaXRpb25zQnVmZmVyLm5lZWRzVXBkYXRlID0gdHJ1ZVxuXG4gIGZpbHRlckFjdGl2ZUNoYW1iZXJzOiAtPlxuICAgIGNoYW1iZXIgZm9yIGNoYW1iZXIgaW4gQGZvcmFtLmNoYW1iZXJzIHdoZW4gY2hhbWJlci52aXNpYmxlXG4iLCJjbGFzcyBDaGFtYmVyIGV4dGVuZHMgVEhSRUUuTWVzaFxuXG4gIERFRkFVTFRfVEVYVFVSRTogXCIuLi9hc3NldHMvaW1hZ2VzL3RleHR1cmUuZ2lmXCJcblxuICBjb25zdHJ1Y3RvcjogKEBjZW50ZXIsIEByYWRpdXMsIG1hdGVyaWFsKSAtPlxuICAgIGdlb21ldHJ5ID0gQGJ1aWxkQ2hhbWJlckdlb21ldHJ5KClcblxuICAgIFRIUkVFLk1lc2guY2FsbCBALCBnZW9tZXRyeSwgbWF0ZXJpYWxcblxuICAgIEB2ZXJ0aWNlcyA9IGdlb21ldHJ5LnZlcnRpY2VzXG4gICAgQG9yaWdpbiAgID0gQGNlbnRlclxuICAgIEBhcGVydHVyZSA9IEBjYWxjdWxhdGVBcGVydHVyZSgpXG5cbiAgYnVpbGRDaGFtYmVyR2VvbWV0cnk6IC0+XG4gICAgY2VudGVyVHJhbnNsYXRpb25NYXRyaXggPSBAYnVpbGRDZW50ZXJUcmFuc2xhdGlvbk1hdHJpeCgpXG5cbiAgICBnZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSBAcmFkaXVzLCAzMiwgMzJcbiAgICBnZW9tZXRyeS5hcHBseU1hdHJpeCBjZW50ZXJUcmFuc2xhdGlvbk1hdHJpeFxuICAgIGdlb21ldHJ5XG5cbiAgYnVpbGRDZW50ZXJUcmFuc2xhdGlvbk1hdHJpeDogLT5cbiAgICBuZXcgVEhSRUUuTWF0cml4NCgpLm1ha2VUcmFuc2xhdGlvbiBAY2VudGVyLngsIEBjZW50ZXIueSwgQGNlbnRlci56XG5cbiAgY2FsY3VsYXRlQXBlcnR1cmU6IC0+XG4gICAgYXBlcnR1cmUgPSBAdmVydGljZXNbMF1cbiAgICBjdXJyZW50RGlzdGFuY2UgPSBhcGVydHVyZS5kaXN0YW5jZVRvIEBjZW50ZXJcblxuICAgIGZvciB2ZXJ0ZXggaW4gQHZlcnRpY2VzWzEuLi0xXVxuICAgICAgbmV3RGlzdGFuY2UgPSB2ZXJ0ZXguZGlzdGFuY2VUbyBAY2VudGVyXG5cbiAgICAgIGlmIG5ld0Rpc3RhbmNlIDwgY3VycmVudERpc3RhbmNlXG4gICAgICAgIGFwZXJ0dXJlID0gdmVydGV4XG4gICAgICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0Rpc3RhbmNlXG5cbiAgICBhcGVydHVyZVxuXG4gIHNldEFwZXJ0dXJlOiAoYXBlcnR1cmUpIC0+XG4gICAgQGFwZXJ0dXJlID0gYXBlcnR1cmVcblxuICBzZXRBbmNlc3RvcjogKGFuY2VzdG9yKSAtPlxuICAgIEBhbmNlc3RvciA9IGFuY2VzdG9yXG5cbiAgICBpZiBhbmNlc3RvclxuICAgICAgQG9yaWdpbiA9IGFuY2VzdG9yLmFwZXJ0dXJlIGlmIGFuY2VzdG9yXG4gICAgICBhbmNlc3Rvci5jaGlsZCA9IEBcblxuICBjYWxjdWxhdGVHZW9tZXRyeVJpbmc6IC0+XG4gICAgdmVydGV4IGZvciB2ZXJ0ZXggaW4gQC5nZW9tZXRyeS52ZXJ0aWNlcyB3aGVuIHZlcnRleC56ID09IDBcbiIsImNsYXNzIEZvcmFtIGV4dGVuZHMgVEhSRUUuT2JqZWN0M0RcblxuICBJTklUSUFMX1JBRElVUzogNVxuXG4gIGNvbnN0cnVjdG9yOiAoQGdlbm90eXBlKSAtPlxuICAgIFRIUkVFLk9iamVjdDNELmNhbGwgQFxuXG4gICAgQG1hdGVyaWFsID0gQGJ1aWxkQ2hhbWJlck1hdGVyaWFsKClcblxuICAgIGluaXRpYWxDaGFtYmVyID0gQGJ1aWxkSW5pdGlhbENoYW1iZXIoKVxuXG4gICAgQGNoYW1iZXJzID0gW2luaXRpYWxDaGFtYmVyXVxuICAgIEBjdXJyZW50Q2hhbWJlciA9IGluaXRpYWxDaGFtYmVyXG5cbiAgYnVpbGRDaGFtYmVyTWF0ZXJpYWw6IC0+XG4gICAgbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwgeyBjb2xvcjogMHhmZmZmZmYsIHRyYW5zcGFyZW50OiB0cnVlIH1cblxuICBidWlsZEluaXRpYWxDaGFtYmVyOiAtPlxuICAgIEBidWlsZENoYW1iZXIgbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCksIEBJTklUSUFMX1JBRElVU1xuXG4gIGJ1aWxkQ2hhbWJlcjogKGNlbnRlciwgcmFkaXVzKSAtPlxuICAgIG5ldyBDaGFtYmVyIGNlbnRlciwgcmFkaXVzLCBAbWF0ZXJpYWxcblxuICBidWlsZENoYW1iZXJzOiAobnVtQ2hhbWJlcnMpIC0+XG4gICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKCkgZm9yIGkgaW4gWzEuLm51bUNoYW1iZXJzLTFdXG4gICAgQGJ1aWxkKClcblxuICBldm9sdmU6IC0+XG4gICAgY2hpbGQgPSBAY3VycmVudENoYW1iZXIuY2hpbGRcblxuICAgIGlmIGNoaWxkXG4gICAgICBAY3VycmVudENoYW1iZXIgPSBjaGlsZFxuICAgICAgQGN1cnJlbnRDaGFtYmVyLnZpc2libGUgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKClcbiAgICAgIEBidWlsZCgpXG5cbiAgcmVncmVzczogLT5cbiAgICBhbmNlc3RvciA9IEBjdXJyZW50Q2hhbWJlci5hbmNlc3RvclxuXG4gICAgaWYgYW5jZXN0b3JcbiAgICAgIEBjdXJyZW50Q2hhbWJlci52aXNpYmxlID0gZmFsc2VcbiAgICAgIEBjdXJyZW50Q2hhbWJlciA9IGFuY2VzdG9yXG5cbiAgY2FsY3VsYXRlTmV4dENoYW1iZXI6IC0+XG4gICAgbmV3Q2VudGVyID0gQGNhbGN1bGF0ZU5ld0NlbnRlcigpXG4gICAgbmV3UmFkaXVzID0gQGNhbGN1bGF0ZU5ld1JhZGl1cygpXG5cbiAgICBuZXdDaGFtYmVyID0gQGJ1aWxkQ2hhbWJlciBuZXdDZW50ZXIsIG5ld1JhZGl1c1xuXG4gICAgbmV3QXBlcnR1cmUgPSBAY2FsY3VsYXRlTmV3QXBlcnR1cmUgbmV3Q2hhbWJlclxuXG4gICAgbmV3Q2hhbWJlci5zZXRBcGVydHVyZSBuZXdBcGVydHVyZVxuICAgIG5ld0NoYW1iZXIuc2V0QW5jZXN0b3IgQGN1cnJlbnRDaGFtYmVyXG5cbiAgICBAY2hhbWJlcnMucHVzaCBuZXdDaGFtYmVyXG5cbiAgICBAY3VycmVudENoYW1iZXIgPSBuZXdDaGFtYmVyXG5cbiAgY2FsY3VsYXRlTmV3Q2VudGVyOiAtPlxuICAgIGN1cnJlbnRPcmlnaW4gICA9IEBjdXJyZW50Q2hhbWJlci5vcmlnaW5cbiAgICBjdXJyZW50QXBlcnR1cmUgPSBAY3VycmVudENoYW1iZXIuYXBlcnR1cmVcblxuICAgICMgY2FsY3VsYXRlIGluaXRpYWwgZ3Jvd3RoIHZlY3RvciAocmVmZXJlbmNlIGxpbmUpXG5cbiAgICBncm93dGhWZWN0b3IgPSBuZXcgVEhSRUUuVmVjdG9yM1xuICAgIGdyb3d0aFZlY3Rvci5zdWJWZWN0b3JzIGN1cnJlbnRBcGVydHVyZSwgY3VycmVudE9yaWdpblxuXG4gICAgIyBkZXZpYXRlIGdyb3d0aCB2ZWN0b3IgZnJvbSByZWZlcmVuY2UgbGluZVxuXG4gICAgaG9yaXpvbnRhbFJvdGF0aW9uQXhpcyA9IG5ldyBUSFJFRS5WZWN0b3IzIDAsIDAsIDFcbiAgICB2ZXJ0aWNhbFJvdGF0aW9uQXhpcyAgID0gbmV3IFRIUkVFLlZlY3RvcjMgMSwgMCwgMFxuXG4gICAgZ3Jvd3RoVmVjdG9yLmFwcGx5QXhpc0FuZ2xlIGhvcml6b250YWxSb3RhdGlvbkF4aXMsIEBnZW5vdHlwZS5waGlcbiAgICBncm93dGhWZWN0b3IuYXBwbHlBeGlzQW5nbGUgdmVydGljYWxSb3RhdGlvbkF4aXMsICAgQGdlbm90eXBlLmJldGFcblxuICAgICMgbXVsdGlwbHkgZ3Jvd3RoIHZlY3RvciBieSB0cmFuc2xhY3Rpb24gZmFjdG9yXG5cbiAgICBncm93dGhWZWN0b3Iubm9ybWFsaXplKClcbiAgICBncm93dGhWZWN0b3IubXVsdGlwbHlTY2FsYXIgQGdlbm90eXBlLnRyYW5zbGF0aW9uRmFjdG9yXG5cbiAgICAjIGNhbGN1bGF0ZSBjZW50ZXIgb2YgbmV3IGNoYW1iZXJcblxuICAgIG5ld0NlbnRlciA9IG5ldyBUSFJFRS5WZWN0b3IzXG4gICAgbmV3Q2VudGVyLmNvcHkgY3VycmVudEFwZXJ0dXJlXG4gICAgbmV3Q2VudGVyLmFkZCBncm93dGhWZWN0b3JcblxuICAgIG5ld0NlbnRlclxuXG4gIGNhbGN1bGF0ZU5ld1JhZGl1czogLT5cbiAgICAoQGN1cnJlbnRDaGFtYmVyLmFuY2VzdG9yIHx8IEBjdXJyZW50Q2hhbWJlcikucmFkaXVzICogQGdlbm90eXBlLmdyb3d0aEZhY3RvclxuXG4gIGNhbGN1bGF0ZU5ld0FwZXJ0dXJlOiAobmV3Q2hhbWJlcikgLT5cbiAgICBuZXdDZW50ZXIgICA9IG5ld0NoYW1iZXIuY2VudGVyXG4gICAgbmV3QXBlcnR1cmUgPSBuZXdDaGFtYmVyLnZlcnRpY2VzWzBdXG5cbiAgICBjdXJyZW50RGlzdGFuY2UgPSBuZXdBcGVydHVyZS5kaXN0YW5jZVRvIG5ld0NlbnRlclxuXG4gICAgZm9yIHZlcnRleCBpbiBuZXdDaGFtYmVyLnZlcnRpY2VzWzEuLi0xXVxuICAgICAgbmV3RGlzdGFuY2UgPSB2ZXJ0ZXguZGlzdGFuY2VUbyBuZXdDZW50ZXJcblxuICAgICAgaWYgbmV3RGlzdGFuY2UgPCBjdXJyZW50RGlzdGFuY2VcbiAgICAgICAgY29udGFpbnMgPSBmYWxzZVxuXG4gICAgICAgIGZvciBjaGFtYmVyIGluIEBjaGFtYmVyc1xuICAgICAgICAgIGlmIGNoYW1iZXIucmFkaXVzID4gbmV3QXBlcnR1cmUuZGlzdGFuY2VUbyBjaGFtYmVyLmNlbnRlclxuICAgICAgICAgICAgY29udGFpbnMgPSB0cnVlXG4gICAgICAgICAgICBicmVha1xuXG4gICAgICAgIHVubGVzcyBjb250YWluc1xuICAgICAgICAgIG5ld0FwZXJ0dXJlID0gdmVydGV4XG4gICAgICAgICAgY3VycmVudERpc3RhbmNlID0gbmV3RGlzdGFuY2VcblxuICAgIG5ld0FwZXJ0dXJlXG5cbiAgYnVpbGQ6IC0+XG4gICAgQC5hZGQgY2hhbWJlciBmb3IgY2hhbWJlciBpbiBAY2hhbWJlcnNcbiIsIiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEZvciBNciBXaGl0ZS4uLiBbKl1cbiNcbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9ffHx8fHx8X19cbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAgICB8XG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFteXVteXVxuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IF9fIHxcbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfF9fX198XG5cbmNsYXNzIFNpbXVsYXRpb25cblxuICBjb25zdHJ1Y3RvcjogKEBjYW52YXMsIEBvcHRpb25zKSAtPlxuICAgIGRlZmF1bHRzID0geyBkZXY6IGZhbHNlIH1cblxuICAgIEBvcHRpb25zIHx8PSB7fVxuXG4gICAgZm9yIG9wdGlvbiBvZiBkZWZhdWx0c1xuICAgICAgQG9wdGlvbnNbb3B0aW9uXSB8fD0gZGVmYXVsdHNbb3B0aW9uXVxuXG4gICAgQHNldHVwU2NlbmUoKVxuICAgIEBzZXR1cENvbnRyb2xzKClcbiAgICBAc2V0dXBHVUkoKSBpZiBAb3B0aW9ucy5kZXZcblxuICBzZXR1cFNjZW5lOiAtPlxuICAgIEBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpXG5cbiAgICAjIGNhbWVyYVxuXG4gICAgQGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg0NSwgd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQsIDAuMSwgMTAwMClcbiAgICBAY2FtZXJhLnBvc2l0aW9uLnNldCAwLCAwLCA3MFxuICAgIEBzY2VuZS5hZGQgQGNhbWVyYVxuXG4gICAgIyByZW5kZXJlclxuXG4gICAgQHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIgeyBhbHBoYTogdHJ1ZSwgYW50aWFsaWFzOiB0cnVlIH1cbiAgICBAcmVuZGVyZXIuc2V0Q2xlYXJDb2xvciAweDExMTExMSwgMVxuICAgIEByZW5kZXJlci5zZXRTaXplIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHRcblxuICAgICMgbGlnaHRpbmdcblxuICAgIHNwb3RMaWdodCA9IG5ldyBUSFJFRS5TcG90TGlnaHQgMHhmZmZmZmZcbiAgICBAY2FtZXJhLmFkZCBzcG90TGlnaHRcblxuICAgIEBjYW52YXMuYXBwZW5kIEByZW5kZXJlci5kb21FbGVtZW50XG5cbiAgc2V0dXBDb250cm9sczogLT5cbiAgICBAY29udHJvbHMgPSBuZXcgVEhSRUUuVHJhY2tiYWxsQ29udHJvbHMgQGNhbWVyYSwgQHJlbmRlcmVyLmRvbUVsZW1lbnRcblxuICAgIEBjb250cm9scy5yb3RhdGVTcGVlZCA9IDUuMFxuICAgIEBjb250cm9scy56b29tU3BlZWQgICA9IDEuMlxuICAgIEBjb250cm9scy5wYW5TcGVlZCAgICA9IDAuOFxuXG4gICAgQGNvbnRyb2xzLm5vWm9vbSA9IGZhbHNlXG4gICAgQGNvbnRyb2xzLm5vUGFuICA9IGZhbHNlXG5cbiAgICBAY29udHJvbHMuc3RhdGljTW92aW5nID0gdHJ1ZVxuXG4gICAgQGNvbnRyb2xzLmR5bmFtaWNEYW1waW5nRmFjdG9yID0gMC4zXG5cbiAgICBAY29udHJvbHMua2V5cyA9IFs2NSwgODMsIDY4XVxuXG4gIHNldHVwR1VJOiAtPlxuICAgIEBndWkgPSBuZXcgZGF0LkdVSVxuXG4gICAgZ2Vub3R5cGUgPVxuICAgICAgcGhpOiAgICAgICAgICAgICAgIDAuNVxuICAgICAgYmV0YTogICAgICAgICAgICAgIDAuNVxuICAgICAgdHJhbnNsYXRpb25GYWN0b3I6IDAuNVxuICAgICAgZ3Jvd3RoRmFjdG9yOiAgICAgIDEuMVxuXG4gICAgc2ltdWxhdGlvbk9wdGlvbnMgPVxuICAgICAgbnVtQ2hhbWJlcnM6IDdcblxuICAgIHN0cnVjdHVyZUFuYWx5emVyID1cbiAgICAgIHNpbXVsYXRlOiAgICAgICA9PiBAc2ltdWxhdGUoZ2Vub3R5cGUsIHNpbXVsYXRpb25PcHRpb25zKVxuICAgICAgZXZvbHZlOiAgICAgICAgID0+IEBldm9sdmUoKVxuICAgICAgcmVncmVzczogICAgICAgID0+IEByZWdyZXNzKClcbiAgICAgIGNlbnRyb2lkc0xpbmU6ICA9PiBAdG9nZ2xlQ2VudHJvaWRzTGluZSgpXG4gICAgICB0b2dnbGVDaGFtYmVyczogPT4gQHRvZ2dsZUNoYW1iZXJzKClcblxuICAgIEBtYXRlcmlhbCA9XG4gICAgICBvcGFjaXR5OiAxLjBcblxuICAgIEBndWkuYWRkKGdlbm90eXBlLCAncGhpJykuc3RlcCAwLjAxXG4gICAgQGd1aS5hZGQoZ2Vub3R5cGUsICdiZXRhJykuc3RlcCAwLjAxXG4gICAgQGd1aS5hZGQoZ2Vub3R5cGUsICd0cmFuc2xhdGlvbkZhY3RvcicpLnN0ZXAgMC4wMVxuICAgIEBndWkuYWRkKGdlbm90eXBlLCAnZ3Jvd3RoRmFjdG9yJykuc3RlcCAwLjAxXG5cbiAgICBAZ3VpLmFkZChzaW11bGF0aW9uT3B0aW9ucywgJ251bUNoYW1iZXJzJylcblxuICAgIEBndWkuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAnc2ltdWxhdGUnKVxuICAgIEBndWkuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAnZXZvbHZlJylcbiAgICBAZ3VpLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ3JlZ3Jlc3MnKVxuICAgIEBndWkuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAnY2VudHJvaWRzTGluZScpXG4gICAgQGd1aS5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICd0b2dnbGVDaGFtYmVycycpXG5cbiAgICBAZ3VpLmFkZChAbWF0ZXJpYWwsICdvcGFjaXR5JylcblxuICBzaW11bGF0ZTogKGdlbm90eXBlLCBvcHRpb25zKSAtPlxuICAgIEBzY2VuZS5yZW1vdmUgQGZvcmFtIGlmIEBmb3JhbVxuXG4gICAgQGZvcmFtID0gbmV3IEZvcmFtIGdlbm90eXBlXG4gICAgQGZvcmFtLmJ1aWxkQ2hhbWJlcnMgb3B0aW9ucy5udW1DaGFtYmVyc1xuXG4gICAgQHNjZW5lLmFkZCBAZm9yYW1cblxuICBldm9sdmU6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIEBmb3JhbS5ldm9sdmUoKVxuICAgIEBjZW50cm9pZHNMaW5lLnJlYnVpbGQoKSBpZiBAY2VudHJvaWRzTGluZVxuXG4gIHJlZ3Jlc3M6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIEBmb3JhbS5yZWdyZXNzKClcbiAgICBAY2VudHJvaWRzTGluZS5yZWJ1aWxkKCkgaWYgQGNlbnRyb2lkc0xpbmVcblxuICB0b2dnbGVDZW50cm9pZHNMaW5lOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICB1bmxlc3MgQGNlbnRyb2lkc0xpbmVcbiAgICAgIEBjZW50cm9pZHNMaW5lID0gbmV3IENlbnRyb2lkc0xpbmUoQGZvcmFtKVxuICAgICAgQGNlbnRyb2lkc0xpbmUudmlzaWJsZSA9IGZhbHNlXG5cbiAgICAgIEBzY2VuZS5hZGQgQGNlbnRyb2lkc0xpbmVcblxuICAgIEBjZW50cm9pZHNMaW5lLnZpc2libGUgPSAhQGNlbnRyb2lkc0xpbmUudmlzaWJsZVxuXG4gIHRvZ2dsZUNoYW1iZXJzOiAtPlxuICAgIEBmb3JhbS52aXNpYmxlID0gIUBmb3JhbS52aXNpYmxlIGlmIEBmb3JhbVxuXG4gIGFuaW1hdGU6ID0+XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIEBhbmltYXRlXG5cbiAgICBpZiBAZm9yYW1cbiAgICAgIEBmb3JhbS5tYXRlcmlhbC5vcGFjaXR5ID0gQG1hdGVyaWFsLm9wYWNpdHlcblxuICAgIEBjb250cm9scy51cGRhdGUoKVxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAcmVuZGVyZXIucmVuZGVyIEBzY2VuZSwgQGNhbWVyYVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9