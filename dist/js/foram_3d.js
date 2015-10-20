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

  Simulation.prototype.resize = function() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    return this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  return Simulation;

})();

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImpzL2NlbnRyb2lkc19saW5lLmNvZmZlZSIsImpzL2NoYW1iZXIuY29mZmVlIiwianMvZm9yYW0uY29mZmVlIiwianMvc2ltdWxhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxhQUFBO0VBQUE7OztBQUFNOzs7MEJBRUosVUFBQSxHQUFZOztFQUVDLHVCQUFDLEtBQUQ7SUFBQyxJQUFDLENBQUEsUUFBRDtJQUNaLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxvQkFBRCxDQUFBO0lBRW5CLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBQyxDQUFBLGdCQUFELENBQUE7SUFDWixJQUFDLENBQUEsUUFBRCxHQUFZLElBQUMsQ0FBQSxpQkFBRCxDQUFBO0lBRVosSUFBQyxDQUFBLE9BQUQsQ0FBQTtJQUVBLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBWCxDQUFnQixJQUFoQixFQUFtQixJQUFDLENBQUEsUUFBcEIsRUFBOEIsSUFBQyxDQUFBLFFBQS9CO0VBUlc7OzBCQVViLG9CQUFBLEdBQXNCLFNBQUE7QUFDcEIsUUFBQTtJQUFBLE1BQUEsR0FBYSxJQUFBLFlBQUEsQ0FBYSxJQUFDLENBQUEsVUFBRCxHQUFjLENBQTNCO1dBRVQsSUFBQSxLQUFLLENBQUMsZUFBTixDQUFzQixNQUF0QixFQUE4QixDQUE5QjtFQUhnQjs7MEJBS3RCLGdCQUFBLEdBQWtCLFNBQUE7QUFDaEIsUUFBQTtJQUFBLFFBQUEsR0FBZSxJQUFBLEtBQUssQ0FBQyxjQUFOLENBQUE7SUFDZixRQUFRLENBQUMsWUFBVCxDQUFzQixVQUF0QixFQUFrQyxJQUFDLENBQUEsZUFBbkM7V0FFQTtFQUpnQjs7MEJBTWxCLGlCQUFBLEdBQW1CLFNBQUE7V0FDYixJQUFBLEtBQUssQ0FBQyxpQkFBTixDQUF3QjtNQUFFLEtBQUEsRUFBTyxRQUFUO01BQW1CLFNBQUEsRUFBVyxFQUE5QjtLQUF4QjtFQURhOzswQkFHbkIsT0FBQSxHQUFTLFNBQUE7QUFDUCxR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TUFBQSxHQUFRLFNBQUE7SUFDTixJQUFDLENBQUEsTUFBTSxDQUFDLE1BQVIsR0FBaUIsTUFBTSxDQUFDLFVBQVAsR0FBb0IsTUFBTSxDQUFDO0lBQzVDLElBQUMsQ0FBQSxNQUFNLENBQUMsc0JBQVIsQ0FBQTtXQUVBLElBQUMsQ0FBQSxRQUFRLENBQUMsT0FBVixDQUFrQixNQUFNLENBQUMsVUFBekIsRUFBcUMsTUFBTSxDQUFDLFdBQTVDO0VBSk0iLCJmaWxlIjoiZm9yYW1fM2QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJjbGFzcyBDZW50cm9pZHNMaW5lIGV4dGVuZHMgVEhSRUUuTGluZVxuXG4gIE1BWF9QT0lOVFM6IDEwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQGZvcmFtKSAtPlxuICAgIEBwb3NpdGlvbnNCdWZmZXIgPSBAYnVpbGRQb3NpdGlvbnNCdWZmZXIoKVxuXG4gICAgQGdlb21ldHJ5ID0gQGJ1aWxkTGluZUdvbWV0cnkoKVxuICAgIEBtYXRlcmlhbCA9IEBidWlsZExpbmVNYXRlcmlhbCgpXG5cbiAgICBAcmVidWlsZCgpXG5cbiAgICBUSFJFRS5MaW5lLmNhbGwgQCwgQGdlb21ldHJ5LCBAbWF0ZXJpYWxcblxuICBidWlsZFBvc2l0aW9uc0J1ZmZlcjogLT5cbiAgICBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5IEBNQVhfUE9JTlRTICogM1xuXG4gICAgbmV3IFRIUkVFLkJ1ZmZlckF0dHJpYnV0ZSBidWZmZXIsIDNcblxuICBidWlsZExpbmVHb21ldHJ5OiAtPlxuICAgIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkJ1ZmZlckdlb21ldHJ5KClcbiAgICBnZW9tZXRyeS5hZGRBdHRyaWJ1dGUgXCJwb3NpdGlvblwiLCBAcG9zaXRpb25zQnVmZmVyXG5cbiAgICBnZW9tZXRyeVxuXG4gIGJ1aWxkTGluZU1hdGVyaWFsOiAtPlxuICAgIG5ldyBUSFJFRS5MaW5lQmFzaWNNYXRlcmlhbCB7IGNvbG9yOiAweGZmMDAwMCwgbGluZXdpZHRoOiAxMCB9XG5cbiAgcmVidWlsZDogLT5cbiAgICBhY3RpdmVDaGFtYmVycyA9IEBmaWx0ZXJBY3RpdmVDaGFtYmVycygpXG5cbiAgICBwb3NpdGlvbnMgPSBAcG9zaXRpb25zQnVmZmVyLmFycmF5XG4gICAgaW5kZXggPSAwXG5cbiAgICBmb3IgY2hhbWJlciBpbiBhY3RpdmVDaGFtYmVyc1xuICAgICAgY2VudHJvaWQgPSBjaGFtYmVyLmNlbnRlclxuXG4gICAgICBwb3NpdGlvbnNbaW5kZXgrK10gPSBjZW50cm9pZC54XG4gICAgICBwb3NpdGlvbnNbaW5kZXgrK10gPSBjZW50cm9pZC55XG4gICAgICBwb3NpdGlvbnNbaW5kZXgrK10gPSBjZW50cm9pZC56XG5cbiAgICBAZ2VvbWV0cnkuc2V0RHJhd1JhbmdlIDAsIGFjdGl2ZUNoYW1iZXJzLmxlbmd0aFxuXG4gICAgQHBvc2l0aW9uc0J1ZmZlci5uZWVkc1VwZGF0ZSA9IHRydWVcblxuICBmaWx0ZXJBY3RpdmVDaGFtYmVyczogLT5cbiAgICBjaGFtYmVyIGZvciBjaGFtYmVyIGluIEBmb3JhbS5jaGFtYmVycyB3aGVuIGNoYW1iZXIudmlzaWJsZVxuIiwiY2xhc3MgQ2hhbWJlciBleHRlbmRzIFRIUkVFLk1lc2hcblxuICBERUZBVUxUX1RFWFRVUkU6IFwiLi4vYXNzZXRzL2ltYWdlcy90ZXh0dXJlLmdpZlwiXG5cbiAgY29uc3RydWN0b3I6IChAY2VudGVyLCBAcmFkaXVzLCBtYXRlcmlhbCkgLT5cbiAgICBnZW9tZXRyeSA9IEBidWlsZENoYW1iZXJHZW9tZXRyeSgpXG5cbiAgICBUSFJFRS5NZXNoLmNhbGwgQCwgZ2VvbWV0cnksIG1hdGVyaWFsXG5cbiAgICBAdmVydGljZXMgPSBnZW9tZXRyeS52ZXJ0aWNlc1xuICAgIEBvcmlnaW4gICA9IEBjZW50ZXJcbiAgICBAYXBlcnR1cmUgPSBAY2FsY3VsYXRlQXBlcnR1cmUoKVxuXG4gIGJ1aWxkQ2hhbWJlckdlb21ldHJ5OiAtPlxuICAgIGNlbnRlclRyYW5zbGF0aW9uTWF0cml4ID0gQGJ1aWxkQ2VudGVyVHJhbnNsYXRpb25NYXRyaXgoKVxuXG4gICAgZ2VvbWV0cnkgPSBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkgQHJhZGl1cywgMzIsIDMyXG4gICAgZ2VvbWV0cnkuYXBwbHlNYXRyaXggY2VudGVyVHJhbnNsYXRpb25NYXRyaXhcbiAgICBnZW9tZXRyeVxuXG4gIGJ1aWxkQ2VudGVyVHJhbnNsYXRpb25NYXRyaXg6IC0+XG4gICAgbmV3IFRIUkVFLk1hdHJpeDQoKS5tYWtlVHJhbnNsYXRpb24gQGNlbnRlci54LCBAY2VudGVyLnksIEBjZW50ZXIuelxuXG4gIGNhbGN1bGF0ZUFwZXJ0dXJlOiAtPlxuICAgIGFwZXJ0dXJlID0gQHZlcnRpY2VzWzBdXG4gICAgY3VycmVudERpc3RhbmNlID0gYXBlcnR1cmUuZGlzdGFuY2VUbyBAY2VudGVyXG5cbiAgICBmb3IgdmVydGV4IGluIEB2ZXJ0aWNlc1sxLi4tMV1cbiAgICAgIG5ld0Rpc3RhbmNlID0gdmVydGV4LmRpc3RhbmNlVG8gQGNlbnRlclxuXG4gICAgICBpZiBuZXdEaXN0YW5jZSA8IGN1cnJlbnREaXN0YW5jZVxuICAgICAgICBhcGVydHVyZSA9IHZlcnRleFxuICAgICAgICBjdXJyZW50RGlzdGFuY2UgPSBuZXdEaXN0YW5jZVxuXG4gICAgYXBlcnR1cmVcblxuICBzZXRBcGVydHVyZTogKGFwZXJ0dXJlKSAtPlxuICAgIEBhcGVydHVyZSA9IGFwZXJ0dXJlXG5cbiAgc2V0QW5jZXN0b3I6IChhbmNlc3RvcikgLT5cbiAgICBAYW5jZXN0b3IgPSBhbmNlc3RvclxuXG4gICAgaWYgYW5jZXN0b3JcbiAgICAgIEBvcmlnaW4gPSBhbmNlc3Rvci5hcGVydHVyZSBpZiBhbmNlc3RvclxuICAgICAgYW5jZXN0b3IuY2hpbGQgPSBAXG5cbiAgY2FsY3VsYXRlR2VvbWV0cnlSaW5nOiAtPlxuICAgIHZlcnRleCBmb3IgdmVydGV4IGluIEAuZ2VvbWV0cnkudmVydGljZXMgd2hlbiB2ZXJ0ZXgueiA9PSAwXG4iLCJjbGFzcyBGb3JhbSBleHRlbmRzIFRIUkVFLk9iamVjdDNEXG5cbiAgSU5JVElBTF9SQURJVVM6IDVcblxuICBjb25zdHJ1Y3RvcjogKEBnZW5vdHlwZSkgLT5cbiAgICBUSFJFRS5PYmplY3QzRC5jYWxsIEBcblxuICAgIEBtYXRlcmlhbCA9IEBidWlsZENoYW1iZXJNYXRlcmlhbCgpXG5cbiAgICBpbml0aWFsQ2hhbWJlciA9IEBidWlsZEluaXRpYWxDaGFtYmVyKClcblxuICAgIEBjaGFtYmVycyA9IFtpbml0aWFsQ2hhbWJlcl1cbiAgICBAY3VycmVudENoYW1iZXIgPSBpbml0aWFsQ2hhbWJlclxuXG4gIGJ1aWxkQ2hhbWJlck1hdGVyaWFsOiAtPlxuICAgIG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsIHsgY29sb3I6IDB4ZmZmZmZmLCB0cmFuc3BhcmVudDogdHJ1ZSB9XG5cbiAgYnVpbGRJbml0aWFsQ2hhbWJlcjogLT5cbiAgICBAYnVpbGRDaGFtYmVyIG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDApLCBASU5JVElBTF9SQURJVVNcblxuICBidWlsZENoYW1iZXI6IChjZW50ZXIsIHJhZGl1cykgLT5cbiAgICBuZXcgQ2hhbWJlciBjZW50ZXIsIHJhZGl1cywgQG1hdGVyaWFsXG5cbiAgYnVpbGRDaGFtYmVyczogKG51bUNoYW1iZXJzKSAtPlxuICAgIEBjYWxjdWxhdGVOZXh0Q2hhbWJlcigpIGZvciBpIGluIFsxLi5udW1DaGFtYmVycy0xXVxuICAgIEBidWlsZCgpXG5cbiAgZXZvbHZlOiAtPlxuICAgIGNoaWxkID0gQGN1cnJlbnRDaGFtYmVyLmNoaWxkXG5cbiAgICBpZiBjaGlsZFxuICAgICAgQGN1cnJlbnRDaGFtYmVyID0gY2hpbGRcbiAgICAgIEBjdXJyZW50Q2hhbWJlci52aXNpYmxlID0gdHJ1ZVxuICAgIGVsc2VcbiAgICAgIEBjYWxjdWxhdGVOZXh0Q2hhbWJlcigpXG4gICAgICBAYnVpbGQoKVxuXG4gIHJlZ3Jlc3M6IC0+XG4gICAgYW5jZXN0b3IgPSBAY3VycmVudENoYW1iZXIuYW5jZXN0b3JcblxuICAgIGlmIGFuY2VzdG9yXG4gICAgICBAY3VycmVudENoYW1iZXIudmlzaWJsZSA9IGZhbHNlXG4gICAgICBAY3VycmVudENoYW1iZXIgPSBhbmNlc3RvclxuXG4gIGNhbGN1bGF0ZU5leHRDaGFtYmVyOiAtPlxuICAgIG5ld0NlbnRlciA9IEBjYWxjdWxhdGVOZXdDZW50ZXIoKVxuICAgIG5ld1JhZGl1cyA9IEBjYWxjdWxhdGVOZXdSYWRpdXMoKVxuXG4gICAgbmV3Q2hhbWJlciA9IEBidWlsZENoYW1iZXIgbmV3Q2VudGVyLCBuZXdSYWRpdXNcblxuICAgIG5ld0FwZXJ0dXJlID0gQGNhbGN1bGF0ZU5ld0FwZXJ0dXJlIG5ld0NoYW1iZXJcblxuICAgIG5ld0NoYW1iZXIuc2V0QXBlcnR1cmUgbmV3QXBlcnR1cmVcbiAgICBuZXdDaGFtYmVyLnNldEFuY2VzdG9yIEBjdXJyZW50Q2hhbWJlclxuXG4gICAgQGNoYW1iZXJzLnB1c2ggbmV3Q2hhbWJlclxuXG4gICAgQGN1cnJlbnRDaGFtYmVyID0gbmV3Q2hhbWJlclxuXG4gIGNhbGN1bGF0ZU5ld0NlbnRlcjogLT5cbiAgICBjdXJyZW50T3JpZ2luICAgPSBAY3VycmVudENoYW1iZXIub3JpZ2luXG4gICAgY3VycmVudEFwZXJ0dXJlID0gQGN1cnJlbnRDaGFtYmVyLmFwZXJ0dXJlXG5cbiAgICAjIGNhbGN1bGF0ZSBpbml0aWFsIGdyb3d0aCB2ZWN0b3IgKHJlZmVyZW5jZSBsaW5lKVxuXG4gICAgZ3Jvd3RoVmVjdG9yID0gbmV3IFRIUkVFLlZlY3RvcjNcbiAgICBncm93dGhWZWN0b3Iuc3ViVmVjdG9ycyBjdXJyZW50QXBlcnR1cmUsIGN1cnJlbnRPcmlnaW5cblxuICAgICMgZGV2aWF0ZSBncm93dGggdmVjdG9yIGZyb20gcmVmZXJlbmNlIGxpbmVcblxuICAgIGhvcml6b250YWxSb3RhdGlvbkF4aXMgPSBuZXcgVEhSRUUuVmVjdG9yMyAwLCAwLCAxXG4gICAgdmVydGljYWxSb3RhdGlvbkF4aXMgICA9IG5ldyBUSFJFRS5WZWN0b3IzIDEsIDAsIDBcblxuICAgIGdyb3d0aFZlY3Rvci5hcHBseUF4aXNBbmdsZSBob3Jpem9udGFsUm90YXRpb25BeGlzLCBAZ2Vub3R5cGUucGhpXG4gICAgZ3Jvd3RoVmVjdG9yLmFwcGx5QXhpc0FuZ2xlIHZlcnRpY2FsUm90YXRpb25BeGlzLCAgIEBnZW5vdHlwZS5iZXRhXG5cbiAgICAjIG11bHRpcGx5IGdyb3d0aCB2ZWN0b3IgYnkgdHJhbnNsYWN0aW9uIGZhY3RvclxuXG4gICAgZ3Jvd3RoVmVjdG9yLm5vcm1hbGl6ZSgpXG4gICAgZ3Jvd3RoVmVjdG9yLm11bHRpcGx5U2NhbGFyIEBnZW5vdHlwZS50cmFuc2xhdGlvbkZhY3RvclxuXG4gICAgIyBjYWxjdWxhdGUgY2VudGVyIG9mIG5ldyBjaGFtYmVyXG5cbiAgICBuZXdDZW50ZXIgPSBuZXcgVEhSRUUuVmVjdG9yM1xuICAgIG5ld0NlbnRlci5jb3B5IGN1cnJlbnRBcGVydHVyZVxuICAgIG5ld0NlbnRlci5hZGQgZ3Jvd3RoVmVjdG9yXG5cbiAgICBuZXdDZW50ZXJcblxuICBjYWxjdWxhdGVOZXdSYWRpdXM6IC0+XG4gICAgKEBjdXJyZW50Q2hhbWJlci5hbmNlc3RvciB8fCBAY3VycmVudENoYW1iZXIpLnJhZGl1cyAqIEBnZW5vdHlwZS5ncm93dGhGYWN0b3JcblxuICBjYWxjdWxhdGVOZXdBcGVydHVyZTogKG5ld0NoYW1iZXIpIC0+XG4gICAgbmV3Q2VudGVyICAgPSBuZXdDaGFtYmVyLmNlbnRlclxuICAgIG5ld0FwZXJ0dXJlID0gbmV3Q2hhbWJlci52ZXJ0aWNlc1swXVxuXG4gICAgY3VycmVudERpc3RhbmNlID0gbmV3QXBlcnR1cmUuZGlzdGFuY2VUbyBuZXdDZW50ZXJcblxuICAgIGZvciB2ZXJ0ZXggaW4gbmV3Q2hhbWJlci52ZXJ0aWNlc1sxLi4tMV1cbiAgICAgIG5ld0Rpc3RhbmNlID0gdmVydGV4LmRpc3RhbmNlVG8gbmV3Q2VudGVyXG5cbiAgICAgIGlmIG5ld0Rpc3RhbmNlIDwgY3VycmVudERpc3RhbmNlXG4gICAgICAgIGNvbnRhaW5zID0gZmFsc2VcblxuICAgICAgICBmb3IgY2hhbWJlciBpbiBAY2hhbWJlcnNcbiAgICAgICAgICBpZiBjaGFtYmVyLnJhZGl1cyA+IG5ld0FwZXJ0dXJlLmRpc3RhbmNlVG8gY2hhbWJlci5jZW50ZXJcbiAgICAgICAgICAgIGNvbnRhaW5zID0gdHJ1ZVxuICAgICAgICAgICAgYnJlYWtcblxuICAgICAgICB1bmxlc3MgY29udGFpbnNcbiAgICAgICAgICBuZXdBcGVydHVyZSA9IHZlcnRleFxuICAgICAgICAgIGN1cnJlbnREaXN0YW5jZSA9IG5ld0Rpc3RhbmNlXG5cbiAgICBuZXdBcGVydHVyZVxuXG4gIGJ1aWxkOiAtPlxuICAgIEAuYWRkIGNoYW1iZXIgZm9yIGNoYW1iZXIgaW4gQGNoYW1iZXJzXG4iLCIjICAgICAgICAgICAgICAgICAgICAgICAgICAgICBGb3IgTXIgV2hpdGUuLi4gWypdXG4jXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfX3x8fHx8fF9fXG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgfFxuIyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXl1bXl1cbiMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCBfXyB8XG4jICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxfX19ffFxuXG5jbGFzcyBTaW11bGF0aW9uXG5cbiAgY29uc3RydWN0b3I6IChAY2FudmFzLCBAb3B0aW9ucykgLT5cbiAgICBkZWZhdWx0cyA9IHsgZGV2OiBmYWxzZSB9XG5cbiAgICBAb3B0aW9ucyB8fD0ge31cblxuICAgIGZvciBvcHRpb24gb2YgZGVmYXVsdHNcbiAgICAgIEBvcHRpb25zW29wdGlvbl0gfHw9IGRlZmF1bHRzW29wdGlvbl1cblxuICAgIEBzZXR1cFNjZW5lKClcbiAgICBAc2V0dXBDb250cm9scygpXG4gICAgQHNldHVwQXV0b1Jlc2l6ZSgpXG4gICAgQHNldHVwR1VJKCkgaWYgQG9wdGlvbnMuZGV2XG5cbiAgc2V0dXBTY2VuZTogLT5cbiAgICBAc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKVxuXG4gICAgIyBjYW1lcmFcblxuICAgIEBjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoNDUsIHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0LCAwLjEsIDEwMDApXG4gICAgQGNhbWVyYS5wb3NpdGlvbi5zZXQgMCwgMCwgNzBcbiAgICBAc2NlbmUuYWRkIEBjYW1lcmFcblxuICAgICMgcmVuZGVyZXJcblxuICAgIEByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyIHsgYWxwaGE6IHRydWUsIGFudGlhbGlhczogdHJ1ZSB9XG4gICAgQHJlbmRlcmVyLnNldENsZWFyQ29sb3IgMHgxMTExMTEsIDFcbiAgICBAcmVuZGVyZXIuc2V0U2l6ZSB3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0XG5cbiAgICAjIGxpZ2h0aW5nXG5cbiAgICBzcG90TGlnaHQgPSBuZXcgVEhSRUUuU3BvdExpZ2h0IDB4ZmZmZmZmXG4gICAgQGNhbWVyYS5hZGQgc3BvdExpZ2h0XG5cbiAgICBAY2FudmFzLmFwcGVuZCBAcmVuZGVyZXIuZG9tRWxlbWVudFxuXG4gIHNldHVwQ29udHJvbHM6IC0+XG4gICAgQGNvbnRyb2xzID0gbmV3IFRIUkVFLlRyYWNrYmFsbENvbnRyb2xzIEBjYW1lcmEsIEByZW5kZXJlci5kb21FbGVtZW50XG5cbiAgICBAY29udHJvbHMucm90YXRlU3BlZWQgPSA1LjBcbiAgICBAY29udHJvbHMuem9vbVNwZWVkICAgPSAxLjJcbiAgICBAY29udHJvbHMucGFuU3BlZWQgICAgPSAwLjhcblxuICAgIEBjb250cm9scy5ub1pvb20gPSBmYWxzZVxuICAgIEBjb250cm9scy5ub1BhbiAgPSBmYWxzZVxuXG4gICAgQGNvbnRyb2xzLnN0YXRpY01vdmluZyA9IHRydWVcblxuICAgIEBjb250cm9scy5keW5hbWljRGFtcGluZ0ZhY3RvciA9IDAuM1xuXG4gICAgQGNvbnRyb2xzLmtleXMgPSBbNjUsIDgzLCA2OF1cblxuICBzZXR1cEF1dG9SZXNpemU6IC0+XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJ3Jlc2l6ZScsID0+XG4gICAgICBAcmVzaXplKClcblxuICBzZXR1cEdVSTogLT5cbiAgICBAZ3VpID0gbmV3IGRhdC5HVUlcblxuICAgIGdlbm90eXBlRm9sZGVyICA9IEBndWkuYWRkRm9sZGVyIFwiR2Vub3R5cGVcIlxuICAgIHN0cnVjdHVyZUZvbGRlciA9IEBndWkuYWRkRm9sZGVyIFwiU3RydWN0dXJlIGFuYWx5emVyXCJcbiAgICBtYXRlcmlhbEZvbGRlciAgPSBAZ3VpLmFkZEZvbGRlciBcIk1hdGVyaWFsXCJcblxuICAgIGdlbm90eXBlID1cbiAgICAgIHBoaTogICAgICAgICAgICAgICAwLjVcbiAgICAgIGJldGE6ICAgICAgICAgICAgICAwLjVcbiAgICAgIHRyYW5zbGF0aW9uRmFjdG9yOiAwLjVcbiAgICAgIGdyb3d0aEZhY3RvcjogICAgICAxLjFcblxuICAgIHNpbXVsYXRpb25PcHRpb25zID1cbiAgICAgIG51bUNoYW1iZXJzOiA3XG5cbiAgICBzdHJ1Y3R1cmVBbmFseXplciA9XG4gICAgICBzaW11bGF0ZTogICAgICAgPT4gQHNpbXVsYXRlKGdlbm90eXBlLCBzaW11bGF0aW9uT3B0aW9ucylcbiAgICAgIGV2b2x2ZTogICAgICAgICA9PiBAZXZvbHZlKClcbiAgICAgIHJlZ3Jlc3M6ICAgICAgICA9PiBAcmVncmVzcygpXG4gICAgICBjZW50cm9pZHNMaW5lOiAgPT4gQHRvZ2dsZUNlbnRyb2lkc0xpbmUoKVxuICAgICAgdG9nZ2xlQ2hhbWJlcnM6ID0+IEB0b2dnbGVDaGFtYmVycygpXG5cbiAgICBtYXRlcmlhbE9wdGlvbnMgPVxuICAgICAgb3BhY2l0eTogMS4wXG5cbiAgICBnZW5vdHlwZUZvbGRlci5hZGQoZ2Vub3R5cGUsICdwaGknKS5zdGVwIDAuMDFcbiAgICBnZW5vdHlwZUZvbGRlci5hZGQoZ2Vub3R5cGUsICdiZXRhJykuc3RlcCAwLjAxXG4gICAgZ2Vub3R5cGVGb2xkZXIuYWRkKGdlbm90eXBlLCAndHJhbnNsYXRpb25GYWN0b3InKS5zdGVwIDAuMDFcbiAgICBnZW5vdHlwZUZvbGRlci5hZGQoZ2Vub3R5cGUsICdncm93dGhGYWN0b3InKS5zdGVwIDAuMDFcblxuICAgIGdlbm90eXBlRm9sZGVyLmFkZChzaW11bGF0aW9uT3B0aW9ucywgJ251bUNoYW1iZXJzJylcblxuICAgIHN0cnVjdHVyZUZvbGRlci5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdzaW11bGF0ZScpXG4gICAgc3RydWN0dXJlRm9sZGVyLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ2V2b2x2ZScpXG4gICAgc3RydWN0dXJlRm9sZGVyLmFkZChzdHJ1Y3R1cmVBbmFseXplciwgJ3JlZ3Jlc3MnKVxuICAgIHN0cnVjdHVyZUZvbGRlci5hZGQoc3RydWN0dXJlQW5hbHl6ZXIsICdjZW50cm9pZHNMaW5lJylcbiAgICBzdHJ1Y3R1cmVGb2xkZXIuYWRkKHN0cnVjdHVyZUFuYWx5emVyLCAndG9nZ2xlQ2hhbWJlcnMnKVxuXG4gICAgbWF0ZXJpYWxGb2xkZXIuYWRkKG1hdGVyaWFsT3B0aW9ucywgJ29wYWNpdHknKS5vbkZpbmlzaENoYW5nZSA9PlxuICAgICAgQGFwcGx5T3BhY2l0eSBtYXRlcmlhbE9wdGlvbnMub3BhY2l0eVxuXG4gIHNpbXVsYXRlOiAoZ2Vub3R5cGUsIG9wdGlvbnMpIC0+XG4gICAgQHJlc2V0KClcblxuICAgIEBmb3JhbSA9IG5ldyBGb3JhbSBnZW5vdHlwZVxuICAgIEBmb3JhbS5idWlsZENoYW1iZXJzIG9wdGlvbnMubnVtQ2hhbWJlcnNcblxuICAgIEBzY2VuZS5hZGQgQGZvcmFtXG5cbiAgZXZvbHZlOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBAZm9yYW0uZXZvbHZlKClcbiAgICBAY2VudHJvaWRzTGluZS5yZWJ1aWxkKCkgaWYgQGNlbnRyb2lkc0xpbmVcblxuICByZWdyZXNzOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBAZm9yYW0ucmVncmVzcygpXG4gICAgQGNlbnRyb2lkc0xpbmUucmVidWlsZCgpIGlmIEBjZW50cm9pZHNMaW5lXG5cbiAgdG9nZ2xlQ2VudHJvaWRzTGluZTogLT5cbiAgICByZXR1cm4gdW5sZXNzIEBmb3JhbVxuXG4gICAgdW5sZXNzIEBjZW50cm9pZHNMaW5lXG4gICAgICBAY2VudHJvaWRzTGluZSA9IG5ldyBDZW50cm9pZHNMaW5lIEBmb3JhbVxuICAgICAgQGNlbnRyb2lkc0xpbmUudmlzaWJsZSA9IGZhbHNlXG5cbiAgICAgIEBzY2VuZS5hZGQgQGNlbnRyb2lkc0xpbmVcblxuICAgIEBjZW50cm9pZHNMaW5lLnZpc2libGUgPSAhQGNlbnRyb2lkc0xpbmUudmlzaWJsZVxuXG4gIHRvZ2dsZUNoYW1iZXJzOiAtPlxuICAgIEBmb3JhbS52aXNpYmxlID0gIUBmb3JhbS52aXNpYmxlIGlmIEBmb3JhbVxuXG4gIGFwcGx5T3BhY2l0eTogKG9wYWNpdHkpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZm9yYW1cblxuICAgIEBmb3JhbS5tYXRlcmlhbC5vcGFjaXR5ID0gb3BhY2l0eVxuXG4gIGV4cG9ydFRvT2JqOiAtPlxuICAgIHJldHVybiB1bmxlc3MgQGZvcmFtXG5cbiAgICBleHBvcnRlciA9IG5ldyBUSFJFRS5PQkpFeHBvcnRlcigpXG4gICAgZXhwb3J0ZXIucGFyc2UgQGZvcmFtXG5cbiAgcmVzZXQ6IC0+XG4gICAgQHNjZW5lLnJlbW92ZSBAZm9yYW0gICAgICAgICBpZiBAZm9yYW1cbiAgICBAc2NlbmUucmVtb3ZlIEBjZW50cm9pZHNMaW5lIGlmIEBjZW50cm9pZHNMaW5lXG5cbiAgICBAZm9yYW0gPSBudWxsXG4gICAgQGNlbnRyb2lkc0xpbmUgPSBudWxsXG5cbiAgYW5pbWF0ZTogPT5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgQGFuaW1hdGVcblxuICAgIEBjb250cm9scy51cGRhdGUoKVxuICAgIEByZW5kZXIoKVxuXG4gIHJlbmRlcjogLT5cbiAgICBAcmVuZGVyZXIucmVuZGVyIEBzY2VuZSwgQGNhbWVyYVxuXG4gIHJlc2l6ZTogLT5cbiAgICBAY2FtZXJhLmFzcGVjdCA9IHdpbmRvdy5pbm5lcldpZHRoIC8gd2luZG93LmlubmVySGVpZ2h0XG4gICAgQGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KClcblxuICAgIEByZW5kZXJlci5zZXRTaXplIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHRcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
