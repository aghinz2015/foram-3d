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

  Chamber.prototype.GROWTH_VECTOR_COLOR = 0xffff00;

  function Chamber(center, radius, thickness, material) {
    var geometry;
    this.center = center;
    this.radius = radius;
    this.thickness = thickness;
    geometry = this.buildChamberGeometry();
    THREE.Mesh.call(this, geometry, material);
    this.vertices = geometry.vertices;
    this.origin = this.center;
    this.aperture = this.calculateAperture();
    this.thicknessVector = this.buildThicknessVector();
    this.add(this.thicknessVector);
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

  Chamber.prototype.buildThicknessVector = function() {
    var direction, thicknessVector;
    direction = new THREE.Vector3(0, 1, 0);
    thicknessVector = new THREE.ArrowHelper(direction, this.origin, this.thickness, this.GROWTH_VECTOR_COLOR);
    thicknessVector.visible = false;
    return thicknessVector;
  };

  Chamber.prototype.showThicknessVector = function() {
    return this.thicknessVector.visible = true;
  };

  Chamber.prototype.hideThicknessVector = function() {
    return this.thicknessVector.visible = false;
  };

  Chamber.prototype.toggleThicknessVector = function() {
    return this.thicknessVector.visible !== this.thicknessVector.visible;
  };

  return Chamber;

})(THREE.Mesh);

