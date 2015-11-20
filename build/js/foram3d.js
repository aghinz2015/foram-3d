/// <reference path="../../typings/threejs/three.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Foram3D;
(function (Foram3D) {
    var Chamber = (function (_super) {
        __extends(Chamber, _super);
        function Chamber(center, radius, thickness) {
            this.center = center;
            this.origin = center;
            this.radius = radius;
            this.thickness = thickness;
            var geometry = this.buildGeometry();
            var material = this.buildMaterial();
            _super.call(this, geometry, material);
            this.aperture = this.calculateAperture();
        }
        Chamber.prototype.setAncestor = function (newAncestor) {
            this.ancestor = newAncestor;
            this.origin = newAncestor.aperture;
            newAncestor.child = this;
        };
        Chamber.prototype.showThicknessVector = function () {
            if (!this.thicknessVector) {
                this.thicknessVector = this.buildThicknessVector();
                this.add(this.thicknessVector);
            }
            this.thicknessVector.visible = true;
        };
        Chamber.prototype.hideThicknessVector = function () {
            if (this.thicknessVector) {
                this.thicknessVector.visible = false;
            }
        };
        Chamber.prototype.buildGeometry = function () {
            var geometry = new THREE.SphereGeometry(this.radius, Chamber.WIDTH_SEGMENTS, Chamber.HEIGHT_SEGMENTS);
            geometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.center.x, this.center.y, this.center.z));
            return geometry;
        };
        Chamber.prototype.buildMaterial = function () {
            return new THREE.MeshLambertMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.5
            });
        };
        Chamber.prototype.buildThicknessVector = function () {
            var direction = new THREE.Vector3(0, 1, 0);
            return new THREE.ArrowHelper(direction, this.origin, this.thickness, 0xffff00);
        };
        Chamber.prototype.calculateAperture = function () {
            var vertices, aperture, currentDistance, newDistance;
            vertices = this.geometry.vertices;
            aperture = vertices[0];
            currentDistance = aperture.distanceTo(this.center);
            for (var i = 1; i < vertices.length; i++) {
                newDistance = vertices[i].distanceTo(this.center);
                if (newDistance < currentDistance) {
                    aperture = vertices[i];
                    currentDistance = newDistance;
                }
            }
            return aperture;
        };
        Chamber.WIDTH_SEGMENTS = 32;
        Chamber.HEIGHT_SEGMENTS = 32;
        return Chamber;
    })(THREE.Mesh);
    Foram3D.Chamber = Chamber;
})(Foram3D || (Foram3D = {}));
/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="./chamber.ts" />
/// <reference path="./genotype_params.ts"/>
var Foram3D;
(function (Foram3D) {
    var Foram = (function (_super) {
        __extends(Foram, _super);
        function Foram(genotype, numChambers) {
            _super.call(this);
            this.genotype = genotype;
            this.material = this.buildMaterial();
            this.chambers = [this.buildInitialChamber()];
            this.currentChamber = this.chambers[0];
            for (var i = 1; i < numChambers; i++) {
                this.evolve();
            }
        }
        Foram.prototype.evolve = function () {
            var child = this.currentChamber.child;
            if (child) {
                this.currentChamber = child;
                this.currentChamber.visible = true;
            }
            else {
                var newChamber = this.calculateNextChamber();
                this.chambers.push(newChamber);
                this.currentChamber = newChamber;
                this.add(newChamber);
            }
        };
        Foram.prototype.regress = function () {
            var ancestor = this.currentChamber.ancestor;
            if (ancestor) {
                this.currentChamber.visible = false;
                this.currentChamber = ancestor;
            }
        };
        Foram.prototype.calculateNextChamber = function () {
            var newCenter, newRadius, newThickness, newChamber, newAperture;
            newCenter = this.calculateNewCenter();
            newRadius = this.calculateNewRadius();
            newThickness = this.calculateNewThickness();
            newChamber = this.buildChamber(newCenter, newRadius, newThickness);
            newAperture = this.calculateNewAperture(newChamber);
            newChamber.aperture = newAperture;
            newChamber.setAncestor(this.currentChamber);
            return newChamber;
        };
        Foram.prototype.calculateNewCenter = function () {
            var currentOrigin, currentAperture, growthVector, horizontalRotationAxis, verticalRotationAxis, newCenter;
            currentOrigin = this.currentChamber.origin;
            currentAperture = this.currentChamber.aperture;
            growthVector = new THREE.Vector3();
            growthVector.subVectors(currentAperture, currentOrigin);
            horizontalRotationAxis = new THREE.Vector3(0, 0, 1);
            verticalRotationAxis = new THREE.Vector3(1, 0, 0);
            growthVector.applyAxisAngle(horizontalRotationAxis, this.genotype.phi);
            growthVector.applyAxisAngle(verticalRotationAxis, this.genotype.beta);
            growthVector.normalize();
            growthVector.multiplyScalar(this.genotype.translationFactor);
            newCenter = new THREE.Vector3();
            newCenter.copy(currentAperture);
            newCenter.add(growthVector);
            return newCenter;
        };
        Foram.prototype.calculateNewRadius = function () {
            return this.ancestorOrCurrentChamber().radius * this.genotype.growthFactor;
        };
        Foram.prototype.calculateNewThickness = function () {
            return this.ancestorOrCurrentChamber().thickness * this.genotype.wallThicknessFactor;
        };
        Foram.prototype.ancestorOrCurrentChamber = function () {
            return this.currentChamber.ancestor || this.currentChamber;
        };
        Foram.prototype.calculateNewAperture = function (newChamber) {
            var newCenter, newChamberVertices, newAperture, currentDistance, newDistance, chamber, contains, i, j;
            newChamberVertices = newChamber.geometry.vertices;
            newAperture = newChamberVertices[0];
            currentDistance = newAperture.distanceTo(newChamber.center);
            for (i = 1; i < newChamberVertices.length; i++) {
                newDistance = newChamberVertices[i].distanceTo(newChamber.center);
                if (newDistance < currentDistance) {
                    contains = false;
                    for (var _i = 0, _a = this.chambers; _i < _a.length; _i++) {
                        chamber = _a[_i];
                        if (chamber.radius > newAperture.distanceTo(chamber.center)) {
                            contains = true;
                            break;
                        }
                    }
                    if (!contains) {
                        newAperture = newChamberVertices[i];
                        currentDistance = newDistance;
                    }
                }
            }
            return newAperture;
        };
        Foram.prototype.buildInitialChamber = function () {
            var initialChamber = this.buildChamber(new THREE.Vector3(0, 0, 0), Foram.INITIAL_RADIUS, Foram.INITIAL_THICKNESS);
            this.add(initialChamber);
            return initialChamber;
        };
        Foram.prototype.buildChamber = function (center, radius, thickness) {
            var chamber = new Foram3D.Chamber(center, radius, thickness);
            chamber.material = this.material;
            return chamber;
        };
        Foram.prototype.buildMaterial = function () {
            return new THREE.MeshLambertMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: Foram.INITIAL_OPACITY
            });
        };
        Foram.INITIAL_RADIUS = 5;
        Foram.INITIAL_THICKNESS = 1;
        Foram.INITIAL_OPACITY = 0.5;
        return Foram;
    })(THREE.Object3D);
    Foram3D.Foram = Foram;
})(Foram3D || (Foram3D = {}));
/// <reference path="./foram.ts" />
var Foram3D;
(function (Foram3D) {
    var ChamberPath = (function (_super) {
        __extends(ChamberPath, _super);
        function ChamberPath(foram, params) {
            this.foram = foram;
            this.positionsBuffer = this.buildPositionsBuffer();
            this.color = params && params.color || ChamberPath.DEFAULT_COLOR;
            this.width = params && params.width || ChamberPath.DEFAULT_WIDTH;
            var geometry = this.buildGeometry();
            var material = this.buildMaterial();
            _super.call(this, geometry, material);
            this.rebuild();
        }
        ChamberPath.prototype.buildPath = function (points) {
            var positions, index, point;
            positions = this.positionsBuffer.array;
            index = 0;
            for (var _i = 0; _i < points.length; _i++) {
                point = points[_i];
                positions[index++] = point.x;
                positions[index++] = point.y;
                positions[index++] = point.z;
            }
            this.geometry.setDrawRange(0, points.length);
            this.positionsBuffer.needsUpdate = true;
        };
        ChamberPath.prototype.fetchChambersAttribute = function (attributeName) {
            var activeChambers, chamber, attributes = [];
            activeChambers = this.filterActiveChambers();
            for (var _i = 0; _i < activeChambers.length; _i++) {
                chamber = activeChambers[_i];
                attributes.push(chamber[attributeName]);
            }
            return attributes;
        };
        ChamberPath.prototype.filterActiveChambers = function () {
            var chambers, chamber, activeChambers;
            chambers = this.foram.chambers;
            activeChambers = [];
            for (var _i = 0; _i < chambers.length; _i++) {
                chamber = chambers[_i];
                if (chamber.visible)
                    activeChambers.push(chamber);
            }
            return activeChambers;
        };
        ChamberPath.prototype.buildPositionsBuffer = function () {
            return new THREE.BufferAttribute(new Float32Array(ChamberPath.MAX_POINTS * 3), 3);
        };
        ChamberPath.prototype.buildGeometry = function () {
            var geometry = new THREE.BufferGeometry();
            geometry.addAttribute('position', this.positionsBuffer);
            return geometry;
        };
        ChamberPath.prototype.buildMaterial = function () {
            return new THREE.LineBasicMaterial({
                color: this.color,
                linewidth: this.width
            });
        };
        ChamberPath.MAX_POINTS = 100;
        ChamberPath.DEFAULT_COLOR = 0xff0000;
        ChamberPath.DEFAULT_WIDTH = 10;
        return ChamberPath;
    })(THREE.Line);
    Foram3D.ChamberPath = ChamberPath;
})(Foram3D || (Foram3D = {}));
/// <reference path="./chamber_path.ts" />
var Foram3D;
(function (Foram3D) {
    var AperturesPath = (function (_super) {
        __extends(AperturesPath, _super);
        function AperturesPath() {
            _super.apply(this, arguments);
        }
        AperturesPath.prototype.rebuild = function () {
            var apertures = this.fetchChambersAttribute("aperture");
            this.buildPath(apertures);
        };
        return AperturesPath;
    })(Foram3D.ChamberPath);
    Foram3D.AperturesPath = AperturesPath;
})(Foram3D || (Foram3D = {}));
/// <reference path="./chamber_path.ts" />
var Foram3D;
(function (Foram3D) {
    var CentroidsPath = (function (_super) {
        __extends(CentroidsPath, _super);
        function CentroidsPath() {
            _super.apply(this, arguments);
        }
        CentroidsPath.prototype.rebuild = function () {
            var centroids = this.fetchChambersAttribute("center");
            this.buildPath(centroids);
        };
        return CentroidsPath;
    })(Foram3D.ChamberPath);
    Foram3D.CentroidsPath = CentroidsPath;
})(Foram3D || (Foram3D = {}));
var Foram3D;
(function (Foram3D) {
    var Configuration = (function () {
        function Configuration(params) {
            this.dev = params.dev || false;
        }
        return Configuration;
    })();
    Foram3D.Configuration = Configuration;
})(Foram3D || (Foram3D = {}));
/// <reference path="../foram.ts" />
var Foram3D;
(function (Foram3D) {
    var Calculator = (function () {
        function Calculator(foram) {
            this.foram = foram;
        }
        return Calculator;
    })();
    Foram3D.Calculator = Calculator;
})(Foram3D || (Foram3D = {}));
var Foram3D;
(function (Foram3D) {
    var Helpers;
    (function (Helpers) {
        var Face = (function () {
            function Face(va, vb, vc) {
                this.va = va;
                this.vb = vb;
                this.vc = vc;
                this.centroid = this.calculateCentroid();
            }
            Face.prototype.calculateCentroid = function () {
                return this.va.clone().add(this.vb).add(this.vc).divideScalar(3);
            };
            return Face;
        })();
        Helpers.Face = Face;
    })(Helpers = Foram3D.Helpers || (Foram3D.Helpers = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="../foram.ts" />
/// <reference path="../helpers/face.ts" />
var Foram3D;
(function (Foram3D) {
    var Calculators;
    (function (Calculators) {
        var FacesProcessor = (function () {
            function FacesProcessor(foram) {
                this.foram = foram;
            }
            FacesProcessor.prototype.sumFaces = function (magnitude) {
                var chambers, chamber, otherChamber, faces, face, vertexFace, isOuterFace, vertices, va, vb, vc, result;
                chambers = this.foram.chambers;
                result = 0;
                for (var _i = 0; _i < chambers.length; _i++) {
                    chamber = chambers[_i];
                    faces = chamber.geometry.faces;
                    vertices = chamber.geometry.vertices;
                    for (var _a = 0; _a < faces.length; _a++) {
                        face = faces[_a];
                        va = vertices[face.a];
                        vb = vertices[face.b];
                        vc = vertices[face.c];
                        vertexFace = new Foram3D.Helpers.Face(va, vb, vc);
                        isOuterFace = true;
                        for (var _b = 0; _b < chambers.length; _b++) {
                            otherChamber = chambers[_b];
                            if (otherChamber == chamber)
                                continue;
                            if (vertexFace.centroid.distanceTo(otherChamber.center) < otherChamber.radius) {
                                isOuterFace = false;
                                break;
                            }
                        }
                        if (isOuterFace) {
                            result += magnitude(vertexFace);
                        }
                    }
                }
                return result;
            };
            return FacesProcessor;
        })();
        Calculators.FacesProcessor = FacesProcessor;
    })(Calculators = Foram3D.Calculators || (Foram3D.Calculators = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="./calculator.ts" />
/// <reference path="./faces_processor.ts" />
var Foram3D;
(function (Foram3D) {
    var Calculators;
    (function (Calculators) {
        var SurfaceCalculator = (function (_super) {
            __extends(SurfaceCalculator, _super);
            function SurfaceCalculator() {
                _super.apply(this, arguments);
            }
            SurfaceCalculator.prototype.calculate = function () {
                var facesProcessor = new Calculators.FacesProcessor(this.foram);
                return facesProcessor.sumFaces(this.calculateFaceSurfaceArea);
            };
            SurfaceCalculator.prototype.calculateFaceSurfaceArea = function (face) {
                var ab, ac, cross;
                ab = face.vb.clone().sub(face.va);
                ac = face.vc.clone().sub(face.va);
                cross = new THREE.Vector3();
                cross.crossVectors(ab, ac);
                return cross.length() / 2;
            };
            return SurfaceCalculator;
        })(Foram3D.Calculator);
        Calculators.SurfaceCalculator = SurfaceCalculator;
    })(Calculators = Foram3D.Calculators || (Foram3D.Calculators = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="./foram.ts"/>
/// <reference path="./genotype_params.ts"/>
/// <reference path="./centroids_path.ts"/>
/// <reference path="./calculators/surface_calculator.ts"/>
var Foram3D;
(function (Foram3D) {
    var Simulation = (function () {
        function Simulation(canvas, configParams) {
            this.canvas = canvas;
            this.configuration = new Foram3D.Configuration(configParams);
            this.thicknessVectorsVisible = false;
            this.setupScene();
            this.setupControls();
            this.setupAutoResize();
            if (this.configuration.dev) {
                this.setupGUI();
            }
            this.animate();
        }
        Simulation.prototype.simulate = function (genotype, numChambers) {
            this.reset();
            this.foram = new Foram3D.Foram(genotype, numChambers);
            this.scene.add(this.foram);
        };
        Simulation.prototype.evolve = function () {
            if (!this.foram)
                return;
            this.foram.evolve();
            if (this.centroidsPath) {
                this.centroidsPath.rebuild();
            }
            if (this.aperturesPath) {
                this.aperturesPath.rebuild();
            }
            this.updateThicknessVectors();
        };
        Simulation.prototype.regress = function () {
            if (!this.foram)
                return;
            this.foram.regress();
            if (this.centroidsPath) {
                this.centroidsPath.rebuild();
            }
            if (this.aperturesPath) {
                this.aperturesPath.rebuild();
            }
        };
        Simulation.prototype.calculateSurfaceArea = function () {
            if (!this.foram)
                return;
            var surfaceCalculator = new Foram3D.Calculators.SurfaceCalculator(this.foram);
            return surfaceCalculator.calculate();
        };
        Simulation.prototype.toggleCentroidsPath = function () {
            if (!this.foram)
                return;
            if (!this.centroidsPath) {
                this.centroidsPath = new Foram3D.CentroidsPath(this.foram, { color: 0xff0000 });
                this.centroidsPath.visible = false;
                this.scene.add(this.centroidsPath);
            }
            this.centroidsPath.visible = !this.centroidsPath.visible;
        };
        Simulation.prototype.toggleAperturesPath = function () {
            if (!this.foram)
                return;
            if (!this.aperturesPath) {
                this.aperturesPath = new Foram3D.AperturesPath(this.foram, { color: 0x00ff00 });
                this.aperturesPath.visible = false;
                this.scene.add(this.aperturesPath);
            }
            this.aperturesPath.visible = !this.aperturesPath.visible;
        };
        Simulation.prototype.showThicknessVectors = function () {
            if (!this.foram)
                return;
            var chambers = this.foram.chambers;
            for (var i = 0; i < chambers.length; i++) {
                chambers[i].showThicknessVector();
            }
        };
        Simulation.prototype.hideThicknessVectors = function () {
            if (!this.foram)
                return;
            var chambers = this.foram.chambers;
            for (var i = 0; i < chambers.length; i++) {
                chambers[i].hideThicknessVector();
            }
        };
        Simulation.prototype.toggleThicknessVectors = function () {
            this.thicknessVectorsVisible = !this.thicknessVectorsVisible;
            this.updateThicknessVectors();
        };
        Simulation.prototype.toggleChambers = function () {
            this.foram.visible = !this.foram.visible;
        };
        Simulation.prototype.applyOpacity = function (opacity) {
            if (!this.foram)
                return;
            this.foram.material.opacity = opacity;
        };
        Simulation.prototype.exportToOBJ = function () {
            if (!this.foram)
                return;
            return new THREE.OBJExporter().parse(this.foram);
        };
        Simulation.prototype.updateThicknessVectors = function () {
            if (this.thicknessVectorsVisible) {
                this.showThicknessVectors();
            }
            else {
                this.hideThicknessVectors();
            }
        };
        Simulation.prototype.reset = function () {
            if (this.foram)
                this.scene.remove(this.foram);
            if (this.centroidsPath)
                this.scene.remove(this.centroidsPath);
            if (this.aperturesPath)
                this.scene.remove(this.aperturesPath);
            this.thicknessVectorsVisible = false;
            this.foram = null;
            this.centroidsPath = null;
            this.aperturesPath = null;
        };
        Simulation.prototype.setupScene = function () {
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.camera.position.set(0, 0, 70);
            this.scene.add(this.camera);
            this.lighting = new THREE.SpotLight(0xffffff);
            this.camera.add(this.lighting);
            this.renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            this.renderer.setClearColor(0x111111, 1);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.canvas.appendChild(this.renderer.domElement);
        };
        Simulation.prototype.setupControls = function () {
            this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
            this.controls.rotateSpeed = 5.0;
            this.controls.zoomSpeed = 1.2;
            this.controls.panSpeed = 0.8;
            this.controls.noZoom = false;
            this.controls.noPan = false;
            this.controls.staticMoving = true;
            this.controls.dynamicDampingFactor = 0.3;
            this.controls.keys = [
                65,
                83,
                68
            ];
        };
        Simulation.prototype.setupAutoResize = function () {
            var _this = this;
            window.addEventListener('resize', function () { return _this.resize(); });
        };
        Simulation.prototype.setupGUI = function () {
            var _this = this;
            this.gui = new dat.GUI();
            var genotypeFolder = this.gui.addFolder("Genotype");
            var structureFolder = this.gui.addFolder("Structure analyzer");
            var materialFolder = this.gui.addFolder("Material");
            var genotype = {
                phi: 0.5,
                beta: 0.5,
                translationFactor: 0.5,
                growthFactor: 1.1,
                wallThicknessFactor: 1.1
            };
            var structureAnalyzer = {
                numChambers: 7,
                simulate: function () { return _this.simulate(genotype, structureAnalyzer.numChambers); },
                evolve: function () { return _this.evolve(); },
                regress: function () { return _this.regress(); },
                centroidsPath: function () { return _this.toggleCentroidsPath(); },
                aperturesPath: function () { return _this.toggleAperturesPath(); },
                thicknessVectors: function () { return _this.toggleThicknessVectors(); },
                toggleChambers: function () { return _this.toggleChambers(); }
            };
            var materialOptions = {
                opacity: 0.5
            };
            genotypeFolder.add(genotype, 'phi').step(0.01);
            genotypeFolder.add(genotype, 'beta').step(0.01);
            genotypeFolder.add(genotype, 'translationFactor').step(0.01);
            genotypeFolder.add(genotype, 'growthFactor').step(0.01);
            genotypeFolder.add(genotype, 'wallThicknessFactor').step(0.01);
            structureFolder.add(structureAnalyzer, 'numChambers');
            structureFolder.add(structureAnalyzer, 'simulate');
            structureFolder.add(structureAnalyzer, 'evolve');
            structureFolder.add(structureAnalyzer, 'regress');
            structureFolder.add(structureAnalyzer, 'centroidsPath');
            structureFolder.add(structureAnalyzer, 'aperturesPath');
            structureFolder.add(structureAnalyzer, 'thicknessVectors');
            structureFolder.add(structureAnalyzer, 'toggleChambers');
            materialFolder.add(materialOptions, 'opacity').onFinishChange(function () { return _this.applyOpacity(materialOptions.opacity); });
        };
        Simulation.prototype.resize = function () {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        Simulation.prototype.animate = function () {
            var _this = this;
            requestAnimationFrame(function () { return _this.animate(); });
            this.controls.update();
            this.render();
        };
        Simulation.prototype.render = function () {
            this.renderer.render(this.scene, this.camera);
        };
        return Simulation;
    })();
    Foram3D.Simulation = Simulation;
})(Foram3D || (Foram3D = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYW1iZXIudHMiLCJmb3JhbS50cyIsImNoYW1iZXJfcGF0aC50cyIsImFwZXJ0dXJlc19wYXRoLnRzIiwiY2VudHJvaWRzX3BhdGgudHMiLCJjb25maWd1cmF0aW9uLnRzIiwiY2FsY3VsYXRvcnMvY2FsY3VsYXRvci50cyIsImhlbHBlcnMvZmFjZS50cyIsImNhbGN1bGF0b3JzL2ZhY2VzX3Byb2Nlc3Nvci50cyIsImNhbGN1bGF0b3JzL3N1cmZhY2VfY2FsY3VsYXRvci50cyIsInNpbXVsYXRpb24udHMiXSwibmFtZXMiOlsiRm9yYW0zRCIsIkZvcmFtM0QuQ2hhbWJlciIsIkZvcmFtM0QuQ2hhbWJlci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2hhbWJlci5zZXRBbmNlc3RvciIsIkZvcmFtM0QuQ2hhbWJlci5zaG93VGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLmhpZGVUaGlja25lc3NWZWN0b3IiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuQ2hhbWJlci5idWlsZE1hdGVyaWFsIiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkVGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLmNhbGN1bGF0ZUFwZXJ0dXJlIiwiRm9yYW0zRC5Gb3JhbSIsIkZvcmFtM0QuRm9yYW0uY29uc3RydWN0b3IiLCJGb3JhbTNELkZvcmFtLmV2b2x2ZSIsIkZvcmFtM0QuRm9yYW0ucmVncmVzcyIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV4dENoYW1iZXIiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld0NlbnRlciIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3UmFkaXVzIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdUaGlja25lc3MiLCJGb3JhbTNELkZvcmFtLmFuY2VzdG9yT3JDdXJyZW50Q2hhbWJlciIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3QXBlcnR1cmUiLCJGb3JhbTNELkZvcmFtLmJ1aWxkSW5pdGlhbENoYW1iZXIiLCJGb3JhbTNELkZvcmFtLmJ1aWxkQ2hhbWJlciIsIkZvcmFtM0QuRm9yYW0uYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuQ2hhbWJlclBhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRoLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyUGF0aC5idWlsZFBhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRoLmZldGNoQ2hhbWJlcnNBdHRyaWJ1dGUiLCJGb3JhbTNELkNoYW1iZXJQYXRoLmZpbHRlckFjdGl2ZUNoYW1iZXJzIiwiRm9yYW0zRC5DaGFtYmVyUGF0aC5idWlsZFBvc2l0aW9uc0J1ZmZlciIsIkZvcmFtM0QuQ2hhbWJlclBhdGguYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuQ2hhbWJlclBhdGguYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuQXBlcnR1cmVzUGF0aCIsIkZvcmFtM0QuQXBlcnR1cmVzUGF0aC5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQXBlcnR1cmVzUGF0aC5yZWJ1aWxkIiwiRm9yYW0zRC5DZW50cm9pZHNQYXRoIiwiRm9yYW0zRC5DZW50cm9pZHNQYXRoLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DZW50cm9pZHNQYXRoLnJlYnVpbGQiLCJGb3JhbTNELkNvbmZpZ3VyYXRpb24iLCJGb3JhbTNELkNvbmZpZ3VyYXRpb24uY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMiLCJGb3JhbTNELkhlbHBlcnMuRmFjZSIsIkZvcmFtM0QuSGVscGVycy5GYWNlLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2UuY2FsY3VsYXRlQ2VudHJvaWQiLCJGb3JhbTNELkNhbGN1bGF0b3JzIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5GYWNlc1Byb2Nlc3NvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuRmFjZXNQcm9jZXNzb3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkZhY2VzUHJvY2Vzc29yLnN1bUZhY2VzIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TdXJmYWNlQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUNhbGN1bGF0b3IuY2FsY3VsYXRlRmFjZVN1cmZhY2VBcmVhIiwiRm9yYW0zRC5TaW11bGF0aW9uIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNpbXVsYXRlIiwiRm9yYW0zRC5TaW11bGF0aW9uLmV2b2x2ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5yZWdyZXNzIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNhbGN1bGF0ZVN1cmZhY2VBcmVhIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRvZ2dsZUNlbnRyb2lkc1BhdGgiLCJGb3JhbTNELlNpbXVsYXRpb24udG9nZ2xlQXBlcnR1cmVzUGF0aCIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zaG93VGhpY2tuZXNzVmVjdG9ycyIsIkZvcmFtM0QuU2ltdWxhdGlvbi5oaWRlVGhpY2tuZXNzVmVjdG9ycyIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRvZ2dsZUNoYW1iZXJzIiwiRm9yYW0zRC5TaW11bGF0aW9uLmFwcGx5T3BhY2l0eSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5leHBvcnRUb09CSiIsIkZvcmFtM0QuU2ltdWxhdGlvbi51cGRhdGVUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlc2V0IiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwU2NlbmUiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBDb250cm9scyIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cEF1dG9SZXNpemUiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBHVUkiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVzaXplIiwiRm9yYW0zRC5TaW11bGF0aW9uLmFuaW1hdGUiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVuZGVyIl0sIm1hcHBpbmdzIjoiQUFBQSx5REFBeUQ7Ozs7OztBQUV6RCxJQUFPLE9BQU8sQ0E2R2I7QUE3R0QsV0FBTyxPQUFPLEVBQUMsQ0FBQztJQUNkQTtRQUE2QkMsMkJBQVVBO1FBZ0JyQ0EsaUJBQVlBLE1BQXFCQSxFQUFFQSxNQUFjQSxFQUFFQSxTQUFpQkE7WUFDbEVDLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBO1lBQ3JCQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQTtZQUNyQkEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLFNBQVNBLEdBQUdBLFNBQVNBLENBQUNBO1lBRTNCQSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxhQUFhQSxFQUFFQSxDQUFDQTtZQUNwQ0EsSUFBSUEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0E7WUFFcENBLGtCQUFNQSxRQUFRQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQTtZQUUxQkEsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsaUJBQWlCQSxFQUFFQSxDQUFDQTtRQUMzQ0EsQ0FBQ0E7UUFFREQsNkJBQVdBLEdBQVhBLFVBQVlBLFdBQW9CQTtZQUM5QkUsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsV0FBV0EsQ0FBQ0E7WUFDNUJBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLFdBQVdBLENBQUNBLFFBQVFBLENBQUNBO1lBQ25DQSxXQUFXQSxDQUFDQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUMzQkEsQ0FBQ0E7UUFFREYscUNBQW1CQSxHQUFuQkE7WUFDRUcsRUFBRUEsQ0FB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O1lBQ0VvQixJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQSxVQUFVQSxHQUFHQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQTtZQUM1REEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0Esc0JBQXNCQSxFQUFFQSxDQUFDQTtZQUVyQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsVUFBVUEsRUFBRUEsTUFBTUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0E7UUFDL0RBLENBQUNBO1FBRU9wQiw0QkFBT0EsR0FBZkE7WUFBQXFCLGlCQUtDQTtZQUpDQSxxQkFBcUJBLENBQUNBLGNBQU1BLE9BQUFBLEtBQUlBLENBQUNBLE9BQU9BLEVBQUVBLEVBQWRBLENBQWNBLENBQUNBLENBQUNBO1lBRTVDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTtZQUN2QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0E7UUFDaEJBLENBQUNBO1FBRU9yQiwyQkFBTUEsR0FBZEE7WUFDRXNCLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1FBQ2hEQSxDQUFDQTtRQUNIdEIsaUJBQUNBO0lBQURBLENBaFNBckQsQUFnU0NxRCxJQUFBckQ7SUFoU1lBLGtCQUFVQSxhQWdTdEJBLENBQUFBO0FBQ0hBLENBQUNBLEVBbFNNLE9BQU8sS0FBUCxPQUFPLFFBa1NiIiwiZmlsZSI6ImZvcmFtM2QuanMiLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
