import * as THREE from 'three';
import * as dat from 'dat.gui';
import { Geometry, WebGLRenderer, OrthographicCamera, Scene, Vector3, PerspectiveCamera, DirectionalLight, AmbientLight, Object3D, Material, GridHelper, AxesHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// TODO(olala7846): Enable caching to speed up compile and load time.

interface	EffectController  {

  newGridXZ: boolean;
  newGridYZ: boolean;
  newGridXY: boolean;
  newGround: boolean;
  newAxes: boolean;

  // UNCOMMENT FOLLOWING LINE TO SET DEFAULT VALUE OF CONTROLS FOR BODY:
  by: number;

  uy: number;
  uz: number;

  fy: number;
  fz: number;
  hz: number;  // hand rotation from Z-axes
  htz: number;  // Hand spread
};


let camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer;
let cameraControls: OrbitControls, effectController: EffectController;
let clock = new THREE.Clock();
let gridXZ = true;
let gridYZ = false;
let gridXY = false;
let axes = true;
let ground = true;
let arm: Object3D, forearm: Object3D, body: Object3D;
let handLeft: Object3D, handRight: Object3D;

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

	// Robot definitions
	var robotBaseMaterial = new THREE.MeshPhongMaterial({
    color: 0x6E23BB, specular: 0x6E23BB, shininess: 20 });
	var robotForearmMaterial = new THREE.MeshPhongMaterial({
    color: 0xF4C154, specular: 0xF4C154, shininess: 100 });
	var robotUpperArmMaterial = new THREE.MeshPhongMaterial({
    color: 0x95E4FB, specular: 0x95E4FB, shininess: 100 });
	var robotBodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x279933, specular: 0x279933, shininess: 100 });
  let robotHandLeftMaterial = new THREE.MeshPhongMaterial({
    color: 0xcc3399, specular: 0xCC3399, shininess:20 })
  let robotHandRightMaterial = new THREE.MeshPhongMaterial({
    color: 0xDD3388, specular: 0XDD3388, shininess:20 })

	var torus = new THREE.Mesh(
		new THREE.TorusGeometry( 22, 15, 32, 32 ), robotBaseMaterial );
	torus.rotation.x = 90 * Math.PI/180;
  scene.add( torus );



	forearm = new THREE.Object3D();
	var faLength = 80;

	createRobotExtender( forearm, faLength, robotForearmMaterial );

	arm = new THREE.Object3D();
	var uaLength = 120;

	createRobotCrane( arm, uaLength, robotUpperArmMaterial );

	// Move the forearm itself to the end of the upper arm.
	forearm.position.y = uaLength;
	arm.add( forearm );

	// YOUR CODE HERE
	body = new THREE.Object3D();
	var bodyLength = 60;
	// Add robot body here, put arm at top.
	// Note that "body" is already declared at top of this code.
	// Here's the call to create the body itself:
  createRobotBody( body, bodyLength, robotBodyMaterial );

  arm.position.y = bodyLength;
  body.add(arm);

  const handLength = 38;
  handLeft = new THREE.Object3D();
  createRobotGrabber(handLeft, handLength, robotHandLeftMaterial);
  handLeft.position.y = faLength;
  forearm.add(handLeft);

  handRight = new THREE.Object3D();
  createRobotGrabber(handRight, handLength, robotHandRightMaterial);
  handRight.position.y = faLength;
  forearm.add(handRight);

  scene.add(body)
	// ALSO CHECK OUT GUI CONTROLS FOR BODY
	// IN THE FUNCTIONS setupGUI() and render()
}

function createRobotExtender( part: Object3D, length: number, material: Material )
{
	var cylinder = new THREE.Mesh(
		new THREE.CylinderGeometry( 22, 22, 6, 32 ), material );
	part.add( cylinder );

	var i;
	for ( i = 0; i < 4; i++ )
	{
		var box = new THREE.Mesh(
			new THREE.BoxGeometry( 4, length, 4 ), material );
		box.position.x = (i < 2) ? -8 : 8;
		box.position.y = length/2;
		box.position.z = (i%2) ? -8 : 8;
		part.add( box );
	}

	cylinder = new THREE.Mesh(
		new THREE.CylinderGeometry( 15, 15, 40, 32 ), material );
	cylinder.rotation.x = 90 * Math.PI/180;
	cylinder.position.y = length;
	part.add( cylinder );
}

function createRobotGrabber(part: Object3D, length: number, material: Material)
{
	var box = new THREE.Mesh(
		new THREE.BoxGeometry( 30, length, 4 ), material );
	box.position.y = length/2;
	part.add( box );
}

