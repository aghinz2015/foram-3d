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
/// <reference path="./calculator.ts" />
/// <reference path="./faces_processor.ts" />
var Foram3D;
(function (Foram3D) {
    var Calculators;
    (function (Calculators) {
        var VolumeCalculator = (function (_super) {
            __extends(VolumeCalculator, _super);
            function VolumeCalculator() {
                _super.apply(this, arguments);
            }
            VolumeCalculator.prototype.calculate = function () {
                var facesProcessor = new Calculators.FacesProcessor(this.foram);
                return facesProcessor.sumFaces(this.calculateFaceTetrahedronVolume);
            };
            VolumeCalculator.prototype.calculateFaceTetrahedronVolume = function (face) {
                var v321, v231, v312, v132, v213, v123;
                v321 = face.vc.x * face.vb.y * face.va.z;
                v231 = face.vb.x * face.vc.y * face.va.z;
                v312 = face.vc.x * face.va.y * face.vb.z;
                v132 = face.va.x * face.vc.y * face.vb.z;
                v213 = face.vb.x * face.va.y * face.vc.z;
                v123 = face.va.x * face.vb.y * face.vc.z;
                return (-v321 + v231 + v312 - v132 - v213 + v123) / 6;
            };
            return VolumeCalculator;
        })(Foram3D.Calculator);
        Calculators.VolumeCalculator = VolumeCalculator;
    })(Calculators = Foram3D.Calculators || (Foram3D.Calculators = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="./calculator.ts" />
var Foram3D;
(function (Foram3D) {
    var Calculators;
    (function (Calculators) {
        var ShapeFactorCalculator = (function (_super) {
            __extends(ShapeFactorCalculator, _super);
            function ShapeFactorCalculator() {
                _super.apply(this, arguments);
            }
            ShapeFactorCalculator.prototype.calculate = function () {
                var centroidsPathLength = this.calculateCentroidsPathLength();
                var headToTailDistance = this.calculateDistanceBetweenHeadAndTail();
                return centroidsPathLength / headToTailDistance;
            };
            ShapeFactorCalculator.prototype.calculateDistanceBetweenHeadAndTail = function () {
                var chambers, head, tail;
                chambers = this.foram.chambers;
                head = chambers[0];
                tail = chambers[chambers.length - 1];
                return head.center.distanceTo(tail.center);
            };
            ShapeFactorCalculator.prototype.calculateCentroidsPathLength = function () {
                var activeChambers, prevChamber, chamber, totalLength;
                activeChambers = this.foram.chambers;
                prevChamber = activeChambers[0];
                activeChambers.shift();
                totalLength = 0;
                for (var _i = 0; _i < activeChambers.length; _i++) {
                    chamber = activeChambers[_i];
                    totalLength += prevChamber.center.distanceTo(chamber.center);
                    prevChamber = chamber;
                }
                return totalLength;
            };
            return ShapeFactorCalculator;
        })(Foram3D.Calculator);
        Calculators.ShapeFactorCalculator = ShapeFactorCalculator;
    })(Calculators = Foram3D.Calculators || (Foram3D.Calculators = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="./foram.ts"/>
/// <reference path="./genotype_params.ts"/>
/// <reference path="./centroids_path.ts"/>
/// <reference path="./calculators/surface_calculator.ts"/>
/// <reference path="./calculators/volume_calculator.ts"/>
/// <reference path="./calculators/shape_factor_calculator.ts"/>
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
            var calculator = new Foram3D.Calculators.SurfaceCalculator(this.foram);
            return calculator.calculate();
        };
        Simulation.prototype.calculateVolume = function () {
            if (!this.foram)
                return;
            var calculator = new Foram3D.Calculators.VolumeCalculator(this.foram);
            return calculator.calculate();
        };
        Simulation.prototype.calculateShapeFactor = function () {
            if (!this.foram)
                return;
            var calculator = new Foram3D.Calculators.ShapeFactorCalculator(this.foram);
            return calculator.calculate();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYW1iZXIudHMiLCJmb3JhbS50cyIsImNoYW1iZXJfcGF0aC50cyIsImFwZXJ0dXJlc19wYXRoLnRzIiwiY2VudHJvaWRzX3BhdGgudHMiLCJjb25maWd1cmF0aW9uLnRzIiwiY2FsY3VsYXRvcnMvY2FsY3VsYXRvci50cyIsImhlbHBlcnMvZmFjZS50cyIsImNhbGN1bGF0b3JzL2ZhY2VzX3Byb2Nlc3Nvci50cyIsImNhbGN1bGF0b3JzL3N1cmZhY2VfY2FsY3VsYXRvci50cyIsImNhbGN1bGF0b3JzL3ZvbHVtZV9jYWxjdWxhdG9yLnRzIiwiY2FsY3VsYXRvcnMvc2hhcGVfZmFjdG9yX2NhbGN1bGF0b3IudHMiLCJzaW11bGF0aW9uLnRzIl0sIm5hbWVzIjpbIkZvcmFtM0QiLCJGb3JhbTNELkNoYW1iZXIiLCJGb3JhbTNELkNoYW1iZXIuY29uc3RydWN0b3IiLCJGb3JhbTNELkNoYW1iZXIuc2V0QW5jZXN0b3IiLCJGb3JhbTNELkNoYW1iZXIuc2hvd1RoaWNrbmVzc1ZlY3RvciIsIkZvcmFtM0QuQ2hhbWJlci5oaWRlVGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkR2VvbWV0cnkiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuQ2hhbWJlci5idWlsZFRoaWNrbmVzc1ZlY3RvciIsIkZvcmFtM0QuQ2hhbWJlci5jYWxjdWxhdGVBcGVydHVyZSIsIkZvcmFtM0QuRm9yYW0iLCJGb3JhbTNELkZvcmFtLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5Gb3JhbS5ldm9sdmUiLCJGb3JhbTNELkZvcmFtLnJlZ3Jlc3MiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5leHRDaGFtYmVyIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdDZW50ZXIiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld1JhZGl1cyIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3VGhpY2tuZXNzIiwiRm9yYW0zRC5Gb3JhbS5hbmNlc3Rvck9yQ3VycmVudENoYW1iZXIiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld0FwZXJ0dXJlIiwiRm9yYW0zRC5Gb3JhbS5idWlsZEluaXRpYWxDaGFtYmVyIiwiRm9yYW0zRC5Gb3JhbS5idWlsZENoYW1iZXIiLCJGb3JhbTNELkZvcmFtLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkNoYW1iZXJQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aC5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2hhbWJlclBhdGguYnVpbGRQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aC5mZXRjaENoYW1iZXJzQXR0cmlidXRlIiwiRm9yYW0zRC5DaGFtYmVyUGF0aC5maWx0ZXJBY3RpdmVDaGFtYmVycyIsIkZvcmFtM0QuQ2hhbWJlclBhdGguYnVpbGRQb3NpdGlvbnNCdWZmZXIiLCJGb3JhbTNELkNoYW1iZXJQYXRoLmJ1aWxkR2VvbWV0cnkiLCJGb3JhbTNELkNoYW1iZXJQYXRoLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkFwZXJ0dXJlc1BhdGgiLCJGb3JhbTNELkFwZXJ0dXJlc1BhdGguY29uc3RydWN0b3IiLCJGb3JhbTNELkFwZXJ0dXJlc1BhdGgucmVidWlsZCIsIkZvcmFtM0QuQ2VudHJvaWRzUGF0aCIsIkZvcmFtM0QuQ2VudHJvaWRzUGF0aC5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2VudHJvaWRzUGF0aC5yZWJ1aWxkIiwiRm9yYW0zRC5Db25maWd1cmF0aW9uIiwiRm9yYW0zRC5Db25maWd1cmF0aW9uLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2UiLCJGb3JhbTNELkhlbHBlcnMuRmFjZS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuSGVscGVycy5GYWNlLmNhbGN1bGF0ZUNlbnRyb2lkIiwiRm9yYW0zRC5DYWxjdWxhdG9ycyIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuRmFjZXNQcm9jZXNzb3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkZhY2VzUHJvY2Vzc29yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5GYWNlc1Byb2Nlc3Nvci5zdW1GYWNlcyIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VDYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TdXJmYWNlQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VDYWxjdWxhdG9yLmNhbGN1bGF0ZUZhY2VTdXJmYWNlQXJlYSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuVm9sdW1lQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuVm9sdW1lQ2FsY3VsYXRvci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuVm9sdW1lQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IuY2FsY3VsYXRlRmFjZVRldHJhaGVkcm9uVm9sdW1lIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNhbGN1bGF0ZURpc3RhbmNlQmV0d2VlbkhlYWRBbmRUYWlsIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IuY2FsY3VsYXRlQ2VudHJvaWRzUGF0aExlbmd0aCIsIkZvcmFtM0QuU2ltdWxhdGlvbiIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zaW11bGF0ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5ldm9sdmUiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVncmVzcyIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jYWxjdWxhdGVTdXJmYWNlQXJlYSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jYWxjdWxhdGVWb2x1bWUiLCJGb3JhbTNELlNpbXVsYXRpb24uY2FsY3VsYXRlU2hhcGVGYWN0b3IiLCJGb3JhbTNELlNpbXVsYXRpb24udG9nZ2xlQ2VudHJvaWRzUGF0aCIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVBcGVydHVyZXNQYXRoIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNob3dUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5TaW11bGF0aW9uLmhpZGVUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRvZ2dsZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELlNpbXVsYXRpb24udG9nZ2xlQ2hhbWJlcnMiLCJGb3JhbTNELlNpbXVsYXRpb24uYXBwbHlPcGFjaXR5IiwiRm9yYW0zRC5TaW11bGF0aW9uLmV4cG9ydFRvT0JKIiwiRm9yYW0zRC5TaW11bGF0aW9uLnVwZGF0ZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVzZXQiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBTY2VuZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cENvbnRyb2xzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwQXV0b1Jlc2l6ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cEdVSSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5yZXNpemUiLCJGb3JhbTNELlNpbXVsYXRpb24uYW5pbWF0ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5yZW5kZXIiXSwibWFwcGluZ3MiOiJBQUFBLHlEQUF5RDs7Ozs7O0FBRXpELElBQU8sT0FBTyxDQTZHYjtBQTdHRCxXQUFPLE9BQU8sRUFBQyxDQUFDO0lBQ2RBO1FBQTZCQywyQkFBVUE7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QUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQTtnQkFFdkNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUFBO2dCQUN4Q0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQUE7Z0JBQ3hDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFBQTtnQkFDeENBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUFBO2dCQUN4Q0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQUE7Z0JBQ3hDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFBQTtnQkFFeENBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLElBQUlBLEdBQUdBLElBQUlBLEdBQUVBLElBQUlBLEdBQUdBLElBQUlBLEdBQUdBLElBQUlB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QUFJQSxDQUFDQSxPQUFPQSxFQUFFQSxFQUFkQSxDQUFjQSxDQUFDQSxDQUFDQTtZQUU1Q0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0E7WUFDdkJBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1FBQ2hCQSxDQUFDQTtRQUVPdkIsMkJBQU1BLEdBQWRBO1lBQ0V3QixJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxFQUFFQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUNoREEsQ0FBQ0E7UUFDSHhCLGlCQUFDQTtJQUFEQSxDQTlTQTlELEFBOFNDOEQsSUFBQTlEO0lBOVNZQSxrQkFBVUEsYUE4U3RCQSxDQUFBQTtBQUNIQSxDQUFDQSxFQWhUTSxPQUFPLEtBQVAsT0FBTyxRQWdUYiIsImZpbGUiOiJmb3JhbTNkLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
