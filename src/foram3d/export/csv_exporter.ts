/// <reference path="./exporter.ts"/>

module Foram3D.Export {
  export class CSVExporter implements Exporter {
    parse(foram: Foram): string {
      var output = [];

      for (let gene in foram.genotype) {
        output.push(foram.genotype[gene]);
      }

      output.push(
        foram.calculateSurfaceArea(),
        foram.calculateVolume(),
        foram.calculateShapeFactor()
      );

      return output.join(";");
    }
  }
}
