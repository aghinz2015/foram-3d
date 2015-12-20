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
        Chamber.APERTURE_MARKER_COLOR = 0x000000;
        Chamber.APERTURE_MARKER_SIZE_FACTOR = 0.05;
        return Chamber;
    })(THREE.Mesh);
    Foram3D.Chamber = Chamber;
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
/// <reference path="./genotype_params.ts"/>
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
            this.material = this.buildMaterial();
            var initialChamber = this.buildInitialChamber();
            this.chambers = [initialChamber];
            this.currentChamber = initialChamber;
            this.prevChambers[0] = initialChamber;
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
        Foram.prototype.getActiveChambers = function () {
            var chamber, activeChambers = [];
            for (var _i = 0, _a = this.chambers; _i < _a.length; _i++) {
                chamber = _a[_i];
                if (chamber.visible)
                    activeChambers.push(chamber);
            }
            return activeChambers;
        };
        Foram.prototype.applyOpacity = function (opacity) {
            this.material.opacity = opacity;
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
        Foram.INITIAL_OPACITY = 0.8;
        return Foram;
    })(THREE.Group);
    Foram3D.Foram = Foram;
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
/// <reference path="./foram.ts"/>
/// <reference path="./genotype_params.ts"/>
/// <reference path="./chamber_paths/centroids_path.ts"/>
/// <reference path="./chamber_paths/apertures_path.ts"/>
/// <reference path="./controls/target_controls.ts"/>
/// <reference path="./helpers/utils.ts"/>
var Foram3D;
(function (Foram3D) {
    var Simulation = (function () {
        function Simulation(canvas, params) {
            this.config = {};
            Foram3D.Helpers.extend(this.config, params, Simulation.DEFAULT_PARAMS);
            this.canvas = canvas;
            this.thicknessVectorsVisible = false;
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
                numChambers: 20,
                simulate: function () { return _this.simulate(genotype, structureAnalyzer.numChambers); },
                evolve: function () { return _this.evolve(); },
                regress: function () { return _this.regress(); },
                centroidsPath: function () { return _this.toggleCentroidsPath(); },
                aperturesPath: function () { return _this.toggleAperturesPath(); },
                thicknessVectors: function () { return _this.toggleThicknessVectors(); },
                toggleChambers: function () { return _this.toggleChambers(); },
                fitTarget: function () { return _this.fitTarget(); }
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
            structureFolder.add(structureAnalyzer, 'toggleChambers');
            structureFolder.add(structureAnalyzer, 'fitTarget');
            materialFolder.add(materialOptions, 'opacity').onFinishChange(function () { return _this.applyOpacity(materialOptions.opacity); });
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYW1iZXIudHMiLCJjYWxjdWxhdG9ycy9jYWxjdWxhdG9yLnRzIiwiaGVscGVycy9mYWNlLnRzIiwiY2FsY3VsYXRvcnMvZmFjZXNfcHJvY2Vzc29yLnRzIiwiY2FsY3VsYXRvcnMvc3VyZmFjZV9jYWxjdWxhdG9yLnRzIiwiY2FsY3VsYXRvcnMvdm9sdW1lX2NhbGN1bGF0b3IudHMiLCJjYWxjdWxhdG9ycy9zaGFwZV9mYWN0b3JfY2FsY3VsYXRvci50cyIsImZvcmFtLnRzIiwiY2hhbWJlcl9wYXRocy9jaGFtYmVyX3BhdGgudHMiLCJjaGFtYmVyX3BhdGhzL2NlbnRyb2lkc19wYXRoLnRzIiwiY2hhbWJlcl9wYXRocy9hcGVydHVyZXNfcGF0aC50cyIsImNvbnRyb2xzL3RhcmdldF9jb250cm9scy50cyIsImhlbHBlcnMvdXRpbHMudHMiLCJzaW11bGF0aW9uLnRzIiwiZXhwb3J0L2V4cG9ydGVyLnRzIiwiZXhwb3J0L2Nzdl9leHBvcnRlci50cyIsImhlbHBlcnMvbGluZS50cyIsImhlbHBlcnMvcGxhbmUudHMiLCJoZWxwZXJzL3BvaW50LnRzIl0sIm5hbWVzIjpbIkZvcmFtM0QiLCJGb3JhbTNELkNoYW1iZXIiLCJGb3JhbTNELkNoYW1iZXIuY29uc3RydWN0b3IiLCJGb3JhbTNELkNoYW1iZXIuc2V0QW5jZXN0b3IiLCJGb3JhbTNELkNoYW1iZXIuc2V0QXBlcnR1cmUiLCJGb3JhbTNELkNoYW1iZXIuc2hvd1RoaWNrbmVzc1ZlY3RvciIsIkZvcmFtM0QuQ2hhbWJlci5oaWRlVGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLm1hcmtBcGVydHVyZSIsIkZvcmFtM0QuQ2hhbWJlci5zZXJpYWxpemUiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRBcGVydHVyZU1hcmtlciIsIkZvcmFtM0QuQ2hhbWJlci5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRUaGlja25lc3NWZWN0b3IiLCJGb3JhbTNELkNoYW1iZXIuY2FsY3VsYXRlQXBlcnR1cmUiLCJGb3JhbTNELkNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMiLCJGb3JhbTNELkhlbHBlcnMuRmFjZSIsIkZvcmFtM0QuSGVscGVycy5GYWNlLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2UuY2FsY3VsYXRlQ2VudHJvaWQiLCJGb3JhbTNELkNhbGN1bGF0b3JzIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5GYWNlc1Byb2Nlc3NvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuRmFjZXNQcm9jZXNzb3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkZhY2VzUHJvY2Vzc29yLnN1bUZhY2VzIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TdXJmYWNlQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUNhbGN1bGF0b3IuY2FsY3VsYXRlRmFjZVN1cmZhY2VBcmVhIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5Wb2x1bWVDYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5Wb2x1bWVDYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5Wb2x1bWVDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuVm9sdW1lQ2FsY3VsYXRvci5jYWxjdWxhdGVGYWNlVGV0cmFoZWRyb25Wb2x1bWUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IuY2FsY3VsYXRlIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IuY2FsY3VsYXRlRGlzdGFuY2VCZXR3ZWVuSGVhZEFuZFRhaWwiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvci5jYWxjdWxhdGVDZW50cm9pZHNQYXRoTGVuZ3RoIiwiRm9yYW0zRC5Gb3JhbSIsIkZvcmFtM0QuRm9yYW0uY29uc3RydWN0b3IiLCJGb3JhbTNELkZvcmFtLmV2b2x2ZSIsIkZvcmFtM0QuRm9yYW0ucmVncmVzcyIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlU3VyZmFjZUFyZWEiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZVZvbHVtZSIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlU2hhcGVGYWN0b3IiLCJGb3JhbTNELkZvcmFtLmdldEFjdGl2ZUNoYW1iZXJzIiwiRm9yYW0zRC5Gb3JhbS5hcHBseU9wYWNpdHkiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5leHRDaGFtYmVyIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdDZW50ZXIiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZUdyb3d0aFZlY3Rvckxlbmd0aCIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3UmFkaXVzIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdUaGlja25lc3MiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld0FwZXJ0dXJlIiwiRm9yYW0zRC5Gb3JhbS5idWlsZEluaXRpYWxDaGFtYmVyIiwiRm9yYW0zRC5Gb3JhbS5idWlsZENoYW1iZXIiLCJGb3JhbTNELkZvcmFtLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkNoYW1iZXJQYXRocyIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguY29uc3RydWN0b3IiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5idWlsZFBhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5mZXRjaENoYW1iZXJzQXR0cmlidXRlIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRQb3NpdGlvbnNCdWZmZXIiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNlbnRyb2lkc1BhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DZW50cm9pZHNQYXRoLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2VudHJvaWRzUGF0aC5yZWJ1aWxkIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQXBlcnR1cmVzUGF0aCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkFwZXJ0dXJlc1BhdGguY29uc3RydWN0b3IiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5BcGVydHVyZXNQYXRoLnJlYnVpbGQiLCJGb3JhbTNELkNvbnRyb2xzIiwiRm9yYW0zRC5Db250cm9scy5UYXJnZXRDb250cm9scyIsIkZvcmFtM0QuQ29udHJvbHMuVGFyZ2V0Q29udHJvbHMuY29uc3RydWN0b3IiLCJGb3JhbTNELkNvbnRyb2xzLlRhcmdldENvbnRyb2xzLmZpdFRhcmdldCIsIkZvcmFtM0QuQ29udHJvbHMuVGFyZ2V0Q29udHJvbHMuY2FsY3VsYXRlQm91bmRpbmdTcGhlcmUiLCJGb3JhbTNELkNvbnRyb2xzLlRhcmdldENvbnRyb2xzLmNhbGN1bGF0ZURpc3RhbmNlVG9UYXJnZXQiLCJGb3JhbTNELkhlbHBlcnMuZXh0ZW5kIiwiRm9yYW0zRC5TaW11bGF0aW9uIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNpbXVsYXRlIiwiRm9yYW0zRC5TaW11bGF0aW9uLmV2b2x2ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5yZWdyZXNzIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNhbGN1bGF0ZVN1cmZhY2VBcmVhIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNhbGN1bGF0ZVZvbHVtZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jYWxjdWxhdGVTaGFwZUZhY3RvciIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVDZW50cm9pZHNQYXRoIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRvZ2dsZUFwZXJ0dXJlc1BhdGgiLCJGb3JhbTNELlNpbXVsYXRpb24uc2hvd1RoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELlNpbXVsYXRpb24uaGlkZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELlNpbXVsYXRpb24udG9nZ2xlVGhpY2tuZXNzVmVjdG9ycyIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVDaGFtYmVycyIsIkZvcmFtM0QuU2ltdWxhdGlvbi5hcHBseU9wYWNpdHkiLCJGb3JhbTNELlNpbXVsYXRpb24uZXhwb3J0VG9PQkoiLCJGb3JhbTNELlNpbXVsYXRpb24uZXhwb3J0VG9DU1YiLCJGb3JhbTNELlNpbXVsYXRpb24udGFrZVNjcmVlbnNob3QiLCJGb3JhbTNELlNpbXVsYXRpb24ub25DaGFtYmVyQ2xpY2siLCJGb3JhbTNELlNpbXVsYXRpb24ub25DaGFtYmVySG92ZXIiLCJGb3JhbTNELlNpbXVsYXRpb24uZml0VGFyZ2V0IiwiRm9yYW0zRC5TaW11bGF0aW9uLnVwZGF0ZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVzZXQiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBTY2VuZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cENvbnRyb2xzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwVGFyZ2V0Q29udHJvbHMiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBNb3VzZUV2ZW50cyIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cEF1dG9SZXNpemUiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBHVUkiLCJGb3JhbTNELlNpbXVsYXRpb24ub25Nb3VzZUNsaWNrIiwiRm9yYW0zRC5TaW11bGF0aW9uLm9uTW91c2VNb3ZlIiwiRm9yYW0zRC5TaW11bGF0aW9uLmdldFBvaW50ZWRDaGFtYmVyIiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlc2l6ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5hbmltYXRlIiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlbmRlciIsIkZvcmFtM0QuRXhwb3J0IiwiRm9yYW0zRC5FeHBvcnQuQ1NWRXhwb3J0ZXIiLCJGb3JhbTNELkV4cG9ydC5DU1ZFeHBvcnRlci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuRXhwb3J0LkNTVkV4cG9ydGVyLnBhcnNlIiwiRm9yYW0zRC5IZWxwZXJzLkxpbmUiLCJGb3JhbTNELkhlbHBlcnMuTGluZS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuSGVscGVycy5MaW5lLmJ1aWxkR2VvbWV0cnkiLCJGb3JhbTNELkhlbHBlcnMuTGluZS5idWlsZE1hdGVyaWFsIiwiRm9yYW0zRC5IZWxwZXJzLlBsYW5lIiwiRm9yYW0zRC5IZWxwZXJzLlBsYW5lLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLlBsYW5lLm5vcm1hbGl6ZVNwYW5uaW5nVmVjdG9ycyIsIkZvcmFtM0QuSGVscGVycy5QbGFuZS5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5IZWxwZXJzLlBsYW5lLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkhlbHBlcnMuUG9pbnQiLCJGb3JhbTNELkhlbHBlcnMuUG9pbnQuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMuUG9pbnQuYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuSGVscGVycy5Qb2ludC5idWlsZE1hdGVyaWFsIl0sIm1hcHBpbmdzIjoiQUFBQSx5REFBeUQ7Ozs7OztBQUV6RCxJQUFPLE9BQU8sQ0FnSmI7QUFoSkQsV0FBTyxPQUFPLEVBQUMsQ0FBQztJQU1kQTtRQUE2QkMsMkJBQVVBO1FBb0JyQ0EsaUJBQVlBLE1BQXFC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QSxNQUFNQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxPQUFPQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtnQkFDakRBLE1BQU1BLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO2dCQUNqREEsTUFBTUEsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2pEQSxNQUFNQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxPQUFPQSxFQUFFQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQTtnQkFFakRBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLENBQUNBO2dCQUNqQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2pDQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQSxDQUFDQTtnQkFDakNBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUNBLENBQUNBO2dCQUVqQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FDcEJBLE1BQU1BLEVBQUVBLE1BQU1BLEVBQUVBLE1BQU1BLEVBQUVBLE1BQU1BLENBQy9CQSxDQUFDQTtnQkFFRkEsUUFBUUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FDakJBLElBQUlBLEtBQUtBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEVBQ3hCQSxJQUFJQSxLQUFLQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxF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
