import * as THREE from 'three';
import * as dat from 'dat.gui';
import {
  Geometry, WebGLRenderer, Scene,
  PerspectiveCamera, DirectionalLight, Object3D,
  Material, GridHelper, AxesHelper, Color, PlaneGeometry, PointsMaterial, Matrix4, Vector3, BoxGeometry, MeshBasicMaterial, WireframeGeometry, LineSegments, BooleanKeyframeTrack, CameraHelper
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';

enum LaserName {
  UNKNOWN = 'UNKNOWN',
  TOP = 'TOP',
  FRONT = 'FRONT',
  SIDE_LEFT = 'SIDE_LEFT',
  SIDE_RIGHT = 'SIDE_RIGHT',
  REAR = 'REAR',
}

enum CameraName {
  FRONT = 'FRONT',
  FRONT_LEFT = 'FRONT_LEFT',
  FRONT_RIGHT = 'FRONT_RIGHT',
  SIDE_LEFT = 'SIDE_LEFT',
  SIDE_RIGHT = 'SIDE_RIGHT',
}

interface LaserConfig {
  top: boolean,
  front: boolean,
  sideLeft: boolean,
  sideRight: boolean,
  rear: boolean,
};

interface CameraConfig {
  front: boolean,
  frontLeft: boolean,
  frontRight: boolean,
  sideLeft: boolean,
  sideRight: boolean,
};

// Chrysler Pacifica has size 204″ L x 80″ W x 70″ H
const CAR_X = 5.18;
const CAR_Y = 2.03;
const CAR_Z = 1.78;

let laserUiControl: LaserConfig = {
  top: true,
  front: true,
  sideLeft: true,
  sideRight: true,
  rear: true,
};
let laserEnabled = new Map<LaserName, boolean>([
  [LaserName.TOP, true],
  [LaserName.FRONT, true],
  [LaserName.SIDE_LEFT, true],
  [LaserName.SIDE_RIGHT, true],
  [LaserName.REAR, true],
]);

let cameraUiControl: CameraConfig = {
  front: false,
  frontLeft: false,
  frontRight: false,
  sideLeft: false,
  sideRight: false,
};

let cameraEnabled = new Map<CameraName, boolean>([
  [CameraName.FRONT, false],
  [CameraName.FRONT_LEFT, false],
  [CameraName.FRONT_RIGHT, false],
  [CameraName.SIDE_LEFT, false],
  [CameraName.SIDE_RIGHT, false],
]);

interface HelperControl {
  axesHelper: boolean,
};

const POINT_SIZE = 0.05;
const DARK_SKY_COLOR = 0x141852;

let camera: PerspectiveCamera;
let cameraControls: OrbitControls;
let renderer: WebGLRenderer;
let scene: Scene;
let clock = new THREE.Clock();
let helperControl: HelperControl;
// Camera frustrum data
let cameraCalibration: any;
let car: Object3D;

// Controllers
let axesHelper: AxesHelper;
let showAxesHelper = true;
const allLaserNames = [
  LaserName.TOP,
  LaserName.FRONT,
  LaserName.SIDE_LEFT,
  LaserName.SIDE_RIGHT,
  LaserName.REAR
];
let laserColor = new Map<LaserName, number>();
laserColor.set(LaserName.TOP, 0xfc0303);
laserColor.set(LaserName.FRONT, 0x03fc0b);
laserColor.set(LaserName.SIDE_LEFT, 0xfc03db);
laserColor.set(LaserName.SIDE_RIGHT, 0x03a1fc);
laserColor.set(LaserName.REAR, 0xfcf003);
let laserObjectMap = new Map<LaserName, Object3D>();
let cameraHelperMap = new Map<CameraName, CameraHelper>();

function fillScene() {
  scene = new THREE.Scene();

  const loader = new PCDLoader();

  allLaserNames.forEach((laserName: LaserName) => {

    let pcdFile = `/python/out/laser_${laserName}.pcd`;
    loader.load(
      pcdFile,
      (points: THREE.Points) => {  // onLoad
        points.traverse((point) => {
          if (point instanceof THREE.Points) {
            let material = new PointsMaterial({
              color: laserColor.get(laserName),
              size: POINT_SIZE,
            });
            point.material = material;
          }
        });
        laserObjectMap.set(laserName, points);
        scene.add(points);
      },
      (progress: ProgressEvent) => {  // onProgress
        console.log((progress.loaded / progress.total * 100) + '% loaded');
      },
      (error: ErrorEvent) => {  // onError
        console.error('Error loading pcd ' + error.message);
      });
  });

  // Add plan (ground)
  const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 32, 32);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x222222,
    side: THREE.DoubleSide,
  });
  let plane = new THREE.Mesh(planeGeometry, planeMaterial);
  scene.add(plane);
  scene.add(car);
}

