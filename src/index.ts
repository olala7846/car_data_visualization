import * as THREE from 'three';
import * as dat from 'dat.gui';
import {
  Geometry, WebGLRenderer, OrthographicCamera, Scene, Vector3,
  PerspectiveCamera, DirectionalLight, AmbientLight, Object3D,
  Material, GridHelper, AxesHelper, MeshPhongMaterial, PointLight, Color, PlaneGeometry
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';

// TODO(olala7846): Enable caching to speed up compile and load time.

let path = "/dist/";	// STUDENT: set to "" to run on your computer, "/" for submitting code to Udacity

let camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer;
let cameraControls: OrbitControls;

let clock = new THREE.Clock();

function fillScene() {
	scene = new THREE.Scene();
  const loader = new PCDLoader();
  const pointCloudFileName = '/python/out/lidar0.pcd';
  loader.load(
    pointCloudFileName,
    (mesh) => {  // on resource loaded
      scene.add(mesh);
    },
    (xhr: any) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
      console.error('Error loading pcd ' + error.message);
    });
}

function init() {
	// For grading the window is fixed in size; here's general code:
	let canvasWidth = window.innerWidth;
	let canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	// renderer.gammaInput = true;
	// renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor( 0x0000, 1.0 );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 55, canvasRatio, 2, 10000 );
	camera.position.set( 10, 5, 15 );
	// CONTROLS
	cameraControls = new OrbitControls(camera, renderer.domElement);
	cameraControls.target.set(0,0,0);

}

function addToDOM() {
	var container = document.getElementById('container');
	var canvas = container.getElementsByTagName('canvas');
	if (canvas.length>0) {
		container.removeChild(canvas[0]);
	}
	container.appendChild( renderer.domElement );
}

function animate() {
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update();
	renderer.render(scene, camera);
}

init();
fillScene();
addToDOM();
animate();
