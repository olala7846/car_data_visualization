import { Component, OnInit } from '@angular/core';
import { WaymoWorldService } from '../waymo-world.service';
import { CameraName, LidarName, LabelType } from '../sensor-data.service';

@Component({
  selector: 'app-support-view',
  templateUrl: './support-view.component.html',
  styleUrls: ['./support-view.component.css']
})
export class SupportViewComponent implements OnInit {

  enableAxesHelper: boolean;
  enableGroundWireframe: boolean;
  selectedCamera: string;
  shouldDisplayFrustum = true;

  lidarNames = Object.values(LidarName);
  labelTypes = Object.values(LabelType);
  cameraNames = Object.values(CameraName);

  constructor(public worldService: WaymoWorldService) { }

  ngOnInit(): void { }

  ngAfterVewInit(): void { }

  onCameraSelected(event: any): void {
    let selectedCamera = event.value;
    this.selectedCamera = selectedCamera
    this.worldService.visualizeCamera(selectedCamera, this.shouldDisplayFrustum);
  }

  setDisplayFrustum(enable: boolean): void {
    this.shouldDisplayFrustum = enable;
    this.worldService.visualizeCamera(this.selectedCamera as CameraName, enable);
  }

}