var Foram,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Foram = (function(superClass) {
  extend(Foram, superClass);

  Foram.prototype.INITIAL_RADIUS = 5;

  Foram.prototype.INITIAL_THICKNESS = 3;

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
    return this.buildChamber(new THREE.Vector3(0, 0, 0), this.INITIAL_RADIUS, this.INITIAL_THICKNESS);
  };

  Foram.prototype.buildChamber = function(center, radius, thickness) {
    return new Chamber(center, radius, thickness, this.material);
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
    var newAperture, newCenter, newChamber, newRadius, newThickness;
    newCenter = this.calculateNewCenter();
    newRadius = this.calculateNewRadius();
    newThickness = this.calculateNewThickness();
    newChamber = this.buildChamber(newCenter, newRadius, newThickness);
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
    return this.ancestorOrCurrentChamber().radius * this.genotype.growthFactor;
  };

  Foram.prototype.calculateNewThickness = function() {
    return this.ancestorOrCurrentChamber().thickness * this.genotype.wallThicknessFactor;
  };

  Foram.prototype.ancestorOrCurrentChamber = function() {
    return this.currentChamber.ancestor || this.currentChamber;
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
    this.setupAutoResize();
    if (this.options.dev) {
      this.setupGUI();
    }
    this.thicknessVectorsVisible = false;
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

  Simulation.prototype.setupAutoResize = function() {
    return window.addEventListener('resize', (function(_this) {
      return function() {
        return _this.resize();
      };
    })(this));
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
      growthFactor: 1.1,
      wallThicknessFactor: 1.1
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
      thicknessVectors: (function(_this) {
        return function() {
          return _this.toggleThicknessVectors();
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
    genotypeFolder.add(genotype, 'wallThicknessFactor').step(0.01);
    genotypeFolder.add(simulationOptions, 'numChambers');
    structureFolder.add(structureAnalyzer, 'simulate');
    structureFolder.add(structureAnalyzer, 'evolve');
    structureFolder.add(structureAnalyzer, 'regress');
    structureFolder.add(structureAnalyzer, 'centroidsLine');
    structureFolder.add(structureAnalyzer, 'thicknessVectors');
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
      this.centroidsLine.rebuild();
    }
    return this.updateThicknessVectors();
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

  Simulation.prototype.showThicknessVectors = function() {
    var chamber, i, len, ref, results;
    if (!this.foram) {
      return;
    }
    ref = this.foram.chambers;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      chamber = ref[i];
      results.push(chamber.showThicknessVector());
    }
    return results;
  };

  Simulation.prototype.hideThicknessVectors = function() {
    var chamber, i, len, ref, results;
    if (!this.foram) {
      return;
    }
    ref = this.foram.chambers;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      chamber = ref[i];
      results.push(chamber.hideThicknessVector());
    }
    return results;
  };

  Simulation.prototype.toggleThicknessVectors = function() {
    this.thicknessVectorsVisible = !this.thicknessVectorsVisible;
    return this.updateThicknessVectors();
  };

  Simulation.prototype.updateThicknessVectors = function() {
    if (this.thicknessVectorsVisible) {
      return this.showThicknessVectors();
    } else {
      return this.hideThicknessVectors();
    }
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

  Simulation.prototype.resize = function() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    return this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  return Simulation;

})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2NlbnRyb2lkc19saW5lLmNvZmZlZSIsImpzL2NoYW1iZXIuY29mZmVlIiwianMvZm9yYW0uY29mZmVlIiwianMvc2ltdWxhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxhQUFBO0VBQUE7OztBQUFNOzs7MEJBRUosVUFBQSxHQUFZOztFQUVDLHVCQUFDLEtBQUQ7SUFBQyxJQUFDLENBQUEsUUFBRDtJQUNaLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0lBRW5CLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLGdCQUFELENBQUE7SUFDWixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBRVosSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQUVBLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWCxDQUFnQixJQUFoQixFQUFtQixJQUFDLENBQUEsUUFBcEIsRUFBOEIsSUFBQyxDQUFBLFFBQS9CO0VBUlc7OzBCQVViLG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsUUFBQTtJQUFBLE1BQUEsR0FBYSxJQUFBLFlBQUEsQ0FBYSxJQUFDLENBQUEsVUFBRCxHQUFjLENBQTNCO1dBRVQsSUFBQSxLQUFLLENBQUMsZUFBTixDQUFzQixNQUF0QixFQUE4QixDQUE5QjtFQUhnQjs7MEJBS3RCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsUUFBQTtJQUFBLFFBQUEsR0FBZSxJQUFBLEtBQUssQ0FBQyxjQUFOLENBQUE7SUFDZixRQUFRLENBQUMsWUFBVCxDQUFzQixVQUF0QixFQUFrQyxJQUFDLENBQUEsZUFBbkM7V0FFQTtFQUpnQjs7MEJBTWxCLGlCQUFBLEdBQW1CLFNBQUE7V0FDYixJQUFBLEtBQUssQ0FBQyxpQkFBTixDQUF3QjtNQUFFLEtBQUEsRUFBTyxRQUFUO01BQW1CLFNBQUEsRUFBVyxFQUE5QjtLQUF4QjtFQURhOzswQkFHbkIsT0FBQSxHQUFTLFNBQUE7QUFDUCxR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QUFNLENBQUMsc0JBQVIsQ0FBQTtXQUVBLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBVixDQUFrQixNQUFNLENBQUMsVUFBekIsRUFBcUMsTUFBTSxDQUFDLFdBQTVDO0VBSk0iLCJmaWxlIjoiZm9yYW1fM2QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBDZW50cm9pZHNMaW5lIGV4dGVuZHMgVEhSRUUuTGluZVxuXG4gIE1BWF9QT0lOVFM6IDEwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQGZvcmFtKSAtPlxuICAgIEBwb3NpdGlvbnNCdWZmZXIgPSBAYnVpbGRQb3NpdGlvbnNCdWZmZXIoKVxuXG4gICAgQGdlb21ldHJ5ID0gQGJ1aWxkTGluZUdvbWV0cnkoKVxuICAgIEBtYXRlcmlhbCA9IEBidWlsZExpbmVNYXRlcmlhbCgpXG5cbiAgICBAcmVidWlsZCgpXG5cbiAgICBUSFJFRS5MaW5lLmNhbGwgQCwgQGdlb21ldHJ5LCBAbWF0ZXJpYWxcblxuICBidWlsZFBvc2l0aW9uc0J1ZmZlcjogLT5cbiAgICBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5IEBNQVhfUE9JTlRTICogM1xuXG4gICAgbmV3IFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBidWZmZXIsIDNcblxuICBidWlsZExpbmVHb21ldHJ5OiAtPlxuICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkJ1ZmZlckdlb21ldHJ5KClcbiAgICBnZW9tZXRyeS5hZGRBdHRyaWJ1dGUgXCJwb3NpdGlvblwiLCBAcG9zaXRpb25zQnVmZmVyXG5cbiAgICBnZW9tZXRyeVxuXG4gIGJ1aWxkTGluZU1hdGVyaWFsOiAtPlxuICAgIG5ldyBUSFJFRS5MaW5lQmFzaWNNYXRlcmlhbCB7IGNvbG9yOiAweGZmMDAwMCwgbGluZXdpZHRoOiAxMCB9XG5cbiAgcmVidWlsZDogLT5cbiAgICBhY3RpdmVDaGFtYmVycyA9IEBmaWx0ZXJBY3RpdmVDaGFtYmVycygpXG5cbiAgICBwb3NpdGlvbnMgPSBAcG9zaXRpb25zQnVmZmVyLmFycmF5XG4gICAgaW5kZXggPSAwXG5cbiAgICBmb3IgY2hhbWJlciBpbiBhY3RpdmVDaGFtYmVyc1xuICAgICAgY2VudHJvaWQgPSBjaGFtYmVyLmNlbnRlclxuXG4gICAgICBwb3NpdGlvbnNbaW5kZXgrK10gPSBjZW50cm9pZC54XG4gICAgICBwb3NpdGlvbnNbaW5kZXgrK10gPSBjZW50cm9pZC55XG4gICAgICBwb3NpdGlvbnNbaW5kZXgrK10gPSBjZW50cm9pZC56XG5cbiAgICBAZ2VvbWV0cnkuc2V0RHJhd1JhbmdlIDAsIGFjdGl2ZUNoYW1iZXJzLmxlbmd0aFxuXG4gICAgQHBvc2l0aW9uc0J1ZmZlci5uZWVkc1VwZGF0ZSA9IHRydWVcblxuICBmaWx0ZXJBY3RpdmVDaGFtYmVyczogLT5cbiAgICBjaGFtYmVyIGZvciBjaGFtYmVyIGluIEBmb3JhbS5jaGFtYmVycyB3aGVuIGNoYW1iZXIudmlzaWJsZVxuIiwiY2xhc3MgQ2hhbWJlciBleHRlbmRzIFRIUkVFLk1lc2hcblxuICBERUZBVUxUX1RFWFRVUkU6IFwiLi4vYXNzZXRzL2ltYWdlcy90ZXh0dXJlLmdpZlwiXG4gIEdST1dUSF9WRUNUT1JfQ09MT1I6IDB4ZmZmZjAwXG5cbiAgY29uc3RydWN0b3I6IChAY2VudGVyLCBAcmFkaXVzLCBAdGhpY2tuZXNzLCBtYXRlcmlhbCkgLT5cbiAgICBnZW9tZXRyeSA9IEBidWlsZENoYW1iZXJHZW9tZXRyeSgpXG5cbiAgICBUSFJFRS5NZXNoLmNhbGwgQCwgZ2VvbWV0cnksIG1hdGVyaWFsXG5cbiAgICBAdmVydGljZXMgPSBnZW9tZXRyeS52ZXJ0aWNlc1xuICAgIEBvcmlnaW4gICA9IEBjZW50ZXJcbiAgICBAYXBlcnR1cmUgPSBAY2FsY3VsYXRlQXBlcnR1cmUoKVxuXG4gICAgQHRoaWNrbmVzc1ZlY3RvciA9IEBidWlsZFRoaWNrbmVzc1ZlY3RvcigpXG4gICAgQC5hZGQgQHRoaWNrbmVzc1ZlY3RvclxuXG4gIGJ1aWxkQ2hhbWJlckdlb21ldHJ5OiAtPlxuICAgIGNlbnRlclRyYW5zbGF0aW9uTWF0cml4ID0gQGJ1aWxkQ2VudGVyVHJhbnNsYXRpb25NYXRyaXgoKVxuXG4gICAgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkgQHJhZGl1cywgMzIsIDMyXG4gICAgZ2VvbWV0cnkuYXBwbHlNYXRyaXggY2VudGVyVHJhbnNsYXRpb25NYXRyaXhcbiAgICBnZW9tZXRyeVxuXG4gIGJ1aWxkQ2VudGVyVHJhbnNsYXRpb25NYXRyaXg6IC0+XG4gICAgbmV3IFRIUkVFLk1hdHJpeDQoKS5tYWtlVHJhbnNsYXRpb24gQGNlbnRlci54LCBAY2VudGVyLnksIEBjZW50ZXIuelxuXG4gIGNhbGN1bGF0ZUFwZXJ0dXJlOiAtPlxuICAgIGFwZXJ0dXJlID0gQHZlcnRpY2VzWzBdXG4gICAgY3VycmVudERpc3RhbmNlID0gYXBlcnR1cmUuZGlzdGFuY2VUbyBAY2VudGVyXG5cbiAgICBmb3IgdmVydGV4IGluIEB2ZXJ0aWNlc1sxLi4tMV1cbiAgICAgIG5ld0Rpc3RhbmNlID0gdmVydGV4LmRpc3RhbmNlVG8gQGNlbnRlclxuXG4gICAgICBpZiBuZXdEaXN0YW5jZSA8IGN1cnJlbnREaXN0YW5jZVxuICAgICAgICBhcGVydHVyZSA9IHZlcnRleFxuICAgICAgICBjdXJyZW50RGlzdGFuY2UgPSBuZXdEaXN0YW5jZVxuXG4gICAgYXBlcnR1cmVcblxuICBzZXRBcGVydHVyZTogKGFwZXJ0dXJlKSAtPlxuICAgIEBhcGVydHVyZSA9IGFwZXJ0dXJlXG5cbiAgc2V0QW5jZXN0b3I6IChhbmNlc3RvcikgLT5cbiAgICBAYW5jZXN0b3IgPSBhbmNlc3RvclxuXG4gICAgaWYgYW5jZXN0b3JcbiAgICAgIEBvcmlnaW4gPSBhbmNlc3Rvci5hcGVydHVyZSBpZiBhbmNlc3RvclxuICAgICAgYW5jZXN0b3IuY2hpbGQgPSBAXG5cbiAgY2FsY3VsYXRlR2VvbWV0cnlSaW5nOiAtPlxuICAgIHZlcnRleCBmb3IgdmVydGV4IGluIEAuZ2VvbWV0cnkudmVydGljZXMgd2hlbiB2ZXJ0ZXgueiA9PSAwXG5cbiAgYnVpbGRUaGlja25lc3NWZWN0b3I6IC0+XG4gICAgZGlyZWN0aW9uID0gbmV3IFRIUkVFLlZlY3RvcjMgMCwgMSwgMFxuXG4gICAgdGhpY2tuZXNzVmVjdG9yID0gbmV3IFRIUkVFLkFycm93SGVscGVyIGRpcmVjdGlvbiwgQG9yaWdpbiwgQHRoaWNrbmVzcywgQEdST1dUSF9WRUNUT1JfQ09MT1JcbiAgICB0aGlja25lc3NWZWN0b3IudmlzaWJsZSA9IGZhbHNlXG5cbiAgICB0aGlja25lc3NWZWN0b3JcblxuICBzaG93VGhpY2tuZXNzVmVjdG9yOiAtPlxuICAgIEB0aGlja25lc3NWZWN0b3IudmlzaWJsZSA9IHRydWVcblxuICBoaWRlVGhpY2tuZXNzVmVjdG9yOiAtPlxuICAgIEB0aGlja25lc3NWZWN0b3IudmlzaWJsZSA9IGZhbHNlXG5cbiAgdG9nZ2xlVGhpY2tuZXNzVmVjdG9yOiAtPlxuICAgIEB0aGlja25lc3NWZWN0b3IudmlzaWJsZSAhPSBAdGhpY2tuZXNzVmVjdG9yLnZpc2libGVcbiIsImNsYXNzIEZvcmFtIGV4dGVuZHMgVEhSRUUuT2JqZWN0M0RcblxuICBJTklUSUFMX1JBRElVUzogNVxuICBJTklUSUFMX1RISUNLTkVTUzogM1xuXG4gIGNvbnN0cnVjdG9yOiAoQGdlbm90eXBlKSAtPlxuICAgIFRIUkVFLk9iamVjdDNELmNhbGwgQFxuXG4gICAgQG1hdGVyaWFsID0gQGJ1aWxkQ2hhbWJlck1hdGVyaWFsKClcblxuICAgIGluaXRpYWxDaGFtYmVyID0gQGJ1aWxkSW5pdGlhbENoYW1iZXIoKVxuXG4gICAgQGNoYW1iZXJzID0gW2luaXRpYWxDaGFtYmVyXVxuICAgIEBjdXJyZW50Q2hhbWJlciA9IGluaXRpYWxDaGFtYmVyXG5cbiAgYnVpbGRDaGFtYmVyTWF0ZXJpYWw6IC0+XG4gICAgbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwgeyBjb2xvcjogMHhmZmZmZmYsIHRyYW5zcGFyZW50OiB0cnVlIH1cblxuICBidWlsZEluaXRpYWxDaGFtYmVyOiAtPlxuICAgIEBidWlsZENoYW1iZXIgbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCksIEBJTklUSUFMX1JBRElVUywgQElOSVRJQUxfVEhJQ0tORVNTXG5cbiAgYnVpbGRDaGFtYmVyOiAoY2VudGVyLCByYWRpdXMsIHRoaWNrbmVzcykgLT5cbiAgICBuZXcgQ2hhbWJlciBjZW50ZXIsIHJhZGl1cywgdGhpY2tuZXNzLCBAbWF0ZXJpYWxcblxuICBidWlsZENoYW1iZXJzOiAobnVtQ2hhbWJlcnMpIC0+XG4gICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKCkgZm9yIGkgaW4gWzEuLm51bUNoYW1iZXJzLTFdXG4gICAgQGJ1aWxkKClcblxuICBldm9sdmU6IC0+XG4gICAgY2hpbGQgPSBAY3VycmVudENoYW1iZXIuY2hpbGRcblxuICAgIGlmIGNoaWxkXG4gICAgICBAY3VycmVudENoYW1iZXIgPSBjaGlsZFxuICAgICAgQGN1cnJlbnRDaGFtYmVyLnZpc2libGUgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKClcbiAgICAgIEBidWlsZCgpXG5cbiAgcmVncmVzczogLT5cbiAgICBhbmNlc3RvciA9IEBjdXJyZW50Q2hhbWJlci5hbmNlc3RvclxuXG4gICAgaWYgYW5jZXN0b3JcbiAgICAgIEBjdXJyZW50Q2hhbWJlci52aXNpYmxlID0gZmFsc2VcbiAgICAgIEBjdXJyZW50Q2hhbWJlciA9IGFuY2VzdG9yXG5cbiAgY2FsY3VsYXRlTmV4dENoYW1iZXI6IC0+XG4gICAgbmV3Q2VudGVyICAgID0gQGNhbGN1bGF0ZU5ld0NlbnRlcigpXG4gICAgbmV3UmFkaXVzICAgID0gQGNhbGN1bGF0ZU5ld1JhZGl1cygpXG4gICAgbmV3VGhpY2tuZXNzID0gQGNhbGN1bGF0ZU5ld1RoaWNrbmVzcygpXG5cbiAgICBuZXdDaGFtYmVyID0gQGJ1aWxkQ2hhbWJlciBuZXdDZW50ZXIsIG5ld1JhZGl1cywgbmV3VGhpY2tuZXNzXG5cbiAgICBuZXdBcGVydHVyZSA9IEBjYWxjdWxhdGVOZXdBcGVydHVyZSBuZXdDaGFtYmVyXG5cbiAgICBuZXdDaGFtYmVyLnNldEFwZXJ0dXJlIG5ld0FwZXJ0dXJlXG4gICAgbmV3Q2hhbWJlci5zZXRBbmNlc3RvciBAY3VycmVudENoYW1iZXJcblxuICAgIEBjaGFtYmVycy5wdXNoIG5ld0NoYW1iZXJcblxuICAgIEBjdXJyZW50Q2hhbWJlciA9IG5ld0NoYW1iZXJcblxuICBjYWxjdWxhdGVOZXdDZW50ZXI6IC0+XG4gICAgY3VycmVudE9yaWdpbiAgID0gQGN1cnJlbnRDaGFtYmVyLm9yaWdpblxuICAgIGN1cnJlbnRBcGVydHVyZSA9IEBjdXJyZW50Q2hhbWJlci5hcGVydHVyZVxuXG4gICAgIyBjYWxjdWxhdGUgaW5pdGlhbCBncm93dGggdmVjdG9yIChyZWZlcmVuY2UgbGluZSlcblxuICAgIGdyb3d0aFZlY3RvciA9IG5ldyBUSFJFRS5WZWN0b3IzXG4gICAgZ3Jvd3RoVmVjdG9yLnN1YlZlY3RvcnMgY3VycmVudEFwZXJ0dXJlLCBjdXJyZW50T3JpZ2luXG5cbiAgICAjIGRldmlhdGUgZ3Jvd3RoIHZlY3RvciBmcm9tIHJlZmVyZW5jZSBsaW5lXG5cbiAgICBob3Jpem9udGFsUm90YXRpb25BeGlzID0gbmV3IFRIUkVFLlZlY3RvcjMgMCwgMCwgMVxuICAgIHZlcnRpY2FsUm90YXRpb25BeGlzICAgPSBuZXcgVEhSRUUuVmVjdG9yMyAxLCAwLCAwXG5cbiAgICBncm93dGhWZWN0b3IuYXBwbHlBeGlzQW5nbGUgaG9yaXpvbnRhbFJvdGF0aW9uQXhpcywgQGdlbm90eXBlLnBoaVxuICAgIGdyb3d0aFZlY3Rvci5hcHBseUF4aXNBbmdsZSB2ZXJ0aWNhbFJvdGF0aW9uQXhpcywgICBAZ2Vub3R5cGUuYmV0YVxuXG4gICAgIyBtdWx0aXBseSBncm93dGggdmVjdG9yIGJ5IHRyYW5zbGFjdGlvbiBmYWN0b3JcblxuICAgIGdyb3d0aFZlY3Rvci5ub3JtYWxpemUoKVxuICAgIGdyb3d0aFZlY3Rvci5tdWx0aXBseVNjYWxhciBAZ2Vub3R5cGUudHJhbnNsYXRpb25GYWN0b3JcblxuICAgICMgY2FsY3VsYXRlIGNlbnRlciBvZiBuZXcgY2hhbWJlclxuXG4gICAgbmV3Q2VudGVyID0gbmV3IFRIUkVFLlZlY3RvcjNcbiAgICBuZXdDZW50ZXIuY29weSBjdXJyZW50QXBlcnR1cmVcbiAgICBuZXdDZW50ZXIuYWRkIGdyb3d0aFZlY3RvclxuXG4gICAgbmV3Q2VudGVyXG5cbiAgY2FsY3VsYXRlTmV3UmFkaXVzOiAtPlxuICAgIEBhbmNlc3Rvck9yQ3VycmVudENoYW1iZXIoKS5yYWRpdXMgKiBAZ2Vub3R5cGUuZ3Jvd3RoRmFjdG9yXG5cbiAgY2FsY3VsYXRlTmV3VGhpY2tuZXNzOiAtPlxuICAgIEBhbmNlc3Rvck9yQ3VycmVudENoYW1iZXIoKS50aGlja25lc3MgKiBAZ2Vub3R5cGUud2FsbFRoaWNrbmVzc0ZhY3RvclxuXG4gIGFuY2VzdG9yT3JDdXJyZW50Q2hhbWJlcjogLT5cbiAgICBAY3VycmVudENoYW1iZXIuYW5jZXN0b3IgfHwgQGN1cnJlbnRDaGFtYmVyXG5cbiAgY2FsY3VsYXRlTmV3QXBlcnR1cmU6IChuZXdDaGFtYmVyKSAtPlxuICAgIG5ld0NlbnRlciAgID0gbmV3Q2hhbWJlci5jZW50ZXJcbiAgICBuZXdBcGVydHVyZSA9IG5ld0NoYW1iZXIudmVydGljZXNbMF1cblxuICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0FwZXJ0dXJlLmRpc3RhbmNlVG8gbmV3Q2VudGVyXG5cbiAgICBmb3IgdmVydGV4IGluIG5ld0NoYW1iZXIudmVydGljZXNbMS4uLTFdXG4gICAgICBuZXdEaXN0YW5jZSA9IHZlcnRleC5kaXN0YW5jZVRvIG5ld0NlbnRlclxuXG4gICAgICBpZiBuZXdEaXN0YW5jZSA8IGN1cnJlbnREaXN0YW5jZVxuICAgICAgICBjb250YWlucyA9IGZhbHNlXG5cbiAgICAgICAgZm9yIGNoYW1iZXIgaW4gQGNoYW1iZXJzXG4gICAgICAgICAgaWYgY2hhbWJlci5yYWRpdXMgPiBuZXdBcGVydHVyZS5kaXN0YW5jZVRvIGNoYW1iZXIuY2VudGVyXG4gICAgICAgICAgICBjb250YWlucyA9IHRydWVcbiAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgdW5sZXNzIGNvbnRhaW5zXG4gICAgICAgICAgbmV3QXBlcnR1cmUgPSB2ZXJ0ZXhcbiAgICAgICAgICBjdXJyZW50RGlzdGFuY2UgPSBuZXdEaXN0YW5jZVxuXG4gICAgbmV3QXBlcnR1cmVcblxuICBidWlsZDogLT5cbiAgICBALmFkZCBjaGFtYmVyIGZvciBjaGFtYmVyIGluIEBjaGFtYmVyc1xuIiwiIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRm9yIE1yIFdoaXRlLi4uIFsqXVxuI1xuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX198fHx8fHxfX1xuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgIHxcbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW15dW15dXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgX18gfFxuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X19fX3xcblxuY2xhc3MgU2ltdWxhdGlvblxuXG4gIGNvbnN0cnVjdG9yOiAoQGNhbnZhcywgQG9wdGlvbnMpIC0+XG4gICAgZGVmYXVsdHMgPSB7IGRldjogZmFsc2UgfVxuXG4gICAgQG9wdGlvbnMgfHw9IHt9XG5cbiAgICBmb3Igb3B0aW9uIG9mIGRlZmF1bHRzXG4gICAgICBAb3B0aW9uc1tvcHRpb25dIHx8PSBkZWZhdWx0c1tvcHRpb25dXG5cbiAgICBAc2V0dXBTY2VuZSgpXG4gICAgQHNldHVwQ29udHJvbHMoKVxuICAgIEBzZXR1cEF1dG9SZXNpemUoKVxuICAgIEBzZXR1cEdVSSgpIGlmIEBvcHRpb25zLmRldlxuXG4gICAgQHRoaWNrbmVzc1ZlY3RvcnNWaXNpYmxlID0gZmFsc2VcblxuICBzZXR1cFNjZW5lOiAtPlxuICAgIEBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpXG5cbiAgICAjIGNhbWVyYVxuXG4gICAgQGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg0NSwgd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHQsIDAuMSwgMTAwMClcbiAgICBAY2FtZXJhLnBvc2l0aW9uLnNldCAwLCAwLCA3MFxuICAgIEBzY2VuZS5hZGQgQGNhbWVyYVxuXG4gICAgIyByZW5kZXJlclxuXG4gICAgQHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIgeyBhbHBoYTogdHJ1ZSwgYW50aWFsaWFzOiB0cnVlIH1cbiAgICBAcmVuZGVyZXIuc2V0Q2xlYXJDb2xvciAweDExMTExMSwgMVxuICAgIEByZW5kZXJlci5zZXRTaXplIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHRcblxuICAgICMgbGlnaHRpbmdcblxuICAgIHNwb3RMaWdodCA9IG5ldyBUSFJFRS5TcG90TGlnaHQgMHhmZmZmZmZcbiAgICBAY2FtZXJhLmFkZCBzcG90TGlnaHRcblxuICAgIEBjYW52YXMuYXBwZW5kIEByZW5kZXJlci5kb21FbGVtZW50XG5cbiAgc2V0dXBDb250cm9sczogLT5cbiAgICBAY29udHJvbHMgPSBuZXcgVEhSRUUuVHJhY2tiYWxsQ29udHJvbHMgQGNhbWVyYSwgQHJlbmRlcmVyLmRvbUVsZW1lbnRcblxuICAgIEBjb250cm9scy5yb3RhdGVTcGVlZCA9IDUuMFxuICAgIEBjb250cm9scy56b29tU3BlZWQgICA9IDEuMlxuICAgIEBjb250cm9scy5wYW5TcGVlZCAgICA9IDAuOFxuXG4gICAgQGNvbnRyb2xzLm5vWm9vbSA9IGZhbHNlXG4gICAgQGNvbnRyb2xzLm5vUGFuICA9IGZhbHNlXG5cbiAgICBAY29udHJvbHMuc3RhdGljTW92aW5nID0gdHJ1ZVxuXG4gICAgQGNvbnRyb2xzLmR5bmFtaWNEYW1waW5nRmFjdG9yID0gMC4zXG5cbiAgICBAY29udHJvbHMua2V5cyA9IFs2NSwgODMsIDY4XVxuXG4gIHNldHVwQXV0b1Jlc2l6ZTogLT5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAncmVzaXplJywgPT5cbiAgICAgIEByZXNpemUoKVxuXG4gIHNldHVwR1VJOiAtPlxuICAgIEBndWkgPSBuZXcgZGF0LkdVSVxuXG4gICAgZ2Vub3R5cGVGb2xkZXIgID0gQGd1aS5hZGRGb2xkZXIgXCJHZW5vdHlwZVwiXG4gICAgc3RydWN0dXJlRm9sZGVyID0gQGd1aS5hZGRGb2xkZXIgXCJTdHJ1Y3R1cmUgYW5hbHl6ZXJcIlxuICAgIG1hdGVyaWFsRm9sZGVyICA9IEBndWkuYWRkRm9sZGVyIFwiTWF0ZXJpYWxcIlxuXG4gICAgZ2Vub3R5cGUgPVxuICAgICAgcGhpOiAgICAgICAgICAgICAgICAgMC41XG4gICAgICBiZXRhOiAgICAgICAgICAgICAgICAwLjVcbiAgICAgIHRyYW5zbGF0aW9uRmFjdG9yOiAgIDAuNVxuICAgICAgZ3Jvd3RoRmFjdG9yOiAgICAgICAgMS4xXG4gICAgICB3YWxsVGhpY2tuZXNzRmFjdG9yOiAxLjFcblxuICAgIHNpbXVsYXRpb25PcHRpb25zID1cbiAgICAgIG51bUNoYW1iZXJzOiA3XG5cbiAgICBzdHJ1Y3R1cmVBbmFseXplciA9XG4gICAgICBzaW11bGF0ZTogICAgICAgICAgPT4gQHNpbXVsYXRlKGdlbm90eXBlLCBzaW11bGF0aW9uT3B0aW9ucylcbiAgICAgIGV2b2x2ZTogICAgICAgICAgICA9PiBAZXZvbHZlKClcbiAgICAgIHJlZ3Jlc3M6ICAgICAgICAgICA9PiBAcmVncmVzcygpXG4gICAgICBjZW50cm9pZHNMaW5lOiAgICAgPT4gQHRvZ2dsZUNlbnRyb2lkc0xpbmUoKVxuICAgICAgdGhpY2tuZXNzVmVjdG9yczogID0+IEB0b2dnbGVUaGlja25lc3NWZWN0b3JzKClcbiAgICAgIHRvZ2dsZUNoYW1iZXJzOiAgICA9PiBAdG9nZ2xlQ2hhbWJlcnMoKVxuXG4gICAgbWF0ZXJpYWxPcHRpb25zID1cbiAgICAgIG9wYWNpdHk6IDEuMFxuXG4gICAgZ2Vub3R5cGVGb2xkZXIuYWRkKGdlbm90eXBlLCAncGhpJykuc3RlcCAwLjAxXG4gICAgZ2Vub3R5cGVGb2xkZXIuYWRkKGdlbm90eXBlLCAnYmV0YScpLnN0ZXAgMC4wMVxuICAgIGdlbm90eXBlRm9sZGVyLmFkZChnZW5vdHlwZSwgJ3RyYW5zbGF0aW9uRmFjdG9yJykuc3RlcCAwLjAxXG4gICAgZ2Vub3R5cGVGb2xkZXIuYWRkKGdlbm90eXBlLCAnZ3Jvd3RoRmFjdG9yJykuc3RlcCAwLjAxXG4gICAgZ2Vub3R5cGVGb2xkZXIuYWRkKGdlbm90eXBlLCAnd2FsbFRoaWNrbmVzc0ZhY3RvcicpLnN0ZXAgMC4wMVxuXG4gICAgZ2Vub3R5cGVGb2xkZXIuYWRkKHNpbXVsYXRpb25PcHRpb25zLCAnbnVtQ2hhbWJlcnMnKVxuXG4gICAgc3RydWN0dXJlRm9sZGVyLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ3NpbXVsYXRlJylcbiAgICBzdHJ1Y3R1cmVGb2xkZXIuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAnZXZvbHZlJylcbiAgICBzdHJ1Y3R1cmVGb2xkZXIuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAncmVncmVzcycpXG4gICAgc3RydWN0dXJlRm9sZGVyLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ2NlbnRyb2lkc0xpbmUnKVxuICAgIHN0cnVjdHVyZUZvbGRlci5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICd0aGlja25lc3NWZWN0b3JzJylcbiAgICBzdHJ1Y3R1cmVGb2xkZXIuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAndG9nZ2xlQ2hhbWJlcnMnKVxuXG4gICAgbWF0ZXJpYWxGb2xkZXIuYWRkKG1hdGVyaWFsT3B0aW9ucywgJ29wYWNpdHknKS5vbkZpbmlzaENoYW5nZSA9PlxuICAgICAgQGFwcGx5T3BhY2l0eSBtYXRlcmlhbE9wdGlvbnMub3BhY2l0eVxuXG4gIHNpbXVsYXRlOiAoZ2Vub3R5cGUsIG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcblxuICAgIEBmb3JhbSA9IG5ldyBGb3JhbSBnZW5vdHlwZVxuICAgIEBmb3JhbS5idWlsZENoYW1iZXJzIG9wdGlvbnMubnVtQ2hhbWJlcnNcblxuICAgIEBzY2VuZS5hZGQgQGZvcmFtXG5cbiAgZXZvbHZlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBAZm9yYW0uZXZvbHZlKClcbiAgICBAY2VudHJvaWRzTGluZS5yZWJ1aWxkKCkgaWYgQGNlbnRyb2lkc0xpbmVcbiAgICBAdXBkYXRlVGhpY2tuZXNzVmVjdG9ycygpXG5cbiAgcmVncmVzczogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgQGZvcmFtLnJlZ3Jlc3MoKVxuICAgIEBjZW50cm9pZHNMaW5lLnJlYnVpbGQoKSBpZiBAY2VudHJvaWRzTGluZVxuXG4gIHRvZ2dsZUNlbnRyb2lkc0xpbmU6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIHVubGVzcyBAY2VudHJvaWRzTGluZVxuICAgICAgQGNlbnRyb2lkc0xpbmUgPSBuZXcgQ2VudHJvaWRzTGluZSBAZm9yYW1cbiAgICAgIEBjZW50cm9pZHNMaW5lLnZpc2libGUgPSBmYWxzZVxuXG4gICAgICBAc2NlbmUuYWRkIEBjZW50cm9pZHNMaW5lXG5cbiAgICBAY2VudHJvaWRzTGluZS52aXNpYmxlID0gIUBjZW50cm9pZHNMaW5lLnZpc2libGVcblxuICBzaG93VGhpY2tuZXNzVmVjdG9yczogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgZm9yIGNoYW1iZXIgaW4gQGZvcmFtLmNoYW1iZXJzXG4gICAgICBjaGFtYmVyLnNob3dUaGlja25lc3NWZWN0b3IoKVxuXG4gIGhpZGVUaGlja25lc3NWZWN0b3JzOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBmb3IgY2hhbWJlciBpbiBAZm9yYW0uY2hhbWJlcnNcbiAgICAgIGNoYW1iZXIuaGlkZVRoaWNrbmVzc1ZlY3RvcigpXG5cbiAgdG9nZ2xlVGhpY2tuZXNzVmVjdG9yczogLT5cbiAgICBAdGhpY2tuZXNzVmVjdG9yc1Zpc2libGUgPSAhQHRoaWNrbmVzc1ZlY3RvcnNWaXNpYmxlXG4gICAgQHVwZGF0ZVRoaWNrbmVzc1ZlY3RvcnMoKVxuXG4gIHVwZGF0ZVRoaWNrbmVzc1ZlY3RvcnM6IC0+XG4gICAgaWYgQHRoaWNrbmVzc1ZlY3RvcnNWaXNpYmxlXG4gICAgICBAc2hvd1RoaWNrbmVzc1ZlY3RvcnMoKVxuICAgIGVsc2VcbiAgICAgIEBoaWRlVGhpY2tuZXNzVmVjdG9ycygpXG5cbiAgdG9nZ2xlQ2hhbWJlcnM6IC0+XG4gICAgQGZvcmFtLnZpc2libGUgPSAhQGZvcmFtLnZpc2libGUgaWYgQGZvcmFtXG5cbiAgYXBwbHlPcGFjaXR5OiAob3BhY2l0eSkgLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgQGZvcmFtLm1hdGVyaWFsLm9wYWNpdHkgPSBvcGFjaXR5XG5cbiAgZXhwb3J0VG9PYmo6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIGV4cG9ydGVyID0gbmV3IFRIUkVFLk9CSkV4cG9ydGVyKClcbiAgICBleHBvcnRlci5wYXJzZSBAZm9yYW1cblxuICByZXNldDogLT5cbiAgICBAc2NlbmUucmVtb3ZlIEBmb3JhbSAgICAgICAgIGlmIEBmb3JhbVxuICAgIEBzY2VuZS5yZW1vdmUgQGNlbnRyb2lkc0xpbmUgaWYgQGNlbnRyb2lkc0xpbmVcblxuICAgIEBmb3JhbSA9IG51bGxcbiAgICBAY2VudHJvaWRzTGluZSA9IG51bGxcblxuICBhbmltYXRlOiA9PlxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSBAYW5pbWF0ZVxuXG4gICAgQGNvbnRyb2xzLnVwZGF0ZSgpXG4gICAgQHJlbmRlcigpXG5cbiAgcmVuZGVyOiAtPlxuICAgIEByZW5kZXJlci5yZW5kZXIgQHNjZW5lLCBAY2FtZXJhXG5cbiAgcmVzaXplOiAtPlxuICAgIEBjYW1lcmEuYXNwZWN0ID0gd2luZG93LmlubmVyV2lkdGggLyB3aW5kb3cuaW5uZXJIZWlnaHRcbiAgICBAY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKVxuXG4gICAgQHJlbmRlcmVyLnNldFNpemUgd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodFxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
