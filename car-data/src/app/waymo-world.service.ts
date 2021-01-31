import * as THREE from 'three';

import { Injectable } from '@angular/core';
import { Scene, Object3D, BoxGeometry, WireframeGeometry, LineSegments, AxesHelper, Points } from 'three';
import { SensorDataService } from './sensor-data.service';
import { LidarName, CameraName } from './sensor-data.service';

// Chrysler Pacifica has size 204″ L x 80″ W x 70″ H
const CAR_X = 5.18;
const CAR_Y = 2.03;
const CAR_Z = 1.78;
const GROUND_COLOR = 0x222222;


// Service that stores the Waymo world (Three.js scene)
@Injectable({
  providedIn: 'root'
})
export class WaymoWorldService {
  waymoVehicle: Object3D;
  ground: THREE.Mesh;
  scene: Scene;
  axesHelper: AxesHelper;
  initialized: boolean = false;
  lidarData: Points;
  lidarDataMap = new Map<LidarName, Points>();

  public enableAxesHelper = true;
  public lidarEnabledMap = new Map<LidarName, boolean>(
    Object.values(LidarName).map((name) => [name, true]));

  constructor(private sensorDataService: SensorDataService) {
    // Inject data service to fetch point cloud data
  }

  // Initialize waymo world (three.js scene)
  init(): void {
    if (this.initialized) {
      return;
    }
    this.scene = new Scene();

    this.waymoVehicle = this.createEgoVehicle();
    this.scene.add(this.waymoVehicle);

    this.ground = this.createGround();
    this.scene.add(this.ground);

    // Default enable AxesHelper
    this.axesHelper = this.createAxesHelper();
    this.scene.add(this.axesHelper);

    this.fetchLidarData();

    // Update initialized flag to avoid redundant work.
    this.initialized = true;
  }

  getScene(): Scene {
    if (!this.scene) {
      console.error('Scene not found, call WaymoWorldService.init() first?');
    }
    return this.scene;
  }

  createGround(): THREE.Mesh {
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000, 32, 32);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: GROUND_COLOR,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(planeGeometry, planeMaterial);
  }

  createEgoVehicle(): Object3D {
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

  createAxesHelper(): AxesHelper {
    let axesHelper = new AxesHelper(100);
    axesHelper.position.set(0, 0, 0);
    return axesHelper;
  }

  fetchLidarData(): void {
    Object.values(LidarName).forEach((name) => {
      let pcdUrl = `/assets/laser_${name}.pcd`;
      this.sensorDataService.getPointCloudData(pcdUrl)
        .then((data: Points) => {
          console.log(`Lidar ${name} data loaded`);
          this.lidarDataMap.set(name, data);
          this.scene.add(data);
        });
    })
  }

  setEnableAxesHelper(enable: boolean): void {
    this.enableAxesHelper = enable;
    if (enable) {
      this.scene.add(this.axesHelper);
    } else {
      this.scene.remove(this.axesHelper);
    }
  }

  setLidarEnabled(lidarName: string, enable: boolean): void {
    let points = this.lidarDataMap.get(lidarName as LidarName);
    this.lidarEnabledMap.set(lidarName as LidarName, enable);
    if (enable) {
      this.scene.add(points) ;
    } else {
      this.scene.remove(points);
    }
  };

}
