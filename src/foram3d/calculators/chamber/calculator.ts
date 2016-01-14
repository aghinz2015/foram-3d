/// <reference path="../../chamber.ts" />

module Foram3D.Calculators.Chamber {
  export abstract class Calculator {
    chamber: Chamber;

    constructor(chamber: Chamber) {
      this.chamber = chamber;
    }

    abstract calculate(): number;
  }
}
