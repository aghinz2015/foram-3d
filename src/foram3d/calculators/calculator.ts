/// <reference path="../foram.ts" />

module Foram3D {
  export abstract class Calculator {
    foram: Foram;

    constructor(foram: Foram) {
      this.foram = foram;
    }

    abstract calculate(): number;
  }
}
