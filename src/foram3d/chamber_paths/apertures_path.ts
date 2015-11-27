/// <reference path="./chamber_path.ts" />

module Foram3D.ChamberPaths {
  export class AperturesPath extends ChamberPath {
    rebuild() {
      var apertures = this.fetchChambersAttribute("aperture");
      this.buildPath(apertures);
    }
  }
}
