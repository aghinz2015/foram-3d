module Foram3D.Controls {
  export class TargetControls {
    camera:   THREE.PerspectiveCamera;
    controls: THREE.TrackballControls;

    constructor(camera: THREE.PerspectiveCamera, controls: THREE.TrackballControls) {
      this.camera = camera;
      this.controls = controls;
    }

    fitTarget(target: THREE.Object3D) {
      var targetBoundingSphere = this.calculateBoundingSphere(target);

      var cameraPosition = this.camera.position;
      var targetPosition = targetBoundingSphere.center;

      this.controls.target.copy(targetPosition);

      var distanceToTarget = this.calculateDistanceToTarget(targetBoundingSphere);

      var cameraTranslation = new THREE.Vector3();

      cameraTranslation.subVectors(cameraPosition, targetPosition);
      cameraTranslation.setLength(distanceToTarget);

      var newCameraPosition = targetPosition.clone();
      newCameraPosition.add(cameraTranslation);

      this.camera.position.copy(newCameraPosition);
      this.camera.updateProjectionMatrix();
    }

    private calculateBoundingSphere(target: THREE.Object3D): THREE.Sphere {
      var visibleTarget = new THREE.Group();

      for (let child of target.children) {
        if (child.visible) visibleTarget.children.push(child);
      }

      var boundingBox = new THREE.Box3().setFromObject(visibleTarget);

      return boundingBox.getBoundingSphere();
    }

    private calculateDistanceToTarget(targetBoundingSphere: THREE.Sphere): number {
      return targetBoundingSphere.radius / Math.tan(this.camera.fov / 2 * Math.PI / 180)
    }
  }
}
