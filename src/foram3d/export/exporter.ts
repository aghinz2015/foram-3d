/// <reference path="../foram.ts"/>

module Foram3D.Export {
  export interface Exporter {
    parse(foram: Foram): string;
  }
}
