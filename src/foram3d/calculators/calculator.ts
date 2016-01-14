/// <reference path="../foram.ts" />

module Foram3D {
  export abstract class Calculator {
    foram: Foram;

    constructor(foram: Foram) {
      this.foram = foram;
    }

    abstract calculate(): number;

    protected sumChambers(calculateChamberMorphometric: (chamber: Chamber) => number): number {
      var result = 0;

      for (let chamber of this.foram.getActiveChambers()) {
        result += calculateChamberMorphometric(chamber);
      }

      return result;
    }
  }
}
