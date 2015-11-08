module Foram3D {
  export class Configuration {
    dev: boolean;

    constructor(params: ConfigurationParams) {
      this.dev = params.dev || false;
    }
  }
}
