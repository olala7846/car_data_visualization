import * as THREE from 'three';
import * as dat from 'dat.gui';
import {
  Geometry, WebGLRenderer, Scene,
  PerspectiveCamera, DirectionalLight, Object3D,
  Material, GridHelper, AxesHelper, Color, PlaneGeometry, PointsMaterial
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';

interface EffectController {
  // Laser control, see LaserName.Name enum in dataset.proto
  laserTop: boolean,
  laserFront: boolean,
  laserLeft: boolean,
  laserRight: boolean,
  laserRear: boolean,

  // Helper control
  axesHelper: boolean,
};

const POINT_SIZE = 0.1;
const DARK_SKY_COLOR = 0x141852;

let camera: PerspectiveCamera;
let cameraControls: OrbitControls;
let effectController: EffectController;
let renderer: WebGLRenderer;
let scene: Scene;
let axesHelper: AxesHelper;

// Controllers
let showLaserTop = true;
let showLaserFront = true;
let showLaserLeft = true;
let showLaserRight = true;
let showLaserRear = true;
let showAxesHelper = true;

let clock = new THREE.Clock();

function fillScene() {
	scene = new THREE.Scene();
  const loader = new PCDLoader();
  const pointCloudFileName = '/python/out/lidar0.pcd';
  loader.load(
    pointCloudFileName,
    (points: THREE.Points) => {  // onLoad
      points.traverse((point) => {
        if (point instanceof THREE.Points) {
          console.log('Is points!');
          let material = new PointsMaterial({
            color: 0xffffff,
            size: POINT_SIZE,
          });
          point.material = material;
        }
      });
      scene.add(points);
    },
    (progress: ProgressEvent) => {  // onProgress
      console.log((progress.loaded / progress.total * 100) + '% loaded');
    },
    (error: ErrorEvent) => {  // onError
      console.error('Error loading pcd ' + error.message);
    });

    // Add plan (ground)
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 32, 32);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x222222,
      side: THREE.DoubleSide,
    });
    let plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);
}

function setupGui() {
  effectController = {
    laserTop: showLaserTop,
    laserFront: showLaserFront,
    laserLeft: showLaserLeft,
    laserRight: showLaserRight,
    laserRear: showLaserRear,
    axesHelper: showAxesHelper,
  };

  let gui = new dat.GUI();
  let sensers = gui.addFolder('Sensers');
  let helpers = gui.addFolder('Helpers');
  Object.keys(effectController).forEach((key: string) => {
    if (key.startsWith('laser')) {
      sensers.add(effectController, key).name(key);
    } else if (key.endsWith('Helper')) {
      helpers.add(effectController, key).name(key);
    }
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
	renderer.setClearColor( DARK_SKY_COLOR, 1.0 );

  // CAMERA
  // Waymo dataset hehicle frame
  //  The x-axis is positive forwards, y-axis is positive to the left,
  //  z-axis is positive upwards. A vehicle pose defines the transform
  //  from the vehicle frame to the global frame.
  camera = new THREE.PerspectiveCamera( 55, canvasRatio, 2, 10000 );
  camera.position.set(10, -20, 5);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 0);
	// CONTROLS
  cameraControls = new OrbitControls(camera, renderer.domElement);
  cameraControls.enableRotate = true;
  cameraControls.enablePan = true;

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
  if (showAxesHelper) {
    if (axesHelper === undefined) {
      axesHelper = new AxesHelper(2);
      axesHelper.position.set(0, 0, 0);
    }
    scene.add(axesHelper);
  } else {
    scene.remove(axesHelper);
  }
}

function animate() {
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update();
  renderer.render(scene, camera);

  if (effectController.axesHelper !== showAxesHelper) {
    showAxesHelper = effectController.axesHelper;
    drawHelpers();
  }
}

init();
fillScene();
setupGui();
drawHelpers();
addToDOM();
animate();
