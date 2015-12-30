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
        Chamber.prototype.setAperture = function (aperture) {
            this.aperture = aperture;
            this.markAperture();
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
        Chamber.prototype.markAperture = function () {
            this.apertureMarker = this.buildApertureMarker();
            this.add(this.apertureMarker);
        };
        Chamber.prototype.serialize = function () {
            return {
                radius: this.radius,
                thickness: this.thickness
            };
        };
        Chamber.prototype.applyMaterial = function (materialParams) {
            for (var param in materialParams) {
                this.material[param] = materialParams[param];
            }
        };
        Chamber.prototype.buildApertureMarker = function () {
            var markerParams = {
                color: Chamber.APERTURE_MARKER_COLOR,
                size: this.radius * Chamber.APERTURE_MARKER_SIZE_FACTOR
            };
            return new Foram3D.Helpers.Point(this.aperture, markerParams);
        };
        Chamber.prototype.buildGeometry = function () {
            var geometry = new THREE.SphereGeometry(this.radius, Chamber.WIDTH_SEGMENTS, Chamber.HEIGHT_SEGMENTS);
            geometry.applyMatrix(new THREE.Matrix4().makeTranslation(this.center.x, this.center.y, this.center.z));
            return geometry;
        };
        Chamber.prototype.buildMaterial = function () {
            return new THREE.MeshLambertMaterial(Chamber.MATERIAL_DEFAULTS);
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
        Chamber.MATERIAL_DEFAULTS = {
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        };
        Chamber.APERTURE_MARKER_COLOR = 0x000000;
        Chamber.APERTURE_MARKER_SIZE_FACTOR = 0.05;
        return Chamber;
    })(THREE.Mesh);
    Foram3D.Chamber = Chamber;
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
            ChamberPath.DEFAULT_WIDTH = 3;
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
/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="./chamber.ts" />
/// <reference path="./genotype.ts"/>
/// <reference path="./chamber_paths/centroids_path.ts"/>
/// <reference path="./chamber_paths/apertures_path.ts"/>
/// <reference path="./calculators/surface_calculator.ts"/>
/// <reference path="./calculators/volume_calculator.ts"/>
/// <reference path="./calculators/shape_factor_calculator.ts"/>
var Foram3D;
(function (Foram3D) {
    var Foram = (function (_super) {
        __extends(Foram, _super);
        function Foram(genotype, numChambers) {
            _super.call(this);
            this.prevChambers = [];
            this.genotype = genotype;
            this.material = Foram.MATERIAL_DEFAULTS;
            var initialChamber = this.buildInitialChamber();
            this.chambers = [initialChamber];
            this.currentChamber = initialChamber;
            this.prevChambers[0] = initialChamber;
            for (var i = 1; i < numChambers; i++) {
                this.evolve();
            }
            this.thicknessVectorsVisible = false;
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
            this.updateChamberPaths();
            this.updateThicknessVectors();
        };
        Foram.prototype.regress = function () {
            var ancestor = this.currentChamber.ancestor;
            if (ancestor) {
                this.currentChamber.visible = false;
                this.currentChamber = ancestor;
            }
            this.updateChamberPaths();
        };
        Foram.prototype.toggleCentroidsPath = function () {
            if (!this.centroidsPath) {
                this.centroidsPath = new Foram3D.ChamberPaths.CentroidsPath(this, { color: 0xff0000 });
                this.centroidsPath.visible = false;
                this.add(this.centroidsPath);
            }
            this.centroidsPath.visible = !this.centroidsPath.visible;
        };
        Foram.prototype.toggleAperturesPath = function () {
            if (!this.aperturesPath) {
                this.aperturesPath = new Foram3D.ChamberPaths.AperturesPath(this, { color: 0x00ff00 });
                this.aperturesPath.visible = false;
                this.add(this.aperturesPath);
            }
            this.aperturesPath.visible = !this.aperturesPath.visible;
        };
        Foram.prototype.showThicknessVectors = function () {
            for (var _i = 0, _a = this.chambers; _i < _a.length; _i++) {
                var chamber = _a[_i];
                chamber.showThicknessVector();
            }
        };
        Foram.prototype.hideThicknessVectors = function () {
            for (var _i = 0, _a = this.chambers; _i < _a.length; _i++) {
                var chamber = _a[_i];
                chamber.hideThicknessVector();
            }
        };
        Foram.prototype.toggleThicknessVectors = function () {
            this.thicknessVectorsVisible = !this.thicknessVectorsVisible;
            this.updateThicknessVectors();
        };
        Foram.prototype.calculateSurfaceArea = function () {
            var calculator = new Foram3D.Calculators.SurfaceCalculator(this);
            return calculator.calculate();
        };
        Foram.prototype.calculateVolume = function () {
            var calculator = new Foram3D.Calculators.VolumeCalculator(this);
            return calculator.calculate();
        };
        Foram.prototype.calculateShapeFactor = function () {
            var calculator = new Foram3D.Calculators.ShapeFactorCalculator(this);
            return calculator.calculate();
        };
        Foram.prototype.applyOpacity = function (opacity) {
            this.material.opacity = opacity;
            this.updateChambersMaterial();
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
            newChamber.setAperture(newAperture);
            newChamber.setAncestor(this.currentChamber);
            this.prevChambers[2] = this.prevChambers[1];
            this.prevChambers[1] = this.prevChambers[0];
            this.prevChambers[0] = newChamber;
            return newChamber;
        };
        Foram.prototype.calculateNewCenter = function () {
            var referenceLine, deviationSurfaceSpanning, phiDeviationAxis, growthVector, newCenter;
            referenceLine = new THREE.Vector3();
            if (this.chambers.length == 1) {
                referenceLine.subVectors(this.prevChambers[0].aperture, this.prevChambers[0].center);
            }
            else {
                referenceLine.subVectors(this.prevChambers[0].aperture, this.prevChambers[1].aperture);
            }
            deviationSurfaceSpanning = new THREE.Vector3();
            switch (this.chambers.length) {
                case 1:
                    deviationSurfaceSpanning.set(0, 1, 0);
                    break;
                case 2:
                    deviationSurfaceSpanning.subVectors(this.prevChambers[1].center, this.prevChambers[1].aperture);
                    break;
                default:
                    deviationSurfaceSpanning.subVectors(this.prevChambers[2].aperture, this.prevChambers[1].aperture);
            }
            phiDeviationAxis = new THREE.Vector3();
            phiDeviationAxis.crossVectors(referenceLine, deviationSurfaceSpanning);
            phiDeviationAxis.normalize();
            growthVector = new THREE.Vector3();
            growthVector.copy(referenceLine);
            growthVector.applyAxisAngle(phiDeviationAxis, this.genotype.phi);
            referenceLine.normalize();
            growthVector.applyAxisAngle(referenceLine, this.genotype.beta);
            var growthVectorLength = this.calculateGrowthVectorLength();
            growthVector.setLength(growthVectorLength);
            newCenter = new THREE.Vector3();
            newCenter.copy(this.prevChambers[0].aperture);
            newCenter.add(growthVector);
            return newCenter;
        };
        Foram.prototype.calculateGrowthVectorLength = function () {
            return this.currentChamber.radius * this.genotype.translationFactor;
        };
        Foram.prototype.calculateNewRadius = function () {
            return this.currentChamber.radius * this.genotype.growthFactor;
        };
        Foram.prototype.calculateNewThickness = function () {
            return this.currentChamber.thickness * this.genotype.wallThicknessFactor;
        };
        Foram.prototype.calculateNewAperture = function (newChamber) {
            var newCenter, newChamberVertices, prevAperture, newAperture, currentDistance, newDistance, chamber, contains, i, j;
            newChamberVertices = newChamber.geometry.vertices;
            prevAperture = this.prevChambers[0].aperture;
            newAperture = newChamberVertices[0];
            currentDistance = newAperture.distanceTo(prevAperture);
            for (i = 1; i < newChamberVertices.length; i++) {
                newDistance = newChamberVertices[i].distanceTo(prevAperture);
                if (newDistance < currentDistance) {
                    contains = false;
                    for (var _i = 0, _a = this.chambers; _i < _a.length; _i++) {
                        chamber = _a[_i];
                        if (chamber.radius >= newChamberVertices[i].distanceTo(chamber.center)) {
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
            initialChamber.markAperture();
            this.add(initialChamber);
            return initialChamber;
        };
        Foram.prototype.buildChamber = function (center, radius, thickness) {
            var chamber = new Foram3D.Chamber(center, radius, thickness);
            chamber.applyMaterial(this.material);
            return chamber;
        };
        Foram.prototype.updateChamberPaths = function () {
            if (this.centroidsPath) {
                this.centroidsPath.rebuild();
            }
            if (this.aperturesPath) {
                this.aperturesPath.rebuild();
            }
        };
        Foram.prototype.updateThicknessVectors = function () {
            if (this.thicknessVectorsVisible) {
                this.showThicknessVectors();
            }
            else {
                this.hideThicknessVectors();
            }
        };
        Foram.prototype.updateChambersMaterial = function () {
            for (var _i = 0, _a = this.chambers; _i < _a.length; _i++) {
                var chamber = _a[_i];
                chamber.applyMaterial(this.material);
            }
        };
        Foram.INITIAL_RADIUS = 5;
        Foram.INITIAL_THICKNESS = 1;
        Foram.MATERIAL_DEFAULTS = {
            opacity: 0.8
        };
        return Foram;
    })(THREE.Group);
    Foram3D.Foram = Foram;
})(Foram3D || (Foram3D = {}));
var Foram3D;
(function (Foram3D) {
    var SimulationGUI = (function (_super) {
        __extends(SimulationGUI, _super);
        function SimulationGUI(simulation) {
            _super.call(this);
            this.simulation = simulation;
            this.setup();
        }
        SimulationGUI.prototype.setup = function () {
            var _this = this;
            var genotypeFolder = this.addFolder("Genotype");
            var structureFolder = this.addFolder("Structure analyzer");
            var materialFolder = this.addFolder("Material");
            var genotype = {
                phi: 0.5,
                beta: 0.5,
                translationFactor: 0.5,
                growthFactor: 1.1,
                wallThicknessFactor: 1.1
            };
            var structureAnalyzer = {
                numChambers: 20,
                simulate: function () { return _this.simulation.simulate(genotype, structureAnalyzer.numChambers); },
                evolve: function () { return _this.simulation.evolve(); },
                regress: function () { return _this.simulation.regress(); },
                centroidsPath: function () { return _this.simulation.toggleCentroidsPath(); },
                aperturesPath: function () { return _this.simulation.toggleAperturesPath(); },
                thicknessVectors: function () { return _this.simulation.toggleThicknessVectors(); },
                fitTarget: function () { return _this.simulation.fitTarget(); }
            };
            var materialOptions = {
                opacity: 0.8
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
            structureFolder.add(structureAnalyzer, 'fitTarget');
            materialFolder.add(materialOptions, 'opacity').onFinishChange(function () { return _this.simulation.applyOpacity(materialOptions.opacity); });
        };
        return SimulationGUI;
    })(dat.GUI);
    Foram3D.SimulationGUI = SimulationGUI;
})(Foram3D || (Foram3D = {}));
var Foram3D;
(function (Foram3D) {
    var Controls;
    (function (Controls) {
        var TargetControls = (function () {
            function TargetControls(camera, controls) {
                this.camera = camera;
                this.controls = controls;
            }
            TargetControls.prototype.fitTarget = function (target) {
                var targetBoundingSphere = this.calculateBoundingSphere(target);
                var cameraPosition = this.camera.position;
                var targetPosition = targetBoundingSphere.center;
                this.controls.target.copy(targetPosition);
                var distanceToTarget = this.calculateDistanceToTarget(targetBoundingSphere);
                var cameraTranslation = new THREE.Vector3();
                cameraTranslation.subVectors(cameraPosition, targetPosition);
                cameraTranslation.setLength(distanceToTarget);
                var newCameraPosition = targetPosition.clone();
                newCameraPosition.add(cameraTranslation);
                this.camera.position.copy(newCameraPosition);
                this.camera.updateProjectionMatrix();
            };
            TargetControls.prototype.calculateBoundingSphere = function (target) {
                var visibleTarget = new THREE.Group();
                for (var _i = 0, _a = target.children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    if (child.visible)
                        visibleTarget.children.push(child);
                }
                var boundingBox = new THREE.Box3().setFromObject(visibleTarget);
                return boundingBox.getBoundingSphere();
            };
            TargetControls.prototype.calculateDistanceToTarget = function (targetBoundingSphere) {
                return targetBoundingSphere.radius / Math.tan(this.camera.fov / 2 * Math.PI / 180);
            };
            return TargetControls;
        })();
        Controls.TargetControls = TargetControls;
    })(Controls = Foram3D.Controls || (Foram3D.Controls = {}));
})(Foram3D || (Foram3D = {}));
var Foram3D;
(function (Foram3D) {
    var Helpers;
    (function (Helpers) {
        function extend(base, params, defaults) {
            for (var param in defaults) {
                if (params && params[param] != undefined) {
                    base[param] = params[param];
                }
                else {
                    base[param] = defaults[param];
                }
            }
        }
        Helpers.extend = extend;
    })(Helpers = Foram3D.Helpers || (Foram3D.Helpers = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="../../typings/tsd.d.ts" />
/// <reference path="./genotype.ts"/>
/// <reference path="./foram.ts"/>
/// <reference path="./simulation_gui.ts"/>
/// <reference path="./controls/target_controls.ts"/>
/// <reference path="./helpers/utils.ts"/>
var Foram3D;
(function (Foram3D) {
    var Simulation = (function () {
        function Simulation(canvas, params) {
            this.config = {};
            Foram3D.Helpers.extend(this.config, params, Simulation.DEFAULT_PARAMS);
            this.canvas = canvas;
            this.setupScene();
            this.setupControls();
            this.setupTargetControls();
            this.setupMouseEvents();
            this.setupAutoResize();
            if (this.config.dev) {
                this.setupGUI();
            }
            this.animate();
        }
        Simulation.prototype.simulate = function (genotype, numChambers) {
            this.reset();
            this.foram = new Foram3D.Foram(genotype, numChambers);
            this.fitTarget();
            this.scene.add(this.foram);
        };
        Simulation.prototype.evolve = function () {
            if (!this.foram)
                return;
            this.foram.evolve();
        };
        Simulation.prototype.regress = function () {
            if (!this.foram)
                return;
            this.foram.regress();
        };
        Simulation.prototype.toggleCentroidsPath = function () {
            if (!this.foram)
                return;
            this.foram.toggleCentroidsPath();
        };
        Simulation.prototype.toggleAperturesPath = function () {
            if (!this.foram)
                return;
            this.foram.toggleAperturesPath();
        };
        Simulation.prototype.calculateSurfaceArea = function () {
            if (!this.foram)
                return;
            return this.foram.calculateSurfaceArea();
        };
        Simulation.prototype.calculateVolume = function () {
            if (!this.foram)
                return;
            return this.foram.calculateVolume();
        };
        Simulation.prototype.calculateShapeFactor = function () {
            if (!this.foram)
                return;
            return this.foram.calculateShapeFactor();
        };
        Simulation.prototype.toggleThicknessVectors = function () {
            if (!this.foram)
                return;
            this.foram.toggleThicknessVectors();
        };
        Simulation.prototype.applyOpacity = function (opacity) {
            if (!this.foram)
                return;
            this.foram.applyOpacity(opacity);
        };
        Simulation.prototype.exportToOBJ = function () {
            if (!this.foram)
                return;
            return new THREE.OBJExporter().parse(this.foram);
        };
        Simulation.prototype.exportToCSV = function () {
            if (!this.foram)
                return;
            return new Foram3D.Export.CSVExporter().parse(this.foram);
        };
        Simulation.prototype.takeScreenshot = function (mimetype) {
            var mimetype = mimetype || "image/jpeg";
            this.render();
            return this.renderer.domElement.toDataURL(mimetype);
        };
        Simulation.prototype.onChamberClick = function (onChamberClick) {
            this._onChamberClick = onChamberClick;
        };
        Simulation.prototype.onChamberHover = function (onChamberHover) {
            this._onChamberHover = onChamberHover;
        };
        Simulation.prototype.fitTarget = function () {
            if (!this.foram)
                return;
            this.targetControls.fitTarget(this.foram);
        };
        Simulation.prototype.reset = function () {
            if (this.foram)
                this.scene.remove(this.foram);
            this.foram = null;
        };
        Simulation.prototype.setupScene = function () {
            this.scene = new THREE.Scene();
            var width = this.canvas.clientWidth;
            var height = this.canvas.clientHeight;
            this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
            this.camera.position.set(0, 0, 70);
            this.scene.add(this.camera);
            this.lighting = new THREE.DirectionalLight(0xffffff, 0.9);
            this.camera.add(this.lighting);
            this.renderer = new THREE.WebGLRenderer({
                alpha: true,
                antialias: true
            });
            this.renderer.setClearColor(0x000000, 1);
            this.renderer.setSize(width, height);
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
        Simulation.prototype.setupTargetControls = function () {
            this.targetControls = new Foram3D.Controls.TargetControls(this.camera, this.controls);
        };
        Simulation.prototype.setupMouseEvents = function () {
            var _this = this;
            this.renderer.domElement.addEventListener('click', function (event) { return _this.onMouseClick(event); });
            this.renderer.domElement.addEventListener('mousemove', function (event) { return _this.onMouseMove(event); });
        };
        Simulation.prototype.setupAutoResize = function () {
            var _this = this;
            window.addEventListener('resize', function () { return _this.resize(); });
        };
        Simulation.prototype.setupGUI = function () {
            this.gui = new Foram3D.SimulationGUI(this);
        };
        Simulation.prototype.onMouseClick = function (event) {
            event.preventDefault();
            if (this._onChamberClick) {
                var chamber = this.getPointedChamber(event);
                if (chamber) {
                    this._onChamberClick(event, chamber.serialize());
                }
            }
        };
        Simulation.prototype.onMouseMove = function (event) {
            event.preventDefault();
            if (this._onChamberHover) {
                var chamber = this.getPointedChamber(event);
                if (chamber) {
                    this._onChamberHover(event, chamber.serialize());
                }
            }
        };
        Simulation.prototype.getPointedChamber = function (event) {
            if (!this.foram)
                return;
            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2();
            mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
            mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, this.camera);
            var intersects = raycaster.intersectObjects(this.foram.chambers);
            if (intersects.length > 0) {
                return intersects[0].object;
            }
        };
        Simulation.prototype.resize = function () {
            var width = this.canvas.clientWidth;
            var height = this.canvas.clientHeight;
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
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
        Simulation.DEFAULT_PARAMS = {
            dev: false
        };
        return Simulation;
    })();
    Foram3D.Simulation = Simulation;
})(Foram3D || (Foram3D = {}));
/// <reference path="../foram.ts"/>
/// <reference path="./exporter.ts"/>
var Foram3D;
(function (Foram3D) {
    var Export;
    (function (Export) {
        var CSVExporter = (function () {
            function CSVExporter() {
            }
            CSVExporter.prototype.parse = function (foram) {
                var output = [];
                for (var gene in foram.genotype) {
                    output.push(foram.genotype[gene]);
                }
                output.push(foram.calculateSurfaceArea(), foram.calculateVolume(), foram.calculateShapeFactor());
                return output.join(";");
            };
            return CSVExporter;
        })();
        Export.CSVExporter = CSVExporter;
    })(Export = Foram3D.Export || (Foram3D.Export = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="../../../typings/threejs/three.d.ts" />
var Foram3D;
(function (Foram3D) {
    var Helpers;
    (function (Helpers) {
        var Line = (function (_super) {
            __extends(Line, _super);
            function Line(start, end, params) {
                this.start = start;
                this.end = end;
                Helpers.extend(this, params, Line.DEFAULT_PARAMS);
                var geometry = this.buildGeometry();
                var material = this.buildMaterial();
                _super.call(this, geometry, material);
            }
            Line.prototype.buildGeometry = function () {
                var geometry, direction, newStart, newEnd;
                geometry = new THREE.Geometry();
                direction = new THREE.Vector3();
                direction.subVectors(this.start, this.end);
                direction.normalize();
                newStart = new THREE.Vector3();
                newStart.addVectors(this.start, direction.multiplyScalar(this.length));
                newEnd = new THREE.Vector3();
                newEnd.addVectors(this.end, direction.negate());
                geometry.vertices.push(newStart, newEnd);
                return geometry;
            };
            Line.prototype.buildMaterial = function () {
                return new THREE.LineBasicMaterial({
                    color: this.color
                });
            };
            Line.DEFAULT_PARAMS = {
                color: 0xff0000,
                length: 2.5
            };
            return Line;
        })(THREE.Line);
        Helpers.Line = Line;
    })(Helpers = Foram3D.Helpers || (Foram3D.Helpers = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="../../../typings/threejs/three.d.ts" />
var Foram3D;
(function (Foram3D) {
    var Helpers;
    (function (Helpers) {
        var Plane = (function (_super) {
            __extends(Plane, _super);
            function Plane(position, spanningVector1, spanningVector2, params) {
                this.position = new THREE.Vector3().copy(position);
                this.spanningVector1 = new THREE.Vector3().copy(spanningVector1);
                this.spanningVector2 = new THREE.Vector3().copy(spanningVector2);
                Helpers.extend(this, params, Plane.DEFAULT_PARAMS);
                this.normalizeSpanningVectors();
                var geometry = this.buildGeometry();
                var material = this.buildMaterial();
                _super.call(this, geometry, material);
            }
            Plane.prototype.normalizeSpanningVectors = function () {
                this.spanningVector1.normalize().multiplyScalar(this.size);
                this.spanningVector2.normalize().multiplyScalar(this.size);
            };
            Plane.prototype.buildGeometry = function () {
                var geometry, point1, point2, point3, point4;
                geometry = new THREE.Geometry();
                point1 = new THREE.Vector3().copy(this.position);
                point2 = new THREE.Vector3().copy(this.position);
                point3 = new THREE.Vector3().copy(this.position);
                point4 = new THREE.Vector3().copy(this.position);
                point1.add(this.spanningVector1);
                point2.add(this.spanningVector2);
                point3.sub(this.spanningVector1);
                point4.sub(this.spanningVector2);
                geometry.vertices.push(point1, point2, point3, point4);
                geometry.faces.push(new THREE.Face3(0, 1, 2), new THREE.Face3(0, 2, 3));
                return geometry;
            };
            Plane.prototype.buildMaterial = function () {
                return new THREE.MeshBasicMaterial({
                    side: THREE.DoubleSide,
                    color: this.color,
                    transparent: true,
                    opacity: this.opacity
                });
            };
            Plane.DEFAULT_PARAMS = {
                color: 0xff0000,
                size: 10,
                opacity: 0.3
            };
            return Plane;
        })(THREE.Mesh);
        Helpers.Plane = Plane;
    })(Helpers = Foram3D.Helpers || (Foram3D.Helpers = {}));
})(Foram3D || (Foram3D = {}));
/// <reference path="../../../typings/threejs/three.d.ts" />
var Foram3D;
(function (Foram3D) {
    var Helpers;
    (function (Helpers) {
        var Point = (function (_super) {
            __extends(Point, _super);
            function Point(position, params) {
                Helpers.extend(this, params, Point.DEFAULT_PARAMS);
                var geometry = this.buildGeometry();
                var material = this.buildMaterial();
                _super.call(this, geometry, material);
                this.position.copy(position);
            }
            Point.prototype.buildGeometry = function () {
                return new THREE.SphereGeometry(this.size, Point.WIDTH_SEGMENTS, Point.HEIGHT_SEGMENTS);
            };
            Point.prototype.buildMaterial = function () {
                return new THREE.MeshLambertMaterial({
                    color: this.color,
                });
            };
            Point.WIDTH_SEGMENTS = 32;
            Point.HEIGHT_SEGMENTS = 32;
            Point.DEFAULT_PARAMS = {
                color: 0xff0000,
                size: 0.3
            };
            return Point;
        })(THREE.Mesh);
        Helpers.Point = Point;
    })(Helpers = Foram3D.Helpers || (Foram3D.Helpers = {}));
})(Foram3D || (Foram3D = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYW1iZXIudHMiLCJjaGFtYmVyX3BhdGhzL2NoYW1iZXJfcGF0aC50cyIsImNoYW1iZXJfcGF0aHMvY2VudHJvaWRzX3BhdGgudHMiLCJjaGFtYmVyX3BhdGhzL2FwZXJ0dXJlc19wYXRoLnRzIiwiY2FsY3VsYXRvcnMvY2FsY3VsYXRvci50cyIsImhlbHBlcnMvZmFjZS50cyIsImNhbGN1bGF0b3JzL2ZhY2VzX3Byb2Nlc3Nvci50cyIsImNhbGN1bGF0b3JzL3N1cmZhY2VfY2FsY3VsYXRvci50cyIsImNhbGN1bGF0b3JzL3ZvbHVtZV9jYWxjdWxhdG9yLnRzIiwiY2FsY3VsYXRvcnMvc2hhcGVfZmFjdG9yX2NhbGN1bGF0b3IudHMiLCJmb3JhbS50cyIsInNpbXVsYXRpb25fZ3VpLnRzIiwiY29udHJvbHMvdGFyZ2V0X2NvbnRyb2xzLnRzIiwiaGVscGVycy91dGlscy50cyIsInNpbXVsYXRpb24udHMiLCJleHBvcnQvZXhwb3J0ZXIudHMiLCJleHBvcnQvY3N2X2V4cG9ydGVyLnRzIiwiaGVscGVycy9saW5lLnRzIiwiaGVscGVycy9wbGFuZS50cyIsImhlbHBlcnMvcG9pbnQudHMiXSwibmFtZXMiOlsiRm9yYW0zRCIsIkZvcmFtM0QuQ2hhbWJlciIsIkZvcmFtM0QuQ2hhbWJlci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2hhbWJlci5zZXRBbmNlc3RvciIsIkZvcmFtM0QuQ2hhbWJlci5zZXRBcGVydHVyZSIsIkZvcmFtM0QuQ2hhbWJlci5zaG93VGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLmhpZGVUaGlja25lc3NWZWN0b3IiLCJGb3JhbTNELkNoYW1iZXIubWFya0FwZXJ0dXJlIiwiRm9yYW0zRC5DaGFtYmVyLnNlcmlhbGl6ZSIsIkZvcmFtM0QuQ2hhbWJlci5hcHBseU1hdGVyaWFsIiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkQXBlcnR1cmVNYXJrZXIiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuQ2hhbWJlci5idWlsZE1hdGVyaWFsIiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkVGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLmNhbGN1bGF0ZUFwZXJ0dXJlIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguZmV0Y2hDaGFtYmVyc0F0dHJpYnV0ZSIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmJ1aWxkUG9zaXRpb25zQnVmZmVyIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DZW50cm9pZHNQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2VudHJvaWRzUGF0aC5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNlbnRyb2lkc1BhdGgucmVidWlsZCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkFwZXJ0dXJlc1BhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5BcGVydHVyZXNQYXRoLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQXBlcnR1cmVzUGF0aC5yZWJ1aWxkIiwiRm9yYW0zRC5DYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2UiLCJGb3JhbTNELkhlbHBlcnMuRmFjZS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuSGVscGVycy5GYWNlLmNhbGN1bGF0ZUNlbnRyb2lkIiwiRm9yYW0zRC5DYWxjdWxhdG9ycyIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuRmFjZXNQcm9jZXNzb3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkZhY2VzUHJvY2Vzc29yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5GYWNlc1Byb2Nlc3Nvci5zdW1GYWNlcyIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VDYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TdXJmYWNlQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VDYWxjdWxhdG9yLmNhbGN1bGF0ZUZhY2VTdXJmYWNlQXJlYSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuVm9sdW1lQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuVm9sdW1lQ2FsY3VsYXRvci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuVm9sdW1lQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IuY2FsY3VsYXRlRmFjZVRldHJhaGVkcm9uVm9sdW1lIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNhbGN1bGF0ZURpc3RhbmNlQmV0d2VlbkhlYWRBbmRUYWlsIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IuY2FsY3VsYXRlQ2VudHJvaWRzUGF0aExlbmd0aCIsIkZvcmFtM0QuRm9yYW0iLCJGb3JhbTNELkZvcmFtLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5Gb3JhbS5ldm9sdmUiLCJGb3JhbTNELkZvcmFtLnJlZ3Jlc3MiLCJGb3JhbTNELkZvcmFtLnRvZ2dsZUNlbnRyb2lkc1BhdGgiLCJGb3JhbTNELkZvcmFtLnRvZ2dsZUFwZXJ0dXJlc1BhdGgiLCJGb3JhbTNELkZvcmFtLnNob3dUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5Gb3JhbS5oaWRlVGhpY2tuZXNzVmVjdG9ycyIsIkZvcmFtM0QuRm9yYW0udG9nZ2xlVGhpY2tuZXNzVmVjdG9ycyIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlU3VyZmFjZUFyZWEiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZVZvbHVtZSIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlU2hhcGVGYWN0b3IiLCJGb3JhbTNELkZvcmFtLmFwcGx5T3BhY2l0eSIsIkZvcmFtM0QuRm9yYW0uZ2V0QWN0aXZlQ2hhbWJlcnMiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5leHRDaGFtYmVyIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdDZW50ZXIiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZUdyb3d0aFZlY3Rvckxlbmd0aCIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3UmFkaXVzIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdUaGlja25lc3MiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld0FwZXJ0dXJlIiwiRm9yYW0zRC5Gb3JhbS5idWlsZEluaXRpYWxDaGFtYmVyIiwiRm9yYW0zRC5Gb3JhbS5idWlsZENoYW1iZXIiLCJGb3JhbTNELkZvcmFtLnVwZGF0ZUNoYW1iZXJQYXRocyIsIkZvcmFtM0QuRm9yYW0udXBkYXRlVGhpY2tuZXNzVmVjdG9ycyIsIkZvcmFtM0QuRm9yYW0udXBkYXRlQ2hhbWJlcnNNYXRlcmlhbCIsIkZvcmFtM0QuU2ltdWxhdGlvbkdVSSIsIkZvcmFtM0QuU2ltdWxhdGlvbkdVSS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuU2ltdWxhdGlvbkdVSS5zZXR1cCIsIkZvcmFtM0QuQ29udHJvbHMiLCJGb3JhbTNELkNvbnRyb2xzLlRhcmdldENvbnRyb2xzIiwiRm9yYW0zRC5Db250cm9scy5UYXJnZXRDb250cm9scy5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ29udHJvbHMuVGFyZ2V0Q29udHJvbHMuZml0VGFyZ2V0IiwiRm9yYW0zRC5Db250cm9scy5UYXJnZXRDb250cm9scy5jYWxjdWxhdGVCb3VuZGluZ1NwaGVyZSIsIkZvcmFtM0QuQ29udHJvbHMuVGFyZ2V0Q29udHJvbHMuY2FsY3VsYXRlRGlzdGFuY2VUb1RhcmdldCIsIkZvcmFtM0QuSGVscGVycy5leHRlbmQiLCJGb3JhbTNELlNpbXVsYXRpb24iLCJGb3JhbTNELlNpbXVsYXRpb24uY29uc3RydWN0b3IiLCJGb3JhbTNELlNpbXVsYXRpb24uc2ltdWxhdGUiLCJGb3JhbTNELlNpbXVsYXRpb24uZXZvbHZlIiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlZ3Jlc3MiLCJGb3JhbTNELlNpbXVsYXRpb24udG9nZ2xlQ2VudHJvaWRzUGF0aCIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVBcGVydHVyZXNQYXRoIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNhbGN1bGF0ZVN1cmZhY2VBcmVhIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNhbGN1bGF0ZVZvbHVtZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jYWxjdWxhdGVTaGFwZUZhY3RvciIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5TaW11bGF0aW9uLmFwcGx5T3BhY2l0eSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5leHBvcnRUb09CSiIsIkZvcmFtM0QuU2ltdWxhdGlvbi5leHBvcnRUb0NTViIsIkZvcmFtM0QuU2ltdWxhdGlvbi50YWtlU2NyZWVuc2hvdCIsIkZvcmFtM0QuU2ltdWxhdGlvbi5vbkNoYW1iZXJDbGljayIsIkZvcmFtM0QuU2ltdWxhdGlvbi5vbkNoYW1iZXJIb3ZlciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5maXRUYXJnZXQiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVzZXQiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBTY2VuZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cENvbnRyb2xzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwVGFyZ2V0Q29udHJvbHMiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBNb3VzZUV2ZW50cyIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cEF1dG9SZXNpemUiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBHVUkiLCJGb3JhbTNELlNpbXVsYXRpb24ub25Nb3VzZUNsaWNrIiwiRm9yYW0zRC5TaW11bGF0aW9uLm9uTW91c2VNb3ZlIiwiRm9yYW0zRC5TaW11bGF0aW9uLmdldFBvaW50ZWRDaGFtYmVyIiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlc2l6ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5hbmltYXRlIiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlbmRlciIsIkZvcmFtM0QuRXhwb3J0IiwiRm9yYW0zRC5FeHBvcnQuQ1NWRXhwb3J0ZXIiLCJGb3JhbTNELkV4cG9ydC5DU1ZFeHBvcnRlci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuRXhwb3J0LkNTVkV4cG9ydGVyLnBhcnNlIiwiRm9yYW0zRC5IZWxwZXJzLkxpbmUiLCJGb3JhbTNELkhlbHBlcnMuTGluZS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuSGVscGVycy5MaW5lLmJ1aWxkR2VvbWV0cnkiLCJGb3JhbTNELkhlbHBlcnMuTGluZS5idWlsZE1hdGVyaWFsIiwiRm9yYW0zRC5IZWxwZXJzLlBsYW5lIiwiRm9yYW0zRC5IZWxwZXJzLlBsYW5lLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLlBsYW5lLm5vcm1hbGl6ZVNwYW5uaW5nVmVjdG9ycyIsIkZvcmFtM0QuSGVscGVycy5QbGFuZS5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5IZWxwZXJzLlBsYW5lLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkhlbHBlcnMuUG9pbnQiLCJGb3JhbTNELkhlbHBlcnMuUG9pbnQuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMuUG9pbnQuYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuSGVscGVycy5Qb2ludC5idWlsZE1hdGVyaWFsIl0sIm1hcHBpbmdzIjoiQUFBQSx5REFBeUQ7Ozs7OztBQUV6RCxJQUFPLE9BQU8sQ0EwSmI7QUExSkQsV0FBTyxPQUFPLEVBQUMsQ0FBQztJQVFkQTtRQUE2QkMsMkJBQVVBO1FBMEJyQ0EsaUJBQVlBLE1BQXFCQSxFQUFFQSxNQUFjQSxFQUFFQSxTQUFpQkE7WUFDbEVDLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBO1lBQ3JCQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQTtZQUNyQkEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLFNBQVNBLEdBQUdBLFNBQVNBLENBQUNBO1lBRTNCQSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxhQUFhQSxFQUFFQSxDQUFDQTtZQUNwQ0EsSUFBSUEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0E7WUFFcENBLGtCQUFNQSxRQUFRQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQTtZQUUxQkEsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsaUJBQWlCQSxFQUFFQSxDQUFDQTtRQUMzQ0EsQ0FBQ0E7UUFFREQsNkJBQVdBLEdBQVhBLFVBQVlBLFdBQW9CQTtZQUM5QkUsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsV0FBV0EsQ0FBQ0E7WUFDNUJBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLFdBQVdBLENBQUNBLFFBQVFBLENBQUNBO1lBQ25DQSxXQUFXQSxDQUFDQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUMzQkEsQ0FBQ0E7UUFFREYsNkJBQVdBLEdBQVhBLFVBQVlBLFFBQXVCQTtZQUNqQ0csSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsUUFBUUEsQ0FBQ0E7WUFDekJBLElBQUlBLENBQUNBLFlBQVlBLEVBQUVBLENBQUNBO1FBQ3RCQSxDQUFDQTtRQUVESCxxQ0FBbUJBLEdBQW5CQTtZQUNFSSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDMUJBLElBQUlBLENBQUNBLGVBQWVBLEdBQUdBLElBQUlBLENBQUNBLG9CQUFvQkEsRUFBRUEsQ0FBQ0E7Z0JBQ25EQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxDQUFDQTtZQUNqQ0EsQ0FBQ0E7WUFFREEsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsT0FBT0EsR0FBR0EsSUFBSUEsQ0FBQ0E7UUFDdENBLENBQUNBO1FBRURKLHFDQUFtQkEsR0FBbkJBO1lBQ0VLLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLENBQUNBLENBQUNBO2dCQUN6QkEsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsT0FBT0EsR0FBR0EsS0FBS0EsQ0FBQ0E7WUFDdkNBLENBQUNBO1FBQ0hBLENBQUNBO1FBRURMLDhCQUFZQSxHQUFaQTtZQUNFTSxJQUFJQSxDQUFDQSxjQUFjQSxHQUFHQSxJQUFJQSxDQUFDQSxtQkFBbUJBLEVBQUVBLENBQUNBO1lBQ2pEQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxjQUFjQSxDQUFDQSxDQUFDQTtRQUNoQ0EsQ0FBQ0E7UUFFRE4sMkJBQVNBLEdBQVRBO1lBQ0VPLE1BQU1BLENBQUNBO2dCQUNMQSxNQUFNQSxFQUFLQSxJQUFJQSxDQUFDQSxNQUFNQTtnQkFDdEJBLFNBQVNBLEVBQUVBLElBQUlBLENBQUNBLFNBQVNBO2FBQzFCQSxDQUFDQTtRQUNKQSxDQUFDQTtRQUVEUCwrQkFBYUEsR0FBYkEsVUFBY0EsY0FBcUNBO1lBQ2pEUSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxJQUFJQSxjQUFjQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDakNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLGNBQWNBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1lBQy9DQSxDQUFDQTtRQUNIQSxDQUFDQTtRQUVPUixxQ0FBbUJBLEdBQTNCQTtZQUNFUyxJQUFJQSxZQUFZQSxHQUFHQTtnQkFDakJBLEtBQUtBLEVBQUVBLE9BQU9BLENBQUNBLHFCQUFxQkE7Z0JBQ3BDQSxJQUFJQSxFQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxPQUFPQSxDQUFDQSwyQkFBMkJBO2FBQ3pEQSxDQUFDQTtZQUVGQSxNQUFNQSxDQUFDQSxJQUFJQSxlQUFPQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxFQUFFQSxZQUFZQSxDQUFDQSxDQUFDQTtRQUN4REEsQ0FBQ0E7UUFFT1QsK0JBQWFBLEdBQXJCQTtZQUNFVSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxjQUFjQSxDQUNyQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFDWEEsT0FBT0EsQ0FBQ0EsY0FBY0EsRUFDdEJBLE9BQU9BLENBQUNBLGVBQWVBLENBQ3hCQSxDQUFDQTtZQUVGQSxRQUFRQSxDQUFDQSxXQUFXQSxDQUNsQkEsSUFBSUEsS0FBS0EsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0EsZUFBZUEsQ0FDakNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEVBQ2JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLEVBQ2JBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLENBQ2RBLENBQ0ZBLENBQUNBO1lBRUZBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBO1FBQ2xCQSxDQUFDQTtRQUVPViwrQkFBYUEsR0FBckJBO1lBQ0VXLE1BQU1BLENBQUNBLElBQUlBLEtBQUtBLENBQUNBLG1CQUFtQkEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxDQUFDQTtRQUNsRUEsQ0FBQ0E7UUFFT1gsc0NBQW9CQSxHQUE1QkE7WUFDRVksSUFBSUEsU0FBU0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFFM0NBLE1BQU1BLENBQUNBLElBQUlBLEtBQUtBLENBQUNBLFdBQVdBLENBQzFCQSxTQUFTQSxFQUNUQSxJQUFJQSxDQUFDQSxNQUFNQSxFQUNYQSxJQUFJQSxDQUFDQSxTQUFTQSxFQUNkQSxRQUFRQSxDQUNUQSxDQUFDQTtRQUNKQSxDQUFDQTtRQUVPWixtQ0FBaUJBLEdBQXpCQTtZQUNFYSxJQUFJQSxRQUFRQSxFQUFFQSxRQUFRQSxFQUFFQSxlQUFlQSxFQUFFQSxXQUFXQSxDQUFDQTtZQUVyREEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7WUFFbENBLFFBQVFBLEdBQUdBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3ZCQSxlQUFlQSxHQUFHQSxRQUFRQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUVuREEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsUUFBUUEsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsRUFBRUEsRUFBRUEsQ0FBQ0E7Z0JBQ3pDQSxXQUFXQSxHQUFHQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxVQUFVQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtnQkFFbERBLEVBQUVBLENBQUNBLENBQUNBLFdBQVdBLEdBQUdBLGVBQWVBLENBQUNBLENBQUNBLENBQUNBO29CQUNsQ0EsUUFBUUEsR0FBR0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3ZCQSxlQUFlQSxHQUFHQSxXQUFXQSxDQUFDQTtnQkFDaENBLENBQUNBO1lBQ0hBLENBQUNBO1lBRURBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBO1FBQ2xCQSxDQUFDQTtRQS9JY2Isc0JBQWNBLEdBQVlBLEVBQUVBLENBQUNBO1FBQzdCQSx1QkFBZUEsR0FBV0EsRUFBRUEsQ0FBQ0E7UUFFN0JBLHlCQUFpQkEsR0FBMEJBO1lBQ3hEQSxLQUFLQSxFQUFRQSxRQUFRQTtZQUNyQkEsV0FBV0EsRUFBRUEsSUFBSUE7WUFDakJBLE9BQU9BLEVBQU1BLEdBQUdBO1NBQ2pCQSxDQUFDQTtRQUVhQSw2QkFBcUJBLEdBQWlCQSxRQUFRQSxDQUFDQTtRQUMvQ0EsbUNBQTJCQSxHQUFXQSxJQUFJQSxDQUFDQTtRQXNJNURBLGNBQUNBO0lBQURBLENBakpBRCxBQWlKQ0MsRUFqSjRCRCxLQUFLQSxDQUFDQSxJQUFJQSxFQWlKdENBO0lBakpZQSxlQUFPQSxVQWlKbkJBLENBQUFBO0FBQ0hBLENBQUNBLEVBMUpNLE9BQU8sS0FBUCxPQUFPLFFBMEpiO0FDNUpELG9DQUFvQztBQUVwQyxJQUFPLE9BQU8sQ0FzRmI7QUF0RkQsV0FBTyxPQUFPO0lBQUNBLElBQUFBLFlBQVlBLENBc0YxQkE7SUF0RmNBLFdBQUFBLFlBQVlBLEVBQUNBLENBQUNBO1FBTTNCZTtZQUEwQ0MsK0JBQVVBO1lBYWxEQSxxQkFBWUEsS0FBWUEsRUFBRUEsTUFBMEJBO2dCQUNsREMsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0E7Z0JBRW5CQSxJQUFJQSxDQUFDQSxlQUFlQSxHQUFHQSxJQUFJQSxDQUFDQSxvQkFBb0JBLEVBQUVBLENBQUNBO2dCQUVuREEsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsTUFBTUEsSUFBSUEsTUFBTUEsQ0FBQ0EsS0FBS0EsSUFBSUEsV0FBV0EsQ0FBQ0EsYUFBYUEsQ0FBQ0E7Z0JBQ2pFQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxNQUFNQSxJQUFJQSxNQUFNQSxDQUFDQSxLQUFLQSxJQUFJQSxXQUFXQSxDQUFDQSxhQUFhQSxDQUFDQTtnQkFFakVBLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBO2dCQUNwQ0EsSUFBSUEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0E7Z0JBRXBDQSxrQkFBTUEsUUFBUUEsRUFBRUEsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBRTFCQSxJQUFJQSxDQUFDQSxPQUFPQSxFQUFFQSxDQUFDQTtZQUNqQkEsQ0FBQ0E7WUFJU0QsK0JBQVNBLEdBQW5CQSxVQUFvQkEsTUFBNEJBO2dCQUM5Q0UsSUFBSUEsU0FBU0EsRUFBRUEsS0FBS0EsRUFBRUEsS0FBS0EsQ0FBQ0E7Z0JBRTVCQSxTQUFTQSxHQUFHQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFDdkNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBO2dCQUVWQSxHQUFHQSxDQUFDQSxDQUFVQSxVQUFNQSxFQUFmQSxrQkFBS0EsRUFBTEEsSUFBZUEsQ0FBQ0E7b0JBQWhCQSxLQUFLQSxHQUFJQSxNQUFNQSxJQUFWQTtvQkFDUkEsU0FBU0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQzdCQSxTQUFTQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDN0JBLFNBQVNBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBO2lCQUM5QkE7Z0JBRURBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFlBQVlBLENBQUNBLENBQUNBLEVBQUVBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO2dCQUU3Q0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsV0FBV0EsR0FBR0EsSUFBSUEsQ0FBQ0E7WUFDMUNBLENBQUNBO1lBRVNGLDRDQUFzQkEsR0FBaENBLFVBQWlDQSxhQUFxQkE7Z0JBQ3BERyxJQUFJQSxjQUFjQSxFQUFFQSxPQUFPQSxFQUFFQSxVQUFVQSxHQUFHQSxFQUFFQSxDQUFDQTtnQkFFN0NBLGNBQWNBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLGlCQUFpQkEsRUFBRUEsQ0FBQ0E7Z0JBRWhEQSxHQUFHQSxDQUFDQSxDQUFZQSxVQUFjQSxFQUF6QkEsMEJBQU9BLEVBQVBBLElBQXlCQSxDQUFDQTtvQkFBMUJBLE9BQU9BLEdBQUlBLGNBQWNBLElBQWxCQTtvQkFDVkEsVUFBVUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7aUJBQ3pDQTtnQkFFREEsTUFBTUEsQ0FBQ0EsVUFBVUEsQ0FBQ0E7WUFDcEJBLENBQUNBO1lBRU9ILDBDQUFvQkEsR0FBNUJBO2dCQUNFSSxNQUFNQSxDQUFDQSxJQUFJQSxLQUFLQSxDQUFDQSxlQUFlQSxDQUM5QkEsSUFBSUEsWUFBWUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsVUFBVUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FDaERBLENBQUNBO1lBQ0pBLENBQUNBO1lBRU9KLG1DQUFhQSxHQUFyQkE7Z0JBQ0VLLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLGNBQWNBLEVBQUVBLENBQUNBO2dCQUMxQ0EsUUFBUUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsVUFBVUEsRUFBRUEsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsQ0FBQ0E7Z0JBRXhEQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQTtZQUNsQkEsQ0FBQ0E7WUFFT0wsbUNBQWFBLEdBQXJCQTtnQkFDRU0sTUFBTUEsQ0FBQ0EsSUFBSUEsS0FBS0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQTtvQkFDakNBLEtBQUtBLEVBQU1BLElBQUlBLENBQUNBLEtBQUtBO29CQUNyQkEsU0FBU0EsRUFBRUEsSUFBSUEsQ0FBQ0EsS0FBS0E7aUJBQ3RCQSxDQUFDQSxDQUFDQTtZQUNMQSxDQUFDQTtZQTdFY04sc0JBQVVBLEdBQVdBLEdBQUdBLENBQUNBO1lBRXpCQSx5QkFBYUEsR0FBV0EsUUFBUUEsQ0FBQ0E7WUFDakNBLHlCQUFhQSxHQUFXQSxDQUFDQSxDQUFDQTtZQTJFM0NBLGtCQUFDQTtRQUFEQSxDQS9FQUQsQUErRUNDLEVBL0V5Q0QsS0FBS0EsQ0FBQ0EsSUFBSUEsRUErRW5EQTtRQS9FcUJBLHdCQUFXQSxjQStFaENBLENBQUFBO0lBQ0hBLENBQUNBLEVBdEZjZixZQUFZQSxHQUFaQSxvQkFBWUEsS0FBWkEsb0JBQVlBLFFBc0YxQkE7QUFBREEsQ0FBQ0EsRUF0Rk0sT0FBTyxLQUFQLE9BQU8sUUFzRmI7QUN4RkQsMENBQTBDO0FBRTFDLElBQU8sT0FBTyxDQU9iO0FBUEQsV0FBTyxPQUFPO0lBQUNBLElBQUFBLFlBQVlBLENBTzFCQTtJQVBjQSxXQUFBQSxZQUFZQSxFQUFDQSxDQUFDQTtRQUMzQmU7WUFBbUNRLGlDQUFXQTtZQUE5Q0E7Z0JBQW1DQyw4QkFBV0E7WUFLOUNBLENBQUNBO1lBSkNELCtCQUFPQSxHQUFQQTtnQkFDRUUsSUFBSUEsU0FBU0EsR0FBR0EsSUFBSUEsQ0FBQ0Esc0JBQXNCQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtnQkFDdERBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO1lBQzVCQSxDQUFDQTtZQUNIRixvQkFBQ0E7UUFBREEsQ0FMQVIsQUFLQ1EsRUFMa0NSLHdCQUFXQSxFQUs3Q0E7UUFMWUEsMEJBQWFBLGdCQUt6QkEsQ0FBQUE7SUFDSEEsQ0FBQ0EsRUFQY2YsWUFBWUEsR0FBWkEsb0JBQVlBLEtBQVpBLG9CQUFZQSxRQU8xQkE7QUFBREEsQ0FBQ0EsRUFQTSxPQUFPLEtBQVAsT0FBTyxRQU9iO0FDVEQsMENBQTBDO0FBRTFDLElBQU8sT0FBTyxDQU9iO0FBUEQsV0FBTyxPQUFPO0lBQUNBLElBQUFBLFlBQVlBLENBTzFCQTtJQVBjQSxXQUFBQSxZQUFZQSxFQUFDQSxDQUFDQTtRQUMzQmU7WUFBbUNXLGlDQUFXQTtZQUE5Q0E7Z0JBQW1DQyw4QkFBV0E7WUFLOUNBLENBQUNBO1lBSkNELCtCQUFPQSxHQUFQQTtnQkFDRUUsSUFBSUEsU0FBU0EsR0FBR0EsSUFBSUEsQ0FBQ0Esc0JBQXNCQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtnQkFDeERBLElBQUlBLENBQUNBLFNBQVNBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO1lBQzVCQSxDQUFDQTtZQUNIRixvQkFBQ0E7UUFBREEsQ0FMQVgsQUFLQ1csRUFMa0NYLHdCQUFXQSxFQUs3Q0E7UUFMWUEsMEJBQWFBLGdCQUt6QkEsQ0FBQUE7SUFDSEEsQ0FBQ0EsRUFQY2YsWUFBWUEsR0FBWkEsb0JBQVlBLEtBQVpBLG9CQUFZQSxRQU8xQkE7QUFBREEsQ0FBQ0EsRUFQTSxPQUFPLEtBQVAsT0FBTyxRQU9iO0FDVEQsb0NBQW9DO0FBRXBDLElBQU8sT0FBTyxDQVViO0FBVkQsV0FBTyxPQUFPLEVBQUMsQ0FBQztJQUNkQTtRQUdFNkIsb0JBQVlBLEtBQVlBO1lBQ3RCQyxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQTtRQUNyQkEsQ0FBQ0E7UUFHSEQsaUJBQUNBO0lBQURBLENBUkE3QixBQVFDNkIsSUFBQTdCO0lBUnFCQSxrQkFBVUEsYUFRL0JBLENBQUFBO0FBQ0hBLENBQUNBLEVBVk0sT0FBTyxLQUFQLE9BQU8sUUFVYjtBQ1pELElBQU8sT0FBTyxDQW9CYjtBQXBCRCxXQUFPLE9BQU87SUFBQ0EsSUFBQUEsT0FBT0EsQ0FvQnJCQTtJQXBCY0EsV0FBQUEsT0FBT0EsRUFBQ0EsQ0FBQ0E7UUFDdEIrQjtZQU9FQyxjQUFZQSxFQUFpQkEsRUFBRUEsRUFBaUJBLEVBQUVBLEVBQWlCQTtnQkFDakVDLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBO2dCQUNiQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQTtnQkFDYkEsSUFBSUEsQ0FBQ0EsRUFBRUEsR0FBR0EsRUFBRUEsQ0FBQ0E7Z0JBRWJBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLGlCQUFpQkEsRUFBRUEsQ0FBQ0E7WUFDM0NBLENBQUNBO1lBRU9ELGdDQUFpQkEsR0FBekJBO2dCQUNFRSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNuRUEsQ0FBQ0E7WUFDSEYsV0FBQ0E7UUFBREEsQ0FsQkFELEFBa0JDQyxJQUFBRDtRQWxCWUEsWUFBSUEsT0FrQmhCQSxDQUFBQTtJQUNIQSxDQUFDQSxFQXBCYy9CLE9BQU9BLEdBQVBBLGVBQU9BLEtBQVBBLGVBQU9BLFFBb0JyQkE7QUFBREEsQ0FBQ0EsRUFwQk0sT0FBTyxLQUFQLE9BQU8sUUFvQmI7QUNwQkQsb0NBQW9DO0FBQ3BDLDJDQUEyQztBQUUzQyxJQUFPLE9BQU8sQ0FnRGI7QUFoREQsV0FBTyxPQUFPO0lBQUNBLElBQUFBLFdBQVdBLENBZ0R6QkE7SUFoRGNBLFdBQUFBLFdBQVdBLEVBQUNBLENBQUNBO1FBQzFCbUM7WUFHRUMsd0JBQVlBLEtBQVlBO2dCQUN0QkMsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0E7WUFDckJBLENBQUNBO1lBRURELGlDQUFRQSxHQUFSQSxVQUFTQSxTQUF5Q0E7Z0JBQ2hERSxJQUFJQSxRQUFRQSxFQUFFQSxPQUFPQSxFQUFFQSxZQUFZQSxFQUMvQkEsS0FBS0EsRUFBRUEsSUFBSUEsRUFBRUEsVUFBVUEsRUFBRUEsV0FBV0EsRUFDcENBLFFBQVFBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQ3BCQSxNQUFNQSxDQUFDQTtnQkFFWEEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsaUJBQWlCQSxFQUFFQSxDQUFDQTtnQkFDMUNBLE1BQU1BLEdBQUtBLENBQUNBLENBQUNBO2dCQUViQSxHQUFHQSxDQUFDQSxDQUFZQSxVQUFRQSxFQUFuQkEsb0JBQU9BLEVBQVBBLElBQW1CQSxDQUFDQTtvQkFBcEJBLE9BQU9BLEdBQUlBLFFBQVFBLElBQVpBO29CQUNWQSxLQUFLQSxHQUFNQSxPQUFPQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQTtvQkFDbENBLFFBQVFBLEdBQUdBLE9BQU9BLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBO29CQUVyQ0EsR0FBR0EsQ0FBQ0EsQ0FBU0EsVUFBS0EsRUFBYkEsaUJBQUlBLEVBQUpBLElBQWFBLENBQUNBO3dCQUFkQSxJQUFJQSxHQUFJQSxLQUFLQSxJQUFUQTt3QkFDUEEsRUFBRUEsR0FBR0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3RCQSxFQUFFQSxHQUFHQSxRQUFRQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDdEJBLEVBQUVBLEdBQUdBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO3dCQUV0QkEsVUFBVUEsR0FBR0EsSUFBSUEsZUFBT0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7d0JBRTFDQSxXQUFXQSxHQUFHQSxJQUFJQSxDQUFDQTt3QkFFbkJBLEdBQUdBLENBQUNBLENBQWlCQSxVQUFRQSxFQUF4QkEsb0JBQVlBLEVBQVpBLElBQXdCQSxDQUFDQTs0QkFBekJBLFlBQVlBLEdBQUlBLFFBQVFBLElBQVpBOzRCQUNmQSxFQUFFQSxDQUFDQSxDQUFDQSxZQUFZQSxJQUFJQSxPQUFPQSxDQUFDQTtnQ0FBQ0EsUUFBUUEsQ0FBQ0E7NEJBRXRDQSxFQUFFQSxDQUFDQSxDQUFDQSxVQUFVQSxDQUFDQSxRQUFRQSxDQUFDQSxVQUFVQSxDQUFDQSxZQUFZQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxZQUFZQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtnQ0FDOUVBLFdBQVdBLEdBQUdBLEtBQUtBLENBQUNBO2dDQUNwQkEsS0FBS0EsQ0FBQ0E7NEJBQ1JBLENBQUNBO3lCQUNGQTt3QkFFREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ2hCQSxNQUFNQSxJQUFJQSxTQUFTQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTt3QkFDbENBLENBQUNBO3FCQUNGQTtpQkFDRkE7Z0JBRURBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO1lBQ2hCQSxDQUFDQTtZQUNIRixxQkFBQ0E7UUFBREEsQ0E5Q0FELEFBOENDQyxJQUFBRDtRQTlDWUEsMEJBQWNBLGlCQThDMUJBLENBQUFBO0lBQ0hBLENBQUNBLEVBaERjbkMsV0FBV0EsR0FBWEEsbUJBQVdBLEtBQVhBLG1CQUFXQSxRQWdEekJBO0FBQURBLENBQUNBLEVBaERNLE9BQU8sS0FBUCxPQUFPLFFBZ0RiO0FDbkRELHdDQUF3QztBQUN4Qyw2Q0FBNkM7QUFFN0MsSUFBTyxPQUFPLENBbUJiO0FBbkJELFdBQU8sT0FBTztJQUFDQSxJQUFBQSxXQUFXQSxDQW1CekJBO0lBbkJjQSxXQUFBQSxXQUFXQSxFQUFDQSxDQUFDQTtRQUMxQm1DO1lBQXVDSSxxQ0FBVUE7WUFBakRBO2dCQUF1Q0MsOEJBQVVBO1lBaUJqREEsQ0FBQ0E7WUFoQkNELHFDQUFTQSxHQUFUQTtnQkFDRUUsSUFBSUEsY0FBY0EsR0FBR0EsSUFBSUEsMEJBQWNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO2dCQUNwREEsTUFBTUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0Esd0JBQXdCQSxDQUFDQSxDQUFDQTtZQUNoRUEsQ0FBQ0E7WUFFT0Ysb0RBQXdCQSxHQUFoQ0EsVUFBaUNBLElBQWtCQTtnQkFDakRHLElBQUlBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLEtBQUtBLENBQUNBO2dCQUVsQkEsRUFBRUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2xDQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtnQkFFbENBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO2dCQUM1QkEsS0FBS0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBRTNCQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUM1QkEsQ0FBQ0E7WUFDSEgsd0JBQUNBO1FBQURBLENBakJBSixBQWlCQ0ksRUFqQnNDSixrQkFBVUEsRUFpQmhEQTtRQWpCWUEsNkJBQWlCQSxvQkFpQjdCQSxDQUFBQTtJQUNIQSxDQUFDQSxFQW5CY25DLFdBQVdBLEdBQVhBLG1CQUFXQSxLQUFYQSxtQkFBV0EsUUFtQnpCQTtBQUFEQSxDQUFDQSxFQW5CTSxPQUFPLEtBQVAsT0FBTyxRQW1CYjtBQ3RCRCx3Q0FBd0M7QUFDeEMsNkNBQTZDO0FBRTdDLElBQU8sT0FBTyxDQW9CYjtBQXBCRCxXQUFPLE9BQU87SUFBQ0EsSUFBQUEsV0FBV0EsQ0FvQnpCQTtJQXBCY0EsV0FBQUEsV0FBV0EsRUFBQ0EsQ0FBQ0E7UUFDMUJtQztZQUFzQ1Esb0NBQVVBO1lBQWhEQTtnQkFBc0NDLDhCQUFVQTtZQWtCaERBLENBQUNBO1lBakJDRCxvQ0FBU0EsR0FBVEE7Z0JBQ0VFLElBQUlBLGNBQWNBLEdBQUdBLElBQUlBLDBCQUFjQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtnQkFDcERBLE1BQU1BLENBQUNBLGNBQWNBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLDhCQUE4QkEsQ0FBQ0EsQ0FBQ0E7WUFDdEVBLENBQUNBO1lBRU9GLHlEQUE4QkEsR0FBdENBLFVBQXVDQSxJQUFrQkE7Z0JBQ3ZERyxJQUFJQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQTtnQkFFdkNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUFBO2dCQUN4Q0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQUE7Z0JBQ3hDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFBQTtnQkFDeENBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUFBO2dCQUN4Q0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQUE7Z0JBQ3hDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFBQTtnQkFFeENBLE1BQU1BLENBQUNBLENBQUNBLENBQUNBLElB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Q0EsQ0FBQ0EsQ0FBQ0E7WUFDNUNBLElBQUlBLENBQUNBLFlBQVlBLENBQUNBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLFlBQVlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQzVDQSxJQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxVQUFVQSxDQUFDQTtZQUVsQ0EsTUFBTUEsQ0FBQ0EsVUFBVUEsQ0FBQ0E7UUFDcEJBLENBQUNBO1FBRU9kLGtDQUFrQkEsR0FBMUJBO1lBQ0VlLElBQUlBLGFBQWFBLEVBQUVBLHdCQUF3QkEsRUFBRUEsZ0JBQWdCQSxFQUFFQSxZQUFZQSxFQUN2RUEsU0FBU0EsQ0FBQ0E7WUFFZEEsYUFBYUEsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0E7WUFFcENBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLElBQUlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO2dCQUM5QkEsYUFBYUEsQ0FBQ0EsVUFBVUEsQ0FDdEJBLElBQUlBLENBQUNBLFlBQVlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLFFBQVFBLEVBQzdCQSxJQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUM1QkEsQ0FBQ0E7WUFDSkEsQ0FBQ0E7WUFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ05BLGFBQWFBLENBQUNBLFVBQVVBLENBQ3RCQSxJQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxRQUFRQSxFQUM3QkEsSUFBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FDOUJBLENBQUNBO1lBQ0pBLENBQUNBO1lBRURBLHdCQUF3QkEsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0E7WUFFL0NBLE1BQU1BLENBQUNBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLE1B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QUFDQTtZQUNqQkEsZUFBT0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsVUFBVUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsQ0FBQ0E7WUFFL0RBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBO1lBRXJCQSxJQUFJQSxDQUFDQSxVQUFVQSxFQUFFQSxDQUFDQTtZQUNsQkEsSUFBSUEsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLG1CQUFtQkEsRUFBRUEsQ0FBQ0E7WUFDM0JBLElBQUlBLENBQUNBLGdCQUFnQkEsRUFBRUEsQ0FBQ0E7WUFDeEJBLElBQUlBLENBQUNBLGVBQWVBLEVBQUVBLENBQUNBO1lBRXZCQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDcEJBLElBQUlBLENBQUNBLFFBQVFBLEVBQUVBLENBQUNBO1lBQ2xCQSxDQUFDQTtZQUVEQSxJQUFJQSxDQUFDQSxPQUFPQSxFQUFFQSxDQUFDQTtRQUNqQkEsQ0FBQ0E7UUFFREQsNkJBQVFBLEdBQVJBLFVBQVNBLFFBQWtCQSxFQUFFQSxXQUFtQkE7WUFDOUNFLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBO1lBRWJBLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLGFBQUtBLENBQUNBLFFBQVFBLEVBQUVBLFdBQVdBLENBQUNBLENBQUNBO1lBRTlDQSxJQUFJQSxDQUFDQSxTQUFTQSxFQUFFQSxDQUFDQTtZQUVqQkEsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7UUFDN0JBLENBQUNBO1FBRURGLDJCQUFNQSxHQUFOQTtZQUNFRyxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQTtnQkFBQ0EsTUFBTUEsQ0FBQ0E7WUFFeEJBLElBQUlBLENBQUNB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Q0FBQ0EsZUFBZUEsQ0FBQ0EsU0FBU0EsRUFBRUEsQ0FBQ0EsY0FBY0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDN0RBLENBQUNBO1lBRU9GLDZCQUFhQSxHQUFyQkE7Z0JBQ0VHLElBQUlBLFFBQVFBLEVBQUVBLE1BQU1BLEVBQUVBLE1BQU1BLEVBQUVBLE1BQU1BLEVBQUVBLE1BQU1BLENBQUNBO2dCQUU3Q0EsUUFBUUEsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsUUFBUUEsRUFBRUEsQ0FBQ0E7Z0JBRWhDQSxNQUFNQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxPQUFPQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtnQkFDakRBLE1BQU1BLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO2dCQUNqREEsTUFBTUEsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2pEQSxNQUFNQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxPQUFPQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtnQkFFakRBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLENBQUNBO2dCQUNqQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2pDQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxDQUFDQTtnQkFDakNBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLENBQUNBO2dCQUVqQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FDcEJBLE1BQU1BLEVBQUVBLE1BQU1BLEVBQUVBLE1BQU1BLEVBQUVBLE1BQU1BLENBQy9CQSxDQUFDQTtnQkFFRkEsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FDakJBLElBQUlBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEVBQ3hCQSxJQUFJQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUN6QkEsQ0FBQ0E7Z0JBRUZBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBO1lBQ2xCQSxDQUFDQTtZQUVPSCw2QkFBYUEsR0FBckJBO2dCQUNFSSxNQUFNQSxDQUFDQSxJQUFJQSxLQUFLQSxDQUFDQSxpQkFBaUJBLENBQUNBO29CQUNqQ0EsSUFBSUEsRUFBU0EsS0FBS0EsQ0FBQ0EsVUFBVUE7b0JBQzdCQSxLQUFLQSxFQUFRQSxJQUFJQSxDQUFDQSxLQUFLQTtvQkFDdkJBLFdBQVdBLEVBQUVBLElBQUlBO29CQUNqQkEsT0FBT0EsRUFBTUEsSUFBSUEsQ0FBQ0EsT0FBT0E7aUJBQzFCQSxDQUFDQSxDQUFDQTtZQUNMQSxDQUFDQTtZQXZFY0osb0JBQWNBLEdBQWdCQTtnQkFDM0NBLEtBQUtBLEVBQUlBLFFBQVFBO2dCQUNqQkEsSUFBSUEsRUFBS0EsRUFBRUE7Z0JBQ1hBLE9BQU9BLEVBQUVBLEdBQUdBO2FBQ2JBLENBQUNBO1lBb0VKQSxZQUFDQTtRQUFEQSxDQXpFQS9GLEFBeUVDK0YsRUF6RTBCL0YsS0FBS0EsQ0FBQ0EsSUFBSUEsRUF5RXBDQTtRQXpFWUEsYUFBS0EsUUF5RWpCQSxDQUFBQTtJQUNIQSxDQUFDQSxFQWpGYy9CLE9BQU9BLEdBQVBBLGVBQU9BLEtBQVBBLGVBQU9BLFFBaUZyQkE7QUFBREEsQ0FBQ0EsRUFqRk0sT0FBTyxLQUFQLE9BQU8sUUFpRmI7QUNuRkQsNERBQTREO0FBRTVELElBQU8sT0FBTyxDQTZDYjtBQTdDRCxXQUFPLE9BQU87SUFBQ0EsSUFBQUEsT0FBT0EsQ0E2Q3JCQTtJQTdDY0EsV0FBQUEsT0FBT0EsRUFBQ0EsQ0FBQ0E7UUFNdEIrQjtZQUEyQm9HLHlCQUFVQTtZQWNuQ0EsZUFBWUEsUUFBdUJBLEVBQUVBLE1BQW9CQTtnQkFDdkRDLE9BQU9BLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLEVBQUVBLE1BQU1BLEVBQUVBLEtBQUtBLENBQUNBLGNBQWNBLENBQUNBLENBQUNBO2dCQUVuREEsSUFBSUEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0E7Z0JBQ3BDQSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxhQUFhQSxFQUFFQSxDQUFDQTtnQkFFcENBLGtCQUFNQSxRQUFRQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQTtnQkFFMUJBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1lBQy9CQSxDQUFDQTtZQUVPRCw2QkFBYUEsR0FBckJBO2dCQUNFRSxNQUFNQSxDQUFDQSxJQUFJQSxLQUFLQSxDQUFDQSxjQUFjQSxDQUM3QkEsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFDVEEsS0FBS0EsQ0FBQ0EsY0FBY0EsRUFDcEJBLEtBQUtBLENBQUNBLGVBQWVBLENBQ3RCQSxDQUFDQTtZQUNKQSxDQUFDQTtZQUVPRiw2QkFBYUEsR0FBckJBO2dCQUNFRyxNQUFNQSxDQUFDQSxJQUFJQSxLQUFLQSxDQUFDQSxtQkFBbUJBLENBQUNBO29CQUNuQ0EsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsS0FBS0E7aUJBQ2xCQSxDQUFDQSxDQUFDQTtZQUNMQSxDQUFDQTtZQXBDY0gsb0JBQWNBLEdBQVlBLEVBQUVBLENBQUNBO1lBQzdCQSxxQkFBZUEsR0FBV0EsRUFBRUEsQ0FBQ0E7WUFFN0JBLG9CQUFjQSxHQUFnQkE7Z0JBQzNDQSxLQUFLQSxFQUFFQSxRQUFRQTtnQkFDZkEsSUFBSUEsRUFBR0EsR0FBR0E7YUFDWEEsQ0FBQ0E7WUErQkpBLFlBQUNBO1FBQURBLENBdENBcEcsQUFzQ0NvRyxFQXRDMEJwRyxLQUFLQSxDQUFDQSxJQUFJQSxFQXNDcENBO1FBdENZQSxhQUFLQSxRQXNDakJBLENBQUFBO0lBQ0hBLENBQUNBLEVBN0NjL0IsT0FBT0EsR0FBUEEsZUFBT0EsS0FBUEEsZUFBT0EsUUE2Q3JCQTtBQUFEQSxDQUFDQSxFQTdDTSxPQUFPLEtBQVAsT0FBTyxRQTZDYiIsImZpbGUiOiJmb3JhbTNkLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGxdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
