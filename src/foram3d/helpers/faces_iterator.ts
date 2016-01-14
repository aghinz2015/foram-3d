module Foram3D.Helpers {
  export class FacesIterator {
    mesh: THREE.Mesh;

    private faces: Array<THREE.Face3>;
    private vertices: Array<THREE.Vector3>;

    private currentFaceIndex: number;

    constructor(mesh: THREE.Mesh) {
      this.mesh = mesh;

      this.faces = this.getFaces();
      this.vertices = this.getVertices();

      this.currentFaceIndex = 0;
    }

    hasNext(): boolean {
      return this.currentFaceIndex < this.faces.length - 1;
    }

    next(): Face {
      var face = this.faces[this.currentFaceIndex];

      this.currentFaceIndex += 1;
      this.currentFaceIndex %= this.faces.length;

      return new Face(
        this.vertices[face.a],
        this.vertices[face.b],
        this.vertices[face.c]
      );
    }

    reset() {
      this.currentFaceIndex = 0;
    }

    private getFaces(): Array<THREE.Face3> {
      return this.mesh.geometry.faces;
    }

    private getVertices(): Array<THREE.Vector3> {
      return this.mesh.geometry.vertices;
    }
  }
}
