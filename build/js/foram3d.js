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
        Chamber.prototype.getVolume = function () {
            if (!this.volume) {
                var calculator = new Foram3D.Calculators.Chamber.VolumeCalculator(this);
                this.volume = calculator.calculate();
            }
            return this.volume;
        };
        Chamber.prototype.serialize = function () {
            return {
                radius: this.radius,
                thickness: this.thickness,
                surfaceArea: this.getSurfaceArea(),
                materialVolume: this.getMaterialVolume(),
                volume: this.getVolume()
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
        Calculator.prototype.sumChambers = function (calculateChamberMorphometric) {
            var result = 0;
            for (var _i = 0, _a = this.foram.getActiveChambers(); _i < _a.length; _i++) {
                var chamber = _a[_i];
                result += calculateChamberMorphometric(chamber);
            }
            return result;
        };
        return Calculator;
    })();
    Foram3D.Calculator = Calculator;
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
                return this.sumChambers(function (chamber) { return chamber.getSurfaceArea(); });
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
        var MaterialVolumeCalculator = (function (_super) {
            __extends(MaterialVolumeCalculator, _super);
            function MaterialVolumeCalculator() {
                _super.apply(this, arguments);
            }
            MaterialVolumeCalculator.prototype.calculate = function () {
                return this.sumChambers(function (chamber) { return chamber.getMaterialVolume(); });
            };
            return MaterialVolumeCalculator;
        })(Foram3D.Calculator);
        Calculators.MaterialVolumeCalculator = MaterialVolumeCalculator;
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
                return this.sumChambers(function (chamber) { return chamber.getVolume(); });
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
var Foram3D;
(function (Foram3D) {
    var Calculators;
    (function (Calculators) {
        var Chamber;
        (function (Chamber) {
            var VolumeCalculator = (function (_super) {
                __extends(VolumeCalculator, _super);
                function VolumeCalculator() {
                    _super.apply(this, arguments);
                }
                VolumeCalculator.prototype.calculate = function () {
                    var outerVolume = this.calculateOuterVolume();
                    var innerVolume = this.calculateInnerVolume();
                    return outerVolume - innerVolume;
                };
                VolumeCalculator.prototype.calculateOuterVolume = function () {
                    var facesIterator, intersectingChambers, face, isOuterFace, chamber, result = 0;
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
                            result += this.calculateFaceVolume(face);
                        }
                    }
                    return result;
                };
                VolumeCalculator.prototype.calculateInnerVolume = function () {
                    var facesIterator, intersectingChambers, face, isOuterFace, chamber, result = 0;
                    intersectingChambers = this.chamber.getIntersectingChambers();
                    for (var _i = 0; _i < intersectingChambers.length; _i++) {
                        chamber = intersectingChambers[_i];
                        facesIterator = new Foram3D.Helpers.FacesIterator(chamber);
                        while (facesIterator.hasNext()) {
                            face = facesIterator.next();
                            if (face.centroid.distanceTo(this.chamber.center) < this.chamber.radius) {
                                result -= this.calculateFaceVolume(face);
                            }
                        }
                    }
                    return result;
                };
                VolumeCalculator.prototype.calculateFaceVolume = function (face) {
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
            })(Chamber.Calculator);
            Chamber.VolumeCalculator = VolumeCalculator;
        })(Chamber = Calculators.Chamber || (Calculators.Chamber = {}));
    })(Calculators = Foram3D.Calculators || (Foram3D.Calculators = {}));
})(Foram3D || (Foram3D = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNoYW1iZXIudHMiLCJjaGFtYmVyX3BhdGhzL2NoYW1iZXJfcGF0aC50cyIsImNoYW1iZXJfcGF0aHMvY2VudHJvaWRzX3BhdGgudHMiLCJjaGFtYmVyX3BhdGhzL2FwZXJ0dXJlc19wYXRoLnRzIiwiY2FsY3VsYXRvcnMvY2FsY3VsYXRvci50cyIsImNhbGN1bGF0b3JzL3N1cmZhY2VfYXJlYV9jYWxjdWxhdG9yLnRzIiwiY2FsY3VsYXRvcnMvbWF0ZXJpYWxfdm9sdW1lX2NhbGN1bGF0b3IudHMiLCJjYWxjdWxhdG9ycy92b2x1bWVfY2FsY3VsYXRvci50cyIsImNhbGN1bGF0b3JzL3NoYXBlX2ZhY3Rvcl9jYWxjdWxhdG9yLnRzIiwiZm9yYW0udHMiLCJzaW11bGF0aW9uX2d1aS50cyIsImNvbnRyb2xzL3RhcmdldF9jb250cm9scy50cyIsImhlbHBlcnMvdXRpbHMudHMiLCJzaW11bGF0aW9uLnRzIiwiZXhwb3J0L2Nzdl9leHBvcnRlci50cyIsImhlbHBlcnMvY29sb3Jfc2VxdWVuY2VyLnRzIiwiaGVscGVycy9mYWNlLnRzIiwiaGVscGVycy9mYWNlc19pdGVyYXRvci50cyIsImhlbHBlcnMvbGluZS50cyIsImhlbHBlcnMvcGxhbmUudHMiLCJoZWxwZXJzL3BvaW50LnRzIiwiY2FsY3VsYXRvcnMvY2hhbWJlci9jYWxjdWxhdG9yLnRzIiwiY2FsY3VsYXRvcnMvY2hhbWJlci9tYXRlcmlhbF92b2x1bWVfY2FsY3VsYXRvci50cyIsImNhbGN1bGF0b3JzL2NoYW1iZXIvc3VyZmFjZV9hcmVhX2NhbGN1bGF0b3IudHMiLCJjYWxjdWxhdG9ycy9jaGFtYmVyL3ZvbHVtZV9jYWxjdWxhdG9yLnRzIl0sIm5hbWVzIjpbIkZvcmFtM0QiLCJGb3JhbTNELkNoYW1iZXIiLCJGb3JhbTNELkNoYW1iZXIuY29uc3RydWN0b3IiLCJGb3JhbTNELkNoYW1iZXIuc2V0QW5jZXN0b3IiLCJGb3JhbTNELkNoYW1iZXIuc2V0QXBlcnR1cmUiLCJGb3JhbTNELkNoYW1iZXIuc2hvd1RoaWNrbmVzc1ZlY3RvciIsIkZvcmFtM0QuQ2hhbWJlci5oaWRlVGhpY2tuZXNzVmVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyLm1hcmtBcGVydHVyZSIsIkZvcmFtM0QuQ2hhbWJlci5nZXRTdXJmYWNlQXJlYSIsIkZvcmFtM0QuQ2hhbWJlci5nZXRNYXRlcmlhbFZvbHVtZSIsIkZvcmFtM0QuQ2hhbWJlci5nZXRWb2x1bWUiLCJGb3JhbTNELkNoYW1iZXIuc2VyaWFsaXplIiwiRm9yYW0zRC5DaGFtYmVyLmFwcGx5TWF0ZXJpYWwiLCJGb3JhbTNELkNoYW1iZXIuc2V0Q29sb3IiLCJGb3JhbTNELkNoYW1iZXIucmVzZXRDb2xvciIsIkZvcmFtM0QuQ2hhbWJlci5kaXN0YW5jZVRvIiwiRm9yYW0zRC5DaGFtYmVyLmludGVyc2VjdHMiLCJGb3JhbTNELkNoYW1iZXIuZ2V0SW50ZXJzZWN0aW5nQ2hhbWJlcnMiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRBcGVydHVyZU1hcmtlciIsIkZvcmFtM0QuQ2hhbWJlci5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5DaGFtYmVyLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkNoYW1iZXIuYnVpbGRUaGlja25lc3NWZWN0b3IiLCJGb3JhbTNELkNoYW1iZXIuY2FsY3VsYXRlQXBlcnR1cmUiLCJGb3JhbTNELkNoYW1iZXJQYXRocyIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNoYW1iZXJQYXRoIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguY29uc3RydWN0b3IiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5idWlsZFBhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5mZXRjaENoYW1iZXJzQXR0cmlidXRlIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRQb3NpdGlvbnNCdWZmZXIiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DaGFtYmVyUGF0aC5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2hhbWJlclBhdGguYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkNlbnRyb2lkc1BhdGgiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5DZW50cm9pZHNQYXRoLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQ2VudHJvaWRzUGF0aC5yZWJ1aWxkIiwiRm9yYW0zRC5DaGFtYmVyUGF0aHMuQXBlcnR1cmVzUGF0aCIsIkZvcmFtM0QuQ2hhbWJlclBhdGhzLkFwZXJ0dXJlc1BhdGguY29uc3RydWN0b3IiLCJGb3JhbTNELkNoYW1iZXJQYXRocy5BcGVydHVyZXNQYXRoLnJlYnVpbGQiLCJGb3JhbTNELkNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3Iuc3VtQ2hhbWJlcnMiLCJGb3JhbTNELkNhbGN1bGF0b3JzIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TdXJmYWNlQXJlYUNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlN1cmZhY2VBcmVhQ2FsY3VsYXRvci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU3VyZmFjZUFyZWFDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuTWF0ZXJpYWxWb2x1bWVDYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5NYXRlcmlhbFZvbHVtZUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLk1hdGVyaWFsVm9sdW1lQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlZvbHVtZUNhbGN1bGF0b3IuY2FsY3VsYXRlIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLlNoYXBlRmFjdG9yQ2FsY3VsYXRvci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuU2hhcGVGYWN0b3JDYWxjdWxhdG9yLmNhbGN1bGF0ZURpc3RhbmNlQmV0d2VlbkhlYWRBbmRUYWlsIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5TaGFwZUZhY3RvckNhbGN1bGF0b3IuY2FsY3VsYXRlQ2VudHJvaWRzUGF0aExlbmd0aCIsIkZvcmFtM0QuRm9yYW0iLCJGb3JhbTNELkZvcmFtLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5Gb3JhbS5ldm9sdmUiLCJGb3JhbTNELkZvcmFtLnJlZ3Jlc3MiLCJGb3JhbTNELkZvcmFtLnRvZ2dsZUNlbnRyb2lkc1BhdGgiLCJGb3JhbTNELkZvcmFtLnRvZ2dsZUFwZXJ0dXJlc1BhdGgiLCJGb3JhbTNELkZvcmFtLnNob3dUaGlja25lc3NWZWN0b3JzIiwiRm9yYW0zRC5Gb3JhbS5oaWRlVGhpY2tuZXNzVmVjdG9ycyIsIkZvcmFtM0QuRm9yYW0udG9nZ2xlVGhpY2tuZXNzVmVjdG9ycyIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlU3VyZmFjZUFyZWEiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZVZvbHVtZSIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTWF0ZXJpYWxWb2x1bWUiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZVNoYXBlRmFjdG9yIiwiRm9yYW0zRC5Gb3JhbS5hcHBseU9wYWNpdHkiLCJGb3JhbTNELkZvcmFtLmNvbG91ciIsIkZvcmFtM0QuRm9yYW0uZGVjb2xvdXIiLCJGb3JhbTNELkZvcmFtLmdldEFjdGl2ZUNoYW1iZXJzIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXh0Q2hhbWJlciIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3Q2VudGVyIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVHcm93dGhWZWN0b3JMZW5ndGgiLCJGb3JhbTNELkZvcmFtLmNhbGN1bGF0ZU5ld1JhZGl1cyIsIkZvcmFtM0QuRm9yYW0uY2FsY3VsYXRlTmV3VGhpY2tuZXNzIiwiRm9yYW0zRC5Gb3JhbS5jYWxjdWxhdGVOZXdBcGVydHVyZSIsIkZvcmFtM0QuRm9yYW0uYnVpbGRJbml0aWFsQ2hhbWJlciIsIkZvcmFtM0QuRm9yYW0uYnVpbGRDaGFtYmVyIiwiRm9yYW0zRC5Gb3JhbS51cGRhdGVDaGFtYmVyUGF0aHMiLCJGb3JhbTNELkZvcmFtLnVwZGF0ZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELkZvcmFtLnVwZGF0ZUNoYW1iZXJzTWF0ZXJpYWwiLCJGb3JhbTNELkZvcmFtLnVwZGF0ZUNoYW1iZXJzQ29sb3JzIiwiRm9yYW0zRC5Gb3JhbS5yZXNldENoYW1iZXJzQ29sb3JzIiwiRm9yYW0zRC5TaW11bGF0aW9uR1VJIiwiRm9yYW0zRC5TaW11bGF0aW9uR1VJLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5TaW11bGF0aW9uR1VJLnNldHVwIiwiRm9yYW0zRC5Db250cm9scyIsIkZvcmFtM0QuQ29udHJvbHMuVGFyZ2V0Q29udHJvbHMiLCJGb3JhbTNELkNvbnRyb2xzLlRhcmdldENvbnRyb2xzLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5Db250cm9scy5UYXJnZXRDb250cm9scy5maXRUYXJnZXQiLCJGb3JhbTNELkNvbnRyb2xzLlRhcmdldENvbnRyb2xzLmNhbGN1bGF0ZUJvdW5kaW5nU3BoZXJlIiwiRm9yYW0zRC5Db250cm9scy5UYXJnZXRDb250cm9scy5jYWxjdWxhdGVEaXN0YW5jZVRvVGFyZ2V0IiwiRm9yYW0zRC5IZWxwZXJzIiwiRm9yYW0zRC5IZWxwZXJzLmV4dGVuZCIsIkZvcmFtM0QuU2ltdWxhdGlvbiIsIkZvcmFtM0QuU2ltdWxhdGlvbi5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zaW11bGF0ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5ldm9sdmUiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVncmVzcyIsIkZvcmFtM0QuU2ltdWxhdGlvbi50b2dnbGVDZW50cm9pZHNQYXRoIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRvZ2dsZUFwZXJ0dXJlc1BhdGgiLCJGb3JhbTNELlNpbXVsYXRpb24uY2FsY3VsYXRlU3VyZmFjZUFyZWEiLCJGb3JhbTNELlNpbXVsYXRpb24uY2FsY3VsYXRlVm9sdW1lIiwiRm9yYW0zRC5TaW11bGF0aW9uLmNhbGN1bGF0ZVNoYXBlRmFjdG9yIiwiRm9yYW0zRC5TaW11bGF0aW9uLnRvZ2dsZVRoaWNrbmVzc1ZlY3RvcnMiLCJGb3JhbTNELlNpbXVsYXRpb24uYXBwbHlPcGFjaXR5IiwiRm9yYW0zRC5TaW11bGF0aW9uLmNvbG91ciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5kZWNvbG91ciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5leHBvcnRUb09CSiIsIkZvcmFtM0QuU2ltdWxhdGlvbi5leHBvcnRUb0NTViIsIkZvcmFtM0QuU2ltdWxhdGlvbi50YWtlU2NyZWVuc2hvdCIsIkZvcmFtM0QuU2ltdWxhdGlvbi5vbkNoYW1iZXJDbGljayIsIkZvcmFtM0QuU2ltdWxhdGlvbi5vbkNoYW1iZXJIb3ZlciIsIkZvcmFtM0QuU2ltdWxhdGlvbi5maXRUYXJnZXQiLCJGb3JhbTNELlNpbXVsYXRpb24ucmVzZXQiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBTY2VuZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cENvbnRyb2xzIiwiRm9yYW0zRC5TaW11bGF0aW9uLnNldHVwVGFyZ2V0Q29udHJvbHMiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBNb3VzZUV2ZW50cyIsIkZvcmFtM0QuU2ltdWxhdGlvbi5zZXR1cEF1dG9SZXNpemUiLCJGb3JhbTNELlNpbXVsYXRpb24uc2V0dXBHVUkiLCJGb3JhbTNELlNpbXVsYXRpb24ub25Nb3VzZUNsaWNrIiwiRm9yYW0zRC5TaW11bGF0aW9uLm9uTW91c2VNb3ZlIiwiRm9yYW0zRC5TaW11bGF0aW9uLmdldFBvaW50ZWRDaGFtYmVyIiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlc2l6ZSIsIkZvcmFtM0QuU2ltdWxhdGlvbi5hbmltYXRlIiwiRm9yYW0zRC5TaW11bGF0aW9uLnJlbmRlciIsIkZvcmFtM0QuRXhwb3J0IiwiRm9yYW0zRC5FeHBvcnQuQ1NWRXhwb3J0ZXIiLCJGb3JhbTNELkV4cG9ydC5DU1ZFeHBvcnRlci5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuRXhwb3J0LkNTVkV4cG9ydGVyLnBhcnNlIiwiRm9yYW0zRC5IZWxwZXJzLkNvbG9yU2VxdWVuY2VyIiwiRm9yYW0zRC5IZWxwZXJzLkNvbG9yU2VxdWVuY2VyLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLkNvbG9yU2VxdWVuY2VyLm5leHQiLCJGb3JhbTNELkhlbHBlcnMuQ29sb3JTZXF1ZW5jZXIucmVzZXQiLCJGb3JhbTNELkhlbHBlcnMuRmFjZSIsIkZvcmFtM0QuSGVscGVycy5GYWNlLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2UuY2FsY3VsYXRlQ2VudHJvaWQiLCJGb3JhbTNELkhlbHBlcnMuRmFjZXNJdGVyYXRvciIsIkZvcmFtM0QuSGVscGVycy5GYWNlc0l0ZXJhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2VzSXRlcmF0b3IuaGFzTmV4dCIsIkZvcmFtM0QuSGVscGVycy5GYWNlc0l0ZXJhdG9yLm5leHQiLCJGb3JhbTNELkhlbHBlcnMuRmFjZXNJdGVyYXRvci5yZXNldCIsIkZvcmFtM0QuSGVscGVycy5GYWNlc0l0ZXJhdG9yLmdldEZhY2VzIiwiRm9yYW0zRC5IZWxwZXJzLkZhY2VzSXRlcmF0b3IuZ2V0VmVydGljZXMiLCJGb3JhbTNELkhlbHBlcnMuTGluZSIsIkZvcmFtM0QuSGVscGVycy5MaW5lLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5IZWxwZXJzLkxpbmUuYnVpbGRHZW9tZXRyeSIsIkZvcmFtM0QuSGVscGVycy5MaW5lLmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkhlbHBlcnMuUGxhbmUiLCJGb3JhbTNELkhlbHBlcnMuUGxhbmUuY29uc3RydWN0b3IiLCJGb3JhbTNELkhlbHBlcnMuUGxhbmUubm9ybWFsaXplU3Bhbm5pbmdWZWN0b3JzIiwiRm9yYW0zRC5IZWxwZXJzLlBsYW5lLmJ1aWxkR2VvbWV0cnkiLCJGb3JhbTNELkhlbHBlcnMuUGxhbmUuYnVpbGRNYXRlcmlhbCIsIkZvcmFtM0QuSGVscGVycy5Qb2ludCIsIkZvcmFtM0QuSGVscGVycy5Qb2ludC5jb25zdHJ1Y3RvciIsIkZvcmFtM0QuSGVscGVycy5Qb2ludC5idWlsZEdlb21ldHJ5IiwiRm9yYW0zRC5IZWxwZXJzLlBvaW50LmJ1aWxkTWF0ZXJpYWwiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIuQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5DYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5DaGFtYmVyLk1hdGVyaWFsVm9sdW1lQ2FsY3VsYXRvciIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5NYXRlcmlhbFZvbHVtZUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIuTWF0ZXJpYWxWb2x1bWVDYWxjdWxhdG9yLmNhbGN1bGF0ZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5TdXJmYWNlQXJlYUNhbGN1bGF0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIuU3VyZmFjZUFyZWFDYWxjdWxhdG9yLmNvbnN0cnVjdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5DaGFtYmVyLlN1cmZhY2VBcmVhQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIuU3VyZmFjZUFyZWFDYWxjdWxhdG9yLmNhbGN1bGF0ZUZhY2VTdXJmYWNlQXJlYSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5Wb2x1bWVDYWxjdWxhdG9yIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5DaGFtYmVyLlZvbHVtZUNhbGN1bGF0b3IuY29uc3RydWN0b3IiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIuVm9sdW1lQ2FsY3VsYXRvci5jYWxjdWxhdGUiLCJGb3JhbTNELkNhbGN1bGF0b3JzLkNoYW1iZXIuVm9sdW1lQ2FsY3VsYXRvci5jYWxjdWxhdGVPdXRlclZvbHVtZSIsIkZvcmFtM0QuQ2FsY3VsYXRvcnMuQ2hhbWJlci5Wb2x1bWVDYWxjdWxhdG9yLmNhbGN1bGF0ZUlubmVyVm9sdW1lIiwiRm9yYW0zRC5DYWxjdWxhdG9ycy5DaGFtYmVyLlZvbHVtZUNhbGN1bGF0b3IuY2FsY3VsYXRlRmFjZVZvbHVtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFFQSxJQUFPLE9BQU8sQ0FnT2I7QUFoT0QsV0FBTyxPQUFPLEVBQUMsQ0FBQztJQVdkQTtRQUE2QkMsMkJBQVVBO1FBZ0NyQ0EsaUJBQVlBLE1BQXFCQSxFQUFFQSxNQUFjQSxFQUFFQSxTQUFpQkE7WUFDbEVDLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBO1lBQ3JCQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxNQUFNQSxDQUFDQTtZQUNyQkEsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsTUFBTUEsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLFNBQVNBLEdBQUdBLFNBQVNBLENBQUNBO1lBRTNCQSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxhQUFhQSxFQUFFQSxDQUFDQTtZQUNwQ0EsSUFBSUEsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0E7WUFFcENBLGtCQUFNQSxRQUFRQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQTtZQUUxQkEsSUFBSUEsQ0FBQ0EsUUFBUUEsR0FBR0EsSUFBSUEsQ0FBQ0EsaUJBQWlCQSxFQUFFQSxDQUFDQTtRQUMzQ0EsQ0FBQ0E7UUFFREQsNkJBQVdBLEdBQVhBLFVBQVlBLFdBQW9C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QSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFBQTtvQkFDeENBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUFBO29CQUV4Q0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsR0FBR0EsSUFBSUEsR0FBRUEsSUFBSUEsR0FBR0EsSUFBSUEsR0FBR0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3ZEQSxDQUFDQTtnQkFDSEwsdUJBQUNBO1lBQURBLENBbkVBVixBQW1FQ1UsRUFuRXFDVixrQkFBVUEsRUFtRS9DQTtZQW5FWUEsd0JBQWdCQSxtQkFtRTVCQSxDQUFBQTtRQUNIQSxDQUFDQSxFQXJFMEJ4SCxPQUFPQSxHQUFQQSxtQkFBT0EsS0FBUEEsbUJBQU9BLFFBcUVqQ0E7SUFBREEsQ0FBQ0EsRUFyRWN4QyxXQUFXQSxHQUFYQSxtQkFBV0EsS0FBWEEsbUJBQVdBLFFBcUV6QkE7QUFBREEsQ0FBQ0EsRUFyRU0sT0FBTyxLQUFQLE9BQU8sUUFxRWIiLCJmaWxlIjoiZm9yYW0zZC5qcyIsInNvdXJjZXNDb250ZW50IjpbbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbCxudWxsLG51bGwsbnVsbF0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
