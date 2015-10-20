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

  Simulation.prototype.resize = function() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    return this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  return Simulation;

})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2NlbnRyb2lkc19saW5lLmNvZmZlZSIsImpzL2NoYW1iZXIuY29mZmVlIiwianMvZm9yYW0uY29mZmVlIiwianMvc2ltdWxhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxhQUFBO0VBQUE7OztBQUFNOzs7MEJBRUosVUFBQSxHQUFZOztFQUVDLHVCQUFDLEtBQUQ7SUFBQyxJQUFDLENBQUEsUUFBRDtJQUNaLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0lBRW5CLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLGdCQUFELENBQUE7SUFDWixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBRVosSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQUVBLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWCxDQUFnQixJQUFoQixFQUFtQixJQUFDLENBQUEsUUFBcEIsRUFBOEIsSUFBQyxDQUFBLFFBQS9CO0VBUlc7OzBCQVViLG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsUUFBQTtJQUFBLE1BQUEsR0FBYSxJQUFBLFlBQUEsQ0FBYSxJQUFDLENBQUEsVUFBRCxHQUFjLENBQTNCO1dBRVQsSUFBQSxLQUFLLENBQUMsZUFBTixDQUFzQixNQUF0QixFQUE4QixDQUE5QjtFQUhnQjs7MEJBS3RCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsUUFBQTtJQUFBLFFBQUEsR0FBZSxJQUFBLEtBQUssQ0FBQyxjQUFOLENBQUE7SUFDZixRQUFRLENBQUMsWUFBVCxDQUFzQixVQUF0QixFQUFrQyxJQUFDLENBQUEsZUFBbkM7V0FFQTtFQUpnQjs7MEJBTWxCLGlCQUFBLEdBQW1CLFNBQUE7V0FDYixJQUFBLEtBQUssQ0FBQyxpQkFBTixDQUF3QjtNQUFFLEtBQUEsRUFBTyxRQUFUO01BQW1CLFNBQUEsRUFBVyxFQUE5QjtLQUF4QjtFQURhOzswQkFHbkIsT0FBQSxHQUFTLFNBQUE7QUFDUCxR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QUFjLElBQUMsQ0FBQSxLQUFmLEVBQUE7O0lBQ0EsSUFBZ0MsSUFBQyxDQUFBLGFBQWpDO01BQUEsSUFBQyxDQUFBLEtBQUssQ0FBQyxNQUFQLENBQWMsSUFBQyxDQUFBLGFBQWYsRUFBQTs7SUFFQSxJQUFDLENBQUEsS0FBRCxHQUFTO1dBQ1QsSUFBQyxDQUFBLGFBQUQsR0FBaUI7RUFMWjs7dUJBT1AsT0FBQSxHQUFTLFNBQUE7SUFDUCxxQkFBQSxDQUFzQixJQUFDLENBQUEsT0FBdkI7SUFFQSxJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBQTtXQUNBLElBQUMsQ0FBQSxNQUFELENBQUE7RUFKTzs7dUJBTVQsTUFBQSxHQUFRLFNBQUE7V0FDTixJQUFDLENBQUEsUUFBUSxDQUFDLE1BQVYsQ0FBaUIsSUFBQyxDQUFBLEtBQWxCLEVBQXlCLElBQUMsQ0FBQSxNQUExQjtFQURNOzt1QkFHUixNQUFBLEdBQVEsU0FBQTtJQUNOLElBQUMsQ0FBQSxNQUFNLENBQUMsTUFBUixHQUFpQixNQUFNLENBQUMsVUFBUCxHQUFvQixNQUFNLENBQUM7SUFDNUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxzQkFBUixDQUFBO1dBRUEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxPQUFWLENBQWtCLE1BQU0sQ0FBQyxVQUF6QixFQUFxQyxNQUFNLENBQUMsV0FBNUM7RUFKTSIsImZpbGUiOiJmb3JhbV8zZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsYXNzIENlbnRyb2lkc0xpbmUgZXh0ZW5kcyBUSFJFRS5MaW5lXG5cbiAgTUFYX1BPSU5UUzogMTAwXG5cbiAgY29uc3RydWN0b3I6IChAZm9yYW0pIC0+XG4gICAgQHBvc2l0aW9uc0J1ZmZlciA9IEBidWlsZFBvc2l0aW9uc0J1ZmZlcigpXG5cbiAgICBAZ2VvbWV0cnkgPSBAYnVpbGRMaW5lR29tZXRyeSgpXG4gICAgQG1hdGVyaWFsID0gQGJ1aWxkTGluZU1hdGVyaWFsKClcblxuICAgIEByZWJ1aWxkKClcblxuICAgIFRIUkVFLkxpbmUuY2FsbCBALCBAZ2VvbWV0cnksIEBtYXRlcmlhbFxuXG4gIGJ1aWxkUG9zaXRpb25zQnVmZmVyOiAtPlxuICAgIGJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkgQE1BWF9QT0lOVFMgKiAzXG5cbiAgICBuZXcgVEhSRUUuQnVmZmVyQXR0cmlidXRlIGJ1ZmZlciwgM1xuXG4gIGJ1aWxkTGluZUdvbWV0cnk6IC0+XG4gICAgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuQnVmZmVyR2VvbWV0cnkoKVxuICAgIGdlb21ldHJ5LmFkZEF0dHJpYnV0ZSBcInBvc2l0aW9uXCIsIEBwb3NpdGlvbnNCdWZmZXJcblxuICAgIGdlb21ldHJ5XG5cbiAgYnVpbGRMaW5lTWF0ZXJpYWw6IC0+XG4gICAgbmV3IFRIUkVFLkxpbmVCYXNpY01hdGVyaWFsIHsgY29sb3I6IDB4ZmYwMDAwLCBsaW5ld2lkdGg6IDEwIH1cblxuICByZWJ1aWxkOiAtPlxuICAgIGFjdGl2ZUNoYW1iZXJzID0gQGZpbHRlckFjdGl2ZUNoYW1iZXJzKClcblxuICAgIHBvc2l0aW9ucyA9IEBwb3NpdGlvbnNCdWZmZXIuYXJyYXlcbiAgICBpbmRleCA9IDBcblxuICAgIGZvciBjaGFtYmVyIGluIGFjdGl2ZUNoYW1iZXJzXG4gICAgICBjZW50cm9pZCA9IGNoYW1iZXIuY2VudGVyXG5cbiAgICAgIHBvc2l0aW9uc1tpbmRleCsrXSA9IGNlbnRyb2lkLnhcbiAgICAgIHBvc2l0aW9uc1tpbmRleCsrXSA9IGNlbnRyb2lkLnlcbiAgICAgIHBvc2l0aW9uc1tpbmRleCsrXSA9IGNlbnRyb2lkLnpcblxuICAgIEBnZW9tZXRyeS5zZXREcmF3UmFuZ2UgMCwgYWN0aXZlQ2hhbWJlcnMubGVuZ3RoXG5cbiAgICBAcG9zaXRpb25zQnVmZmVyLm5lZWRzVXBkYXRlID0gdHJ1ZVxuXG4gIGZpbHRlckFjdGl2ZUNoYW1iZXJzOiAtPlxuICAgIGNoYW1iZXIgZm9yIGNoYW1iZXIgaW4gQGZvcmFtLmNoYW1iZXJzIHdoZW4gY2hhbWJlci52aXNpYmxlXG4iLCJjbGFzcyBDaGFtYmVyIGV4dGVuZHMgVEhSRUUuTWVzaFxuXG4gIERFRkFVTFRfVEVYVFVSRTogXCIuLi9hc3NldHMvaW1hZ2VzL3RleHR1cmUuZ2lmXCJcblxuICBjb25zdHJ1Y3RvcjogKEBjZW50ZXIsIEByYWRpdXMsIEB0aGlja25lc3MsIG1hdGVyaWFsKSAtPlxuICAgIGdlb21ldHJ5ID0gQGJ1aWxkQ2hhbWJlckdlb21ldHJ5KClcblxuICAgIFRIUkVFLk1lc2guY2FsbCBALCBnZW9tZXRyeSwgbWF0ZXJpYWxcblxuICAgIEB2ZXJ0aWNlcyA9IGdlb21ldHJ5LnZlcnRpY2VzXG4gICAgQG9yaWdpbiAgID0gQGNlbnRlclxuICAgIEBhcGVydHVyZSA9IEBjYWxjdWxhdGVBcGVydHVyZSgpXG5cbiAgYnVpbGRDaGFtYmVyR2VvbWV0cnk6IC0+XG4gICAgY2VudGVyVHJhbnNsYXRpb25NYXRyaXggPSBAYnVpbGRDZW50ZXJUcmFuc2xhdGlvbk1hdHJpeCgpXG5cbiAgICBnZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSBAcmFkaXVzLCAzMiwgMzJcbiAgICBnZW9tZXRyeS5hcHBseU1hdHJpeCBjZW50ZXJUcmFuc2xhdGlvbk1hdHJpeFxuICAgIGdlb21ldHJ5XG5cbiAgYnVpbGRDZW50ZXJUcmFuc2xhdGlvbk1hdHJpeDogLT5cbiAgICBuZXcgVEhSRUUuTWF0cml4NCgpLm1ha2VUcmFuc2xhdGlvbiBAY2VudGVyLngsIEBjZW50ZXIueSwgQGNlbnRlci56XG5cbiAgY2FsY3VsYXRlQXBlcnR1cmU6IC0+XG4gICAgYXBlcnR1cmUgPSBAdmVydGljZXNbMF1cbiAgICBjdXJyZW50RGlzdGFuY2UgPSBhcGVydHVyZS5kaXN0YW5jZVRvIEBjZW50ZXJcblxuICAgIGZvciB2ZXJ0ZXggaW4gQHZlcnRpY2VzWzEuLi0xXVxuICAgICAgbmV3RGlzdGFuY2UgPSB2ZXJ0ZXguZGlzdGFuY2VUbyBAY2VudGVyXG5cbiAgICAgIGlmIG5ld0Rpc3RhbmNlIDwgY3VycmVudERpc3RhbmNlXG4gICAgICAgIGFwZXJ0dXJlID0gdmVydGV4XG4gICAgICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0Rpc3RhbmNlXG5cbiAgICBhcGVydHVyZVxuXG4gIHNldEFwZXJ0dXJlOiAoYXBlcnR1cmUpIC0+XG4gICAgQGFwZXJ0dXJlID0gYXBlcnR1cmVcblxuICBzZXRBbmNlc3RvcjogKGFuY2VzdG9yKSAtPlxuICAgIEBhbmNlc3RvciA9IGFuY2VzdG9yXG5cbiAgICBpZiBhbmNlc3RvclxuICAgICAgQG9yaWdpbiA9IGFuY2VzdG9yLmFwZXJ0dXJlIGlmIGFuY2VzdG9yXG4gICAgICBhbmNlc3Rvci5jaGlsZCA9IEBcblxuICBjYWxjdWxhdGVHZW9tZXRyeVJpbmc6IC0+XG4gICAgdmVydGV4IGZvciB2ZXJ0ZXggaW4gQC5nZW9tZXRyeS52ZXJ0aWNlcyB3aGVuIHZlcnRleC56ID09IDBcbiIsImNsYXNzIEZvcmFtIGV4dGVuZHMgVEhSRUUuT2JqZWN0M0RcblxuICBJTklUSUFMX1JBRElVUzogNVxuICBJTklUSUFMX1RISUNLTkVTUzogM1xuXG4gIGNvbnN0cnVjdG9yOiAoQGdlbm90eXBlKSAtPlxuICAgIFRIUkVFLk9iamVjdDNELmNhbGwgQFxuXG4gICAgQG1hdGVyaWFsID0gQGJ1aWxkQ2hhbWJlck1hdGVyaWFsKClcblxuICAgIGluaXRpYWxDaGFtYmVyID0gQGJ1aWxkSW5pdGlhbENoYW1iZXIoKVxuXG4gICAgQGNoYW1iZXJzID0gW2luaXRpYWxDaGFtYmVyXVxuICAgIEBjdXJyZW50Q2hhbWJlciA9IGluaXRpYWxDaGFtYmVyXG5cbiAgYnVpbGRDaGFtYmVyTWF0ZXJpYWw6IC0+XG4gICAgbmV3IFRIUkVFLk1lc2hMYW1iZXJ0TWF0ZXJpYWwgeyBjb2xvcjogMHhmZmZmZmYsIHRyYW5zcGFyZW50OiB0cnVlIH1cblxuICBidWlsZEluaXRpYWxDaGFtYmVyOiAtPlxuICAgIEBidWlsZENoYW1iZXIgbmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgMCksIEBJTklUSUFMX1JBRElVUywgQElOSVRJQUxfVEhJQ0tORVNTXG5cbiAgYnVpbGRDaGFtYmVyOiAoY2VudGVyLCByYWRpdXMsIHRoaWNrbmVzcykgLT5cbiAgICBuZXcgQ2hhbWJlciBjZW50ZXIsIHJhZGl1cywgdGhpY2tuZXNzLCBAbWF0ZXJpYWxcblxuICBidWlsZENoYW1iZXJzOiAobnVtQ2hhbWJlcnMpIC0+XG4gICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKCkgZm9yIGkgaW4gWzEuLm51bUNoYW1iZXJzLTFdXG4gICAgQGJ1aWxkKClcblxuICBldm9sdmU6IC0+XG4gICAgY2hpbGQgPSBAY3VycmVudENoYW1iZXIuY2hpbGRcblxuICAgIGlmIGNoaWxkXG4gICAgICBAY3VycmVudENoYW1iZXIgPSBjaGlsZFxuICAgICAgQGN1cnJlbnRDaGFtYmVyLnZpc2libGUgPSB0cnVlXG4gICAgZWxzZVxuICAgICAgQGNhbGN1bGF0ZU5leHRDaGFtYmVyKClcbiAgICAgIEBidWlsZCgpXG5cbiAgcmVncmVzczogLT5cbiAgICBhbmNlc3RvciA9IEBjdXJyZW50Q2hhbWJlci5hbmNlc3RvclxuXG4gICAgaWYgYW5jZXN0b3JcbiAgICAgIEBjdXJyZW50Q2hhbWJlci52aXNpYmxlID0gZmFsc2VcbiAgICAgIEBjdXJyZW50Q2hhbWJlciA9IGFuY2VzdG9yXG5cbiAgY2FsY3VsYXRlTmV4dENoYW1iZXI6IC0+XG4gICAgbmV3Q2VudGVyICAgID0gQGNhbGN1bGF0ZU5ld0NlbnRlcigpXG4gICAgbmV3UmFkaXVzICAgID0gQGNhbGN1bGF0ZU5ld1JhZGl1cygpXG4gICAgbmV3VGhpY2tuZXNzID0gQGNhbGN1bGF0ZU5ld1RoaWNrbmVzcygpXG5cbiAgICBuZXdDaGFtYmVyID0gQGJ1aWxkQ2hhbWJlciBuZXdDZW50ZXIsIG5ld1JhZGl1cywgbmV3VGhpY2tuZXNzXG5cbiAgICBuZXdBcGVydHVyZSA9IEBjYWxjdWxhdGVOZXdBcGVydHVyZSBuZXdDaGFtYmVyXG5cbiAgICBuZXdDaGFtYmVyLnNldEFwZXJ0dXJlIG5ld0FwZXJ0dXJlXG4gICAgbmV3Q2hhbWJlci5zZXRBbmNlc3RvciBAY3VycmVudENoYW1iZXJcblxuICAgIEBjaGFtYmVycy5wdXNoIG5ld0NoYW1iZXJcblxuICAgIEBjdXJyZW50Q2hhbWJlciA9IG5ld0NoYW1iZXJcblxuICBjYWxjdWxhdGVOZXdDZW50ZXI6IC0+XG4gICAgY3VycmVudE9yaWdpbiAgID0gQGN1cnJlbnRDaGFtYmVyLm9yaWdpblxuICAgIGN1cnJlbnRBcGVydHVyZSA9IEBjdXJyZW50Q2hhbWJlci5hcGVydHVyZVxuXG4gICAgIyBjYWxjdWxhdGUgaW5pdGlhbCBncm93dGggdmVjdG9yIChyZWZlcmVuY2UgbGluZSlcblxuICAgIGdyb3d0aFZlY3RvciA9IG5ldyBUSFJFRS5WZWN0b3IzXG4gICAgZ3Jvd3RoVmVjdG9yLnN1YlZlY3RvcnMgY3VycmVudEFwZXJ0dXJlLCBjdXJyZW50T3JpZ2luXG5cbiAgICAjIGRldmlhdGUgZ3Jvd3RoIHZlY3RvciBmcm9tIHJlZmVyZW5jZSBsaW5lXG5cbiAgICBob3Jpem9udGFsUm90YXRpb25BeGlzID0gbmV3IFRIUkVFLlZlY3RvcjMgMCwgMCwgMVxuICAgIHZlcnRpY2FsUm90YXRpb25BeGlzICAgPSBuZXcgVEhSRUUuVmVjdG9yMyAxLCAwLCAwXG5cbiAgICBncm93dGhWZWN0b3IuYXBwbHlBeGlzQW5nbGUgaG9yaXpvbnRhbFJvdGF0aW9uQXhpcywgQGdlbm90eXBlLnBoaVxuICAgIGdyb3d0aFZlY3Rvci5hcHBseUF4aXNBbmdsZSB2ZXJ0aWNhbFJvdGF0aW9uQXhpcywgICBAZ2Vub3R5cGUuYmV0YVxuXG4gICAgIyBtdWx0aXBseSBncm93dGggdmVjdG9yIGJ5IHRyYW5zbGFjdGlvbiBmYWN0b3JcblxuICAgIGdyb3d0aFZlY3Rvci5ub3JtYWxpemUoKVxuICAgIGdyb3d0aFZlY3Rvci5tdWx0aXBseVNjYWxhciBAZ2Vub3R5cGUudHJhbnNsYXRpb25GYWN0b3JcblxuICAgICMgY2FsY3VsYXRlIGNlbnRlciBvZiBuZXcgY2hhbWJlclxuXG4gICAgbmV3Q2VudGVyID0gbmV3IFRIUkVFLlZlY3RvcjNcbiAgICBuZXdDZW50ZXIuY29weSBjdXJyZW50QXBlcnR1cmVcbiAgICBuZXdDZW50ZXIuYWRkIGdyb3d0aFZlY3RvclxuXG4gICAgbmV3Q2VudGVyXG5cbiAgY2FsY3VsYXRlTmV3UmFkaXVzOiAtPlxuICAgIEBhbmNlc3Rvck9yQ3VycmVudENoYW1iZXIoKS5yYWRpdXMgKiBAZ2Vub3R5cGUuZ3Jvd3RoRmFjdG9yXG5cbiAgY2FsY3VsYXRlTmV3VGhpY2tuZXNzOiAtPlxuICAgIEBhbmNlc3Rvck9yQ3VycmVudENoYW1iZXIoKS50aGlja25lc3MgKiBAZ2Vub3R5cGUud2FsbFRoaWNrbmVzc0ZhY3RvclxuXG4gIGFuY2VzdG9yT3JDdXJyZW50Q2hhbWJlcjogLT5cbiAgICBAY3VycmVudENoYW1iZXIuYW5jZXN0b3IgfHwgQGN1cnJlbnRDaGFtYmVyXG5cbiAgY2FsY3VsYXRlTmV3QXBlcnR1cmU6IChuZXdDaGFtYmVyKSAtPlxuICAgIG5ld0NlbnRlciAgID0gbmV3Q2hhbWJlci5jZW50ZXJcbiAgICBuZXdBcGVydHVyZSA9IG5ld0NoYW1iZXIudmVydGljZXNbMF1cblxuICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0FwZXJ0dXJlLmRpc3RhbmNlVG8gbmV3Q2VudGVyXG5cbiAgICBmb3IgdmVydGV4IGluIG5ld0NoYW1iZXIudmVydGljZXNbMS4uLTFdXG4gICAgICBuZXdEaXN0YW5jZSA9IHZlcnRleC5kaXN0YW5jZVRvIG5ld0NlbnRlclxuXG4gICAgICBpZiBuZXdEaXN0YW5jZSA8IGN1cnJlbnREaXN0YW5jZVxuICAgICAgICBjb250YWlucyA9IGZhbHNlXG5cbiAgICAgICAgZm9yIGNoYW1iZXIgaW4gQGNoYW1iZXJzXG4gICAgICAgICAgaWYgY2hhbWJlci5yYWRpdXMgPiBuZXdBcGVydHVyZS5kaXN0YW5jZVRvIGNoYW1iZXIuY2VudGVyXG4gICAgICAgICAgICBjb250YWlucyA9IHRydWVcbiAgICAgICAgICAgIGJyZWFrXG5cbiAgICAgICAgdW5sZXNzIGNvbnRhaW5zXG4gICAgICAgICAgbmV3QXBlcnR1cmUgPSB2ZXJ0ZXhcbiAgICAgICAgICBjdXJyZW50RGlzdGFuY2UgPSBuZXdEaXN0YW5jZVxuXG4gICAgbmV3QXBlcnR1cmVcblxuICBidWlsZDogLT5cbiAgICBALmFkZCBjaGFtYmVyIGZvciBjaGFtYmVyIGluIEBjaGFtYmVyc1xuIiwiIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRm9yIE1yIFdoaXRlLi4uIFsqXVxuI1xuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgX198fHx8fHxfX1xuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8ICAgIHxcbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW15dW15dXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgX18gfFxuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8X19fX3xcblxuY2xhc3MgU2ltdWxhdGlvblxuXG4gIGNvbnN0cnVjdG9yOiAoQGNhbnZhcywgQG9wdGlvbnMpIC0+XG4gICAgZGVmYXVsdHMgPSB7IGRldjogZmFsc2UgfVxuXG4gICAgQG9wdGlvbnMgfHw9IHt9XG5cbiAgICBmb3Igb3B0aW9uIG9mIGRlZmF1bHRzXG4gICAgICBAb3B0aW9uc1tvcHRpb25dIHx8PSBkZWZhdWx0c1tvcHRpb25dXG5cbiAgICBAc2V0dXBTY2VuZSgpXG4gICAgQHNldHVwQ29udHJvbHMoKVxuICAgIEBzZXR1cEF1dG9SZXNpemUoKVxuICAgIEBzZXR1cEdVSSgpIGlmIEBvcHRpb25zLmRldlxuXG4gIHNldHVwU2NlbmU6IC0+XG4gICAgQHNjZW5lID0gbmV3IFRIUkVFLlNjZW5lKClcblxuICAgICMgY2FtZXJhXG5cbiAgICBAY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKDQ1LCB3aW5kb3cuaW5uZXJXaWR0aCAvIHdpbmRvdy5pbm5lckhlaWdodCwgMC4xLCAxMDAwKVxuICAgIEBjYW1lcmEucG9zaXRpb24uc2V0IDAsIDAsIDcwXG4gICAgQHNjZW5lLmFkZCBAY2FtZXJhXG5cbiAgICAjIHJlbmRlcmVyXG5cbiAgICBAcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlciB7IGFscGhhOiB0cnVlLCBhbnRpYWxpYXM6IHRydWUgfVxuICAgIEByZW5kZXJlci5zZXRDbGVhckNvbG9yIDB4MTExMTExLCAxXG4gICAgQHJlbmRlcmVyLnNldFNpemUgd2luZG93LmlubmVyV2lkdGgsIHdpbmRvdy5pbm5lckhlaWdodFxuXG4gICAgIyBsaWdodGluZ1xuXG4gICAgc3BvdExpZ2h0ID0gbmV3IFRIUkVFLlNwb3RMaWdodCAweGZmZmZmZlxuICAgIEBjYW1lcmEuYWRkIHNwb3RMaWdodFxuXG4gICAgQGNhbnZhcy5hcHBlbmQgQHJlbmRlcmVyLmRvbUVsZW1lbnRcblxuICBzZXR1cENvbnRyb2xzOiAtPlxuICAgIEBjb250cm9scyA9IG5ldyBUSFJFRS5UcmFja2JhbGxDb250cm9scyBAY2FtZXJhLCBAcmVuZGVyZXIuZG9tRWxlbWVudFxuXG4gICAgQGNvbnRyb2xzLnJvdGF0ZVNwZWVkID0gNS4wXG4gICAgQGNvbnRyb2xzLnpvb21TcGVlZCAgID0gMS4yXG4gICAgQGNvbnRyb2xzLnBhblNwZWVkICAgID0gMC44XG5cbiAgICBAY29udHJvbHMubm9ab29tID0gZmFsc2VcbiAgICBAY29udHJvbHMubm9QYW4gID0gZmFsc2VcblxuICAgIEBjb250cm9scy5zdGF0aWNNb3ZpbmcgPSB0cnVlXG5cbiAgICBAY29udHJvbHMuZHluYW1pY0RhbXBpbmdGYWN0b3IgPSAwLjNcblxuICAgIEBjb250cm9scy5rZXlzID0gWzY1LCA4MywgNjhdXG5cbiAgc2V0dXBBdXRvUmVzaXplOiAtPlxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICdyZXNpemUnLCA9PlxuICAgICAgQHJlc2l6ZSgpXG5cbiAgc2V0dXBHVUk6IC0+XG4gICAgQGd1aSA9IG5ldyBkYXQuR1VJXG5cbiAgICBnZW5vdHlwZUZvbGRlciAgPSBAZ3VpLmFkZEZvbGRlciBcIkdlbm90eXBlXCJcbiAgICBzdHJ1Y3R1cmVGb2xkZXIgPSBAZ3VpLmFkZEZvbGRlciBcIlN0cnVjdHVyZSBhbmFseXplclwiXG4gICAgbWF0ZXJpYWxGb2xkZXIgID0gQGd1aS5hZGRGb2xkZXIgXCJNYXRlcmlhbFwiXG5cbiAgICBnZW5vdHlwZSA9XG4gICAgICBwaGk6ICAgICAgICAgICAgICAgICAwLjVcbiAgICAgIGJldGE6ICAgICAgICAgICAgICAgIDAuNVxuICAgICAgdHJhbnNsYXRpb25GYWN0b3I6ICAgMC41XG4gICAgICBncm93dGhGYWN0b3I6ICAgICAgICAxLjFcbiAgICAgIHdhbGxUaGlja25lc3NGYWN0b3I6IDEuMVxuXG4gICAgc2ltdWxhdGlvbk9wdGlvbnMgPVxuICAgICAgbnVtQ2hhbWJlcnM6IDdcblxuICAgIHN0cnVjdHVyZUFuYWx5emVyID1cbiAgICAgIHNpbXVsYXRlOiAgICAgICA9PiBAc2ltdWxhdGUoZ2Vub3R5cGUsIHNpbXVsYXRpb25PcHRpb25zKVxuICAgICAgZXZvbHZlOiAgICAgICAgID0+IEBldm9sdmUoKVxuICAgICAgcmVncmVzczogICAgICAgID0+IEByZWdyZXNzKClcbiAgICAgIGNlbnRyb2lkc0xpbmU6ICA9PiBAdG9nZ2xlQ2VudHJvaWRzTGluZSgpXG4gICAgICB0b2dnbGVDaGFtYmVyczogPT4gQHRvZ2dsZUNoYW1iZXJzKClcblxuICAgIG1hdGVyaWFsT3B0aW9ucyA9XG4gICAgICBvcGFjaXR5OiAxLjBcblxuICAgIGdlbm90eXBlRm9sZGVyLmFkZChnZW5vdHlwZSwgJ3BoaScpLnN0ZXAgMC4wMVxuICAgIGdlbm90eXBlRm9sZGVyLmFkZChnZW5vdHlwZSwgJ2JldGEnKS5zdGVwIDAuMDFcbiAgICBnZW5vdHlwZUZvbGRlci5hZGQoZ2Vub3R5cGUsICd0cmFuc2xhdGlvbkZhY3RvcicpLnN0ZXAgMC4wMVxuICAgIGdlbm90eXBlRm9sZGVyLmFkZChnZW5vdHlwZSwgJ2dyb3d0aEZhY3RvcicpLnN0ZXAgMC4wMVxuICAgIGdlbm90eXBlRm9sZGVyLmFkZChnZW5vdHlwZSwgJ3dhbGxUaGlja25lc3NGYWN0b3InKS5zdGVwIDAuMDFcblxuICAgIGdlbm90eXBlRm9sZGVyLmFkZChzaW11bGF0aW9uT3B0aW9ucywgJ251bUNoYW1iZXJzJylcblxuICAgIHN0cnVjdHVyZUZvbGRlci5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdzaW11bGF0ZScpXG4gICAgc3RydWN0dXJlRm9sZGVyLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ2V2b2x2ZScpXG4gICAgc3RydWN0dXJlRm9sZGVyLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ3JlZ3Jlc3MnKVxuICAgIHN0cnVjdHVyZUZvbGRlci5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdjZW50cm9pZHNMaW5lJylcbiAgICBzdHJ1Y3R1cmVGb2xkZXIuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAndG9nZ2xlQ2hhbWJlcnMnKVxuXG4gICAgbWF0ZXJpYWxGb2xkZXIuYWRkKG1hdGVyaWFsT3B0aW9ucywgJ29wYWNpdHknKS5vbkZpbmlzaENoYW5nZSA9PlxuICAgICAgQGFwcGx5T3BhY2l0eSBtYXRlcmlhbE9wdGlvbnMub3BhY2l0eVxuXG4gIHNpbXVsYXRlOiAoZ2Vub3R5cGUsIG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcblxuICAgIEBmb3JhbSA9IG5ldyBGb3JhbSBnZW5vdHlwZVxuICAgIEBmb3JhbS5idWlsZENoYW1iZXJzIG9wdGlvbnMubnVtQ2hhbWJlcnNcblxuICAgIEBzY2VuZS5hZGQgQGZvcmFtXG5cbiAgZXZvbHZlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBAZm9yYW0uZXZvbHZlKClcbiAgICBAY2VudHJvaWRzTGluZS5yZWJ1aWxkKCkgaWYgQGNlbnRyb2lkc0xpbmVcblxuICByZWdyZXNzOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBAZm9yYW0ucmVncmVzcygpXG4gICAgQGNlbnRyb2lkc0xpbmUucmVidWlsZCgpIGlmIEBjZW50cm9pZHNMaW5lXG5cbiAgdG9nZ2xlQ2VudHJvaWRzTGluZTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgdW5sZXNzIEBjZW50cm9pZHNMaW5lXG4gICAgICBAY2VudHJvaWRzTGluZSA9IG5ldyBDZW50cm9pZHNMaW5lIEBmb3JhbVxuICAgICAgQGNlbnRyb2lkc0xpbmUudmlzaWJsZSA9IGZhbHNlXG5cbiAgICAgIEBzY2VuZS5hZGQgQGNlbnRyb2lkc0xpbmVcblxuICAgIEBjZW50cm9pZHNMaW5lLnZpc2libGUgPSAhQGNlbnRyb2lkc0xpbmUudmlzaWJsZVxuXG4gIHRvZ2dsZUNoYW1iZXJzOiAtPlxuICAgIEBmb3JhbS52aXNpYmxlID0gIUBmb3JhbS52aXNpYmxlIGlmIEBmb3JhbVxuXG4gIGFwcGx5T3BhY2l0eTogKG9wYWNpdHkpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIEBmb3JhbS5tYXRlcmlhbC5vcGFjaXR5ID0gb3BhY2l0eVxuXG4gIGV4cG9ydFRvT2JqOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBleHBvcnRlciA9IG5ldyBUSFJFRS5PQkpFeHBvcnRlcigpXG4gICAgZXhwb3J0ZXIucGFyc2UgQGZvcmFtXG5cbiAgcmVzZXQ6IC0+XG4gICAgQHNjZW5lLnJlbW92ZSBAZm9yYW0gICAgICAgICBpZiBAZm9yYW1cbiAgICBAc2NlbmUucmVtb3ZlIEBjZW50cm9pZHNMaW5lIGlmIEBjZW50cm9pZHNMaW5lXG5cbiAgICBAZm9yYW0gPSBudWxsXG4gICAgQGNlbnRyb2lkc0xpbmUgPSBudWxsXG5cbiAgYW5pbWF0ZTogPT5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgQGFuaW1hdGVcblxuICAgIEBjb250cm9scy51cGRhdGUoKVxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAcmVuZGVyZXIucmVuZGVyIEBzY2VuZSwgQGNhbWVyYVxuXG4gIHJlc2l6ZTogLT5cbiAgICBAY2FtZXJhLmFzcGVjdCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0XG4gICAgQGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KClcblxuICAgIEByZW5kZXJlci5zZXRTaXplIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHRcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
