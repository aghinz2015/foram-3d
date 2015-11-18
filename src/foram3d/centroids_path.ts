/// <reference path="./chamber_path.ts" />

module Foram3D {
  export class CentroidsPath extends ChamberPath {
    rebuild() {
      var centroids = this.fetchChambersAttribute("center");
      this.buildPath(centroids);
    }
  }
}
