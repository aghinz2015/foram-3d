module Foram3D {
  export class SimulationGUI extends dat.GUI {
    simulation: Simulation;

    constructor(simulation: Simulation) {
      super();

      this.simulation = simulation;
      this.setup();
    }

    private setup() {
      var genotypeFolder  = this.addFolder("Genotype");
      var structureFolder = this.addFolder("Structure analyzer");
      var materialFolder  = this.addFolder("Material");

      var genotype = {
        phi:                 0.5,
        beta:                0.5,
        translationFactor:   0.5,
        growthFactor:        1.1,
        wallThicknessFactor: 1.1
      };

      var structureAnalyzer = {
        numChambers:      20,
        simulate:         () => this.simulation.simulate(genotype, structureAnalyzer.numChambers),
        evolve:           () => this.simulation.evolve(),
        regress:          () => this.simulation.regress(),
        centroidsPath:    () => this.simulation.toggleCentroidsPath(),
        aperturesPath:    () => this.simulation.toggleAperturesPath(),
        thicknessVectors: () => this.simulation.toggleThicknessVectors(),
        fitTarget:        () => this.simulation.fitTarget()
      }

      var materialOptions = {
        opacity: 0.8
      }

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

      materialFolder.add(materialOptions, 'opacity').onFinishChange(
        () => this.simulation.applyOpacity(materialOptions.opacity)
      );
    }

  }
}
