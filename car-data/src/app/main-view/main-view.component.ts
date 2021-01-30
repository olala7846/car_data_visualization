import * as THREE from 'three';

import { Component, OnInit } from '@angular/core';
import { WebGLRenderer, PerspectiveCamera, Object3D, BoxGeometry, WireframeGeometry, LineSegments, Scene } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Container } from '@angular/compiler/src/i18n/i18n_ast';

const MAIN_VIEW_CONTAINER_ID = "main-view-container";
const RENDERER_CLEAR_COLOR = 0x141852;

// Chrysler Pacifica has size 204″ L x 80″ W x 70″ H
const CAR_X = 5.18;
const CAR_Y = 2.03;
const CAR_Z = 1.78;

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.css']
})
export class MainViewComponent implements OnInit {

  camera: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  cameraControls: OrbitControls;
  containerHeight: number;
  containerWidth: number;
  renderer: WebGLRenderer;

  // Waymo world objects
  scene: Scene;
  ground: THREE.Mesh;
  car: Object3D;

  constructor() { }

  ngOnInit(): void {
    this.updateContainerSize();
    this.initThreeJs();
    this.initScene();
    this.addCanvasToDom();
    this.startAnimation();
  }

  initThreeJs(): void {
    this.renderer = this.initRenderer();
    this.camera = this.initCamera();
    this.cameraControls = this.initCameraControl(this.camera, this.renderer);
  }

  initScene(): void {
    let scene = new THREE.Scene();
    this.scene = scene;

    this.ground = this.initGround();
    scene.add(this.ground)

    this.car = this.initCar();
    scene.add(this.car);


  }

  initGround(): THREE.Mesh {
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 32, 32);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x222222,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(planeGeometry, planeMaterial);
  }

  initCar(): Object3D {
    let car = new Object3D();
    let carGeometry = new BoxGeometry(CAR_X, CAR_Y, CAR_Z);
    let carWireFrame = new WireframeGeometry(carGeometry);
    let carBoundingBox = new LineSegments(carWireFrame);
    // Set car slighlty forward (no accurate number, just that 1.5 looks good).
    carBoundingBox.position.setX(1.5);
    // Set car BB slightly over the ground
    carBoundingBox.position.setZ(CAR_Z/2 + 0.01);
    car.add(carBoundingBox);
    return car;
  }

  initRenderer(): WebGLRenderer {
    let renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    renderer.setSize(this.containerWidth, this.containerHeight);
    renderer.setClearColor(RENDERER_CLEAR_COLOR);
    renderer.autoClear = false;
    return renderer;
  }

  updateRendererSize() {
    if (this.renderer) {
      this.renderer.setSize(this.containerWidth, this.containerHeight);
    }
  }

  initCamera(): PerspectiveCamera {
    const mainPortRatio = this.containerWidth / this.containerWidth;
    let camera = new THREE.PerspectiveCamera(55, mainPortRatio, 2, 10000);
    // In the Waymo vehicle workd, +z is up. +x is front, +y is left.
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  initCameraControl(camera: PerspectiveCamera, renderer: WebGLRenderer): OrbitControls {
    let cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.enableRotate = true;
    cameraControls.enablePan  = true;
    return cameraControls;
  }

  addCanvasToDom(): void {
    // Find and remove any existing canvas
    let container = document.getElementById(MAIN_VIEW_CONTAINER_ID);
    let canvases = document.getElementsByClassName('canvas');
    if (canvases.length > 0) {
      for (let canvas of Array.from(canvases)) {
        container.removeChild(canvas);
      }
    }
    container.appendChild(this.renderer.domElement);
  }

  updateContainerSize(): void {
    let sizeChanged = false;
    let container = document.getElementById(MAIN_VIEW_CONTAINER_ID);
    if (this.containerWidth == container.clientWidth &&
      this.containerHeight == container.clientHeight) {
      return;
    }

    this.containerWidth = container.clientWidth;
    this.containerHeight = container.clientHeight;
    this.updateRendererSize();
  }

  startAnimation(): void {
    window.requestAnimationFrame(this.startAnimation.bind(this));
    this.render()
  }

  render(): void {
    this.updateContainerSize();
    this.cameraControls.update();
    this.renderer.clear();

    this.renderer.render(this.scene, this.camera);
  }

}