function setupGui() {
  helperControl = {
    axesHelper: showAxesHelper,
  };

  let gui = new dat.GUI();
  let sensers = gui.addFolder('Sensers');
  Object.keys(laserUiControl).forEach((laserName: string) => {
    sensers.add(laserUiControl, laserName).name(laserName);
  });

  let cameras = gui.addFolder('Cameras');
  Object.keys(cameraUiControl).forEach((cameraName: string) => {
    cameras.add(cameraUiControl, cameraName).name(cameraName);
  });

  let helpers = gui.addFolder('Helpers');
  Object.keys(helperControl).forEach((key: string) => {
    helpers.add(helperControl, key).name(key);
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

  car = new Object3D();
  let carGeometry = new BoxGeometry(CAR_X, CAR_Y, CAR_Z);
  let carWireFrame = new WireframeGeometry(carGeometry);
  let carBoundingBox = new LineSegments(carWireFrame);
  carBoundingBox.position.setX(1.5);
  carBoundingBox.position.setZ(CAR_Z/2 + 0.01);
  car.add(carBoundingBox);
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

function updateLaser(laserName: LaserName, enabled: boolean) {
  if (enabled == laserEnabled.get(laserName)) {
    return;  // nothing changed
  }
  let pointCloud = laserObjectMap.get(laserName);
  if (enabled) {
    scene.add(pointCloud);
  } else {
    scene.remove(pointCloud);
  }
  laserEnabled.set(laserName, enabled);
}

function fetchCameraCalibration() {
  // f_v, f_u: focal length of the camera
  // c_v, c_u: center point (image coordinate) of the center point
  // http://mesh.brown.edu/en193s08-2003/notes/en193s08-proj.pdf
  const cameraCalibrationJson = '/python/out/1.frustrum.json';
  fetch(cameraCalibrationJson)
  .then((response) => {
    return response.json();
  }).then((json) => {
    cameraCalibration = json;
    drawCameraFrustrum();
  });
}

function drawCameraFrustrum() {
  if (cameraCalibration === undefined) {
    console.log('waiting from camera calibration data...');
    return;
  }

  let frustrums: Array<any> = cameraCalibration['frustrums'];
  frustrums.forEach((cameraData: any) => {
    drawSingleCamera(cameraData);
  });
  // drawSingleCamera(frustrums[0]);
}

function drawSingleCamera(cameraData: any) {
  let cameraName = cameraData.name;
  let fv, fu, cv, cu;
  let k1, k2, p1, p2, k3
  [fv, fu, cv, cu, k1, k2, p1, p2, k3] = cameraData['intrinsic'];
  let transform = new THREE.Matrix4();
  let transformRowMajor = cameraData['extrinsic'];
  transform.elements = cameraData['extrinsic'];
  // Matrix4D.elements stores data in column major form, we need to transpose it
  transform = transform.transpose();


  let aspectRatio = fv/fu;
  // all camera images has width 1920
  let fov = Math.atan2(fv, 960.0) / Math.PI * 180;
  let perspectiveCamera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.1, 20);

  // Waymo camera seems to point to +x axis instead of -Z
  perspectiveCamera.lookAt(1, 0, 0);
  perspectiveCamera.up.set(0, 0, 1);
  let carCamera = new Object3D();
  carCamera.add(perspectiveCamera);
  carCamera.matrixAutoUpdate = false;
  carCamera.applyMatrix4(transform);
  carCamera.updateMatrixWorld(true);

  let helper = new THREE.CameraHelper(perspectiveCamera);
  cameraHelperMap.set(cameraName, helper);
}

function updateCamera(cameraName: CameraName, enabled: boolean) {
  if (cameraEnabled.get(cameraName) == enabled) {
    return;
  }

  let helper = cameraHelperMap.get(cameraName);
  if (enabled) {
    scene.add(helper);
  } else {
    scene.remove(helper);
  }
  cameraEnabled.set(cameraName, enabled);
}

function render() {
  // modify scene if ui config change
  updateLaser(LaserName.TOP, laserUiControl.top);
  updateLaser(LaserName.FRONT, laserUiControl.front);
  updateLaser(LaserName.SIDE_LEFT, laserUiControl.sideLeft);
  updateLaser(LaserName.SIDE_RIGHT, laserUiControl.sideRight);
  updateLaser(LaserName.REAR, laserUiControl.rear);

  updateCamera(CameraName.FRONT, cameraUiControl.front);
  updateCamera(CameraName.FRONT_LEFT, cameraUiControl.frontLeft);
  updateCamera(CameraName.FRONT_RIGHT, cameraUiControl.frontRight);
  updateCamera(CameraName.SIDE_RIGHT, cameraUiControl.sideLeft);
  updateCamera(CameraName.SIDE_RIGHT, cameraUiControl.sideRight);

  if (helperControl.axesHelper !== showAxesHelper) {
    showAxesHelper = helperControl.axesHelper;
    drawHelpers();
  }

	var delta = clock.getDelta();
	cameraControls.update();
  renderer.render(scene, camera);
}

fetchCameraCalibration();
init();
fillScene();
setupGui();
drawHelpers();
addToDOM();
animate();
