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
            var calculator = new Foram3D.Calculators.Chamber.SurfaceAreaCalculator(this);
            return calculator.calculate();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYW1iZXIudHMiLCJjaGFtYmVyX3BhdGhzL2NoYW1iZXJfcGF0aC50cyIsImNoYW1iZXJfcGF0aHMvY2VudHJvaWRzX3BhdGgudHMiLCJjaGFtYmVyX3BhdGhzL2FwZXJ0dXJlc19wYXRoLnRzIiwiY2FsY3VsYXRvcnMvY2FsY3VsYXRvci50cyIsImhlbHBlcnMvZmFjZS50cyIsImNhbGN1bGF0b3JzL2ZhY2VzX3Byb2Nlc3Nvci50cyIsImNhbGN1bGF0b3JzL3N1cmZhY2VfYXJlYV9jYWxjdWxhdG9yLnRzIiwiY2FsY3VsYXRvcnMvdm9sdW1lX2NhbGN1bGF0b3IudHMiLCJjYWxjdWxhdG9ycy9zaGFwZV9mYWN0b3JfY2FsY3VsYXRvci50cyIsImZvcmFtLnRzIiwic2ltdWxhdGlvbl9ndWkudHMiLCJjb250cm9scy90YXJnZXRfY29udHJvbHMudHMiLCJoZWxwZXJzL3V0aWxzLnRzIiwic2ltdWxhdGlvbi50cyIsImV4cG9ydC9jc3ZfZXhwb3J0ZXIudHMiLCJoZWxwZXJzL2NvbG9yX3NlcXVlbmNlci50cyIsImhlbHBlcnMvZmFjZXNfaXRlcmF0b3IudHMiLCJoZWxwZXJzL2xpbmUudHMiLCJoZWxwZXJzL3BsYW5lLnRzIiwiaGVscGVycy9wb2ludC50cyIsImNhbGN1bGF0b3JzL2NoYW1iZXIvY2FsY3VsYXRvci50cyIsImNhbGN1bGF0b3JzL2NoYW1iZXIvc3VyZmFjZV9hcmVhX2NhbGN1bGF0b3IudHMiXSwibmFtZXMiOlsiRm9yYW0zRCIsIkZvcmFtM0QuQ2hhbWJlciIsIkZvcmFtM0QuQ2hhbWJlci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2hhbWJlci5zZXRBbmNlc3RvciIsIkZvcmFtM0QuQ2hhbWJlci5zZXRBcGVydHVyZSIsIkZvcmFtM0QuQ2hhbWJlci5zaG93VGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLmhpZGVUaGlja25lc3NWZWN0b3IiLCJGb3JhbTNELkNoYW1iZXIubWFya0FwZXJ0dXJlIiwiRm9yYW0zRC5DaGFtYmVyLmdldFN1cmZhY2VBcmVhIiwiRm9yYW0zRC5DaGFtYmVyLnNlcmlhbGl6ZSIsIkZvcmFtM0QuQ2hhbWJlci5hcHBseU1hdGVyaWFsIiwiRm9yYW0zRC5DaGFtYmVyLnNldENvbG9yIiwiRm9yYW0zRC5DaGFtYmVyLnJlc2V0Q29sb3IiLCJGb3JhbTNELkNoYW1iZXIuZGlzdGFuY2VUbyIsIkZvcmFtM0QuQ2hhbWJlci5pbnRlcnNlY3RzIiwiRm9yYW0zRC5DaGFtYmVyLmdldEludGVyc2VjdGluZ0NoYW1iZXJzIiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkQXBlcnR1cmVNYXJrZXIiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuQ2hhbWJlci5idWlsZE1hdGVyaWFsIiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkVGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLmNhbGN1bGF0ZUFwZXJ0dXJlIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguZmV0Y2hDaGFtYmVyc0F0dHJpYnV0ZSIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmJ1aWxkUG9zaXRpb25zQnVmZmVyIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DZW50cm9pZHNQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2VudHJvaWRzUGF0aC5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNlbnRyb2lkc1BhdGgucmVidWlsZCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkFwZXJ0dXJlc1BhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5BcGVydHVyZXNQYXRoLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQXBlcnR1cmVzUGF0aC5yZWJ1aWxkIiwiRm9yYW0zRC5DYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2UiLCJGb3JhbTNELkhlbHBlcnMuRmFjZS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuSGVscGVycy5GYWNlLmNhbGN1bGF0ZUNlbnRyb2lkIiwiRm9yYW0zRC5DYWxjdWxhdG9ycyIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuRmFjZXNQcm9jZXNzb3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkZhY2VzUHJvY2Vzc29yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5GYWNlc1Byb2Nlc3Nvci5zdW1GYWNlcyIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUFyZWFDYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TdXJmYWNlQXJlYUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VBcmVhQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IuY2FsY3VsYXRlIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5Wb2x1bWVDYWxjdWxhdG9yLmNhbGN1bGF0ZUZhY2VUZXRyYWhlZHJvblZvbHVtZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvci5jYWxjdWxhdGVEaXN0YW5jZUJldHdlZW5IZWFkQW5kVGFpbCIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNhbGN1bGF0ZUNlbnRyb2lkc1BhdGhMZW5ndGgiLCJGb3JhbTNELkZvcmFtIiwiRm9yYW0zRC5Gb3JhbS5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuRm9yYW0uZXZvbHZlIiwiRm9yYW0zRC5Gb3JhbS5yZWdyZXNzIiwiRm9yYW0zRC5Gb3JhbS50b2dnbGVDZW50cm9pZHNQYXRoIiwiRm9yYW0zRC5Gb3JhbS50b2dnbGVBcGVydHVyZXNQYXRoIiwiRm9yYW0zRC5Gb3JhbS5zaG93VGhpY2tuZXNzVmVjdG9ycyIsIkZvcmFtM0QuRm9yYW0uaGlkZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELkZvcmFtLnRvZ2dsZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZVN1cmZhY2VBcmVhIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVWb2x1bWUiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZVNoYXBlRmFjdG9yIiwiRm9yYW0zRC5Gb3JhbS5hcHBseU9wYWNpdHkiLCJGb3JhbTNELkZvcmFtLmNvbG91ciIsIkZvcmFtM0QuRm9yYW0uZGVjb2xvdXIiLCJGb3JhbTNELkZvcmFtLmdldEFjdGl2ZUNoYW1iZXJzIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXh0Q2hhbWJlciIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3Q2VudGVyIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVHcm93dGhWZWN0b3JMZW5ndGgiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld1JhZGl1cyIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3VGhpY2tuZXNzIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdBcGVydHVyZSIsIkZvcmFtM0QuRm9yYW0uYnVpbGRJbml0aWFsQ2hhbWJlciIsIkZvcmFtM0QuRm9yYW0uYnVpbGRDaGFtYmVyIiwiRm9yYW0zRC5Gb3JhbS51cGRhdGVDaGFtYmVyUGF0aHMiLCJGb3JhbTNELkZvcmFtLnVwZGF0ZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELkZvcmFtLnVwZGF0ZUNoYW1iZXJzTWF0ZXJpYWwiLCJGb3JhbTNELkZvcmFtLnVwZGF0ZUNoYW1iZXJzQ29sb3JzIiwiRm9yYW0zRC5Gb3JhbS5yZXNldENoYW1iZXJzQ29sb3JzIiwiRm9yYW0zRC5TaW11bGF0aW9uR1VJIiwiRm9yYW0zRC5TaW11bGF0aW9uR1VJLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5TaW11bGF0aW9uR1VJLnNldHVwIiwiRm9yYW0zRC5Db250cm9scyIsIkZvcmFtM0QuQ29udHJvbHMuVGFyZ2V0Q29udHJvbHMiLCJGb3JhbTNELkNvbnRyb2xzLlRhcmdldENvbnRyb2xzLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5Db250cm9scy5UYXJnZXRDb250cm9scy5maXRUYXJnZXQiLCJGb3JhbTNELkNvbnRyb2xzLlRhcmdldENvbnRyb2xzLmNhbGN1bGF0ZUJvdW5kaW5nU3BoZXJlIiwiRm9yYW0zRC5Db250cm9scy5UYXJnZXRDb250cm9scy5jYWxjdWxhdGVEaXN0YW5jZVRvVGFyZ2V0IiwiRm9yYW0zRC5IZWxwZXJzLmV4dGVuZCIsIkZvcmFtM0QuU2ltdWxhdGlvbiIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zaW11bGF0ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5ldm9sdmUiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVncmVzcyIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVDZW50cm9pZHNQYXRoIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRvZ2dsZUFwZXJ0dXJlc1BhdGgiLCJGb3JhbTNELlNpbXVsYXRpb24uY2FsY3VsYXRlU3VyZmFjZUFyZWEiLCJGb3JhbTNELlNpbXVsYXRpb24uY2FsY3VsYXRlVm9sdW1lIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNhbGN1bGF0ZVNoYXBlRmFjdG9yIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRvZ2dsZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELlNpbXVsYXRpb24uYXBwbHlPcGFjaXR5IiwiRm9yYW0zRC5TaW11bGF0aW9uLmNvbG91ciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5kZWNvbG91ciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5leHBvcnRUb09CSiIsIkZvcmFtM0QuU2ltdWxhdGlvbi5leHBvcnRUb0NTViIsIkZvcmFtM0QuU2ltdWxhdGlvbi50YWtlU2NyZWVuc2hvdCIsIkZvcmFtM0QuU2ltdWxhdGlvbi5vbkNoYW1iZXJDbGljayIsIkZvcmFtM0QuU2ltdWxhdGlvbi5vbkNoYW1iZXJIb3ZlciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5maXRUYXJnZXQiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVzZXQiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBTY2VuZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cENvbnRyb2xzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwVGFyZ2V0Q29udHJvbHMiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBNb3VzZUV2ZW50cyIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cEF1dG9SZXNpemUiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBHVUkiLCJGb3JhbTNELlNpbXVsYXRpb24ub25Nb3VzZUNsaWNrIiwiRm9yYW0zRC5TaW11bGF0aW9uLm9uTW91c2VNb3ZlIiwiRm9yYW0zRC5TaW11bGF0aW9uLmdldFBvaW50ZWRDaGFtYmVyIiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlc2l6ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5hbmltYXRlIiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlbmRlciIsIkZvcmFtM0QuRXhwb3J0IiwiRm9yYW0zRC5FeHBvcnQuQ1NWRXhwb3J0ZXIiLCJGb3JhbTNELkV4cG9ydC5DU1ZFeHBvcnRlci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuRXhwb3J0LkNTVkV4cG9ydGVyLnBhcnNlIiwiRm9yYW0zRC5IZWxwZXJzLkNvbG9yU2VxdWVuY2VyIiwiRm9yYW0zRC5IZWxwZXJzLkNvbG9yU2VxdWVuY2VyLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLkNvbG9yU2VxdWVuY2VyLm5leHQiLCJGb3JhbTNELkhlbHBlcnMuQ29sb3JTZXF1ZW5jZXIucmVzZXQiLCJGb3JhbTNELkhlbHBlcnMuRmFjZXNJdGVyYXRvciIsIkZvcmFtM0QuSGVscGVycy5GYWNlc0l0ZXJhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2VzSXRlcmF0b3IuaGFzTmV4dCIsIkZvcmFtM0QuSGVscGVycy5GYWNlc0l0ZXJhdG9yLm5leHQiLCJGb3JhbTNELkhlbHBlcnMuRmFjZXNJdGVyYXRvci5yZXNldCIsIkZvcmFtM0QuSGVscGVycy5GYWNlc0l0ZXJhdG9yLmdldEZhY2VzIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2VzSXRlcmF0b3IuZ2V0VmVydGljZXMiLCJGb3JhbTNELkhlbHBlcnMuTGluZSIsIkZvcmFtM0QuSGVscGVycy5MaW5lLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLkxpbmUuYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuSGVscGVycy5MaW5lLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkhlbHBlcnMuUGxhbmUiLCJGb3JhbTNELkhlbHBlcnMuUGxhbmUuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMuUGxhbmUubm9ybWFsaXplU3Bhbm5pbmdWZWN0b3JzIiwiRm9yYW0zRC5IZWxwZXJzLlBsYW5lLmJ1aWxkR2VvbWV0cnkiLCJGb3JhbTNELkhlbHBlcnMuUGxhbmUuYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuSGVscGVycy5Qb2ludCIsIkZvcmFtM0QuSGVscGVycy5Qb2ludC5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuSGVscGVycy5Qb2ludC5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5IZWxwZXJzLlBvaW50LmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIuQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5DYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5DaGFtYmVyLlN1cmZhY2VBcmVhQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5TdXJmYWNlQXJlYUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIuU3VyZmFjZUFyZWFDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5TdXJmYWNlQXJlYUNhbGN1bGF0b3IuY2FsY3VsYXRlRmFjZVN1cmZhY2VBcmVhIl0sIm1hcHBpbmdzIjoiOzs7OztBQUVBLElBQU8sT0FBTyxDQWdNYjtBQWhNRCxXQUFPLE9BQU8sRUFBQyxDQUFDO0lBUWRBO1FBQTZCQywyQkFBVUE7UUE0QnJDQSxpQkFBWUEsTUFBcUJBLEVBQUVBLE1BQWNBLEVBQUVBLFNBQWlCQTtZQUNsRUMsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBO1lBQ3JCQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQTtZQUNyQkEsSUFBSUEsQ0FBQ0EsU0FBU0EsR0FBR0EsU0FBU0EsQ0FBQ0E7WUFFM0JBLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBO1lBQ3BDQSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxhQUFhQSxFQUFFQSxDQUFDQTtZQUVwQ0Es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RU9GLHlEQUE4QkEsR0FBdENBLFVBQXVDQSxJQUFrQkE7Z0JBQ3ZERyxJQUFJQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxFQUFFQSxJQUFJQSxDQUFDQTtnQkFFdkNBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUFBO2dCQUN4Q0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQUE7Z0JBQ3hDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFBQTtnQkFDeENBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUFBO2dCQUN4Q0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQUE7Z0JBQ3hDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFBQTtnQkFFeENBLE1BQU1B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QkE7b0JBQ2pERyxJQUFJQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxLQUFLQSxDQUFDQTtvQkFFbEJBLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO29CQUNsQ0EsRUFBRUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7b0JBRWxDQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxPQUFPQSxFQUFFQSxDQUFDQTtvQkFDNUJBLEtBQUtBLENBQUNBLFlBQVlBLENBQUNBLEVBQUVBLEVBQUVBLEVBQUVBLENBQUNBLENBQUNBO29CQUUzQkEsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsTUFBTUEsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzVCQSxDQUFDQTtnQkFDSEgsNEJBQUNBO1lBQURBLENBdENBSCxBQXNDQ0csRUF0QzBDSCxrQkFBVUEsRUFzQ3BEQTtZQXRDWUEsNkJBQXFCQSx3QkFzQ2pDQSxDQUFBQTtRQUNIQSxDQUFDQSxFQXhDMEJwSCxPQUFPQSxHQUFQQSxtQkFBT0EsS0FBUEEsbUJBQU9BLFFBd0NqQ0E7SUFBREEsQ0FBQ0EsRUF4Q2N6QyxXQUFXQSxHQUFYQSxtQkFBV0EsS0FBWEEsbUJBQVdBLFFBd0N6QkE7QUFBREEsQ0FBQ0EsRUF4Q00sT0FBTyxLQUFQLE9BQU8sUUF3Q2IiLCJmaWxlIjoiZm9yYW0zZC5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
