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

  return Chamber;

})(THREE.Mesh);

var Foram,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Foram = (function(superClass) {
  extend(Foram, superClass);

  Foram.prototype.INITIAL_RADIUS = 5;

  Foram.prototype.INITIAL_THICKNESS = 3;

  Foram.prototype.INITIAL_OPACITY = 0.5;

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
      transparent: true,
      opacity: this.INITIAL_OPACITY
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
      opacity: 0.5
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2NlbnRyb2lkc19saW5lLmNvZmZlZSIsImpzL2NoYW1iZXIuY29mZmVlIiwianMvZm9yYW0uY29mZmVlIiwianMvc2ltdWxhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxhQUFBO0VBQUE7OztBQUFNOzs7MEJBRUosVUFBQSxHQUFZOztFQUVDLHVCQUFDLEtBQUQ7SUFBQyxJQUFDLENBQUEsUUFBRDtJQUNaLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0lBRW5CLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLGdCQUFELENBQUE7SUFDWixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBRVosSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQUVBLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWCxDQUFnQixJQUFoQixFQUFtQixJQUFDLENBQUEsUUFBcEIsRUFBOEIsSUFBQyxDQUFBLFFBQS9CO0VBUlc7OzBCQVViLG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsUUFBQTtJQUFBLE1BQUEsR0FBYSxJQUFBLFlBQUEsQ0FBYSxJQUFDLENBQUEsVUFBRCxHQUFjLENBQTNCO1dBRVQsSUFBQSxLQUFLLENBQUMsZUFBTixDQUFzQixNQUF0QixFQUE4QixDQUE5QjtFQUhnQjs7MEJBS3RCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsUUFBQTtJQUFBLFFBQUEsR0FBZSxJQUFBLEtBQUssQ0FBQyxjQUFOLENBQUE7SUFDZixRQUFRLENBQUMsWUFBVCxDQUFzQixVQUF0QixFQUFrQyxJQUFDLENBQUEsZUFBbkM7V0FFQTtFQUpnQjs7MEJBTWxCLGlCQUFBLEdBQW1CLFNBQUE7V0FDYixJQUFBLEtBQUssQ0FBQyxpQkFBTixDQUF3QjtNQUFFLEtBQUEsRUFBTyxRQUFUO01BQW1CLFNBQUEsRUFBVyxFQUE5QjtLQUF4QjtFQURhOzswQkFHbkIsT0FBQSxHQUFTLFNBQUE7QUFDUCxR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USxDQUFDLE9BQVYsQ0FBa0IsTUFBTSxDQUFDLFVBQXpCLEVBQXFDLE1BQU0sQ0FBQyxXQUE1QztFQUpNIiwiZmlsZSI6ImZvcmFtXzNkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgQ2VudHJvaWRzTGluZSBleHRlbmRzIFRIUkVFLkxpbmVcblxuICBNQVhfUE9JTlRTOiAxMDBcblxuICBjb25zdHJ1Y3RvcjogKEBmb3JhbSkgLT5cbiAgICBAcG9zaXRpb25zQnVmZmVyID0gQGJ1aWxkUG9zaXRpb25zQnVmZmVyKClcblxuICAgIEBnZW9tZXRyeSA9IEBidWlsZExpbmVHb21ldHJ5KClcbiAgICBAbWF0ZXJpYWwgPSBAYnVpbGRMaW5lTWF0ZXJpYWwoKVxuXG4gICAgQHJlYnVpbGQoKVxuXG4gICAgVEhSRUUuTGluZS5jYWxsIEAsIEBnZW9tZXRyeSwgQG1hdGVyaWFsXG5cbiAgYnVpbGRQb3NpdGlvbnNCdWZmZXI6IC0+XG4gICAgYnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheSBATUFYX1BPSU5UUyAqIDNcblxuICAgIG5ldyBUSFJFRS5CdWZmZXJBdHRyaWJ1dGUgYnVmZmVyLCAzXG5cbiAgYnVpbGRMaW5lR29tZXRyeTogLT5cbiAgICBnZW9tZXRyeSA9IG5ldyBUSFJFRS5CdWZmZXJHZW9tZXRyeSgpXG4gICAgZ2VvbWV0cnkuYWRkQXR0cmlidXRlIFwicG9zaXRpb25cIiwgQHBvc2l0aW9uc0J1ZmZlclxuXG4gICAgZ2VvbWV0cnlcblxuICBidWlsZExpbmVNYXRlcmlhbDogLT5cbiAgICBuZXcgVEhSRUUuTGluZUJhc2ljTWF0ZXJpYWwgeyBjb2xvcjogMHhmZjAwMDAsIGxpbmV3aWR0aDogMTAgfVxuXG4gIHJlYnVpbGQ6IC0+XG4gICAgYWN0aXZlQ2hhbWJlcnMgPSBAZmlsdGVyQWN0aXZlQ2hhbWJlcnMoKVxuXG4gICAgcG9zaXRpb25zID0gQHBvc2l0aW9uc0J1ZmZlci5hcnJheVxuICAgIGluZGV4ID0gMFxuXG4gICAgZm9yIGNoYW1iZXIgaW4gYWN0aXZlQ2hhbWJlcnNcbiAgICAgIGNlbnRyb2lkID0gY2hhbWJlci5jZW50ZXJcblxuICAgICAgcG9zaXRpb25zW2luZGV4KytdID0gY2VudHJvaWQueFxuICAgICAgcG9zaXRpb25zW2luZGV4KytdID0gY2VudHJvaWQueVxuICAgICAgcG9zaXRpb25zW2luZGV4KytdID0gY2VudHJvaWQuelxuXG4gICAgQGdlb21ldHJ5LnNldERyYXdSYW5nZSAwLCBhY3RpdmVDaGFtYmVycy5sZW5ndGhcblxuICAgIEBwb3NpdGlvbnNCdWZmZXIubmVlZHNVcGRhdGUgPSB0cnVlXG5cbiAgZmlsdGVyQWN0aXZlQ2hhbWJlcnM6IC0+XG4gICAgY2hhbWJlciBmb3IgY2hhbWJlciBpbiBAZm9yYW0uY2hhbWJlcnMgd2hlbiBjaGFtYmVyLnZpc2libGVcbiIsImNsYXNzIENoYW1iZXIgZXh0ZW5kcyBUSFJFRS5NZXNoXG5cbiAgREVGQVVMVF9URVhUVVJFOiBcIi4uL2Fzc2V0cy9pbWFnZXMvdGV4dHVyZS5naWZcIlxuICBHUk9XVEhfVkVDVE9SX0NPTE9SOiAweGZmZmYwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQGNlbnRlciwgQHJhZGl1cywgQHRoaWNrbmVzcywgbWF0ZXJpYWwpIC0+XG4gICAgZ2VvbWV0cnkgPSBAYnVpbGRDaGFtYmVyR2VvbWV0cnkoKVxuXG4gICAgVEhSRUUuTWVzaC5jYWxsIEAsIGdlb21ldHJ5LCBtYXRlcmlhbFxuXG4gICAgQHZlcnRpY2VzID0gZ2VvbWV0cnkudmVydGljZXNcbiAgICBAb3JpZ2luICAgPSBAY2VudGVyXG4gICAgQGFwZXJ0dXJlID0gQGNhbGN1bGF0ZUFwZXJ0dXJlKClcblxuICAgIEB0aGlja25lc3NWZWN0b3IgPSBAYnVpbGRUaGlja25lc3NWZWN0b3IoKVxuICAgIEAuYWRkIEB0aGlja25lc3NWZWN0b3JcblxuICBidWlsZENoYW1iZXJHZW9tZXRyeTogLT5cbiAgICBjZW50ZXJUcmFuc2xhdGlvbk1hdHJpeCA9IEBidWlsZENlbnRlclRyYW5zbGF0aW9uTWF0cml4KClcblxuICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5IEByYWRpdXMsIDMyLCAzMlxuICAgIGdlb21ldHJ5LmFwcGx5TWF0cml4IGNlbnRlclRyYW5zbGF0aW9uTWF0cml4XG4gICAgZ2VvbWV0cnlcblxuICBidWlsZENlbnRlclRyYW5zbGF0aW9uTWF0cml4OiAtPlxuICAgIG5ldyBUSFJFRS5NYXRyaXg0KCkubWFrZVRyYW5zbGF0aW9uIEBjZW50ZXIueCwgQGNlbnRlci55LCBAY2VudGVyLnpcblxuICBjYWxjdWxhdGVBcGVydHVyZTogLT5cbiAgICBhcGVydHVyZSA9IEB2ZXJ0aWNlc1swXVxuICAgIGN1cnJlbnREaXN0YW5jZSA9IGFwZXJ0dXJlLmRpc3RhbmNlVG8gQGNlbnRlclxuXG4gICAgZm9yIHZlcnRleCBpbiBAdmVydGljZXNbMS4uLTFdXG4gICAgICBuZXdEaXN0YW5jZSA9IHZlcnRleC5kaXN0YW5jZVRvIEBjZW50ZXJcblxuICAgICAgaWYgbmV3RGlzdGFuY2UgPCBjdXJyZW50RGlzdGFuY2VcbiAgICAgICAgYXBlcnR1cmUgPSB2ZXJ0ZXhcbiAgICAgICAgY3VycmVudERpc3RhbmNlID0gbmV3RGlzdGFuY2VcblxuICAgIGFwZXJ0dXJlXG5cbiAgc2V0QXBlcnR1cmU6IChhcGVydHVyZSkgLT5cbiAgICBAYXBlcnR1cmUgPSBhcGVydHVyZVxuXG4gIHNldEFuY2VzdG9yOiAoYW5jZXN0b3IpIC0+XG4gICAgQGFuY2VzdG9yID0gYW5jZXN0b3JcblxuICAgIGlmIGFuY2VzdG9yXG4gICAgICBAb3JpZ2luID0gYW5jZXN0b3IuYXBlcnR1cmUgaWYgYW5jZXN0b3JcbiAgICAgIGFuY2VzdG9yLmNoaWxkID0gQFxuXG4gIGNhbGN1bGF0ZUdlb21ldHJ5UmluZzogLT5cbiAgICB2ZXJ0ZXggZm9yIHZlcnRleCBpbiBALmdlb21ldHJ5LnZlcnRpY2VzIHdoZW4gdmVydGV4LnogPT0gMFxuXG4gIGJ1aWxkVGhpY2tuZXNzVmVjdG9yOiAtPlxuICAgIGRpcmVjdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzIDAsIDEsIDBcblxuICAgIHRoaWNrbmVzc1ZlY3RvciA9IG5ldyBUSFJFRS5BcnJvd0hlbHBlciBkaXJlY3Rpb24sIEBvcmlnaW4sIEB0aGlja25lc3MsIEBHUk9XVEhfVkVDVE9SX0NPTE9SXG4gICAgdGhpY2tuZXNzVmVjdG9yLnZpc2libGUgPSBmYWxzZVxuXG4gICAgdGhpY2tuZXNzVmVjdG9yXG5cbiAgc2hvd1RoaWNrbmVzc1ZlY3RvcjogLT5cbiAgICBAdGhpY2tuZXNzVmVjdG9yLnZpc2libGUgPSB0cnVlXG5cbiAgaGlkZVRoaWNrbmVzc1ZlY3RvcjogLT5cbiAgICBAdGhpY2tuZXNzVmVjdG9yLnZpc2libGUgPSBmYWxzZVxuIiwiY2xhc3MgRm9yYW0gZXh0ZW5kcyBUSFJFRS5PYmplY3QzRFxuXG4gIElOSVRJQUxfUkFESVVTOiA1XG4gIElOSVRJQUxfVEhJQ0tORVNTOiAzXG4gIElOSVRJQUxfT1BBQ0lUWTogMC41XG5cbiAgY29uc3RydWN0b3I6IChAZ2Vub3R5cGUpIC0+XG4gICAgVEhSRUUuT2JqZWN0M0QuY2FsbCBAXG5cbiAgICBAbWF0ZXJpYWwgPSBAYnVpbGRDaGFtYmVyTWF0ZXJpYWwoKVxuXG4gICAgaW5pdGlhbENoYW1iZXIgPSBAYnVpbGRJbml0aWFsQ2hhbWJlcigpXG5cbiAgICBAY2hhbWJlcnMgPSBbaW5pdGlhbENoYW1iZXJdXG4gICAgQGN1cnJlbnRDaGFtYmVyID0gaW5pdGlhbENoYW1iZXJcblxuICBidWlsZENoYW1iZXJNYXRlcmlhbDogLT5cbiAgICBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCB7IGNvbG9yOiAweGZmZmZmZiwgdHJhbnNwYXJlbnQ6IHRydWUsIG9wYWNpdHk6IEBJTklUSUFMX09QQUNJVFkgfVxuXG4gIGJ1aWxkSW5pdGlhbENoYW1iZXI6IC0+XG4gICAgQGJ1aWxkQ2hhbWJlciBuZXcgVEhSRUUuVmVjdG9yMygwLCAwLCAwKSwgQElOSVRJQUxfUkFESVVTLCBASU5JVElBTF9USElDS05FU1NcblxuICBidWlsZENoYW1iZXI6IChjZW50ZXIsIHJhZGl1cywgdGhpY2tuZXNzKSAtPlxuICAgIG5ldyBDaGFtYmVyIGNlbnRlciwgcmFkaXVzLCB0aGlja25lc3MsIEBtYXRlcmlhbFxuXG4gIGJ1aWxkQ2hhbWJlcnM6IChudW1DaGFtYmVycykgLT5cbiAgICBAY2FsY3VsYXRlTmV4dENoYW1iZXIoKSBmb3IgaSBpbiBbMS4ubnVtQ2hhbWJlcnMtMV1cbiAgICBAYnVpbGQoKVxuXG4gIGV2b2x2ZTogLT5cbiAgICBjaGlsZCA9IEBjdXJyZW50Q2hhbWJlci5jaGlsZFxuXG4gICAgaWYgY2hpbGRcbiAgICAgIEBjdXJyZW50Q2hhbWJlciA9IGNoaWxkXG4gICAgICBAY3VycmVudENoYW1iZXIudmlzaWJsZSA9IHRydWVcbiAgICBlbHNlXG4gICAgICBAY2FsY3VsYXRlTmV4dENoYW1iZXIoKVxuICAgICAgQGJ1aWxkKClcblxuICByZWdyZXNzOiAtPlxuICAgIGFuY2VzdG9yID0gQGN1cnJlbnRDaGFtYmVyLmFuY2VzdG9yXG5cbiAgICBpZiBhbmNlc3RvclxuICAgICAgQGN1cnJlbnRDaGFtYmVyLnZpc2libGUgPSBmYWxzZVxuICAgICAgQGN1cnJlbnRDaGFtYmVyID0gYW5jZXN0b3JcblxuICBjYWxjdWxhdGVOZXh0Q2hhbWJlcjogLT5cbiAgICBuZXdDZW50ZXIgICAgPSBAY2FsY3VsYXRlTmV3Q2VudGVyKClcbiAgICBuZXdSYWRpdXMgICAgPSBAY2FsY3VsYXRlTmV3UmFkaXVzKClcbiAgICBuZXdUaGlja25lc3MgPSBAY2FsY3VsYXRlTmV3VGhpY2tuZXNzKClcblxuICAgIG5ld0NoYW1iZXIgPSBAYnVpbGRDaGFtYmVyIG5ld0NlbnRlciwgbmV3UmFkaXVzLCBuZXdUaGlja25lc3NcblxuICAgIG5ld0FwZXJ0dXJlID0gQGNhbGN1bGF0ZU5ld0FwZXJ0dXJlIG5ld0NoYW1iZXJcblxuICAgIG5ld0NoYW1iZXIuc2V0QXBlcnR1cmUgbmV3QXBlcnR1cmVcbiAgICBuZXdDaGFtYmVyLnNldEFuY2VzdG9yIEBjdXJyZW50Q2hhbWJlclxuXG4gICAgQGNoYW1iZXJzLnB1c2ggbmV3Q2hhbWJlclxuXG4gICAgQGN1cnJlbnRDaGFtYmVyID0gbmV3Q2hhbWJlclxuXG4gIGNhbGN1bGF0ZU5ld0NlbnRlcjogLT5cbiAgICBjdXJyZW50T3JpZ2luICAgPSBAY3VycmVudENoYW1iZXIub3JpZ2luXG4gICAgY3VycmVudEFwZXJ0dXJlID0gQGN1cnJlbnRDaGFtYmVyLmFwZXJ0dXJlXG5cbiAgICAjIGNhbGN1bGF0ZSBpbml0aWFsIGdyb3d0aCB2ZWN0b3IgKHJlZmVyZW5jZSBsaW5lKVxuXG4gICAgZ3Jvd3RoVmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjNcbiAgICBncm93dGhWZWN0b3Iuc3ViVmVjdG9ycyBjdXJyZW50QXBlcnR1cmUsIGN1cnJlbnRPcmlnaW5cblxuICAgICMgZGV2aWF0ZSBncm93dGggdmVjdG9yIGZyb20gcmVmZXJlbmNlIGxpbmVcblxuICAgIGhvcml6b250YWxSb3RhdGlvbkF4aXMgPSBuZXcgVEhSRUUuVmVjdG9yMyAwLCAwLCAxXG4gICAgdmVydGljYWxSb3RhdGlvbkF4aXMgICA9IG5ldyBUSFJFRS5WZWN0b3IzIDEsIDAsIDBcblxuICAgIGdyb3d0aFZlY3Rvci5hcHBseUF4aXNBbmdsZSBob3Jpem9udGFsUm90YXRpb25BeGlzLCBAZ2Vub3R5cGUucGhpXG4gICAgZ3Jvd3RoVmVjdG9yLmFwcGx5QXhpc0FuZ2xlIHZlcnRpY2FsUm90YXRpb25BeGlzLCAgIEBnZW5vdHlwZS5iZXRhXG5cbiAgICAjIG11bHRpcGx5IGdyb3d0aCB2ZWN0b3IgYnkgdHJhbnNsYWN0aW9uIGZhY3RvclxuXG4gICAgZ3Jvd3RoVmVjdG9yLm5vcm1hbGl6ZSgpXG4gICAgZ3Jvd3RoVmVjdG9yLm11bHRpcGx5U2NhbGFyIEBnZW5vdHlwZS50cmFuc2xhdGlvbkZhY3RvclxuXG4gICAgIyBjYWxjdWxhdGUgY2VudGVyIG9mIG5ldyBjaGFtYmVyXG5cbiAgICBuZXdDZW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yM1xuICAgIG5ld0NlbnRlci5jb3B5IGN1cnJlbnRBcGVydHVyZVxuICAgIG5ld0NlbnRlci5hZGQgZ3Jvd3RoVmVjdG9yXG5cbiAgICBuZXdDZW50ZXJcblxuICBjYWxjdWxhdGVOZXdSYWRpdXM6IC0+XG4gICAgQGFuY2VzdG9yT3JDdXJyZW50Q2hhbWJlcigpLnJhZGl1cyAqIEBnZW5vdHlwZS5ncm93dGhGYWN0b3JcblxuICBjYWxjdWxhdGVOZXdUaGlja25lc3M6IC0+XG4gICAgQGFuY2VzdG9yT3JDdXJyZW50Q2hhbWJlcigpLnRoaWNrbmVzcyAqIEBnZW5vdHlwZS53YWxsVGhpY2tuZXNzRmFjdG9yXG5cbiAgYW5jZXN0b3JPckN1cnJlbnRDaGFtYmVyOiAtPlxuICAgIEBjdXJyZW50Q2hhbWJlci5hbmNlc3RvciB8fCBAY3VycmVudENoYW1iZXJcblxuICBjYWxjdWxhdGVOZXdBcGVydHVyZTogKG5ld0NoYW1iZXIpIC0+XG4gICAgbmV3Q2VudGVyICAgPSBuZXdDaGFtYmVyLmNlbnRlclxuICAgIG5ld0FwZXJ0dXJlID0gbmV3Q2hhbWJlci52ZXJ0aWNlc1swXVxuXG4gICAgY3VycmVudERpc3RhbmNlID0gbmV3QXBlcnR1cmUuZGlzdGFuY2VUbyBuZXdDZW50ZXJcblxuICAgIGZvciB2ZXJ0ZXggaW4gbmV3Q2hhbWJlci52ZXJ0aWNlc1sxLi4tMV1cbiAgICAgIG5ld0Rpc3RhbmNlID0gdmVydGV4LmRpc3RhbmNlVG8gbmV3Q2VudGVyXG5cbiAgICAgIGlmIG5ld0Rpc3RhbmNlIDwgY3VycmVudERpc3RhbmNlXG4gICAgICAgIGNvbnRhaW5zID0gZmFsc2VcblxuICAgICAgICBmb3IgY2hhbWJlciBpbiBAY2hhbWJlcnNcbiAgICAgICAgICBpZiBjaGFtYmVyLnJhZGl1cyA+IG5ld0FwZXJ0dXJlLmRpc3RhbmNlVG8gY2hhbWJlci5jZW50ZXJcbiAgICAgICAgICAgIGNvbnRhaW5zID0gdHJ1ZVxuICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICB1bmxlc3MgY29udGFpbnNcbiAgICAgICAgICBuZXdBcGVydHVyZSA9IHZlcnRleFxuICAgICAgICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0Rpc3RhbmNlXG5cbiAgICBuZXdBcGVydHVyZVxuXG4gIGJ1aWxkOiAtPlxuICAgIEAuYWRkIGNoYW1iZXIgZm9yIGNoYW1iZXIgaW4gQGNoYW1iZXJzXG4iLCIjICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGb3IgTXIgV2hpdGUuLi4gWypdXG4jXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfX3x8fHx8fF9fXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgfFxuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXl1bXl1cbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBfXyB8XG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxfX19ffFxuXG5jbGFzcyBTaW11bGF0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAY2FudmFzLCBAb3B0aW9ucykgLT5cbiAgICBkZWZhdWx0cyA9IHsgZGV2OiBmYWxzZSB9XG5cbiAgICBAb3B0aW9ucyB8fD0ge31cblxuICAgIGZvciBvcHRpb24gb2YgZGVmYXVsdHNcbiAgICAgIEBvcHRpb25zW29wdGlvbl0gfHw9IGRlZmF1bHRzW29wdGlvbl1cblxuICAgIEBzZXR1cFNjZW5lKClcbiAgICBAc2V0dXBDb250cm9scygpXG4gICAgQHNldHVwQXV0b1Jlc2l6ZSgpXG4gICAgQHNldHVwR1VJKCkgaWYgQG9wdGlvbnMuZGV2XG5cbiAgICBAdGhpY2tuZXNzVmVjdG9yc1Zpc2libGUgPSBmYWxzZVxuXG4gIHNldHVwU2NlbmU6IC0+XG4gICAgQHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKClcblxuICAgICMgY2FtZXJhXG5cbiAgICBAY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDQ1LCB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodCwgMC4xLCAxMDAwKVxuICAgIEBjYW1lcmEucG9zaXRpb24uc2V0IDAsIDAsIDcwXG4gICAgQHNjZW5lLmFkZCBAY2FtZXJhXG5cbiAgICAjIHJlbmRlcmVyXG5cbiAgICBAcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlciB7IGFscGhhOiB0cnVlLCBhbnRpYWxpYXM6IHRydWUgfVxuICAgIEByZW5kZXJlci5zZXRDbGVhckNvbG9yIDB4MTExMTExLCAxXG4gICAgQHJlbmRlcmVyLnNldFNpemUgd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodFxuXG4gICAgIyBsaWdodGluZ1xuXG4gICAgc3BvdExpZ2h0ID0gbmV3IFRIUkVFLlNwb3RMaWdodCAweGZmZmZmZlxuICAgIEBjYW1lcmEuYWRkIHNwb3RMaWdodFxuXG4gICAgQGNhbnZhcy5hcHBlbmQgQHJlbmRlcmVyLmRvbUVsZW1lbnRcblxuICBzZXR1cENvbnRyb2xzOiAtPlxuICAgIEBjb250cm9scyA9IG5ldyBUSFJFRS5UcmFja2JhbGxDb250cm9scyBAY2FtZXJhLCBAcmVuZGVyZXIuZG9tRWxlbWVudFxuXG4gICAgQGNvbnRyb2xzLnJvdGF0ZVNwZWVkID0gNS4wXG4gICAgQGNvbnRyb2xzLnpvb21TcGVlZCAgID0gMS4yXG4gICAgQGNvbnRyb2xzLnBhblNwZWVkICAgID0gMC44XG5cbiAgICBAY29udHJvbHMubm9ab29tID0gZmFsc2VcbiAgICBAY29udHJvbHMubm9QYW4gID0gZmFsc2VcblxuICAgIEBjb250cm9scy5zdGF0aWNNb3ZpbmcgPSB0cnVlXG5cbiAgICBAY29udHJvbHMuZHluYW1pY0RhbXBpbmdGYWN0b3IgPSAwLjNcblxuICAgIEBjb250cm9scy5rZXlzID0gWzY1LCA4MywgNjhdXG5cbiAgc2V0dXBBdXRvUmVzaXplOiAtPlxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICdyZXNpemUnLCA9PlxuICAgICAgQHJlc2l6ZSgpXG5cbiAgc2V0dXBHVUk6IC0+XG4gICAgQGd1aSA9IG5ldyBkYXQuR1VJXG5cbiAgICBnZW5vdHlwZUZvbGRlciAgPSBAZ3VpLmFkZEZvbGRlciBcIkdlbm90eXBlXCJcbiAgICBzdHJ1Y3R1cmVGb2xkZXIgPSBAZ3VpLmFkZEZvbGRlciBcIlN0cnVjdHVyZSBhbmFseXplclwiXG4gICAgbWF0ZXJpYWxGb2xkZXIgID0gQGd1aS5hZGRGb2xkZXIgXCJNYXRlcmlhbFwiXG5cbiAgICBnZW5vdHlwZSA9XG4gICAgICBwaGk6ICAgICAgICAgICAgICAgICAwLjVcbiAgICAgIGJldGE6ICAgICAgICAgICAgICAgIDAuNVxuICAgICAgdHJhbnNsYXRpb25GYWN0b3I6ICAgMC41XG4gICAgICBncm93dGhGYWN0b3I6ICAgICAgICAxLjFcbiAgICAgIHdhbGxUaGlja25lc3NGYWN0b3I6IDEuMVxuXG4gICAgc2ltdWxhdGlvbk9wdGlvbnMgPVxuICAgICAgbnVtQ2hhbWJlcnM6IDdcblxuICAgIHN0cnVjdHVyZUFuYWx5emVyID1cbiAgICAgIHNpbXVsYXRlOiAgICAgICAgICA9PiBAc2ltdWxhdGUoZ2Vub3R5cGUsIHNpbXVsYXRpb25PcHRpb25zKVxuICAgICAgZXZvbHZlOiAgICAgICAgICAgID0+IEBldm9sdmUoKVxuICAgICAgcmVncmVzczogICAgICAgICAgID0+IEByZWdyZXNzKClcbiAgICAgIGNlbnRyb2lkc0xpbmU6ICAgICA9PiBAdG9nZ2xlQ2VudHJvaWRzTGluZSgpXG4gICAgICB0aGlja25lc3NWZWN0b3JzOiAgPT4gQHRvZ2dsZVRoaWNrbmVzc1ZlY3RvcnMoKVxuICAgICAgdG9nZ2xlQ2hhbWJlcnM6ICAgID0+IEB0b2dnbGVDaGFtYmVycygpXG5cbiAgICBtYXRlcmlhbE9wdGlvbnMgPVxuICAgICAgb3BhY2l0eTogMC41XG5cbiAgICBnZW5vdHlwZUZvbGRlci5hZGQoZ2Vub3R5cGUsICdwaGknKS5zdGVwIDAuMDFcbiAgICBnZW5vdHlwZUZvbGRlci5hZGQoZ2Vub3R5cGUsICdiZXRhJykuc3RlcCAwLjAxXG4gICAgZ2Vub3R5cGVGb2xkZXIuYWRkKGdlbm90eXBlLCAndHJhbnNsYXRpb25GYWN0b3InKS5zdGVwIDAuMDFcbiAgICBnZW5vdHlwZUZvbGRlci5hZGQoZ2Vub3R5cGUsICdncm93dGhGYWN0b3InKS5zdGVwIDAuMDFcbiAgICBnZW5vdHlwZUZvbGRlci5hZGQoZ2Vub3R5cGUsICd3YWxsVGhpY2tuZXNzRmFjdG9yJykuc3RlcCAwLjAxXG5cbiAgICBnZW5vdHlwZUZvbGRlci5hZGQoc2ltdWxhdGlvbk9wdGlvbnMsICdudW1DaGFtYmVycycpXG5cbiAgICBzdHJ1Y3R1cmVGb2xkZXIuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAnc2ltdWxhdGUnKVxuICAgIHN0cnVjdHVyZUZvbGRlci5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdldm9sdmUnKVxuICAgIHN0cnVjdHVyZUZvbGRlci5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdyZWdyZXNzJylcbiAgICBzdHJ1Y3R1cmVGb2xkZXIuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAnY2VudHJvaWRzTGluZScpXG4gICAgc3RydWN0dXJlRm9sZGVyLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ3RoaWNrbmVzc1ZlY3RvcnMnKVxuICAgIHN0cnVjdHVyZUZvbGRlci5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICd0b2dnbGVDaGFtYmVycycpXG5cbiAgICBtYXRlcmlhbEZvbGRlci5hZGQobWF0ZXJpYWxPcHRpb25zLCAnb3BhY2l0eScpLm9uRmluaXNoQ2hhbmdlID0+XG4gICAgICBAYXBwbHlPcGFjaXR5IG1hdGVyaWFsT3B0aW9ucy5vcGFjaXR5XG5cbiAgc2ltdWxhdGU6IChnZW5vdHlwZSwgb3B0aW9ucykgLT5cbiAgICBAcmVzZXQoKVxuXG4gICAgQGZvcmFtID0gbmV3IEZvcmFtIGdlbm90eXBlXG4gICAgQGZvcmFtLmJ1aWxkQ2hhbWJlcnMgb3B0aW9ucy5udW1DaGFtYmVyc1xuXG4gICAgQHNjZW5lLmFkZCBAZm9yYW1cblxuICBldm9sdmU6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIEBmb3JhbS5ldm9sdmUoKVxuICAgIEBjZW50cm9pZHNMaW5lLnJlYnVpbGQoKSBpZiBAY2VudHJvaWRzTGluZVxuICAgIEB1cGRhdGVUaGlja25lc3NWZWN0b3JzKClcblxuICByZWdyZXNzOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBAZm9yYW0ucmVncmVzcygpXG4gICAgQGNlbnRyb2lkc0xpbmUucmVidWlsZCgpIGlmIEBjZW50cm9pZHNMaW5lXG5cbiAgdG9nZ2xlQ2VudHJvaWRzTGluZTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgdW5sZXNzIEBjZW50cm9pZHNMaW5lXG4gICAgICBAY2VudHJvaWRzTGluZSA9IG5ldyBDZW50cm9pZHNMaW5lIEBmb3JhbVxuICAgICAgQGNlbnRyb2lkc0xpbmUudmlzaWJsZSA9IGZhbHNlXG5cbiAgICAgIEBzY2VuZS5hZGQgQGNlbnRyb2lkc0xpbmVcblxuICAgIEBjZW50cm9pZHNMaW5lLnZpc2libGUgPSAhQGNlbnRyb2lkc0xpbmUudmlzaWJsZVxuXG4gIHNob3dUaGlja25lc3NWZWN0b3JzOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBmb3IgY2hhbWJlciBpbiBAZm9yYW0uY2hhbWJlcnNcbiAgICAgIGNoYW1iZXIuc2hvd1RoaWNrbmVzc1ZlY3RvcigpXG5cbiAgaGlkZVRoaWNrbmVzc1ZlY3RvcnM6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIGZvciBjaGFtYmVyIGluIEBmb3JhbS5jaGFtYmVyc1xuICAgICAgY2hhbWJlci5oaWRlVGhpY2tuZXNzVmVjdG9yKClcblxuICB0b2dnbGVUaGlja25lc3NWZWN0b3JzOiAtPlxuICAgIEB0aGlja25lc3NWZWN0b3JzVmlzaWJsZSA9ICFAdGhpY2tuZXNzVmVjdG9yc1Zpc2libGVcbiAgICBAdXBkYXRlVGhpY2tuZXNzVmVjdG9ycygpXG5cbiAgdXBkYXRlVGhpY2tuZXNzVmVjdG9yczogLT5cbiAgICBpZiBAdGhpY2tuZXNzVmVjdG9yc1Zpc2libGVcbiAgICAgIEBzaG93VGhpY2tuZXNzVmVjdG9ycygpXG4gICAgZWxzZVxuICAgICAgQGhpZGVUaGlja25lc3NWZWN0b3JzKClcblxuICB0b2dnbGVDaGFtYmVyczogLT5cbiAgICBAZm9yYW0udmlzaWJsZSA9ICFAZm9yYW0udmlzaWJsZSBpZiBAZm9yYW1cblxuICBhcHBseU9wYWNpdHk6IChvcGFjaXR5KSAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBAZm9yYW0ubWF0ZXJpYWwub3BhY2l0eSA9IG9wYWNpdHlcblxuICBleHBvcnRUb09iajogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgZXhwb3J0ZXIgPSBuZXcgVEhSRUUuT0JKRXhwb3J0ZXIoKVxuICAgIGV4cG9ydGVyLnBhcnNlIEBmb3JhbVxuXG4gIHJlc2V0OiAtPlxuICAgIEBzY2VuZS5yZW1vdmUgQGZvcmFtICAgICAgICAgaWYgQGZvcmFtXG4gICAgQHNjZW5lLnJlbW92ZSBAY2VudHJvaWRzTGluZSBpZiBAY2VudHJvaWRzTGluZVxuXG4gICAgQGZvcmFtID0gbnVsbFxuICAgIEBjZW50cm9pZHNMaW5lID0gbnVsbFxuXG4gIGFuaW1hdGU6ID0+XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIEBhbmltYXRlXG5cbiAgICBAY29udHJvbHMudXBkYXRlKClcbiAgICBAcmVuZGVyKClcblxuICByZW5kZXI6IC0+XG4gICAgQHJlbmRlcmVyLnJlbmRlciBAc2NlbmUsIEBjYW1lcmFcblxuICByZXNpemU6IC0+XG4gICAgQGNhbWVyYS5hc3BlY3QgPSB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodFxuICAgIEBjYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpXG5cbiAgICBAcmVuZGVyZXIuc2V0U2l6ZSB3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
