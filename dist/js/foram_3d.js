var CentroidsLine,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

CentroidsLine = (function(superClass) {
  extend(CentroidsLine, superClass);

  CentroidsLine.prototype.MAX_POINTS = 100;

  function CentroidsLine(foram) {
    this.foram = foram;
    this.positionsBuffer = this.buildPositionsBuffer();
    this.geometry = this.buildLineGometry();
    this.material = this.buildLineMaterial();
    this.rebuild();
    THREE.Line.call(this, this.geometry, this.material);
  }

  CentroidsLine.prototype.buildPositionsBuffer = function() {
    var buffer;
    buffer = new Float32Array(this.MAX_POINTS * 3);
    return new THREE.BufferAttribute(buffer, 3);
  };

  CentroidsLine.prototype.buildLineGometry = function() {
    var geometry;
    geometry = new THREE.BufferGeometry();
    geometry.addAttribute("position", this.positionsBuffer);
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
    var genotype, genotypeFolder, materialFolder, materialOptions, simulationOptions, structureAnalyzer, structureFolder;
    this.gui = new dat.GUI;
    genotypeFolder = this.gui.addFolder("Genotype");
    structureFolder = this.gui.addFolder("Structure analyzer");
    materialFolder = this.gui.addFolder("Material");
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
    materialOptions = {
      opacity: 1.0
    };
    genotypeFolder.add(genotype, 'phi').step(0.01);
    genotypeFolder.add(genotype, 'beta').step(0.01);
    genotypeFolder.add(genotype, 'translationFactor').step(0.01);
    genotypeFolder.add(genotype, 'growthFactor').step(0.01);
    genotypeFolder.add(simulationOptions, 'numChambers');
    structureFolder.add(structureAnalyzer, 'simulate');
    structureFolder.add(structureAnalyzer, 'evolve');
    structureFolder.add(structureAnalyzer, 'regress');
    structureFolder.add(structureAnalyzer, 'centroidsLine');
    structureFolder.add(structureAnalyzer, 'toggleChambers');
    return materialFolder.add(materialOptions, 'opacity').onFinishChange((function(_this) {
      return function() {
        return _this.applyOpacity(materialOptions.opacity);
      };
    })(this));
  };

  Simulation.prototype.simulate = function(genotype, options) {
    this.reset();
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

  Simulation.prototype.applyOpacity = function(opacity) {
    if (!this.foram) {
      return;
    }
    return this.foram.material.opacity = opacity;
  };

  Simulation.prototype.exportToObj = function() {
    var exporter;
    if (!this.foram) {
      return;
    }
    exporter = new THREE.OBJExporter();
    return exporter.parse(this.foram);
  };

  Simulation.prototype.reset = function() {
    if (this.foram) {
      this.scene.remove(this.foram);
    }
    if (this.centroidsLine) {
      this.scene.remove(this.centroidsLine);
    }
    this.foram = null;
    return this.centroidsLine = null;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2NlbnRyb2lkc19saW5lLmNvZmZlZSIsImpzL2NoYW1iZXIuY29mZmVlIiwianMvZm9yYW0uY29mZmVlIiwianMvc2ltdWxhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxhQUFBO0VBQUE7OztBQUFNOzs7MEJBRUosVUFBQSxHQUFZOztFQUVDLHVCQUFDLEtBQUQ7SUFBQyxJQUFDLENBQUEsUUFBRDtJQUNaLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0lBRW5CLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLGdCQUFELENBQUE7SUFDWixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBRVosSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQUVBLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWCxDQUFnQixJQUFoQixFQUFtQixJQUFDLENBQUEsUUFBcEIsRUFBOEIsSUFBQyxDQUFBLFFBQS9CO0VBUlc7OzBCQVViLG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsUUFBQTtJQUFBLE1BQUEsR0FBYSxJQUFBLFlBQUEsQ0FBYSxJQUFDLENBQUEsVUFBRCxHQUFjLENBQTNCO1dBRVQsSUFBQSxLQUFLLENBQUMsZUFBTixDQUFzQixNQUF0QixFQUE4QixDQUE5QjtFQUhnQjs7MEJBS3RCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsUUFBQTtJQUFBLFFBQUEsR0FBZSxJQUFBLEtBQUssQ0FBQyxjQUFOLENBQUE7SUFDZixRQUFRLENBQUMsWUFBVCxDQUFzQixVQUF0QixFQUFrQyxJQUFDLENBQUEsZUFBbkM7V0FFQTtFQUpnQjs7MEJBTWxCLGlCQUFBLEdBQW1CLFNBQUE7V0FDYixJQUFBLEtBQUssQ0FBQyxpQkFBTixDQUF3QjtNQUFFLEtBQUEsRUFBTyxRQUFUO01BQW1CLFNBQUEsRUFBVyxFQUE5QjtLQUF4QjtFQURhOzswQkFHbkIsT0FBQSxHQUFTLFNBQUE7QUFDUCxR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SUFBQSxDQUFjLElBQUMsQ0FBQSxLQUFmO0FBQUEsYUFBQTs7V0FFQSxJQUFDLENBQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFoQixHQUEwQjtFQUhkOzt1QkFLZCxXQUFBLEdBQWEsU0FBQTtBQUNYLFFBQUE7SUFBQSxJQUFBLENBQWMsSUFBQyxDQUFBLEtBQWY7QUFBQSxhQUFBOztJQUVBLFFBQUEsR0FBZSxJQUFBLEtBQUssQ0FBQyxXQUFOLENBQUE7V0FDZixRQUFRLENBQUMsS0FBVCxDQUFlLElBQUMsQ0FBQSxLQUFoQjtFQUpXOzt1QkFNYixLQUFBLEdBQU8sU0FBQTtJQUNMLElBQWdDLElBQUMsQ0FBQSxLQUFqQztNQUFBLElBQUMsQ0FBQSxLQUFLLENBQUMsTUFBUCxDQUFjLElBQUMsQ0FBQSxLQUFmLEVBQUE7O0lBQ0EsSUFBZ0MsSUFBQyxDQUFBLGFBQWpDO01BQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLENBQWMsSUFBQyxDQUFBLGFBQWYsRUFBQTs7SUFFQSxJQUFDLENBQUEsS0FBRCxHQUFTO1dBQ1QsSUFBQyxDQUFBLGFBQUQsR0FBaUI7RUFMWjs7dUJBT1AsT0FBQSxHQUFTLFNBQUE7SUFDUCxxQkFBQSxDQUFzQixJQUFDLENBQUEsT0FBdkI7SUFFQSxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBQTtXQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7RUFKTzs7dUJBTVQsTUFBQSxHQUFRLFNBQUE7V0FDTixJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBaUIsSUFBQyxDQUFBLEtBQWxCLEVBQXlCLElBQUMsQ0FBQSxNQUExQjtFQURNIiwiZmlsZSI6ImZvcmFtXzNkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgQ2VudHJvaWRzTGluZSBleHRlbmRzIFRIUkVFLkxpbmVcblxuICBNQVhfUE9JTlRTOiAxMDBcblxuICBjb25zdHJ1Y3RvcjogKEBmb3JhbSkgLT5cbiAgICBAcG9zaXRpb25zQnVmZmVyID0gQGJ1aWxkUG9zaXRpb25zQnVmZmVyKClcblxuICAgIEBnZW9tZXRyeSA9IEBidWlsZExpbmVHb21ldHJ5KClcbiAgICBAbWF0ZXJpYWwgPSBAYnVpbGRMaW5lTWF0ZXJpYWwoKVxuXG4gICAgQHJlYnVpbGQoKVxuXG4gICAgVEhSRUUuTGluZS5jYWxsIEAsIEBnZW9tZXRyeSwgQG1hdGVyaWFsXG5cbiAgYnVpbGRQb3NpdGlvbnNCdWZmZXI6IC0+XG4gICAgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSBATUFYX1BPSU5UUyAqIDNcblxuICAgIG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgYnVmZmVyLCAzXG5cbiAgYnVpbGRMaW5lR29tZXRyeTogLT5cbiAgICBnZW9tZXRyeSA9IG5ldyBUSFJFRS5CdWZmZXJHZW9tZXRyeSgpXG4gICAgZ2VvbWV0cnkuYWRkQXR0cmlidXRlIFwicG9zaXRpb25cIiwgQHBvc2l0aW9uc0J1ZmZlclxuXG4gICAgZ2VvbWV0cnlcblxuICBidWlsZExpbmVNYXRlcmlhbDogLT5cbiAgICBuZXcgVEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwgeyBjb2xvcjogMHhmZjAwMDAsIGxpbmV3aWR0aDogMTAgfVxuXG4gIHJlYnVpbGQ6IC0+XG4gICAgYWN0aXZlQ2hhbWJlcnMgPSBAZmlsdGVyQWN0aXZlQ2hhbWJlcnMoKVxuXG4gICAgcG9zaXRpb25zID0gQHBvc2l0aW9uc0J1ZmZlci5hcnJheVxuICAgIGluZGV4ID0gMFxuXG4gICAgZm9yIGNoYW1iZXIgaW4gYWN0aXZlQ2hhbWJlcnNcbiAgICAgIGNlbnRyb2lkID0gY2hhbWJlci5jZW50ZXJcblxuICAgICAgcG9zaXRpb25zW2luZGV4KytdID0gY2VudHJvaWQueFxuICAgICAgcG9zaXRpb25zW2luZGV4KytdID0gY2VudHJvaWQueVxuICAgICAgcG9zaXRpb25zW2luZGV4KytdID0gY2VudHJvaWQuelxuXG4gICAgQGdlb21ldHJ5LnNldERyYXdSYW5nZSAwLCBhY3RpdmVDaGFtYmVycy5sZW5ndGhcblxuICAgIEBwb3NpdGlvbnNCdWZmZXIubmVlZHNVcGRhdGUgPSB0cnVlXG5cbiAgZmlsdGVyQWN0aXZlQ2hhbWJlcnM6IC0+XG4gICAgY2hhbWJlciBmb3IgY2hhbWJlciBpbiBAZm9yYW0uY2hhbWJlcnMgd2hlbiBjaGFtYmVyLnZpc2libGVcbiIsImNsYXNzIENoYW1iZXIgZXh0ZW5kcyBUSFJFRS5NZXNoXG5cbiAgREVGQVVMVF9URVhUVVJFOiBcIi4uL2Fzc2V0cy9pbWFnZXMvdGV4dHVyZS5naWZcIlxuXG4gIGNvbnN0cnVjdG9yOiAoQGNlbnRlciwgQHJhZGl1cywgbWF0ZXJpYWwpIC0+XG4gICAgZ2VvbWV0cnkgPSBAYnVpbGRDaGFtYmVyR2VvbWV0cnkoKVxuXG4gICAgVEhSRUUuTWVzaC5jYWxsIEAsIGdlb21ldHJ5LCBtYXRlcmlhbFxuXG4gICAgQHZlcnRpY2VzID0gZ2VvbWV0cnkudmVydGljZXNcbiAgICBAb3JpZ2luICAgPSBAY2VudGVyXG4gICAgQGFwZXJ0dXJlID0gQGNhbGN1bGF0ZUFwZXJ0dXJlKClcblxuICBidWlsZENoYW1iZXJHZW9tZXRyeTogLT5cbiAgICBjZW50ZXJUcmFuc2xhdGlvbk1hdHJpeCA9IEBidWlsZENlbnRlclRyYW5zbGF0aW9uTWF0cml4KClcblxuICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5IEByYWRpdXMsIDMyLCAzMlxuICAgIGdlb21ldHJ5LmFwcGx5TWF0cml4IGNlbnRlclRyYW5zbGF0aW9uTWF0cml4XG4gICAgZ2VvbWV0cnlcblxuICBidWlsZENlbnRlclRyYW5zbGF0aW9uTWF0cml4OiAtPlxuICAgIG5ldyBUSFJFRS5NYXRyaXg0KCkubWFrZVRyYW5zbGF0aW9uIEBjZW50ZXIueCwgQGNlbnRlci55LCBAY2VudGVyLnpcblxuICBjYWxjdWxhdGVBcGVydHVyZTogLT5cbiAgICBhcGVydHVyZSA9IEB2ZXJ0aWNlc1swXVxuICAgIGN1cnJlbnREaXN0YW5jZSA9IGFwZXJ0dXJlLmRpc3RhbmNlVG8gQGNlbnRlclxuXG4gICAgZm9yIHZlcnRleCBpbiBAdmVydGljZXNbMS4uLTFdXG4gICAgICBuZXdEaXN0YW5jZSA9IHZlcnRleC5kaXN0YW5jZVRvIEBjZW50ZXJcblxuICAgICAgaWYgbmV3RGlzdGFuY2UgPCBjdXJyZW50RGlzdGFuY2VcbiAgICAgICAgYXBlcnR1cmUgPSB2ZXJ0ZXhcbiAgICAgICAgY3VycmVudERpc3RhbmNlID0gbmV3RGlzdGFuY2VcblxuICAgIGFwZXJ0dXJlXG5cbiAgc2V0QXBlcnR1cmU6IChhcGVydHVyZSkgLT5cbiAgICBAYXBlcnR1cmUgPSBhcGVydHVyZVxuXG4gIHNldEFuY2VzdG9yOiAoYW5jZXN0b3IpIC0+XG4gICAgQGFuY2VzdG9yID0gYW5jZXN0b3JcblxuICAgIGlmIGFuY2VzdG9yXG4gICAgICBAb3JpZ2luID0gYW5jZXN0b3IuYXBlcnR1cmUgaWYgYW5jZXN0b3JcbiAgICAgIGFuY2VzdG9yLmNoaWxkID0gQFxuXG4gIGNhbGN1bGF0ZUdlb21ldHJ5UmluZzogLT5cbiAgICB2ZXJ0ZXggZm9yIHZlcnRleCBpbiBALmdlb21ldHJ5LnZlcnRpY2VzIHdoZW4gdmVydGV4LnogPT0gMFxuIiwiY2xhc3MgRm9yYW0gZXh0ZW5kcyBUSFJFRS5PYmplY3QzRFxuXG4gIElOSVRJQUxfUkFESVVTOiA1XG5cbiAgY29uc3RydWN0b3I6IChAZ2Vub3R5cGUpIC0+XG4gICAgVEhSRUUuT2JqZWN0M0QuY2FsbCBAXG5cbiAgICBAbWF0ZXJpYWwgPSBAYnVpbGRDaGFtYmVyTWF0ZXJpYWwoKVxuXG4gICAgaW5pdGlhbENoYW1iZXIgPSBAYnVpbGRJbml0aWFsQ2hhbWJlcigpXG5cbiAgICBAY2hhbWJlcnMgPSBbaW5pdGlhbENoYW1iZXJdXG4gICAgQGN1cnJlbnRDaGFtYmVyID0gaW5pdGlhbENoYW1iZXJcblxuICBidWlsZENoYW1iZXJNYXRlcmlhbDogLT5cbiAgICBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCB7IGNvbG9yOiAweGZmZmZmZiwgdHJhbnNwYXJlbnQ6IHRydWUgfVxuXG4gIGJ1aWxkSW5pdGlhbENoYW1iZXI6IC0+XG4gICAgQGJ1aWxkQ2hhbWJlciBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKSwgQElOSVRJQUxfUkFESVVTXG5cbiAgYnVpbGRDaGFtYmVyOiAoY2VudGVyLCByYWRpdXMpIC0+XG4gICAgbmV3IENoYW1iZXIgY2VudGVyLCByYWRpdXMsIEBtYXRlcmlhbFxuXG4gIGJ1aWxkQ2hhbWJlcnM6IChudW1DaGFtYmVycykgLT5cbiAgICBAY2FsY3VsYXRlTmV4dENoYW1iZXIoKSBmb3IgaSBpbiBbMS4ubnVtQ2hhbWJlcnMtMV1cbiAgICBAYnVpbGQoKVxuXG4gIGV2b2x2ZTogLT5cbiAgICBjaGlsZCA9IEBjdXJyZW50Q2hhbWJlci5jaGlsZFxuXG4gICAgaWYgY2hpbGRcbiAgICAgIEBjdXJyZW50Q2hhbWJlciA9IGNoaWxkXG4gICAgICBAY3VycmVudENoYW1iZXIudmlzaWJsZSA9IHRydWVcbiAgICBlbHNlXG4gICAgICBAY2FsY3VsYXRlTmV4dENoYW1iZXIoKVxuICAgICAgQGJ1aWxkKClcblxuICByZWdyZXNzOiAtPlxuICAgIGFuY2VzdG9yID0gQGN1cnJlbnRDaGFtYmVyLmFuY2VzdG9yXG5cbiAgICBpZiBhbmNlc3RvclxuICAgICAgQGN1cnJlbnRDaGFtYmVyLnZpc2libGUgPSBmYWxzZVxuICAgICAgQGN1cnJlbnRDaGFtYmVyID0gYW5jZXN0b3JcblxuICBjYWxjdWxhdGVOZXh0Q2hhbWJlcjogLT5cbiAgICBuZXdDZW50ZXIgPSBAY2FsY3VsYXRlTmV3Q2VudGVyKClcbiAgICBuZXdSYWRpdXMgPSBAY2FsY3VsYXRlTmV3UmFkaXVzKClcblxuICAgIG5ld0NoYW1iZXIgPSBAYnVpbGRDaGFtYmVyIG5ld0NlbnRlciwgbmV3UmFkaXVzXG5cbiAgICBuZXdBcGVydHVyZSA9IEBjYWxjdWxhdGVOZXdBcGVydHVyZSBuZXdDaGFtYmVyXG5cbiAgICBuZXdDaGFtYmVyLnNldEFwZXJ0dXJlIG5ld0FwZXJ0dXJlXG4gICAgbmV3Q2hhbWJlci5zZXRBbmNlc3RvciBAY3VycmVudENoYW1iZXJcblxuICAgIEBjaGFtYmVycy5wdXNoIG5ld0NoYW1iZXJcblxuICAgIEBjdXJyZW50Q2hhbWJlciA9IG5ld0NoYW1iZXJcblxuICBjYWxjdWxhdGVOZXdDZW50ZXI6IC0+XG4gICAgY3VycmVudE9yaWdpbiAgID0gQGN1cnJlbnRDaGFtYmVyLm9yaWdpblxuICAgIGN1cnJlbnRBcGVydHVyZSA9IEBjdXJyZW50Q2hhbWJlci5hcGVydHVyZVxuXG4gICAgIyBjYWxjdWxhdGUgaW5pdGlhbCBncm93dGggdmVjdG9yIChyZWZlcmVuY2UgbGluZSlcblxuICAgIGdyb3d0aFZlY3RvciA9IG5ldyBUSFJFRS5WZWN0b3IzXG4gICAgZ3Jvd3RoVmVjdG9yLnN1YlZlY3RvcnMgY3VycmVudEFwZXJ0dXJlLCBjdXJyZW50T3JpZ2luXG5cbiAgICAjIGRldmlhdGUgZ3Jvd3RoIHZlY3RvciBmcm9tIHJlZmVyZW5jZSBsaW5lXG5cbiAgICBob3Jpem9udGFsUm90YXRpb25BeGlzID0gbmV3IFRIUkVFLlZlY3RvcjMgMCwgMCwgMVxuICAgIHZlcnRpY2FsUm90YXRpb25BeGlzICAgPSBuZXcgVEhSRUUuVmVjdG9yMyAxLCAwLCAwXG5cbiAgICBncm93dGhWZWN0b3IuYXBwbHlBeGlzQW5nbGUgaG9yaXpvbnRhbFJvdGF0aW9uQXhpcywgQGdlbm90eXBlLnBoaVxuICAgIGdyb3d0aFZlY3Rvci5hcHBseUF4aXNBbmdsZSB2ZXJ0aWNhbFJvdGF0aW9uQXhpcywgICBAZ2Vub3R5cGUuYmV0YVxuXG4gICAgIyBtdWx0aXBseSBncm93dGggdmVjdG9yIGJ5IHRyYW5zbGFjdGlvbiBmYWN0b3JcblxuICAgIGdyb3d0aFZlY3Rvci5ub3JtYWxpemUoKVxuICAgIGdyb3d0aFZlY3Rvci5tdWx0aXBseVNjYWxhciBAZ2Vub3R5cGUudHJhbnNsYXRpb25GYWN0b3JcblxuICAgICMgY2FsY3VsYXRlIGNlbnRlciBvZiBuZXcgY2hhbWJlclxuXG4gICAgbmV3Q2VudGVyID0gbmV3IFRIUkVFLlZlY3RvcjNcbiAgICBuZXdDZW50ZXIuY29weSBjdXJyZW50QXBlcnR1cmVcbiAgICBuZXdDZW50ZXIuYWRkIGdyb3d0aFZlY3RvclxuXG4gICAgbmV3Q2VudGVyXG5cbiAgY2FsY3VsYXRlTmV3UmFkaXVzOiAtPlxuICAgIChAY3VycmVudENoYW1iZXIuYW5jZXN0b3IgfHwgQGN1cnJlbnRDaGFtYmVyKS5yYWRpdXMgKiBAZ2Vub3R5cGUuZ3Jvd3RoRmFjdG9yXG5cbiAgY2FsY3VsYXRlTmV3QXBlcnR1cmU6IChuZXdDaGFtYmVyKSAtPlxuICAgIG5ld0NlbnRlciAgID0gbmV3Q2hhbWJlci5jZW50ZXJcbiAgICBuZXdBcGVydHVyZSA9IG5ld0NoYW1iZXIudmVydGljZXNbMF1cblxuICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0FwZXJ0dXJlLmRpc3RhbmNlVG8gbmV3Q2VudGVyXG5cbiAgICBmb3IgdmVydGV4IGluIG5ld0NoYW1iZXIudmVydGljZXNbMS4uLTFdXG4gICAgICBuZXdEaXN0YW5jZSA9IHZlcnRleC5kaXN0YW5jZVRvIG5ld0NlbnRlclxuXG4gICAgICBpZiBuZXdEaXN0YW5jZSA8IGN1cnJlbnREaXN0YW5jZVxuICAgICAgICBjb250YWlucyA9IGZhbHNlXG5cbiAgICAgICAgZm9yIGNoYW1iZXIgaW4gQGNoYW1iZXJzXG4gICAgICAgICAgaWYgY2hhbWJlci5yYWRpdXMgPiBuZXdBcGVydHVyZS5kaXN0YW5jZVRvIGNoYW1iZXIuY2VudGVyXG4gICAgICAgICAgICBjb250YWlucyA9IHRydWVcbiAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgdW5sZXNzIGNvbnRhaW5zXG4gICAgICAgICAgbmV3QXBlcnR1cmUgPSB2ZXJ0ZXhcbiAgICAgICAgICBjdXJyZW50RGlzdGFuY2UgPSBuZXdEaXN0YW5jZVxuXG4gICAgbmV3QXBlcnR1cmVcblxuICBidWlsZDogLT5cbiAgICBALmFkZCBjaGFtYmVyIGZvciBjaGFtYmVyIGluIEBjaGFtYmVyc1xuIiwiIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRm9yIE1yIFdoaXRlLi4uIFsqXVxuI1xuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX198fHx8fHxfX1xuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgIHxcbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW15dW15dXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgX18gfFxuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X19fX3xcblxuY2xhc3MgU2ltdWxhdGlvblxuXG4gIGNvbnN0cnVjdG9yOiAoQGNhbnZhcywgQG9wdGlvbnMpIC0+XG4gICAgZGVmYXVsdHMgPSB7IGRldjogZmFsc2UgfVxuXG4gICAgQG9wdGlvbnMgfHw9IHt9XG5cbiAgICBmb3Igb3B0aW9uIG9mIGRlZmF1bHRzXG4gICAgICBAb3B0aW9uc1tvcHRpb25dIHx8PSBkZWZhdWx0c1tvcHRpb25dXG5cbiAgICBAc2V0dXBTY2VuZSgpXG4gICAgQHNldHVwQ29udHJvbHMoKVxuICAgIEBzZXR1cEdVSSgpIGlmIEBvcHRpb25zLmRldlxuXG4gIHNldHVwU2NlbmU6IC0+XG4gICAgQHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKClcblxuICAgICMgY2FtZXJhXG5cbiAgICBAY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDQ1LCB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodCwgMC4xLCAxMDAwKVxuICAgIEBjYW1lcmEucG9zaXRpb24uc2V0IDAsIDAsIDcwXG4gICAgQHNjZW5lLmFkZCBAY2FtZXJhXG5cbiAgICAjIHJlbmRlcmVyXG5cbiAgICBAcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlciB7IGFscGhhOiB0cnVlLCBhbnRpYWxpYXM6IHRydWUgfVxuICAgIEByZW5kZXJlci5zZXRDbGVhckNvbG9yIDB4MTExMTExLCAxXG4gICAgQHJlbmRlcmVyLnNldFNpemUgd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodFxuXG4gICAgIyBsaWdodGluZ1xuXG4gICAgc3BvdExpZ2h0ID0gbmV3IFRIUkVFLlNwb3RMaWdodCAweGZmZmZmZlxuICAgIEBjYW1lcmEuYWRkIHNwb3RMaWdodFxuXG4gICAgQGNhbnZhcy5hcHBlbmQgQHJlbmRlcmVyLmRvbUVsZW1lbnRcblxuICBzZXR1cENvbnRyb2xzOiAtPlxuICAgIEBjb250cm9scyA9IG5ldyBUSFJFRS5UcmFja2JhbGxDb250cm9scyBAY2FtZXJhLCBAcmVuZGVyZXIuZG9tRWxlbWVudFxuXG4gICAgQGNvbnRyb2xzLnJvdGF0ZVNwZWVkID0gNS4wXG4gICAgQGNvbnRyb2xzLnpvb21TcGVlZCAgID0gMS4yXG4gICAgQGNvbnRyb2xzLnBhblNwZWVkICAgID0gMC44XG5cbiAgICBAY29udHJvbHMubm9ab29tID0gZmFsc2VcbiAgICBAY29udHJvbHMubm9QYW4gID0gZmFsc2VcblxuICAgIEBjb250cm9scy5zdGF0aWNNb3ZpbmcgPSB0cnVlXG5cbiAgICBAY29udHJvbHMuZHluYW1pY0RhbXBpbmdGYWN0b3IgPSAwLjNcblxuICAgIEBjb250cm9scy5rZXlzID0gWzY1LCA4MywgNjhdXG5cbiAgc2V0dXBHVUk6IC0+XG4gICAgQGd1aSA9IG5ldyBkYXQuR1VJXG5cbiAgICBnZW5vdHlwZUZvbGRlciAgPSBAZ3VpLmFkZEZvbGRlciBcIkdlbm90eXBlXCJcbiAgICBzdHJ1Y3R1cmVGb2xkZXIgPSBAZ3VpLmFkZEZvbGRlciBcIlN0cnVjdHVyZSBhbmFseXplclwiXG4gICAgbWF0ZXJpYWxGb2xkZXIgID0gQGd1aS5hZGRGb2xkZXIgXCJNYXRlcmlhbFwiXG5cbiAgICBnZW5vdHlwZSA9XG4gICAgICBwaGk6ICAgICAgICAgICAgICAgMC41XG4gICAgICBiZXRhOiAgICAgICAgICAgICAgMC41XG4gICAgICB0cmFuc2xhdGlvbkZhY3RvcjogMC41XG4gICAgICBncm93dGhGYWN0b3I6ICAgICAgMS4xXG5cbiAgICBzaW11bGF0aW9uT3B0aW9ucyA9XG4gICAgICBudW1DaGFtYmVyczogN1xuXG4gICAgc3RydWN0dXJlQW5hbHl6ZXIgPVxuICAgICAgc2ltdWxhdGU6ICAgICAgID0+IEBzaW11bGF0ZShnZW5vdHlwZSwgc2ltdWxhdGlvbk9wdGlvbnMpXG4gICAgICBldm9sdmU6ICAgICAgICAgPT4gQGV2b2x2ZSgpXG4gICAgICByZWdyZXNzOiAgICAgICAgPT4gQHJlZ3Jlc3MoKVxuICAgICAgY2VudHJvaWRzTGluZTogID0+IEB0b2dnbGVDZW50cm9pZHNMaW5lKClcbiAgICAgIHRvZ2dsZUNoYW1iZXJzOiA9PiBAdG9nZ2xlQ2hhbWJlcnMoKVxuXG4gICAgbWF0ZXJpYWxPcHRpb25zID1cbiAgICAgIG9wYWNpdHk6IDEuMFxuXG4gICAgZ2Vub3R5cGVGb2xkZXIuYWRkKGdlbm90eXBlLCAncGhpJykuc3RlcCAwLjAxXG4gICAgZ2Vub3R5cGVGb2xkZXIuYWRkKGdlbm90eXBlLCAnYmV0YScpLnN0ZXAgMC4wMVxuICAgIGdlbm90eXBlRm9sZGVyLmFkZChnZW5vdHlwZSwgJ3RyYW5zbGF0aW9uRmFjdG9yJykuc3RlcCAwLjAxXG4gICAgZ2Vub3R5cGVGb2xkZXIuYWRkKGdlbm90eXBlLCAnZ3Jvd3RoRmFjdG9yJykuc3RlcCAwLjAxXG5cbiAgICBnZW5vdHlwZUZvbGRlci5hZGQoc2ltdWxhdGlvbk9wdGlvbnMsICdudW1DaGFtYmVycycpXG5cbiAgICBzdHJ1Y3R1cmVGb2xkZXIuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAnc2ltdWxhdGUnKVxuICAgIHN0cnVjdHVyZUZvbGRlci5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdldm9sdmUnKVxuICAgIHN0cnVjdHVyZUZvbGRlci5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdyZWdyZXNzJylcbiAgICBzdHJ1Y3R1cmVGb2xkZXIuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAnY2VudHJvaWRzTGluZScpXG4gICAgc3RydWN0dXJlRm9sZGVyLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ3RvZ2dsZUNoYW1iZXJzJylcblxuICAgIG1hdGVyaWFsRm9sZGVyLmFkZChtYXRlcmlhbE9wdGlvbnMsICdvcGFjaXR5Jykub25GaW5pc2hDaGFuZ2UgPT5cbiAgICAgIEBhcHBseU9wYWNpdHkgbWF0ZXJpYWxPcHRpb25zLm9wYWNpdHlcblxuICBzaW11bGF0ZTogKGdlbm90eXBlLCBvcHRpb25zKSAtPlxuICAgIEByZXNldCgpXG5cbiAgICBAZm9yYW0gPSBuZXcgRm9yYW0gZ2Vub3R5cGVcbiAgICBAZm9yYW0uYnVpbGRDaGFtYmVycyBvcHRpb25zLm51bUNoYW1iZXJzXG5cbiAgICBAc2NlbmUuYWRkIEBmb3JhbVxuXG4gIGV2b2x2ZTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgQGZvcmFtLmV2b2x2ZSgpXG4gICAgQGNlbnRyb2lkc0xpbmUucmVidWlsZCgpIGlmIEBjZW50cm9pZHNMaW5lXG5cbiAgcmVncmVzczogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgQGZvcmFtLnJlZ3Jlc3MoKVxuICAgIEBjZW50cm9pZHNMaW5lLnJlYnVpbGQoKSBpZiBAY2VudHJvaWRzTGluZVxuXG4gIHRvZ2dsZUNlbnRyb2lkc0xpbmU6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIHVubGVzcyBAY2VudHJvaWRzTGluZVxuICAgICAgQGNlbnRyb2lkc0xpbmUgPSBuZXcgQ2VudHJvaWRzTGluZSBAZm9yYW1cbiAgICAgIEBjZW50cm9pZHNMaW5lLnZpc2libGUgPSBmYWxzZVxuXG4gICAgICBAc2NlbmUuYWRkIEBjZW50cm9pZHNMaW5lXG5cbiAgICBAY2VudHJvaWRzTGluZS52aXNpYmxlID0gIUBjZW50cm9pZHNMaW5lLnZpc2libGVcblxuICB0b2dnbGVDaGFtYmVyczogLT5cbiAgICBAZm9yYW0udmlzaWJsZSA9ICFAZm9yYW0udmlzaWJsZSBpZiBAZm9yYW1cblxuICBhcHBseU9wYWNpdHk6IChvcGFjaXR5KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBAZm9yYW0ubWF0ZXJpYWwub3BhY2l0eSA9IG9wYWNpdHlcblxuICBleHBvcnRUb09iajogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgZXhwb3J0ZXIgPSBuZXcgVEhSRUUuT0JKRXhwb3J0ZXIoKVxuICAgIGV4cG9ydGVyLnBhcnNlIEBmb3JhbVxuXG4gIHJlc2V0OiAtPlxuICAgIEBzY2VuZS5yZW1vdmUgQGZvcmFtICAgICAgICAgaWYgQGZvcmFtXG4gICAgQHNjZW5lLnJlbW92ZSBAY2VudHJvaWRzTGluZSBpZiBAY2VudHJvaWRzTGluZVxuXG4gICAgQGZvcmFtID0gbnVsbFxuICAgIEBjZW50cm9pZHNMaW5lID0gbnVsbFxuXG4gIGFuaW1hdGU6ID0+XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIEBhbmltYXRlXG5cbiAgICBAY29udHJvbHMudXBkYXRlKClcbiAgICBAcmVuZGVyKClcblxuICByZW5kZXI6IC0+XG4gICAgQHJlbmRlcmVyLnJlbmRlciBAc2NlbmUsIEBjYW1lcmFcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==