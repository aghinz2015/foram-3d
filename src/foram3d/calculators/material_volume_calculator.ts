/// <reference path="./calculator.ts" />

module Foram3D.Calculators {
  export class MaterialVolumeCalculator extends Calculator {
    calculate(): number {
      return this.sumChambers(
        (chamber: Chamber) => chamber.getMaterialVolume()
      );
    }
  }
}
