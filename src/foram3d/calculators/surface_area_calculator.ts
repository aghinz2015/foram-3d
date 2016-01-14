/// <reference path="./calculator.ts" />

module Foram3D.Calculators {
  export class SurfaceAreaCalculator extends Calculator {
    calculate(): number {
      var result = 0;

      for (let chamber of this.foram.getActiveChambers()) {
        result += chamber.getSurfaceArea();
      }

      return result;
    }
  }
}
