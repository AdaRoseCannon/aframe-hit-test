/* global AFRAME, THREE, XRRay */
// Original source https://github.com/stspanho/aframe-hit-test


// Usage
// Needs the master version of AFrame and the hit-test optional feature
// Add ar-hit-test to the reticle
/**

    <a-scene webxr="optionalFeatures: hit-test,local-floor;">
      <a-entity id="world" scale="0.1 0.1 0.1" position="0 0 -3">
        <a-box position="-1 0.5 0" rotation="0 45 0" color="#4CC3D9"></a-box>
        <a-sphere position="0 1.25 -2" radius="1.25" color="#EF2D5E"></a-sphere>
        <a-cylinder position="1 0.75 0" radius="0.5" height="1.5" color="#FFC65D"></a-cylinder>
        <a-plane position="0 0 -1" rotation="-90 0 0" width="4" height="4" color="#7BC8A4"></a-plane>
        <a-sky hide-in-ar-mode color="#ECECEC"></a-sky>
      </a-entity>
      
      <a-plane ar-hit-test visible="false" id="reticle" position="0 0 0" rotation="-90 0 0" width="0.1" height="0.1" material="src:https://cdn.glitch.com/31ab0503-2a9b-4eab-8fd3-9910e8398336%2F31ab0503-2a9b-4eab-8fd3-9910e8398336_target.png?v=1594646291100;blending:additive;"></a-plane>
    </a-scene>
    <script>
      document.getElementById('reticle').addEventListener('select', function (event) {
        const position = this.getAttribute('position');
        document.getElementById('world').setAttribute('position', position);
      });
    </script>
*/

AFRAME.registerComponent("ar-hit-test", {
  init: function() {
    this.xrHitTestSource = null;
    this.refSpace = null;

    this.el.sceneEl.renderer.xr.addEventListener("sessionend", ev => {
      this.refSpace = null;
      this.xrHitTestSource = null;
    });

    this.el.sceneEl.renderer.xr.addEventListener("sessionstart", ev => {
      const session = this.el.sceneEl.renderer.xr.getSession();

      session.addEventListener('select', event => {
        this.el.emit('select');
      });
      
      session
      .requestReferenceSpace("viewer")
      .then(space => {
        return session.requestHitTestSource({
          space,
          offsetRay: window.XRRay && new XRRay({y: 0.2})
        });
      })
      .then(hitTestSource => {
        this.xrHitTestSource = hitTestSource;
      });

      session.requestReferenceSpace("local-floor").then(space => {
        this.refSpace = space;
      });
    });
  },
  tick: function() {
    if (this.el.sceneEl.is("ar-mode")) {
      const frame = this.el.sceneEl.frame;
      const xrViewerPose = frame.getViewerPose(this.refSpace);

      if (this.xrHitTestSource && xrViewerPose) {
        const hitTestResults = frame.getHitTestResults(this.xrHitTestSource);
        if (hitTestResults.length > 0) {
          this.el.setAttribute('visible', 'true');
          const pose = hitTestResults[0].getPose(this.refSpace);

          const inputMat = new THREE.Matrix4();
          inputMat.fromArray(pose.transform.matrix);

          const position = new THREE.Vector3();
          position.setFromMatrixPosition(inputMat);
          this.el.setAttribute("position", position);
        } else {
          this.el.setAttribute('visible', 'false');
        }
      }
    }
  }
});
