import * as THREE from 'three';
// TODO(olala7846): Enable caching to speed up compile and load time.

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  /* fov in degree */ 75,
  /* aspect ratio */ window.innerWidth / window.innerHeight,
  /* near clipping plane */ 0.1,
  /* far clipping plane */ 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// Mesh is an object that takes a geometry and applies a material to it.
const cube = new THREE.Mesh( geometry, material );
scene.add(cube);

camera.position.z = 5;



function animate() {
  requestAnimationFrame(animate);

  // Rotate
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

	renderer.render(scene, camera);
}
animate();
