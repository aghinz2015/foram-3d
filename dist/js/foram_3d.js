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
    return this.gui.add(structureAnalyzer, 'centroidsLine');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2NlbnRyb2lkc19saW5lLmNvZmZlZSIsImpzL2NoYW1iZXIuY29mZmVlIiwianMvZm9yYW0uY29mZmVlIiwianMvc2ltdWxhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxhQUFBO0VBQUE7OztBQUFNOzs7MEJBRUosVUFBQSxHQUFZOztFQUVDLHVCQUFDLEtBQUQ7SUFBQyxJQUFDLENBQUEsUUFBRDtJQUNaLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0lBRW5CLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLGdCQUFELENBQWtCLElBQUMsQ0FBQSxlQUFuQjtJQUNaLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLGlCQUFELENBQUE7SUFFWixJQUFDLENBQUEsT0FBRCxDQUFBO0lBRUEsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFYLENBQWdCLElBQWhCLEVBQW1CLElBQUMsQ0FBQSxRQUFwQixFQUE4QixJQUFDLENBQUEsUUFBL0I7RUFSVzs7MEJBVWIsb0JBQUEsR0FBc0IsU0FBQTtBQUNwQixRQUFBO0lBQUEsTUFBQSxHQUFhLElBQUEsWUFBQSxDQUFhLElBQUMsQ0FBQSxVQUFELEdBQWMsQ0FBM0I7V0FFVCxJQUFBLEtBQUssQ0FBQyxlQUFOLENBQXNCLE1BQXRCLEVBQThCLENBQTlCO0VBSGdCOzswQkFLdEIsZ0JBQUEsR0FBa0IsU0FBQyxlQUFEO0FBQ2hCLFFBQUE7SUFBQSxRQUFBLEdBQWUsSUFBQSxLQUFLLENBQUMsY0FBTixDQUFBO0lBQ2YsUUFBUSxDQUFDLFlBQVQsQ0FBc0IsVUFBdEIsRUFBa0MsZUFBbEM7V0FFQTtFQUpnQjs7MEJBTWxCLGlCQUFBLEdBQW1CLFNBQUE7V0FDYixJQUFBLEtBQUssQ0FBQyxpQkFBTixDQUF3QjtNQUFFLEtBQUEsRUFBTyxRQUFUO01BQW1CLFNBQUEsRUFBVyxFQUE5QjtLQUF4QjtFQURhOzswQkFHbkIsT0FBQSxHQUFT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YUFBRCxHQUFxQixJQUFBLGFBQUEsQ0FBYyxJQUFDLENBQUEsS0FBZjtNQUNyQixJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsR0FBeUI7TUFFekIsSUFBQyxDQUFBLEtBQUssQ0FBQyxHQUFQLENBQVcsSUFBQyxDQUFBLGFBQVosRUFKRjs7V0FNQSxJQUFDLENBQUEsYUFBYSxDQUFDLE9BQWYsR0FBeUIsQ0FBQyxJQUFDLENBQUEsYUFBYSxDQUFDO0VBVHRCOzt1QkFXckIsT0FBQSxHQUFTLFNBQUE7SUFDUCxxQkFBQSxDQUFzQixJQUFDLENBQUEsT0FBdkI7SUFFQSxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBQTtXQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7RUFKTzs7dUJBTVQsTUFBQSxHQUFRLFNBQUE7V0FDTixJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBaUIsSUFBQyxDQUFBLEtBQWxCLEVBQXlCLElBQUMsQ0FBQSxNQUExQjtFQURNIiwiZmlsZSI6ImZvcmFtXzNkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgQ2VudHJvaWRzTGluZSBleHRlbmRzIFRIUkVFLkxpbmVcblxuICBNQVhfUE9JTlRTOiAxMDBcblxuICBjb25zdHJ1Y3RvcjogKEBmb3JhbSkgLT5cbiAgICBAcG9zaXRpb25zQnVmZmVyID0gQGJ1aWxkUG9zaXRpb25zQnVmZmVyKClcblxuICAgIEBnZW9tZXRyeSA9IEBidWlsZExpbmVHb21ldHJ5IEBwb3NpdGlvbnNCdWZmZXJcbiAgICBAbWF0ZXJpYWwgPSBAYnVpbGRMaW5lTWF0ZXJpYWwoKVxuXG4gICAgQHJlYnVpbGQoKVxuXG4gICAgVEhSRUUuTGluZS5jYWxsIEAsIEBnZW9tZXRyeSwgQG1hdGVyaWFsXG5cbiAgYnVpbGRQb3NpdGlvbnNCdWZmZXI6IC0+XG4gICAgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSBATUFYX1BPSU5UUyAqIDNcblxuICAgIG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgYnVmZmVyLCAzXG5cbiAgYnVpbGRMaW5lR29tZXRyeTogKHBvc2l0aW9uc0J1ZmZlcikgLT5cbiAgICBnZW9tZXRyeSA9IG5ldyBUSFJFRS5CdWZmZXJHZW9tZXRyeSgpXG4gICAgZ2VvbWV0cnkuYWRkQXR0cmlidXRlIFwicG9zaXRpb25cIiwgcG9zaXRpb25zQnVmZmVyXG5cbiAgICBnZW9tZXRyeVxuXG4gIGJ1aWxkTGluZU1hdGVyaWFsOiAtPlxuICAgIG5ldyBUSFJFRS5MaW5lQmFzaWNNYXRlcmlhbCB7IGNvbG9yOiAweGZmMDAwMCwgbGluZXdpZHRoOiAxMCB9XG5cbiAgcmVidWlsZDogLT5cbiAgICBhY3RpdmVDaGFtYmVycyA9IEBmaWx0ZXJBY3RpdmVDaGFtYmVycygpXG5cbiAgICBwb3NpdGlvbnMgPSBAcG9zaXRpb25zQnVmZmVyLmFycmF5XG4gICAgaW5kZXggPSAwXG5cbiAgICBmb3IgY2hhbWJlciBpbiBhY3RpdmVDaGFtYmVyc1xuICAgICAgY2VudHJvaWQgPSBjaGFtYmVyLmNlbnRlclxuXG4gICAgICBwb3NpdGlvbnNbaW5kZXgrK10gPSBjZW50cm9pZC54XG4gICAgICBwb3NpdGlvbnNbaW5kZXgrK10gPSBjZW50cm9pZC55XG4gICAgICBwb3NpdGlvbnNbaW5kZXgrK10gPSBjZW50cm9pZC56XG5cbiAgICBAZ2VvbWV0cnkuc2V0RHJhd1JhbmdlIDAsIGFjdGl2ZUNoYW1iZXJzLmxlbmd0aFxuXG4gICAgQHBvc2l0aW9uc0J1ZmZlci5uZWVkc1VwZGF0ZSA9IHRydWVcblxuICBmaWx0ZXJBY3RpdmVDaGFtYmVyczogLT5cbiAgICBjaGFtYmVyIGZvciBjaGFtYmVyIGluIEBmb3JhbS5jaGFtYmVycyB3aGVuIGNoYW1iZXIudmlzaWJsZVxuIiwiY2xhc3MgQ2hhbWJlciBleHRlbmRzIFRIUkVFLk1lc2hcblxuICBERUZBVUxUX1RFWFRVUkU6IFwiLi4vYXNzZXRzL2ltYWdlcy90ZXh0dXJlLmdpZlwiXG5cbiAgY29uc3RydWN0b3I6IChAY2VudGVyLCBAcmFkaXVzKSAtPlxuICAgIGdlb21ldHJ5ID0gQGJ1aWxkQ2hhbWJlckdlb21ldHJ5KClcbiAgICBtYXRlcmlhbCA9IEBidWlsZENoYW1iZXJNYXRlcmlhbCgpXG5cbiAgICBUSFJFRS5NZXNoLmNhbGwgQCwgZ2VvbWV0cnksIG1hdGVyaWFsXG5cbiAgICBAdmVydGljZXMgPSBnZW9tZXRyeS52ZXJ0aWNlc1xuICAgIEBvcmlnaW4gICA9IEBjZW50ZXJcbiAgICBAYXBlcnR1cmUgPSBAY2FsY3VsYXRlQXBlcnR1cmUoKVxuXG4gIGJ1aWxkQ2hhbWJlckdlb21ldHJ5OiAtPlxuICAgIGNlbnRlclRyYW5zbGF0aW9uTWF0cml4ID0gQGJ1aWxkQ2VudGVyVHJhbnNsYXRpb25NYXRyaXgoKVxuXG4gICAgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkgQHJhZGl1cywgMzIsIDMyXG4gICAgZ2VvbWV0cnkuYXBwbHlNYXRyaXggY2VudGVyVHJhbnNsYXRpb25NYXRyaXhcbiAgICBnZW9tZXRyeVxuXG4gIGJ1aWxkQ2hhbWJlck1hdGVyaWFsOiAtPlxuICAgIG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsIHsgY29sb3I6IDB4ZmZmZmZmIH1cblxuICBidWlsZENlbnRlclRyYW5zbGF0aW9uTWF0cml4OiAtPlxuICAgIG5ldyBUSFJFRS5NYXRyaXg0KCkubWFrZVRyYW5zbGF0aW9uIEBjZW50ZXIueCwgQGNlbnRlci55LCBAY2VudGVyLnpcblxuICBjYWxjdWxhdGVBcGVydHVyZTogLT5cbiAgICBhcGVydHVyZSA9IEB2ZXJ0aWNlc1swXVxuICAgIGN1cnJlbnREaXN0YW5jZSA9IGFwZXJ0dXJlLmRpc3RhbmNlVG8gQGNlbnRlclxuXG4gICAgZm9yIHZlcnRleCBpbiBAdmVydGljZXNbMS4uLTFdXG4gICAgICBuZXdEaXN0YW5jZSA9IHZlcnRleC5kaXN0YW5jZVRvIEBjZW50ZXJcblxuICAgICAgaWYgbmV3RGlzdGFuY2UgPCBjdXJyZW50RGlzdGFuY2VcbiAgICAgICAgYXBlcnR1cmUgPSB2ZXJ0ZXhcbiAgICAgICAgY3VycmVudERpc3RhbmNlID0gbmV3RGlzdGFuY2VcblxuICAgIGFwZXJ0dXJlXG5cbiAgc2V0QXBlcnR1cmU6IChhcGVydHVyZSkgLT5cbiAgICBAYXBlcnR1cmUgPSBhcGVydHVyZVxuXG4gIHNldEFuY2VzdG9yOiAoYW5jZXN0b3IpIC0+XG4gICAgQGFuY2VzdG9yID0gYW5jZXN0b3JcblxuICAgIGlmIGFuY2VzdG9yXG4gICAgICBAb3JpZ2luID0gYW5jZXN0b3IuYXBlcnR1cmUgaWYgYW5jZXN0b3JcbiAgICAgIGFuY2VzdG9yLmNoaWxkID0gQFxuXG4gIGNhbGN1bGF0ZUdlb21ldHJ5UmluZzogLT5cbiAgICB2ZXJ0ZXggZm9yIHZlcnRleCBpbiBALmdlb21ldHJ5LnZlcnRpY2VzIHdoZW4gdmVydGV4LnogPT0gMFxuIiwiY2xhc3MgRm9yYW0gZXh0ZW5kcyBUSFJFRS5PYmplY3QzRFxuXG4gIElOSVRJQUxfUkFESVVTOiA1XG5cbiAgY29uc3RydWN0b3I6IChAZ2Vub3R5cGUpIC0+XG4gICAgVEhSRUUuT2JqZWN0M0QuY2FsbCBAXG5cbiAgICBpbml0aWFsQ2hhbWJlciA9IEBidWlsZEluaXRpYWxDaGFtYmVyKClcblxuICAgIEBjaGFtYmVycyA9IFtpbml0aWFsQ2hhbWJlcl1cbiAgICBAY3VycmVudENoYW1iZXIgPSBpbml0aWFsQ2hhbWJlclxuXG4gIGJ1aWxkSW5pdGlhbENoYW1iZXI6IC0+XG4gICAgbmV3IENoYW1iZXIobmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCksIEBJTklUSUFMX1JBRElVUylcblxuICBidWlsZENoYW1iZXJzOiAobnVtQ2hhbWJlcnMpIC0+XG4gICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKCkgZm9yIGkgaW4gWzEuLm51bUNoYW1iZXJzLTFdXG4gICAgQGJ1aWxkKClcblxuICBldm9sdmU6IC0+XG4gICAgY2hpbGQgPSBAY3VycmVudENoYW1iZXIuY2hpbGRcblxuICAgIGlmIGNoaWxkXG4gICAgICBAY3VycmVudENoYW1iZXIgPSBjaGlsZFxuICAgICAgQGN1cnJlbnRDaGFtYmVyLnZpc2libGUgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKClcbiAgICAgIEBidWlsZCgpXG5cbiAgcmVncmVzczogLT5cbiAgICBhbmNlc3RvciA9IEBjdXJyZW50Q2hhbWJlci5hbmNlc3RvclxuXG4gICAgaWYgYW5jZXN0b3JcbiAgICAgIEBjdXJyZW50Q2hhbWJlci52aXNpYmxlID0gZmFsc2VcbiAgICAgIEBjdXJyZW50Q2hhbWJlciA9IGFuY2VzdG9yXG5cbiAgY2FsY3VsYXRlTmV4dENoYW1iZXI6IC0+XG4gICAgbmV3Q2VudGVyID0gQGNhbGN1bGF0ZU5ld0NlbnRlcigpXG4gICAgbmV3UmFkaXVzID0gQGNhbGN1bGF0ZU5ld1JhZGl1cygpXG5cbiAgICBuZXdDaGFtYmVyID0gbmV3IENoYW1iZXIgbmV3Q2VudGVyLCBuZXdSYWRpdXNcblxuICAgIG5ld0FwZXJ0dXJlID0gQGNhbGN1bGF0ZU5ld0FwZXJ0dXJlIG5ld0NoYW1iZXJcblxuICAgIG5ld0NoYW1iZXIuc2V0QXBlcnR1cmUgbmV3QXBlcnR1cmVcbiAgICBuZXdDaGFtYmVyLnNldEFuY2VzdG9yIEBjdXJyZW50Q2hhbWJlclxuXG4gICAgQGNoYW1iZXJzLnB1c2ggbmV3Q2hhbWJlclxuXG4gICAgQGN1cnJlbnRDaGFtYmVyID0gbmV3Q2hhbWJlclxuXG4gIGNhbGN1bGF0ZU5ld0NlbnRlcjogLT5cbiAgICBjdXJyZW50T3JpZ2luICAgPSBAY3VycmVudENoYW1iZXIub3JpZ2luXG4gICAgY3VycmVudEFwZXJ0dXJlID0gQGN1cnJlbnRDaGFtYmVyLmFwZXJ0dXJlXG5cbiAgICAjIGNhbGN1bGF0ZSBpbml0aWFsIGdyb3d0aCB2ZWN0b3IgKHJlZmVyZW5jZSBsaW5lKVxuXG4gICAgZ3Jvd3RoVmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjNcbiAgICBncm93dGhWZWN0b3Iuc3ViVmVjdG9ycyBjdXJyZW50QXBlcnR1cmUsIGN1cnJlbnRPcmlnaW5cblxuICAgICMgZGV2aWF0ZSBncm93dGggdmVjdG9yIGZyb20gcmVmZXJlbmNlIGxpbmVcblxuICAgIGhvcml6b250YWxSb3RhdGlvbkF4aXMgPSBuZXcgVEhSRUUuVmVjdG9yMyAwLCAwLCAxXG4gICAgdmVydGljYWxSb3RhdGlvbkF4aXMgICA9IG5ldyBUSFJFRS5WZWN0b3IzIDEsIDAsIDBcblxuICAgIGdyb3d0aFZlY3Rvci5hcHBseUF4aXNBbmdsZSBob3Jpem9udGFsUm90YXRpb25BeGlzLCBAZ2Vub3R5cGUucGhpXG4gICAgZ3Jvd3RoVmVjdG9yLmFwcGx5QXhpc0FuZ2xlIHZlcnRpY2FsUm90YXRpb25BeGlzLCAgIEBnZW5vdHlwZS5iZXRhXG5cbiAgICAjIG11bHRpcGx5IGdyb3d0aCB2ZWN0b3IgYnkgdHJhbnNsYWN0aW9uIGZhY3RvclxuXG4gICAgZ3Jvd3RoVmVjdG9yLm5vcm1hbGl6ZSgpXG4gICAgZ3Jvd3RoVmVjdG9yLm11bHRpcGx5U2NhbGFyIEBnZW5vdHlwZS50cmFuc2xhdGlvbkZhY3RvclxuXG4gICAgIyBjYWxjdWxhdGUgY2VudGVyIG9mIG5ldyBjaGFtYmVyXG5cbiAgICBuZXdDZW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yM1xuICAgIG5ld0NlbnRlci5jb3B5IGN1cnJlbnRBcGVydHVyZVxuICAgIG5ld0NlbnRlci5hZGQgZ3Jvd3RoVmVjdG9yXG5cbiAgICBuZXdDZW50ZXJcblxuICBjYWxjdWxhdGVOZXdSYWRpdXM6IC0+XG4gICAgKEBjdXJyZW50Q2hhbWJlci5hbmNlc3RvciB8fCBAY3VycmVudENoYW1iZXIpLnJhZGl1cyAqIEBnZW5vdHlwZS5ncm93dGhGYWN0b3JcblxuICBjYWxjdWxhdGVOZXdBcGVydHVyZTogKG5ld0NoYW1iZXIpIC0+XG4gICAgbmV3Q2VudGVyICAgPSBuZXdDaGFtYmVyLmNlbnRlclxuICAgIG5ld0FwZXJ0dXJlID0gbmV3Q2hhbWJlci52ZXJ0aWNlc1swXVxuXG4gICAgY3VycmVudERpc3RhbmNlID0gbmV3QXBlcnR1cmUuZGlzdGFuY2VUbyBuZXdDZW50ZXJcblxuICAgIGZvciB2ZXJ0ZXggaW4gbmV3Q2hhbWJlci52ZXJ0aWNlc1sxLi4tMV1cbiAgICAgIG5ld0Rpc3RhbmNlID0gdmVydGV4LmRpc3RhbmNlVG8gbmV3Q2VudGVyXG5cbiAgICAgIGlmIG5ld0Rpc3RhbmNlIDwgY3VycmVudERpc3RhbmNlXG4gICAgICAgIGNvbnRhaW5zID0gZmFsc2VcblxuICAgICAgICBmb3IgY2hhbWJlciBpbiBAY2hhbWJlcnNcbiAgICAgICAgICBpZiBjaGFtYmVyLnJhZGl1cyA+IG5ld0FwZXJ0dXJlLmRpc3RhbmNlVG8gY2hhbWJlci5jZW50ZXJcbiAgICAgICAgICAgIGNvbnRhaW5zID0gdHJ1ZVxuICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICB1bmxlc3MgY29udGFpbnNcbiAgICAgICAgICBuZXdBcGVydHVyZSA9IHZlcnRleFxuICAgICAgICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0Rpc3RhbmNlXG5cbiAgICBuZXdBcGVydHVyZVxuXG4gIGJ1aWxkOiAtPlxuICAgIEAuYWRkIGNoYW1iZXIgZm9yIGNoYW1iZXIgaW4gQGNoYW1iZXJzXG4iLCIjICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGb3IgTXIgV2hpdGUuLi4gWypdXG4jXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfX3x8fHx8fF9fXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgfFxuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXl1bXl1cbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBfXyB8XG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxfX19ffFxuXG5jbGFzcyBTaW11bGF0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAY2FudmFzLCBAb3B0aW9ucykgLT5cbiAgICBkZWZhdWx0cyA9IHsgZGV2OiBmYWxzZSB9XG5cbiAgICBAb3B0aW9ucyB8fD0ge31cblxuICAgIGZvciBvcHRpb24gb2YgZGVmYXVsdHNcbiAgICAgIEBvcHRpb25zW29wdGlvbl0gfHw9IGRlZmF1bHRzW29wdGlvbl1cblxuICAgIEBzZXR1cFNjZW5lKClcbiAgICBAc2V0dXBDb250cm9scygpXG4gICAgQHNldHVwR1VJKCkgaWYgQG9wdGlvbnMuZGV2XG5cbiAgc2V0dXBTY2VuZTogLT5cbiAgICBAc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKVxuXG4gICAgIyBjYW1lcmFcblxuICAgIEBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNDUsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwMDApXG4gICAgQGNhbWVyYS5wb3NpdGlvbi5zZXQgMCwgMCwgNzBcbiAgICBAc2NlbmUuYWRkIEBjYW1lcmFcblxuICAgICMgcmVuZGVyZXJcblxuICAgIEByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyIHsgYWxwaGE6IHRydWUsIGFudGlhbGlhczogdHJ1ZSB9XG4gICAgQHJlbmRlcmVyLnNldENsZWFyQ29sb3IgMHgxMTExMTEsIDFcbiAgICBAcmVuZGVyZXIuc2V0U2l6ZSB3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0XG5cbiAgICAjIGxpZ2h0aW5nXG5cbiAgICBzcG90TGlnaHQgPSBuZXcgVEhSRUUuU3BvdExpZ2h0IDB4ZmZmZmZmXG4gICAgQGNhbWVyYS5hZGQgc3BvdExpZ2h0XG5cbiAgICBAY2FudmFzLmFwcGVuZCBAcmVuZGVyZXIuZG9tRWxlbWVudFxuXG4gIHNldHVwQ29udHJvbHM6IC0+XG4gICAgQGNvbnRyb2xzID0gbmV3IFRIUkVFLlRyYWNrYmFsbENvbnRyb2xzIEBjYW1lcmEsIEByZW5kZXJlci5kb21FbGVtZW50XG5cbiAgICBAY29udHJvbHMucm90YXRlU3BlZWQgPSA1LjBcbiAgICBAY29udHJvbHMuem9vbVNwZWVkICAgPSAxLjJcbiAgICBAY29udHJvbHMucGFuU3BlZWQgICAgPSAwLjhcblxuICAgIEBjb250cm9scy5ub1pvb20gPSBmYWxzZVxuICAgIEBjb250cm9scy5ub1BhbiAgPSBmYWxzZVxuXG4gICAgQGNvbnRyb2xzLnN0YXRpY01vdmluZyA9IHRydWVcblxuICAgIEBjb250cm9scy5keW5hbWljRGFtcGluZ0ZhY3RvciA9IDAuM1xuXG4gICAgQGNvbnRyb2xzLmtleXMgPSBbNjUsIDgzLCA2OF1cblxuICBzZXR1cEdVSTogLT5cbiAgICBAZ3VpID0gbmV3IGRhdC5HVUlcblxuICAgIGdlbm90eXBlID1cbiAgICAgIHBoaTogICAgICAgICAgICAgICAwLjVcbiAgICAgIGJldGE6ICAgICAgICAgICAgICAwLjVcbiAgICAgIHRyYW5zbGF0aW9uRmFjdG9yOiAwLjVcbiAgICAgIGdyb3d0aEZhY3RvcjogICAgICAxLjFcblxuICAgIHNpbXVsYXRpb25PcHRpb25zID1cbiAgICAgIG51bUNoYW1iZXJzOiA3XG5cbiAgICBzdHJ1Y3R1cmVBbmFseXplciA9XG4gICAgICBzaW11bGF0ZTogICAgICA9PiBAc2ltdWxhdGUoZ2Vub3R5cGUsIHNpbXVsYXRpb25PcHRpb25zKVxuICAgICAgZXZvbHZlOiAgICAgICAgPT4gQGV2b2x2ZSgpXG4gICAgICByZWdyZXNzOiAgICAgICA9PiBAcmVncmVzcygpXG4gICAgICBjZW50cm9pZHNMaW5lOiA9PiBAdG9nZ2xlQ2VudHJvaWRzTGluZSgpXG5cbiAgICBAZ3VpLmFkZChnZW5vdHlwZSwgJ3BoaScpLnN0ZXAgMC4wMVxuICAgIEBndWkuYWRkKGdlbm90eXBlLCAnYmV0YScpLnN0ZXAgMC4wMVxuICAgIEBndWkuYWRkKGdlbm90eXBlLCAndHJhbnNsYXRpb25GYWN0b3InKS5zdGVwIDAuMDFcbiAgICBAZ3VpLmFkZChnZW5vdHlwZSwgJ2dyb3d0aEZhY3RvcicpLnN0ZXAgMC4wMVxuXG4gICAgQGd1aS5hZGQoc2ltdWxhdGlvbk9wdGlvbnMsICdudW1DaGFtYmVycycpXG5cbiAgICBAZ3VpLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ3NpbXVsYXRlJylcbiAgICBAZ3VpLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ2V2b2x2ZScpXG4gICAgQGd1aS5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdyZWdyZXNzJylcbiAgICBAZ3VpLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ2NlbnRyb2lkc0xpbmUnKVxuXG4gIHNpbXVsYXRlOiAoZ2Vub3R5cGUsIG9wdGlvbnMpIC0+XG4gICAgQHNjZW5lLnJlbW92ZSBAZm9yYW0gaWYgQGZvcmFtXG5cbiAgICBAZm9yYW0gPSBuZXcgRm9yYW0gZ2Vub3R5cGVcbiAgICBAZm9yYW0uYnVpbGRDaGFtYmVycyBvcHRpb25zLm51bUNoYW1iZXJzXG5cbiAgICBAc2NlbmUuYWRkIEBmb3JhbVxuXG4gIGV2b2x2ZTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgQGZvcmFtLmV2b2x2ZSgpXG4gICAgQGNlbnRyb2lkc0xpbmUucmVidWlsZCgpIGlmIEBjZW50cm9pZHNMaW5lXG5cbiAgcmVncmVzczogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgQGZvcmFtLnJlZ3Jlc3MoKVxuICAgIEBjZW50cm9pZHNMaW5lLnJlYnVpbGQoKSBpZiBAY2VudHJvaWRzTGluZVxuXG4gIHRvZ2dsZUNlbnRyb2lkc0xpbmU6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIHVubGVzcyBAY2VudHJvaWRzTGluZVxuICAgICAgQGNlbnRyb2lkc0xpbmUgPSBuZXcgQ2VudHJvaWRzTGluZShAZm9yYW0pXG4gICAgICBAY2VudHJvaWRzTGluZS52aXNpYmxlID0gZmFsc2VcblxuICAgICAgQHNjZW5lLmFkZCBAY2VudHJvaWRzTGluZVxuXG4gICAgQGNlbnRyb2lkc0xpbmUudmlzaWJsZSA9ICFAY2VudHJvaWRzTGluZS52aXNpYmxlXG5cbiAgYW5pbWF0ZTogPT5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgQGFuaW1hdGVcblxuICAgIEBjb250cm9scy51cGRhdGUoKVxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAcmVuZGVyZXIucmVuZGVyIEBzY2VuZSwgQGNhbWVyYVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9