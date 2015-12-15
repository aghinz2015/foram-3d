module Foram3D.Helpers {
  export function extend<T extends Object>(base: T, params: T, defaults: T) {
    for (let param in defaults) {
      if (params && params[param] != undefined) {
        base[param] = params[param];
      } else {
        base[param] = defaults[param];
      }
    }
  }
}
