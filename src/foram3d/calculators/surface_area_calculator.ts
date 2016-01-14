/// <reference path="./calculator.ts" />

module Foram3D.Calculators {
  export class SurfaceAreaCalculator extends Calculator {
    calculate(): number {
      return this.sumChambers(
        (chamber: Chamber) => chamber.getSurfaceArea()
      );
    }
  }
}