function createRobotCrane( part: Object3D, length: number, material: Material )
{
	var box = new THREE.Mesh(
		new THREE.BoxGeometry( 18, length, 18 ), material );
	box.position.y = length/2;
	part.add( box );

	var sphere = new THREE.Mesh(
		new THREE.SphereGeometry( 20, 32, 16 ), material );
	// place sphere at end of arm
	sphere.position.y = length;
	part.add( sphere );
}

function createRobotBody( part: Object3D, length: number, material: Material )
{
	var cylinder = new THREE.Mesh(
		new THREE.CylinderGeometry( 50, 12, length/2, 18 ), material );
	cylinder.position.y = length/4;
	part.add( cylinder );

	cylinder = new THREE.Mesh(
		new THREE.CylinderGeometry( 12, 50, length/2, 18 ), material );
	cylinder.position.y = 3*length/4;
	part.add( cylinder );

	var box = new THREE.Mesh(
		new THREE.BoxGeometry( 12, length/4, 110 ), material );
	box.position.y = length/2;
	part.add( box );

	var sphere = new THREE.Mesh(
		new THREE.SphereGeometry( 20, 32, 16 ), material );
	// place sphere at end of arm
	sphere.position.y = length;
	part.add( sphere );
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
	camera.position.set( -510, 240, 100 );
	// CONTROLS
	cameraControls = new OrbitControls(camera, renderer.domElement);
	cameraControls.target.set(0,120,0);
	camera.position.set(-102, 177, 20);
	cameraControls.target.set(-13, 60, 2);
	fillScene();

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
	// if (ground) {
	// 	Coordinates.drawGround({size:10000});
	// }
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
      || effectController.newGround !== ground
      || effectController.newAxes !== axes) {
    gridXZ = effectController.newGridXZ;
		gridYZ = effectController.newGridYZ;
		gridXY = effectController.newGridXY;
		ground = effectController.newGround;
		axes = effectController.newAxes;

		fillScene();
		drawHelpers();
	}

	// UNCOMMENT FOLLOWING LINES TO ENABLE CONTROLS FOR BODY:

	body.rotation.y = effectController.by * Math.PI/180;	// yaw

	arm.rotation.y = effectController.uy * Math.PI/180;	// yaw
	arm.rotation.z = effectController.uz * Math.PI/180;	// roll

	forearm.rotation.y = effectController.fy * Math.PI/180;	// yaw
  forearm.rotation.z = effectController.fz * Math.PI/180;	// roll

  handLeft.rotation.z = effectController.hz * Math.PI/180; //tilt
  handRight.rotation.z = effectController.hz * Math.PI/180; //tilt
  handLeft.position.z = effectController.htz;
  handRight.position.z = -effectController.htz;

	renderer.render(scene, camera);
}

function setupGui() {

  effectController = {

		newGridXZ: gridXZ,
		newGridYZ: gridYZ,
		newGridXY: gridXY,
		newGround: ground,
		newAxes: axes,

		// UNCOMMENT FOLLOWING LINE TO SET DEFAULT VALUE OF CONTROLS FOR BODY:
		by: 0.0,

		uy: 70.0,
		uz: -15.0,

		fy: 10.0,
    fz: 60.0,

    hz: 0.0,
    htz: 10,
	};

	var gui = new dat.GUI();
	var h = gui.addFolder("Grid display");
	h.add( effectController, "newGridXZ").name("Show XZ grid");
	h.add( effectController, "newGridYZ" ).name("Show YZ grid");
	h.add( effectController, "newGridXY" ).name("Show XY grid");
	h.add( effectController, "newGround" ).name("Show ground");
	h.add( effectController, "newAxes" ).name("Show axes");
	h = gui.addFolder("Arm angles");
  // student, uncomment:
  h.add(effectController, "by", -180.0, 180.0, 0.025).name("Body y");
	h.add(effectController, "uy", -180.0, 180.0, 0.025).name("Upper arm y");
	h.add(effectController, "uz", -45.0, 45.0, 0.025).name("Upper arm z");
	h.add(effectController, "fy", -180.0, 180.0, 0.025).name("Forearm y");
  h.add(effectController, "fz", -120.0, 120.0, 0.025).name("Forearm z");
  h.add(effectController, "hz", -45, 45, 0.025).name("Hand z rotation");
  h.add(effectController, "htz", 2.0, 17, 0.025).name("Hand spread");
}


init();
fillScene();
drawHelpers();
addToDOM();
setupGui();
animate();
