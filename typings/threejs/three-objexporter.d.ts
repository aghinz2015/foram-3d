declare module THREE {
  export class OBJExporter {
    parse(object: THREE.Object3D): string;
  }
}
