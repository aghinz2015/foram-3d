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
var Foram3D;
(function (Foram3D) {
    var Helpers;
    (function (Helpers) {
        var ColorSequencer = (function () {
            function ColorSequencer(colors) {
                this.colors = colors || ColorSequencer.COLORS;
                this.currentColorIndex = 0;
            }
            ColorSequencer.prototype.next = function () {
                var color = this.colors[this.currentColorIndex];
                this.currentColorIndex += 1;
                this.currentColorIndex %= this.colors.length;
                return color;
            };
            ColorSequencer.prototype.reset = function () {
                this.currentColorIndex = 0;
            };
            ColorSequencer.COLORS = [
                0xff0000,
                0x00ff00,
                0x0000ff
            ];
            return ColorSequencer;
        })();
        Helpers.ColorSequencer = ColorSequencer;
    })(Helpers = Foram3D.Helpers || (Foram3D.Helpers = {}));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYW1iZXIudHMiLCJjaGFtYmVyX3BhdGhzL2NoYW1iZXJfcGF0aC50cyIsImNoYW1iZXJfcGF0aHMvY2VudHJvaWRzX3BhdGgudHMiLCJjaGFtYmVyX3BhdGhzL2FwZXJ0dXJlc19wYXRoLnRzIiwiY2FsY3VsYXRvcnMvY2FsY3VsYXRvci50cyIsImhlbHBlcnMvZmFjZS50cyIsImNhbGN1bGF0b3JzL2ZhY2VzX3Byb2Nlc3Nvci50cyIsImNhbGN1bGF0b3JzL3N1cmZhY2VfY2FsY3VsYXRvci50cyIsImNhbGN1bGF0b3JzL3ZvbHVtZV9jYWxjdWxhdG9yLnRzIiwiY2FsY3VsYXRvcnMvc2hhcGVfZmFjdG9yX2NhbGN1bGF0b3IudHMiLCJmb3JhbS50cyIsInNpbXVsYXRpb25fZ3VpLnRzIiwiY29udHJvbHMvdGFyZ2V0X2NvbnRyb2xzLnRzIiwiaGVscGVycy91dGlscy50cyIsInNpbXVsYXRpb24udHMiLCJleHBvcnQvZXhwb3J0ZXIudHMiLCJleHBvcnQvY3N2X2V4cG9ydGVyLnRzIiwiaGVscGVycy9jb2xvcl9zZXF1ZW5jZXIudHMiLCJoZWxwZXJzL2xpbmUudHMiLCJoZWxwZXJzL3BsYW5lLnRzIiwiaGVscGVycy9wb2ludC50cyJdLCJuYW1lcyI6WyJGb3JhbTNEIiwiRm9yYW0zRC5DaGFtYmVyIiwiRm9yYW0zRC5DaGFtYmVyLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLnNldEFuY2VzdG9yIiwiRm9yYW0zRC5DaGFtYmVyLnNldEFwZXJ0dXJlIiwiRm9yYW0zRC5DaGFtYmVyLnNob3dUaGlja25lc3NWZWN0b3IiLCJGb3JhbTNELkNoYW1iZXIuaGlkZVRoaWNrbmVzc1ZlY3RvciIsIkZvcmFtM0QuQ2hhbWJlci5tYXJrQXBlcnR1cmUiLCJGb3JhbTNELkNoYW1iZXIuc2VyaWFsaXplIiwiRm9yYW0zRC5DaGFtYmVyLmFwcGx5TWF0ZXJpYWwiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRBcGVydHVyZU1hcmtlciIsIkZvcmFtM0QuQ2hhbWJlci5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRUaGlja25lc3NWZWN0b3IiLCJGb3JhbTNELkNoYW1iZXIuY2FsY3VsYXRlQXBlcnR1cmUiLCJGb3JhbTNELkNoYW1iZXJQYXRocyIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguY29uc3RydWN0b3IiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5idWlsZFBhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5mZXRjaENoYW1iZXJzQXR0cmlidXRlIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRQb3NpdGlvbnNCdWZmZXIiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNlbnRyb2lkc1BhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DZW50cm9pZHNQYXRoLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2VudHJvaWRzUGF0aC5yZWJ1aWxkIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQXBlcnR1cmVzUGF0aCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkFwZXJ0dXJlc1BhdGguY29uc3RydWN0b3IiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5BcGVydHVyZXNQYXRoLnJlYnVpbGQiLCJGb3JhbTNELkNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMiLCJGb3JhbTNELkhlbHBlcnMuRmFjZSIsIkZvcmFtM0QuSGVscGVycy5GYWNlLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2UuY2FsY3VsYXRlQ2VudHJvaWQiLCJGb3JhbTNELkNhbGN1bGF0b3JzIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5GYWNlc1Byb2Nlc3NvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuRmFjZXNQcm9jZXNzb3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkZhY2VzUHJvY2Vzc29yLnN1bUZhY2VzIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TdXJmYWNlQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUNhbGN1bGF0b3IuY2FsY3VsYXRlRmFjZVN1cmZhY2VBcmVhIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5Wb2x1bWVDYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5Wb2x1bWVDYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5Wb2x1bWVDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuVm9sdW1lQ2FsY3VsYXRvci5jYWxjdWxhdGVGYWNlVGV0cmFoZWRyb25Wb2x1bWUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IuY2FsY3VsYXRlIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IuY2FsY3VsYXRlRGlzdGFuY2VCZXR3ZWVuSGVhZEFuZFRhaWwiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvci5jYWxjdWxhdGVDZW50cm9pZHNQYXRoTGVuZ3RoIiwiRm9yYW0zRC5Gb3JhbSIsIkZvcmFtM0QuRm9yYW0uY29uc3RydWN0b3IiLCJGb3JhbTNELkZvcmFtLmV2b2x2ZSIsIkZvcmFtM0QuRm9yYW0ucmVncmVzcyIsIkZvcmFtM0QuRm9yYW0udG9nZ2xlQ2VudHJvaWRzUGF0aCIsIkZvcmFtM0QuRm9yYW0udG9nZ2xlQXBlcnR1cmVzUGF0aCIsIkZvcmFtM0QuRm9yYW0uc2hvd1RoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELkZvcmFtLmhpZGVUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5Gb3JhbS50b2dnbGVUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVTdXJmYWNlQXJlYSIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlVm9sdW1lIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVTaGFwZUZhY3RvciIsIkZvcmFtM0QuRm9yYW0uYXBwbHlPcGFjaXR5IiwiRm9yYW0zRC5Gb3JhbS5nZXRBY3RpdmVDaGFtYmVycyIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV4dENoYW1iZXIiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld0NlbnRlciIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlR3Jvd3RoVmVjdG9yTGVuZ3RoIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdSYWRpdXMiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld1RoaWNrbmVzcyIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3QXBlcnR1cmUiLCJGb3JhbTNELkZvcmFtLmJ1aWxkSW5pdGlhbENoYW1iZXIiLCJGb3JhbTNELkZvcmFtLmJ1aWxkQ2hhbWJlciIsIkZvcmFtM0QuRm9yYW0udXBkYXRlQ2hhbWJlclBhdGhzIiwiRm9yYW0zRC5Gb3JhbS51cGRhdGVUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5Gb3JhbS51cGRhdGVDaGFtYmVyc01hdGVyaWFsIiwiRm9yYW0zRC5TaW11bGF0aW9uR1VJIiwiRm9yYW0zRC5TaW11bGF0aW9uR1VJLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5TaW11bGF0aW9uR1VJLnNldHVwIiwiRm9yYW0zRC5Db250cm9scyIsIkZvcmFtM0QuQ29udHJvbHMuVGFyZ2V0Q29udHJvbHMiLCJGb3JhbTNELkNvbnRyb2xzLlRhcmdldENvbnRyb2xzLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5Db250cm9scy5UYXJnZXRDb250cm9scy5maXRUYXJnZXQiLCJGb3JhbTNELkNvbnRyb2xzLlRhcmdldENvbnRyb2xzLmNhbGN1bGF0ZUJvdW5kaW5nU3BoZXJlIiwiRm9yYW0zRC5Db250cm9scy5UYXJnZXRDb250cm9scy5jYWxjdWxhdGVEaXN0YW5jZVRvVGFyZ2V0IiwiRm9yYW0zRC5IZWxwZXJzLmV4dGVuZCIsIkZvcmFtM0QuU2ltdWxhdGlvbiIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zaW11bGF0ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5ldm9sdmUiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVncmVzcyIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVDZW50cm9pZHNQYXRoIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRvZ2dsZUFwZXJ0dXJlc1BhdGgiLCJGb3JhbTNELlNpbXVsYXRpb24uY2FsY3VsYXRlU3VyZmFjZUFyZWEiLCJGb3JhbTNELlNpbXVsYXRpb24uY2FsY3VsYXRlVm9sdW1lIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNhbGN1bGF0ZVNoYXBlRmFjdG9yIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRvZ2dsZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELlNpbXVsYXRpb24uYXBwbHlPcGFjaXR5IiwiRm9yYW0zRC5TaW11bGF0aW9uLmV4cG9ydFRvT0JKIiwiRm9yYW0zRC5TaW11bGF0aW9uLmV4cG9ydFRvQ1NWIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRha2VTY3JlZW5zaG90IiwiRm9yYW0zRC5TaW11bGF0aW9uLm9uQ2hhbWJlckNsaWNrIiwiRm9yYW0zRC5TaW11bGF0aW9uLm9uQ2hhbWJlckhvdmVyIiwiRm9yYW0zRC5TaW11bGF0aW9uLmZpdFRhcmdldCIsIkZvcmFtM0QuU2ltdWxhdGlvbi5yZXNldCIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cFNjZW5lIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwQ29udHJvbHMiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBUYXJnZXRDb250cm9scyIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cE1vdXNlRXZlbnRzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwQXV0b1Jlc2l6ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cEdVSSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5vbk1vdXNlQ2xpY2siLCJGb3JhbTNELlNpbXVsYXRpb24ub25Nb3VzZU1vdmUiLCJGb3JhbTNELlNpbXVsYXRpb24uZ2V0UG9pbnRlZENoYW1iZXIiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVzaXplIiwiRm9yYW0zRC5TaW11bGF0aW9uLmFuaW1hdGUiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVuZGVyIiwiRm9yYW0zRC5FeHBvcnQiLCJGb3JhbTNELkV4cG9ydC5DU1ZFeHBvcnRlciIsIkZvcmFtM0QuRXhwb3J0LkNTVkV4cG9ydGVyLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5FeHBvcnQuQ1NWRXhwb3J0ZXIucGFyc2UiLCJGb3JhbTNELkhlbHBlcnMuQ29sb3JTZXF1ZW5jZXIiLCJGb3JhbTNELkhlbHBlcnMuQ29sb3JTZXF1ZW5jZXIuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMuQ29sb3JTZXF1ZW5jZXIubmV4dCIsIkZvcmFtM0QuSGVscGVycy5Db2xvclNlcXVlbmNlci5yZXNldCIsIkZvcmFtM0QuSGVscGVycy5MaW5lIiwiRm9yYW0zRC5IZWxwZXJzLkxpbmUuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMuTGluZS5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5IZWxwZXJzLkxpbmUuYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuSGVscGVycy5QbGFuZSIsIkZvcmFtM0QuSGVscGVycy5QbGFuZS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuSGVscGVycy5QbGFuZS5ub3JtYWxpemVTcGFubmluZ1ZlY3RvcnMiLCJGb3JhbTNELkhlbHBlcnMuUGxhbmUuYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuSGVscGVycy5QbGFuZS5idWlsZE1hdGVyaWFsIiwiRm9yYW0zRC5IZWxwZXJzLlBvaW50IiwiRm9yYW0zRC5IZWxwZXJzLlBvaW50LmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLlBvaW50LmJ1aWxkR2VvbWV0cnkiLCJGb3JhbTNELkhlbHBlcnMuUG9pbnQuYnVpbGRNYXRlcmlhbCJdLCJtYXBwaW5ncyI6IkFBQUEseURBQXlEOzs7Ozs7QUFFekQsSUFBTyxPQUFPLENBMEpiO0FBMUpELFdBQU8sT0FBTyxFQUFDLENBQUM7SUFRZEE7UUFBNkJDLDJCQUFVQTtRQTBCckNBLGlCQUFZQSxNQUFxQkEsRUFBRUEsTUFBY0EsRUFBRUEsU0FBaUJBO1lBQ2xFQyxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQTtZQUNyQkEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBO1lBQ3JCQSxJQUFJQSxDQUFDQSxTQUFTQSxHQUFHQSxTQUFTQSxDQUFDQTtZQUUzQkEsSUFBSUEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0E7WUFDcENBLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBO1lBRXBDQSxrQkFBTUEsUUFBUUEsRUFBRUEsUUFBUUEsQ0FBQ0EsQ0FBQ0E7WUFFMUJBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLGlCQUFpQkEsRUFBRUEsQ0FBQ0E7UUFDM0NBLENBQUNBO1FBRURELDZCQUFXQSxHQUFYQSxVQUFZQSxXQUFvQkE7WUFDOUJFLElB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QTtRQUNwQkEsQ0FBQ0E7UUFFT2xCLCtCQUFVQSxHQUFsQkE7WUFDRW1CLElBQUlBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBO1lBRS9CQSxJQUFJQSxLQUFLQSxHQUFJQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxXQUFXQSxDQUFDQTtZQUNyQ0EsSUFBSUEsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsWUFBWUEsQ0FBQ0E7WUFFdENBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLGlCQUFpQkEsQ0FBQ0EsRUFBRUEsRUFBRUEsS0FBS0EsR0FBR0EsTUFBTUEsRUFBRUEsR0FBR0EsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7WUFDMUVBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBO1lBQ25DQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtZQUU1QkEsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxRQUFRQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUMxREEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7WUFFL0JBLElBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLGFBQWFBLENBQUNBO2dCQUN0Q0EsS0FBS0EsRUFBRUEsSUFBSUE7Z0JBQ1hBLFNBQVNBLEVBQUVBLElBQUlBO2FBQ2hCQSxDQUFDQSxDQUFDQTtZQUVIQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxhQUFhQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUN6Q0Es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QzdCQSxxQkFBZUEsR0FBV0EsRUFBRUEsQ0FBQ0E7WUFFN0JBLG9CQUFjQSxHQUFnQkE7Z0JBQzNDQSxLQUFLQSxFQUFFQSxRQUFRQTtnQkFDZkEsSUFBSUEsRUFBR0EsR0FBR0E7YUFDWEEsQ0FBQ0E7WUErQkpBLFlBQUNBO1FBQURBLENBdENBeEcsQUFzQ0N3RyxFQXRDMEJ4RyxLQUFLQSxDQUFDQSxJQUFJQSxFQXNDcENBO1FBdENZQSxhQUFLQSxRQXNDakJBLENBQUFBO0lBQ0hBLENBQUNBLEVBN0NjL0IsT0FBT0EsR0FBUEEsZUFBT0EsS0FBUEEsZUFBT0EsUUE2Q3JCQTtBQUFEQSxDQUFDQSxFQTdDTSxPQUFPLEtBQVAsT0FBTyxRQTZDYiIsImZpbGUiOiJmb3JhbTNkLmpzIiwic291cmNlc0NvbnRlbnQiOltudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
