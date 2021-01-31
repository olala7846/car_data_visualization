import * as THREE from 'three';

import { Component, OnInit } from '@angular/core';
import { WebGLRenderer, PerspectiveCamera, Object3D, BoxGeometry, WireframeGeometry, LineSegments, Scene, AxesHelper } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { WaymoWorldService } from '../waymo-world.service';

const MAIN_VIEW_CONTAINER_ID = "main-view-container";
const RENDERER_CLEAR_COLOR = 0x141852;

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
  scene: Scene;

  constructor(private waymoWorldService: WaymoWorldService) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    // For some reason all the three.js code won't work if put in ngOnInit.
    // TODO: figure it out
    this.updateContainerSize();
    this.waymoWorldService.init();
    this.scene = this.waymoWorldService.getScene();
    this.initThreeJs();
    this.addCanvasToDom();
    this.animate();
  }

  initThreeJs(): void {
    this.renderer = this.initRenderer();
    this.camera = this.initCamera();
    this.cameraControls = this.initCameraControl(this.camera, this.renderer);
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
    if (this.camera) {
      this.camera.aspect = this.containerWidth / this.containerHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  initCamera(): PerspectiveCamera {
    const mainPortRatio = this.containerWidth / this.containerHeight;
    let camera = new THREE.PerspectiveCamera(55, mainPortRatio, 2, 10000);
    // In the Waymo vehicle workd, +z is up. +x is front, +y is left.
    camera.position.set(100, -100, 5);
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
    let canvases = document.getElementsByTagName('canvas');
    if (canvases.length > 0) {
      container.removeChild(canvases[0]);
    }
    container.appendChild(this.renderer.domElement);
  }

  updateContainerSize(): void {
    let container = document.getElementById(MAIN_VIEW_CONTAINER_ID);
    if (this.containerWidth == container.clientWidth &&
      this.containerHeight == container.clientHeight) {
      return;
    }

    this.containerWidth = container.clientWidth;
    this.containerHeight = container.clientHeight;
    this.updateRendererSize();
  }

  animate(): void {
    window.requestAnimationFrame(this.animate.bind(this));
    this.render()
  }

  render(): void {
    this.updateContainerSize();
    this.cameraControls.update();
    this.renderer.clear();

    this.renderer.setViewport(0, 0, this.containerWidth, this.containerHeight);
    this.renderer.render(this.scene, this.camera);
  }

}
