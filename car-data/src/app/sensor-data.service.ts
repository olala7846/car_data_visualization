import { Injectable } from '@angular/core';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import { Points, Object3D, BoxGeometry, WireframeGeometry, LineBasicMaterial, LineSegments } from 'three';

export enum LidarName {
  TOP = 'TOP',
  FRONT = 'FRONT',
  SIDE_LEFT = 'SIDE_LEFT',
  SIDE_RIGHT = 'SIDE_RIGHT',
  REAR = 'REAR',
}

export enum CameraName {
  FRONT = 'FRONT',
  FRONT_LEFT = 'FRONT_LEFT',
  FRONT_RIGHT = 'FRONT_RIGHT',
  SIDE_LEFT = 'SIDE_LEFT',
  SIDE_RIGHT = 'SIDE_RIGHT',
}

export enum LabelType {
  VEHICLE = 'VEHICLE',
  PEDESTRIAN = 'PEDESTRIAN',
  SIGN = 'SIGN',
  CYCLIST = 'CYCLIST',
}

const LABEL_DATA_URL = '/assets/1.data.json';
const JSON_DATA_LABELS_KEY = 'labels';
const LABEL_COLOR = 0xebe534;

@Injectable({
  providedIn: 'root'
})
export class SensorDataService {
  pcdLoader: PCDLoader;

  constructor() { }

  // Lazy initialize PCDLoader;
  getPcdLoader(): PCDLoader {
    if (!this.pcdLoader) {
      this.pcdLoader = new PCDLoader();
    }
    return this.pcdLoader;
  }

  getPointCloudData(fileUrl: string): Promise<Points> {
    let loader = this.getPcdLoader();
    return new Promise((resolve, reject) => {
      loader.load(
        fileUrl,
        (points: THREE.Points) => {  // onLoad
          return resolve(points);
        },
        (progress: ProgressEvent) => {  // onProgress
          console.log((progress.loaded / progress.total * 100) + '% loaded');
        },
        (error: ErrorEvent) => {  // onError
          let errMsg = `Error loading ${fileUrl}, ${error.message}`;
          reject(errMsg);
        });
    });
  }

  getLabelData(): Promise<Array<Object3D>> {
    return fetch(LABEL_DATA_URL)
      .then((response) => response.json())
      .then((json) => this.toBoundingBoxes(json));
  }

  private toBoundingBoxes(jsonData: any): Array<Object3D> {
    let labels = jsonData[JSON_DATA_LABELS_KEY];
    return labels.map(this.toSingleBoundingBox);
  }

  private toSingleBoundingBox(labelData: any): Object3D {
    let labelGeometry = new BoxGeometry(
      labelData.length, labelData.width, labelData.height);
    let labelWireFrame = new WireframeGeometry(labelGeometry);
    let labelMaterial = new LineBasicMaterial({
      color: LABEL_COLOR
    });
    let labelBoundingBox = new LineSegments(labelWireFrame, labelMaterial);
    labelBoundingBox.position.set(
      labelData.centerX, labelData.centerY, labelData.centerZ);
    // The heading of the bounding box (in radians).  The heading is the angle
    // required to rotate +x to the surface normal of the box front face. It is
    // normalized to [-pi, pi).
    labelBoundingBox.rotateZ(labelData.heading);
    return labelBoundingBox;
  }
}
