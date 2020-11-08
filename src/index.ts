import * as THREE from 'three';
import * as dat from 'dat.gui';
import {
  Geometry, WebGLRenderer, OrthographicCamera, Scene, Vector3,
  PerspectiveCamera, DirectionalLight, AmbientLight, Object3D,
  Material, GridHelper, AxesHelper, MeshPhongMaterial
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// TODO(olala7846): Enable caching to speed up compile and load time.

interface	EffectController  {

  newGridXZ: boolean;
  newGridYZ: boolean;
  newGridXY: boolean;
  newAxes: boolean;

  // Add custom controls below
};


let camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer;
let cameraControls: OrbitControls, effectController: EffectController;
let clock = new THREE.Clock();
let gridXZ = true;
let gridYZ = false;
let gridXY = false;
let axes = true;
let ground = true;

function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );

	// LIGHTS
	var ambientLight = new THREE.AmbientLight( 0x222222 );
	var light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light.position.set( 200, 400, 500 );
	var light2 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	light2.position.set( -500, 250, -200 );
	scene.add(ambientLight);
	scene.add(light);
	scene.add(light2);

  // Add Objects here
  let boxMaterial = new MeshPhongMaterial({
    color: 0xD1F5FD, specular: 0xD1f5fD, shininess: 100,
  });
  let box = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 2), boxMaterial);
  box.position.x = 0;
  box.position.y = 0;
  box.position.z = 0;

  scene.add(box);
}

function init() {
	// For grading the window is fixed in size; here's general code:
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	// renderer.gammaInput = true;
	// renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor( 0xAAAAAA, 1.0 );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 38, canvasRatio, 1, 10000 );
	// CONTROLS
	cameraControls = new OrbitControls(camera, renderer.domElement);
	camera.position.set(-10, 10, 2);
	cameraControls.target.set(0, 0, 0);
}

function addToDOM() {
	var container = document.getElementById('container');
	var canvas = container.getElementsByTagName('canvas');
	if (canvas.length>0) {
		container.removeChild(canvas[0]);
	}
	container.appendChild( renderer.domElement );
}

function drawHelpers() {
	if (gridXZ) {
    const gridHelper = new THREE.GridHelper(1000, 100);
    scene.add(gridHelper);
	}
	if (gridYZ) {
    const gridHelper = new THREE.GridHelper(1000, 100);
    gridHelper.rotation.z = 90 * Math.PI / 180;
    scene.add(gridHelper);
	}
	if (gridXY) {
    const gridHelper = new THREE.GridHelper(1000, 100);
    gridHelper.rotation.x = 90 * Math.PI / 180;
    scene.add(gridHelper);
	}
	if (axes) {
    const axesHelper = new AxesHelper(200);
    scene.add(axesHelper);
	}
}

function animate() {
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update();

  if (effectController.newGridXZ !== gridXZ
      || effectController.newGridYZ !== gridYZ
      || effectController.newGridXY !== gridXY
      || effectController.newAxes !== axes) {
    gridXZ = effectController.newGridXZ;
		gridYZ = effectController.newGridYZ;
		gridXY = effectController.newGridXY;
		axes = effectController.newAxes;

		fillScene();
		drawHelpers();
  }

  // TODO: Other dynamic updates here

	renderer.render(scene, camera);
}

function setupGui() {

  effectController = {

		newGridXZ: gridXZ,
		newGridYZ: gridYZ,
		newGridXY: gridXY,
		newAxes: axes,

		// Other Custom controls here
	};

	var gui = new dat.GUI();
	var h = gui.addFolder("Grid display");
	h.add( effectController, "newGridXZ").name("Show XZ grid");
	h.add( effectController, "newGridYZ" ).name("Show YZ grid");
	h.add( effectController, "newGridXY" ).name("Show XY grid");
	h.add( effectController, "newAxes" ).name("Show axes");

  // Add other custom control below
}


init();
fillScene();
setupGui();
drawHelpers();
addToDOM();
animate();
