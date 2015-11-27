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
        Foram.prototype.getActiveChambers = function () {
            var chamber, activeChambers = [];
            for (var _i = 0, _a = this.chambers; _i < _a.length; _i++) {
                chamber = _a[_i];
                if (chamber.visible)
                    activeChambers.push(chamber);
            }
            return activeChambers;
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
                chambers = this.foram.getActiveChambers();
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
                activeChambers = this.foram.getActiveChambers();
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
/// <reference path="../foram.ts" />
var Foram3D;
(function (Foram3D) {
    var ChamberPaths;
    (function (ChamberPaths) {
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
                activeChambers = this.foram.getActiveChambers();
                for (var _i = 0; _i < activeChambers.length; _i++) {
                    chamber = activeChambers[_i];
                    attributes.push(chamber[attributeName]);
                }
                return attributes;
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
        ChamberPaths.ChamberPath = ChamberPath;
    })(ChamberPaths = Foram3D.ChamberPaths || (Foram3D.ChamberPaths = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="./chamber_path.ts" />
var Foram3D;
(function (Foram3D) {
    var ChamberPaths;
    (function (ChamberPaths) {
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
        })(ChamberPaths.ChamberPath);
        ChamberPaths.CentroidsPath = CentroidsPath;
    })(ChamberPaths = Foram3D.ChamberPaths || (Foram3D.ChamberPaths = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="./chamber_path.ts" />
var Foram3D;
(function (Foram3D) {
    var ChamberPaths;
    (function (ChamberPaths) {
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
        })(ChamberPaths.ChamberPath);
        ChamberPaths.AperturesPath = AperturesPath;
    })(ChamberPaths = Foram3D.ChamberPaths || (Foram3D.ChamberPaths = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="./foram.ts"/>
/// <reference path="./genotype_params.ts"/>
/// <reference path="./calculators/surface_calculator.ts"/>
/// <reference path="./calculators/volume_calculator.ts"/>
/// <reference path="./calculators/shape_factor_calculator.ts"/>
/// <reference path="./chamber_paths/centroids_path.ts"/>
/// <reference path="./chamber_paths/apertures_path.ts"/>
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
                this.centroidsPath = new Foram3D.ChamberPaths.CentroidsPath(this.foram, { color: 0xff0000 });
                this.centroidsPath.visible = false;
                this.scene.add(this.centroidsPath);
            }
            this.centroidsPath.visible = !this.centroidsPath.visible;
        };
        Simulation.prototype.toggleAperturesPath = function () {
            if (!this.foram)
                return;
            if (!this.aperturesPath) {
                this.aperturesPath = new Foram3D.ChamberPaths.AperturesPath(this.foram, { color: 0x00ff00 });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYW1iZXIudHMiLCJjb25maWd1cmF0aW9uLnRzIiwiZm9yYW0udHMiLCJjYWxjdWxhdG9ycy9jYWxjdWxhdG9yLnRzIiwiaGVscGVycy9mYWNlLnRzIiwiY2FsY3VsYXRvcnMvZmFjZXNfcHJvY2Vzc29yLnRzIiwiY2FsY3VsYXRvcnMvc3VyZmFjZV9jYWxjdWxhdG9yLnRzIiwiY2FsY3VsYXRvcnMvdm9sdW1lX2NhbGN1bGF0b3IudHMiLCJjYWxjdWxhdG9ycy9zaGFwZV9mYWN0b3JfY2FsY3VsYXRvci50cyIsImNoYW1iZXJfcGF0aHMvY2hhbWJlcl9wYXRoLnRzIiwiY2hhbWJlcl9wYXRocy9jZW50cm9pZHNfcGF0aC50cyIsImNoYW1iZXJfcGF0aHMvYXBlcnR1cmVzX3BhdGgudHMiLCJzaW11bGF0aW9uLnRzIl0sIm5hbWVzIjpbIkZvcmFtM0QiLCJGb3JhbTNELkNoYW1iZXIiLCJGb3JhbTNELkNoYW1iZXIuY29uc3RydWN0b3IiLCJGb3JhbTNELkNoYW1iZXIuc2V0QW5jZXN0b3IiLCJGb3JhbTNELkNoYW1iZXIuc2hvd1RoaWNrbmVzc1ZlY3RvciIsIkZvcmFtM0QuQ2hhbWJlci5oaWRlVGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkR2VvbWV0cnkiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuQ2hhbWJlci5idWlsZFRoaWNrbmVzc1ZlY3RvciIsIkZvcmFtM0QuQ2hhbWJlci5jYWxjdWxhdGVBcGVydHVyZSIsIkZvcmFtM0QuQ29uZmlndXJhdGlvbiIsIkZvcmFtM0QuQ29uZmlndXJhdGlvbi5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuRm9yYW0iLCJGb3JhbTNELkZvcmFtLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5Gb3JhbS5ldm9sdmUiLCJGb3JhbTNELkZvcmFtLnJlZ3Jlc3MiLCJGb3JhbTNELkZvcmFtLmdldEFjdGl2ZUNoYW1iZXJzIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXh0Q2hhbWJlciIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3Q2VudGVyIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdSYWRpdXMiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld1RoaWNrbmVzcyIsIkZvcmFtM0QuRm9yYW0uYW5jZXN0b3JPckN1cnJlbnRDaGFtYmVyIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdBcGVydHVyZSIsIkZvcmFtM0QuRm9yYW0uYnVpbGRJbml0aWFsQ2hhbWJlciIsIkZvcmFtM0QuRm9yYW0uYnVpbGRDaGFtYmVyIiwiRm9yYW0zRC5Gb3JhbS5idWlsZE1hdGVyaWFsIiwiRm9yYW0zRC5DYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2UiLCJGb3JhbTNELkhlbHBlcnMuRmFjZS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuSGVscGVycy5GYWNlLmNhbGN1bGF0ZUNlbnRyb2lkIiwiRm9yYW0zRC5DYWxjdWxhdG9ycyIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuRmFjZXNQcm9jZXNzb3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkZhY2VzUHJvY2Vzc29yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5GYWNlc1Byb2Nlc3Nvci5zdW1GYWNlcyIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VDYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TdXJmYWNlQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VDYWxjdWxhdG9yLmNhbGN1bGF0ZUZhY2VTdXJmYWNlQXJlYSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuVm9sdW1lQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuVm9sdW1lQ2FsY3VsYXRvci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuVm9sdW1lQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IuY2FsY3VsYXRlRmFjZVRldHJhaGVkcm9uVm9sdW1lIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNhbGN1bGF0ZURpc3RhbmNlQmV0d2VlbkhlYWRBbmRUYWlsIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IuY2FsY3VsYXRlQ2VudHJvaWRzUGF0aExlbmd0aCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmJ1aWxkUGF0aCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmZldGNoQ2hhbWJlcnNBdHRyaWJ1dGUiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5idWlsZFBvc2l0aW9uc0J1ZmZlciIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmJ1aWxkR2VvbWV0cnkiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5idWlsZE1hdGVyaWFsIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2VudHJvaWRzUGF0aCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNlbnRyb2lkc1BhdGguY29uc3RydWN0b3IiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DZW50cm9pZHNQYXRoLnJlYnVpbGQiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5BcGVydHVyZXNQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQXBlcnR1cmVzUGF0aC5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkFwZXJ0dXJlc1BhdGgucmVidWlsZCIsIkZvcmFtM0QuU2ltdWxhdGlvbiIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zaW11bGF0ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5ldm9sdmUiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVncmVzcyIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jYWxjdWxhdGVTdXJmYWNlQXJlYSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jYWxjdWxhdGVWb2x1bWUiLCJGb3JhbTNELlNpbXVsYXRpb24uY2FsY3VsYXRlU2hhcGVGYWN0b3IiLCJGb3JhbTNELlNpbXVsYXRpb24udG9nZ2xlQ2VudHJvaWRzUGF0aCIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVBcGVydHVyZXNQYXRoIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNob3dUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5TaW11bGF0aW9uLmhpZGVUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRvZ2dsZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELlNpbXVsYXRpb24udG9nZ2xlQ2hhbWJlcnMiLCJGb3JhbTNELlNpbXVsYXRpb24uYXBwbHlPcGFjaXR5IiwiRm9yYW0zRC5TaW11bGF0aW9uLmV4cG9ydFRvT0JKIiwiRm9yYW0zRC5TaW11bGF0aW9uLnVwZGF0ZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVzZXQiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBTY2VuZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cENvbnRyb2xzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwQXV0b1Jlc2l6ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cEdVSSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5yZXNpemUiLCJGb3JhbTNELlNpbXVsYXRpb24uYW5pbWF0ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5yZW5kZXIiXSwibWFwcGluZ3MiOiJBQUFBLHlEQUF5RDs7Ozs7O0FBRXpELElBQU8sT0FBTyxDQTZHYjtBQTdHRCxXQUFPLE9BQU8sRUFBQyxDQUFDO0lBQ2RBO1FBQTZCQywyQkFBVUE7UUFnQnJDQSxpQkFBWUEsTUFBcUJBLEVBQUVBLE1BQWNBLEVBQUVBLFNBQWlCQTtZQUNsRUMsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBO1lBQ3JCQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQTtZQUNyQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsR0FBR0EsU0FBU0EsQ0FBQ0E7WUFFM0JBLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBO1lBQ3BDQSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxhQUFhQSxFQUFFQSxDQUFDQTtZQUVwQ0Esa0JBQU1BLFFBQVFBLEVBQUVBLFFBQVFBLENBQUNBLENBQUNBO1lBRTFCQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxpQkFBaUJBLEVBQUVBLENBQUNBO1FBQzNDQSxDQUFDQTtRQUVERCw2QkFBV0EsR0FBWEEsVUFBWUEsV0FBb0JBO1lBQzlCRSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxXQUFXQSxDQUFDQTtZQUM1QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsV0FBV0EsQ0FBQ0EsUUFBUUEsQ0FBQ0E7WUFDbkNBLFdBQVdBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBO1FBQzNCQSxDQUFDQTtRQUVERixxQ0FBbUJBLEdBQW5CQTtZQUNFRyxFQUFFQSxDQUFDQSxD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QUdBLENBQUNBLGlCQUFpQkEsRUFBRUEsZ0JBQWdCQSxDQUFDQSxDQUFDQTtZQUV6REEsY0FBY0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsZUFBZUEsRUFBRUEsU0FBU0EsQ0FBQ0EsQ0FBQ0EsY0FBY0EsQ0FDM0RBLGNBQU1BLE9BQUFBLEtBQUlBLENBQUNBLFlBQVlBLENBQUNBLGVBQWVBLENBQUNBLE9BQU9BLENBQUNBLEVBQTFDQSxDQUEwQ0EsQ0FDakRBLENBQUNBO1FBQ0pBLENBQUNBO1FBRU9yQiwyQkFBTUEsR0FBZEE7WUFDRXNCLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBLFVBQVVBLEdBQUdBLE1BQU1BLENBQUNBLFdBQVdBLENBQUNBO1lBQzVEQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxzQkFBc0JBLEVBQUVBLENBQUNBO1lBRXJDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxVQUFVQSxFQUFFQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtRQUMvREEsQ0FBQ0E7UUFFT3RCLDRCQUFPQSxHQUFmQTtZQUFBdUIsaUJBS0NBO1lBSkNBLHFCQUFxQkEsQ0FBQ0EsY0FBTUEsT0FBQUEsS0FBSUEsQ0FBQ0EsT0FBT0EsRUFBRUEsRUFBZEEsQ0FBY0EsQ0FBQ0EsQ0FBQ0E7WUFFNUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1lBQ3ZCQSxJQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTtRQUNoQkEsQ0FBQ0E7UUFFT3ZCLDJCQUFNQSxHQUFkQTtZQUNFd0IsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7UUFDaERBLENBQUNBO1FBQ0h4QixpQkFBQ0E7SUFBREEsQ0E5U0EvRCxBQThTQytELElBQUEvRDtJQTlTWUEsa0JBQVVBLGFBOFN0QkEsQ0FBQUE7QUFDSEEsQ0FBQ0EsRUFoVE0sT0FBTyxLQUFQLE9BQU8sUUFnVGIiLCJmaWxlIjoiZm9yYW0zZC5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
