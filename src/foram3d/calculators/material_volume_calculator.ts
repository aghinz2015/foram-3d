/// <reference path="./calculator.ts" />

module Foram3D.Calculators {
  export class MaterialVolumeCalculator extends Calculator {
    calculate(): number {
      var result = 0;

      for (let chamber of this.foram.getActiveChambers()) {
        result += chamber.getMaterialVolume();
      }

      return result;
    }
  }
}
