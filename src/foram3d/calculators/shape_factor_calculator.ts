/// <reference path="./calculator.ts" />

module Foram3D.Calculators {
  export class ShapeFactorCalculator extends Calculator {
    calculate(): number {
      var centroidsPathLength = this.calculateCentroidsPathLength();
      var headToTailDistance  = this.calculateDistanceBetweenHeadAndTail();

      return centroidsPathLength / headToTailDistance;
    }

    private calculateDistanceBetweenHeadAndTail(): number {
      var chambers, head, tail;

      chambers = this.foram.chambers;

      head = chambers[0];
      tail = chambers[chambers.length - 1];

      return head.center.distanceTo(tail.center);
    }

    private calculateCentroidsPathLength(): number {
      var activeChambers, prevChamber, chamber,
          totalLength;

      activeChambers = this.foram.chambers;

      prevChamber = activeChambers[0];
      activeChambers.shift();

      totalLength = 0;

      for (chamber of activeChambers) {
        totalLength += prevChamber.center.distanceTo(chamber.center);
        prevChamber = chamber;
      }

      return totalLength;
    }
  }
}
