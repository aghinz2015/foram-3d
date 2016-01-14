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
        Chamber.prototype.getSurfaceArea = function () {
            if (!this.surfaceArea) {
                var calculator = new Foram3D.Calculators.Chamber.SurfaceAreaCalculator(this);
                this.surfaceArea = calculator.calculate();
            }
            return this.surfaceArea;
        };
        Chamber.prototype.getMaterialVolume = function () {
            if (!this.materialVolume) {
                var calculator = new Foram3D.Calculators.Chamber.MaterialVolumeCalculator(this);
                this.materialVolume = calculator.calculate();
            }
            return this.materialVolume;
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
        Chamber.prototype.setColor = function (color) {
            this.material.color.set(color);
        };
        Chamber.prototype.resetColor = function () {
            this.material.color.set(Chamber.MATERIAL_DEFAULTS.color);
        };
        Chamber.prototype.distanceTo = function (otherChamber) {
            return this.center.distanceTo(otherChamber.center);
        };
        Chamber.prototype.intersects = function (otherChamber) {
            return this.distanceTo(otherChamber) < this.radius + otherChamber.radius;
        };
        Chamber.prototype.getIntersectingChambers = function () {
            var intersectingChambers = [];
            var ancestor = this.ancestor;
            while (ancestor) {
                if (ancestor.intersects(this)) {
                    intersectingChambers.push(ancestor);
                }
                ancestor = ancestor.ancestor;
            }
            return intersectingChambers;
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
var Foram3D;
(function (Foram3D) {
    var Calculators;
    (function (Calculators) {
        var SurfaceAreaCalculator = (function (_super) {
            __extends(SurfaceAreaCalculator, _super);
            function SurfaceAreaCalculator() {
                _super.apply(this, arguments);
            }
            SurfaceAreaCalculator.prototype.calculate = function () {
                var result = 0;
                for (var _i = 0, _a = this.foram.getActiveChambers(); _i < _a.length; _i++) {
                    var chamber = _a[_i];
                    result += chamber.getSurfaceArea();
                }
                return result;
            };
            return SurfaceAreaCalculator;
        })(Foram3D.Calculator);
        Calculators.SurfaceAreaCalculator = SurfaceAreaCalculator;
    })(Calculators = Foram3D.Calculators || (Foram3D.Calculators = {}));
})(Foram3D || (Foram3D = {}));
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
var Foram3D;
(function (Foram3D) {
    var Foram = (function (_super) {
        __extends(Foram, _super);
        function Foram(genotype, numChambers) {
            _super.call(this);
            this.prevChambers = [];
            this.genotype = genotype;
            this.material = Foram.MATERIAL_DEFAULTS;
            this.colorSequencer = new Foram3D.Helpers.ColorSequencer();
            this.isColored = false;
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
            var calculator = new Foram3D.Calculators.SurfaceAreaCalculator(this);
            return calculator.calculate();
        };
        Foram.prototype.calculateVolume = function () {
            var calculator = new Foram3D.Calculators.VolumeCalculator(this);
            return calculator.calculate();
        };
        Foram.prototype.calculateMaterialVolume = function () {
            var calculator = new Foram3D.Calculators.MaterialVolumeCalculator(this);
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
        Foram.prototype.colour = function (colors) {
            this.colorSequencer = new Foram3D.Helpers.ColorSequencer(colors);
            this.updateChambersColors();
            this.isColored = true;
        };
        Foram.prototype.decolour = function () {
            this.resetChambersColors();
            this.isColored = false;
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
            if (this.isColored) {
                chamber.setColor(this.colorSequencer.next());
            }
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
        Foram.prototype.updateChambersColors = function () {
            this.colorSequencer.reset();
            for (var _i = 0, _a = this.chambers; _i < _a.length; _i++) {
                var chamber = _a[_i];
                chamber.setColor(this.colorSequencer.next());
            }
        };
        Foram.prototype.resetChambersColors = function () {
            for (var _i = 0, _a = this.chambers; _i < _a.length; _i++) {
                var chamber = _a[_i];
                chamber.resetColor();
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
                opacity: 0.8,
                colour: function () { return _this.simulation.colour(); },
                decolour: function () { return _this.simulation.decolour(); }
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
            materialFolder.add(materialOptions, 'colour');
            materialFolder.add(materialOptions, 'decolour');
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
        Simulation.prototype.colour = function (colors) {
            if (!this.foram)
                return;
            this.foram.colour(colors);
        };
        Simulation.prototype.decolour = function () {
            if (!this.foram)
                return;
            this.foram.decolour();
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
var Foram3D;
(function (Foram3D) {
    var Calculators;
    (function (Calculators) {
        var MaterialVolumeCalculator = (function (_super) {
            __extends(MaterialVolumeCalculator, _super);
            function MaterialVolumeCalculator() {
                _super.apply(this, arguments);
            }
            MaterialVolumeCalculator.prototype.calculate = function () {
                var result = 0;
                for (var _i = 0, _a = this.foram.getActiveChambers(); _i < _a.length; _i++) {
                    var chamber = _a[_i];
                    result += chamber.getMaterialVolume();
                }
                return result;
            };
            return MaterialVolumeCalculator;
        })(Foram3D.Calculator);
        Calculators.MaterialVolumeCalculator = MaterialVolumeCalculator;
    })(Calculators = Foram3D.Calculators || (Foram3D.Calculators = {}));
})(Foram3D || (Foram3D = {}));
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
var Foram3D;
(function (Foram3D) {
    var Helpers;
    (function (Helpers) {
        var FacesIterator = (function () {
            function FacesIterator(mesh) {
                this.mesh = mesh;
                this.faces = this.getFaces();
                this.vertices = this.getVertices();
                this.currentFaceIndex = 0;
            }
            FacesIterator.prototype.hasNext = function () {
                return this.currentFaceIndex < this.faces.length - 1;
            };
            FacesIterator.prototype.next = function () {
                var face = this.faces[this.currentFaceIndex];
                this.currentFaceIndex += 1;
                this.currentFaceIndex %= this.faces.length;
                return new Helpers.Face(this.vertices[face.a], this.vertices[face.b], this.vertices[face.c]);
            };
            FacesIterator.prototype.reset = function () {
                this.currentFaceIndex = 0;
            };
            FacesIterator.prototype.getFaces = function () {
                return this.mesh.geometry.faces;
            };
            FacesIterator.prototype.getVertices = function () {
                return this.mesh.geometry.vertices;
            };
            return FacesIterator;
        })();
        Helpers.FacesIterator = FacesIterator;
    })(Helpers = Foram3D.Helpers || (Foram3D.Helpers = {}));
})(Foram3D || (Foram3D = {}));
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
var Foram3D;
(function (Foram3D) {
    var Calculators;
    (function (Calculators) {
        var Chamber;
        (function (Chamber) {
            var Calculator = (function () {
                function Calculator(chamber) {
                    this.chamber = chamber;
                }
                return Calculator;
            })();
            Chamber.Calculator = Calculator;
        })(Chamber = Calculators.Chamber || (Calculators.Chamber = {}));
    })(Calculators = Foram3D.Calculators || (Foram3D.Calculators = {}));
})(Foram3D || (Foram3D = {}));
var Foram3D;
(function (Foram3D) {
    var Calculators;
    (function (Calculators) {
        var Chamber;
        (function (Chamber) {
            var MaterialVolumeCalculator = (function (_super) {
                __extends(MaterialVolumeCalculator, _super);
                function MaterialVolumeCalculator() {
                    _super.apply(this, arguments);
                }
                MaterialVolumeCalculator.prototype.calculate = function () {
                    return this.chamber.getSurfaceArea() * this.chamber.thickness;
                };
                return MaterialVolumeCalculator;
            })(Chamber.Calculator);
            Chamber.MaterialVolumeCalculator = MaterialVolumeCalculator;
        })(Chamber = Calculators.Chamber || (Calculators.Chamber = {}));
    })(Calculators = Foram3D.Calculators || (Foram3D.Calculators = {}));
})(Foram3D || (Foram3D = {}));
var Foram3D;
(function (Foram3D) {
    var Calculators;
    (function (Calculators) {
        var Chamber;
        (function (Chamber) {
            var SurfaceAreaCalculator = (function (_super) {
                __extends(SurfaceAreaCalculator, _super);
                function SurfaceAreaCalculator() {
                    _super.apply(this, arguments);
                }
                SurfaceAreaCalculator.prototype.calculate = function () {
                    var intersectingChambers, facesIterator, face, isOuterFace, chamber, result = 0;
                    intersectingChambers = this.chamber.getIntersectingChambers();
                    facesIterator = new Foram3D.Helpers.FacesIterator(this.chamber);
                    while (facesIterator.hasNext()) {
                        face = facesIterator.next();
                        isOuterFace = true;
                        for (var _i = 0; _i < intersectingChambers.length; _i++) {
                            chamber = intersectingChambers[_i];
                            if (face.centroid.distanceTo(chamber.center) < chamber.radius) {
                                isOuterFace = false;
                                break;
                            }
                        }
                        if (isOuterFace) {
                            result += this.calculateFaceSurfaceArea(face);
                        }
                    }
                    return result;
                };
                SurfaceAreaCalculator.prototype.calculateFaceSurfaceArea = function (face) {
                    var ab, ac, cross;
                    ab = face.vb.clone().sub(face.va);
                    ac = face.vc.clone().sub(face.va);
                    cross = new THREE.Vector3();
                    cross.crossVectors(ab, ac);
                    return cross.length() / 2;
                };
                return SurfaceAreaCalculator;
            })(Chamber.Calculator);
            Chamber.SurfaceAreaCalculator = SurfaceAreaCalculator;
        })(Chamber = Calculators.Chamber || (Calculators.Chamber = {}));
    })(Calculators = Foram3D.Calculators || (Foram3D.Calculators = {}));
})(Foram3D || (Foram3D = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYW1iZXIudHMiLCJjaGFtYmVyX3BhdGhzL2NoYW1iZXJfcGF0aC50cyIsImNoYW1iZXJfcGF0aHMvY2VudHJvaWRzX3BhdGgudHMiLCJjaGFtYmVyX3BhdGhzL2FwZXJ0dXJlc19wYXRoLnRzIiwiY2FsY3VsYXRvcnMvY2FsY3VsYXRvci50cyIsImhlbHBlcnMvZmFjZS50cyIsImNhbGN1bGF0b3JzL2ZhY2VzX3Byb2Nlc3Nvci50cyIsImNhbGN1bGF0b3JzL3N1cmZhY2VfYXJlYV9jYWxjdWxhdG9yLnRzIiwiY2FsY3VsYXRvcnMvdm9sdW1lX2NhbGN1bGF0b3IudHMiLCJjYWxjdWxhdG9ycy9zaGFwZV9mYWN0b3JfY2FsY3VsYXRvci50cyIsImZvcmFtLnRzIiwic2ltdWxhdGlvbl9ndWkudHMiLCJjb250cm9scy90YXJnZXRfY29udHJvbHMudHMiLCJoZWxwZXJzL3V0aWxzLnRzIiwic2ltdWxhdGlvbi50cyIsImNhbGN1bGF0b3JzL21hdGVyaWFsX3ZvbHVtZV9jYWxjdWxhdG9yLnRzIiwiZXhwb3J0L2Nzdl9leHBvcnRlci50cyIsImhlbHBlcnMvY29sb3Jfc2VxdWVuY2VyLnRzIiwiaGVscGVycy9mYWNlc19pdGVyYXRvci50cyIsImhlbHBlcnMvbGluZS50cyIsImhlbHBlcnMvcGxhbmUudHMiLCJoZWxwZXJzL3BvaW50LnRzIiwiY2FsY3VsYXRvcnMvY2hhbWJlci9jYWxjdWxhdG9yLnRzIiwiY2FsY3VsYXRvcnMvY2hhbWJlci9tYXRlcmlhbF92b2x1bWVfY2FsY3VsYXRvci50cyIsImNhbGN1bGF0b3JzL2NoYW1iZXIvc3VyZmFjZV9hcmVhX2NhbGN1bGF0b3IudHMiXSwibmFtZXMiOlsiRm9yYW0zRCIsIkZvcmFtM0QuQ2hhbWJlciIsIkZvcmFtM0QuQ2hhbWJlci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2hhbWJlci5zZXRBbmNlc3RvciIsIkZvcmFtM0QuQ2hhbWJlci5zZXRBcGVydHVyZSIsIkZvcmFtM0QuQ2hhbWJlci5zaG93VGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLmhpZGVUaGlja25lc3NWZWN0b3IiLCJGb3JhbTNELkNoYW1iZXIubWFya0FwZXJ0dXJlIiwiRm9yYW0zRC5DaGFtYmVyLmdldFN1cmZhY2VBcmVhIiwiRm9yYW0zRC5DaGFtYmVyLmdldE1hdGVyaWFsVm9sdW1lIiwiRm9yYW0zRC5DaGFtYmVyLnNlcmlhbGl6ZSIsIkZvcmFtM0QuQ2hhbWJlci5hcHBseU1hdGVyaWFsIiwiRm9yYW0zRC5DaGFtYmVyLnNldENvbG9yIiwiRm9yYW0zRC5DaGFtYmVyLnJlc2V0Q29sb3IiLCJGb3JhbTNELkNoYW1iZXIuZGlzdGFuY2VUbyIsIkZvcmFtM0QuQ2hhbWJlci5pbnRlcnNlY3RzIiwiRm9yYW0zRC5DaGFtYmVyLmdldEludGVyc2VjdGluZ0NoYW1iZXJzIiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkQXBlcnR1cmVNYXJrZXIiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuQ2hhbWJlci5idWlsZE1hdGVyaWFsIiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkVGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLmNhbGN1bGF0ZUFwZXJ0dXJlIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguZmV0Y2hDaGFtYmVyc0F0dHJpYnV0ZSIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmJ1aWxkUG9zaXRpb25zQnVmZmVyIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DZW50cm9pZHNQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2VudHJvaWRzUGF0aC5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNlbnRyb2lkc1BhdGgucmVidWlsZCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkFwZXJ0dXJlc1BhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5BcGVydHVyZXNQYXRoLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQXBlcnR1cmVzUGF0aC5yZWJ1aWxkIiwiRm9yYW0zRC5DYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2UiLCJGb3JhbTNELkhlbHBlcnMuRmFjZS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuSGVscGVycy5GYWNlLmNhbGN1bGF0ZUNlbnRyb2lkIiwiRm9yYW0zRC5DYWxjdWxhdG9ycyIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuRmFjZXNQcm9jZXNzb3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkZhY2VzUHJvY2Vzc29yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5GYWNlc1Byb2Nlc3Nvci5zdW1GYWNlcyIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUFyZWFDYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TdXJmYWNlQXJlYUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VBcmVhQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IuY2FsY3VsYXRlIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5Wb2x1bWVDYWxjdWxhdG9yLmNhbGN1bGF0ZUZhY2VUZXRyYWhlZHJvblZvbHVtZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvci5jYWxjdWxhdGVEaXN0YW5jZUJldHdlZW5IZWFkQW5kVGFpbCIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNhbGN1bGF0ZUNlbnRyb2lkc1BhdGhMZW5ndGgiLCJGb3JhbTNELkZvcmFtIiwiRm9yYW0zRC5Gb3JhbS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuRm9yYW0uZXZvbHZlIiwiRm9yYW0zRC5Gb3JhbS5yZWdyZXNzIiwiRm9yYW0zRC5Gb3JhbS50b2dnbGVDZW50cm9pZHNQYXRoIiwiRm9yYW0zRC5Gb3JhbS50b2dnbGVBcGVydHVyZXNQYXRoIiwiRm9yYW0zRC5Gb3JhbS5zaG93VGhpY2tuZXNzVmVjdG9ycyIsIkZvcmFtM0QuRm9yYW0uaGlkZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELkZvcmFtLnRvZ2dsZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZVN1cmZhY2VBcmVhIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVWb2x1bWUiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU1hdGVyaWFsVm9sdW1lIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVTaGFwZUZhY3RvciIsIkZvcmFtM0QuRm9yYW0uYXBwbHlPcGFjaXR5IiwiRm9yYW0zRC5Gb3JhbS5jb2xvdXIiLCJGb3JhbTNELkZvcmFtLmRlY29sb3VyIiwiRm9yYW0zRC5Gb3JhbS5nZXRBY3RpdmVDaGFtYmVycyIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV4dENoYW1iZXIiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld0NlbnRlciIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlR3Jvd3RoVmVjdG9yTGVuZ3RoIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdSYWRpdXMiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld1RoaWNrbmVzcyIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3QXBlcnR1cmUiLCJGb3JhbTNELkZvcmFtLmJ1aWxkSW5pdGlhbENoYW1iZXIiLCJGb3JhbTNELkZvcmFtLmJ1aWxkQ2hhbWJlciIsIkZvcmFtM0QuRm9yYW0udXBkYXRlQ2hhbWJlclBhdGhzIiwiRm9yYW0zRC5Gb3JhbS51cGRhdGVUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5Gb3JhbS51cGRhdGVDaGFtYmVyc01hdGVyaWFsIiwiRm9yYW0zRC5Gb3JhbS51cGRhdGVDaGFtYmVyc0NvbG9ycyIsIkZvcmFtM0QuRm9yYW0ucmVzZXRDaGFtYmVyc0NvbG9ycyIsIkZvcmFtM0QuU2ltdWxhdGlvbkdVSSIsIkZvcmFtM0QuU2ltdWxhdGlvbkdVSS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuU2ltdWxhdGlvbkdVSS5zZXR1cCIsIkZvcmFtM0QuQ29udHJvbHMiLCJGb3JhbTNELkNvbnRyb2xzLlRhcmdldENvbnRyb2xzIiwiRm9yYW0zRC5Db250cm9scy5UYXJnZXRDb250cm9scy5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ29udHJvbHMuVGFyZ2V0Q29udHJvbHMuZml0VGFyZ2V0IiwiRm9yYW0zRC5Db250cm9scy5UYXJnZXRDb250cm9scy5jYWxjdWxhdGVCb3VuZGluZ1NwaGVyZSIsIkZvcmFtM0QuQ29udHJvbHMuVGFyZ2V0Q29udHJvbHMuY2FsY3VsYXRlRGlzdGFuY2VUb1RhcmdldCIsIkZvcmFtM0QuSGVscGVycy5leHRlbmQiLCJGb3JhbTNELlNpbXVsYXRpb24iLCJGb3JhbTNELlNpbXVsYXRpb24uY29uc3RydWN0b3IiLCJGb3JhbTNELlNpbXVsYXRpb24uc2ltdWxhdGUiLCJGb3JhbTNELlNpbXVsYXRpb24uZXZvbHZlIiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlZ3Jlc3MiLCJGb3JhbTNELlNpbXVsYXRpb24udG9nZ2xlQ2VudHJvaWRzUGF0aCIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVBcGVydHVyZXNQYXRoIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNhbGN1bGF0ZVN1cmZhY2VBcmVhIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNhbGN1bGF0ZVZvbHVtZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jYWxjdWxhdGVTaGFwZUZhY3RvciIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5TaW11bGF0aW9uLmFwcGx5T3BhY2l0eSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jb2xvdXIiLCJGb3JhbTNELlNpbXVsYXRpb24uZGVjb2xvdXIiLCJGb3JhbTNELlNpbXVsYXRpb24uZXhwb3J0VG9PQkoiLCJGb3JhbTNELlNpbXVsYXRpb24uZXhwb3J0VG9DU1YiLCJGb3JhbTNELlNpbXVsYXRpb24udGFrZVNjcmVlbnNob3QiLCJGb3JhbTNELlNpbXVsYXRpb24ub25DaGFtYmVyQ2xpY2siLCJGb3JhbTNELlNpbXVsYXRpb24ub25DaGFtYmVySG92ZXIiLCJGb3JhbTNELlNpbXVsYXRpb24uZml0VGFyZ2V0IiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlc2V0IiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwU2NlbmUiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBDb250cm9scyIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cFRhcmdldENvbnRyb2xzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwTW91c2VFdmVudHMiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBBdXRvUmVzaXplIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwR1VJIiwiRm9yYW0zRC5TaW11bGF0aW9uLm9uTW91c2VDbGljayIsIkZvcmFtM0QuU2ltdWxhdGlvbi5vbk1vdXNlTW92ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5nZXRQb2ludGVkQ2hhbWJlciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5yZXNpemUiLCJGb3JhbTNELlNpbXVsYXRpb24uYW5pbWF0ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5yZW5kZXIiLCJGb3JhbTNELkNhbGN1bGF0b3JzLk1hdGVyaWFsVm9sdW1lQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuTWF0ZXJpYWxWb2x1bWVDYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5NYXRlcmlhbFZvbHVtZUNhbGN1bGF0b3IuY2FsY3VsYXRlIiwiRm9yYW0zRC5FeHBvcnQiLCJGb3JhbTNELkV4cG9ydC5DU1ZFeHBvcnRlciIsIkZvcmFtM0QuRXhwb3J0LkNTVkV4cG9ydGVyLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5FeHBvcnQuQ1NWRXhwb3J0ZXIucGFyc2UiLCJGb3JhbTNELkhlbHBlcnMuQ29sb3JTZXF1ZW5jZXIiLCJGb3JhbTNELkhlbHBlcnMuQ29sb3JTZXF1ZW5jZXIuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMuQ29sb3JTZXF1ZW5jZXIubmV4dCIsIkZvcmFtM0QuSGVscGVycy5Db2xvclNlcXVlbmNlci5yZXNldCIsIkZvcmFtM0QuSGVscGVycy5GYWNlc0l0ZXJhdG9yIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2VzSXRlcmF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMuRmFjZXNJdGVyYXRvci5oYXNOZXh0IiwiRm9yYW0zRC5IZWxwZXJzLkZhY2VzSXRlcmF0b3IubmV4dCIsIkZvcmFtM0QuSGVscGVycy5GYWNlc0l0ZXJhdG9yLnJlc2V0IiwiRm9yYW0zRC5IZWxwZXJzLkZhY2VzSXRlcmF0b3IuZ2V0RmFjZXMiLCJGb3JhbTNELkhlbHBlcnMuRmFjZXNJdGVyYXRvci5nZXRWZXJ0aWNlcyIsIkZvcmFtM0QuSGVscGVycy5MaW5lIiwiRm9yYW0zRC5IZWxwZXJzLkxpbmUuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMuTGluZS5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5IZWxwZXJzLkxpbmUuYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuSGVscGVycy5QbGFuZSIsIkZvcmFtM0QuSGVscGVycy5QbGFuZS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuSGVscGVycy5QbGFuZS5ub3JtYWxpemVTcGFubmluZ1ZlY3RvcnMiLCJGb3JhbTNELkhlbHBlcnMuUGxhbmUuYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuSGVscGVycy5QbGFuZS5idWlsZE1hdGVyaWFsIiwiRm9yYW0zRC5IZWxwZXJzLlBvaW50IiwiRm9yYW0zRC5IZWxwZXJzLlBvaW50LmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLlBvaW50LmJ1aWxkR2VvbWV0cnkiLCJGb3JhbTNELkhlbHBlcnMuUG9pbnQuYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5DYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5DaGFtYmVyLkNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIuTWF0ZXJpYWxWb2x1bWVDYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5DaGFtYmVyLk1hdGVyaWFsVm9sdW1lQ2FsY3VsYXRvci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5NYXRlcmlhbFZvbHVtZUNhbGN1bGF0b3IuY2FsY3VsYXRlIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5DaGFtYmVyLlN1cmZhY2VBcmVhQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5TdXJmYWNlQXJlYUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIuU3VyZmFjZUFyZWFDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5TdXJmYWNlQXJlYUNhbGN1bGF0b3IuY2FsY3VsYXRlRmFjZVN1cmZhY2VBcmVhIl0sIm1hcHBpbmdzIjoiOzs7OztBQUVBLElBQU8sT0FBTyxDQWdOYjtBQWhORCxXQUFPLE9BQU8sRUFBQyxDQUFDO0lBUWRBO1FBQTZCQywyQkFBVUE7UUErQnJDQSxpQkFBWUEsTUFBcUJBLEVBQUVBLE1BQWNBLEVBQUVBLFNBQWlCQTtZQUNsRUMsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBO1lBQ3JCQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQTtZQUNyQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsR0FBR0EsU0FBU0EsQ0FBQ0E7WUFFM0JBLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBO1lBQ3BDQSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxhQUFhQSxFQUFFQSxDQUFDQTtZQUVwQ0Esa0JBQU1BLFFBQVFBLEVBQUVBLFFBQVFBLENBQUNBLENBQUNBO1lBRTFCQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxpQkFBaUJBLEVBQUVBLENBQUNBO1FBQzNDQSxDQUFDQTtRQUVERCw2QkFBV0EsR0FBWEEsVUFBWUEsV0FBb0JBO1lBQzlCRSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxXQUFXQSxDQUFDQTtZQUM1QkEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsV0FBV0EsQ0FBQ0EsUUFBUUEsQ0FBQ0E7WUFDbkNBLFdBQVdBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBO1FBQzNCQSxDQUFDQTtRQUVERiw2QkFBV0EsR0FBWEEsVUFBWUEsUUFBdUJBO1lBQ2pDRyxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxRQUFRQSxDQUFDQTtZQUN6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LENBQUNBLFFBQVFBLENBQUNBLElBQUlBLENBQUNBLDhCQUE4QkEsQ0FBQ0EsQ0FBQ0E7WUFDdEVBLENBQUNBO1lBRU9GLHlEQUE4QkEsR0FBdENBLFVBQXVDQSxJQUFrQkE7Z0JBQ3ZERyxJQUFJQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQTtnQkFFdkNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUFBO2dCQUN4Q0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQUE7Z0JBQ3hDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFBQTtnQkFDeENBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUFBO2dCQUN4Q0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQUE7Z0JBQ3hDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxD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LENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO1lBRXBDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDOUJBLGFBQWFBLENBQUNBLFVBQVVBLENBQ3RCQSxJQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxRQUFRQSxFQUM3QkEsSUFBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FDNUJBLENBQUNBO1lBQ0pBLENBQUNBO1lBQUNBLElBQUlBLENBQUNBLENBQUNBO2dCQUNOQSxhQUFhQSxDQUFDQSxVQUFVQSxDQUN0QkEsSUFBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsUUFBUUEsRUFDN0JBLElBQUlBLENBQUNBLFlBQVlBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLFFBQVFBLENBQzlCQSxDQUFDQTtZQUNKQSxDQUFDQTtZQUVEQSx3QkFBd0JBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO1lBRS9DQSxNQUFNQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDN0JBLEtBQUtBLENBQUNBO29CQUNKQSx3QkFBd0JBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO29CQUN0Q0EsS0FBS0EsQ0FBQ0E7Z0JBQ1JBLEtBQUtBLENBQUNBO29CQUNKQSx3QkFBd0JBLENBQUNBLFVBQVVBLENBQ2pDQSxJQUFJQSxDQUFDQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxFQUMzQkEsSUFBSUEsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FDOUJBLENBQUNBO29CQUNGQSxLQUFLQSxDQUFDQTtnQkFDUkE7b0JBQ0VB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LE1BQU1BLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBO2dCQUM1QkEsQ0FBQ0E7Z0JBQ0hILDRCQUFDQTtZQUFEQSxDQXRDQU4sQUFzQ0NNLEVBdEMwQ04sa0JBQVVBLEVBc0NwREE7WUF0Q1lBLDZCQUFxQkEsd0JBc0NqQ0EsQ0FBQUE7UUFDSEEsQ0FBQ0EsRUF4QzBCeEgsT0FBT0EsR0FBUEEsbUJBQU9BLEtBQVBBLG1CQUFPQSxRQXdDakNBO0lBQURBLENBQUNBLEVBeENjMUMsV0FBV0EsR0FBWEEsbUJBQVdBLEtBQVhBLG1CQUFXQSxRQXdDekJBO0FBQURBLENBQUNBLEVBeENNLE9BQU8sS0FBUCxPQUFPLFFBd0NiIiwiZmlsZSI6ImZvcmFtM2QuanMiLCJzb3VyY2VzQ29udGVudCI6W251bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGxdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
