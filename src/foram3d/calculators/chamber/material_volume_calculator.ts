/// <reference path="./calculator.ts"/>

module Foram3D.Calculators.Chamber {
  export class MaterialVolumeCalculator extends Calculator {
    calculate(): number {
      return this.chamber.getSurfaceArea() * this.chamber.thickness;
    }
  }
}
