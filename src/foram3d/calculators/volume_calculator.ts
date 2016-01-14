/// <reference path="./calculator.ts" />
/// <reference path="./faces_processor.ts" />

module Foram3D.Calculators {
  export class VolumeCalculator extends Calculator {
    calculate(): number {
      var result = 0;

      for (let chamber of this.foram.getActiveChambers()) {
        result += chamber.getVolume();
      }

      return result;
    }
  }
}
