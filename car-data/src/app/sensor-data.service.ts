import { Injectable } from '@angular/core';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import { Points, Object3D, BoxGeometry, WireframeGeometry, LineBasicMaterial, LineSegments, PerspectiveCamera, CameraHelper } from 'three';
import * as THREE from 'three';

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
  UNKNOWN = 'UNKNOWN',
  VEHICLE = 'VEHICLE',
  PEDESTRIAN = 'PEDESTRIAN',
  SIGN = 'SIGN',
  CYCLIST = 'CYCLIST',
}

export interface LabelAndCameraData {
  cameras: Array<CarCamera>,
  labels: Array<LabelBoundingBox>,
}

export interface LabelBoundingBox {
  type: LabelType,
  boundingBox: Object3D,
}

export interface CarCamera {
  cameraName: string,
  camera: PerspectiveCamera,
  cameraObject: Object3D,
  helper: CameraHelper,
}

const LABEL_AND_FRUSTRUM_DATA_URL = '/assets/1.data.json';
const JSON_DATA_LABELS_KEY = 'labels';
const JSON_DATA_FRUSTRUM_KEY = 'frustrums';
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

  getLabelAndCameraData(): Promise<LabelAndCameraData> {
    return fetch(LABEL_AND_FRUSTRUM_DATA_URL)
      .then((response) => response.json())
      .then((json) => {
        let cameras = this.getCarCameras(json);
        let labels = this.getLabelBoundingBoxes(json);
        return {
          cameras: cameras,
          labels: labels,
        };
      });
  }

  getCarCameras(jsonData: any): Array<CarCamera> {
    let frustrums: Array<any> = jsonData[JSON_DATA_FRUSTRUM_KEY];
    return frustrums.map(this.toHelperCamera);
  }

  toHelperCamera(cameraData: any): CarCamera {
      // http://mesh.brown.edu/en193s08-2003/notes/en193s08-proj.pdf
    let cameraName = cameraData.name;
    let fv, fu, cv, cu;
    let k1, k2, p1, p2, k3
    [fv, fu, cv, cu, k1, k2, p1, p2, k3] = cameraData['intrinsic'];
    let transform = new THREE.Matrix4();
    let transformRowMajor = cameraData['extrinsic'];
    transform.elements = cameraData['extrinsic'];
    // Matrix4D.elements stores data in column major form, we need to transpose it
    transform = transform.transpose();

    // TODO: camera aspect ratio seems a bit off? (always equals to 1)
    let aspectRatio = fu/fv;
    // all camera images has width 1920
    let fov = Math.atan2(fv, 960.0) / Math.PI * 180;
    let camera = new THREE.PerspectiveCamera(fov, aspectRatio, 0.5, 30);

    // Waymo camera seems to point to +x axis instead of -Z
    camera.up.set(0, 0, 1);
    camera.lookAt(1, 0, 0);
    let carCamera = new Object3D();
    carCamera.add(camera);
    carCamera.matrixAutoUpdate = false;
    carCamera.applyMatrix4(transform);
    carCamera.updateMatrixWorld(true);

    let helper = new THREE.CameraHelper(camera);

    return {
      cameraName: cameraName,
      camera: camera,
      helper: helper,
      cameraObject: carCamera,
    };
  }

  private getLabelBoundingBoxes(jsonData: any): Array<LabelBoundingBox> {
    let labels = jsonData[JSON_DATA_LABELS_KEY];
    return labels.map(this.toSingleBoundingBox.bind(this));
  }

  private toSingleBoundingBox(labelData: any): LabelBoundingBox {
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
    let labelType = this.toLabelType(labelData.type);
    return {
      type: labelType,
      boundingBox: labelBoundingBox,
    }
    labelBoundingBox;
  }

  private toLabelType(typeString: string): LabelType {
    switch(typeString) {
      case 'TYPE_VEHICLE':
        return LabelType.VEHICLE;
      case 'TYPE_PEDESTRIAN':
        return LabelType.PEDESTRIAN;
      case 'TYPE_SIGN':
        return LabelType.SIGN;
      case 'TYPE_CYCLIST':
        return LabelType.CYCLIST;
      case 'TYPE_UNKNOWN':
      default:
        break;
    }
  }
}
