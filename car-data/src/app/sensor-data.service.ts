import { Injectable } from '@angular/core';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import { Points } from 'three';

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
}
