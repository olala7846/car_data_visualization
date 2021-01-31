import { Component, OnInit } from '@angular/core';
import { WaymoWorldService } from '../waymo-world.service';
import { CameraName, LidarName } from '../sensor-data.service';

@Component({
  selector: 'app-support-view',
  templateUrl: './support-view.component.html',
  styleUrls: ['./support-view.component.css']
})
export class SupportViewComponent implements OnInit {

  enableAxesHelper: boolean;
  enableGroundWireframe: boolean;

  lidarNames = Object.values(LidarName);

  cameraNames = Object.values(CameraName);
  camera: string;

  constructor(public worldService: WaymoWorldService) { }

  ngOnInit(): void { }


  ngAfterVewInit(): void { }

}
