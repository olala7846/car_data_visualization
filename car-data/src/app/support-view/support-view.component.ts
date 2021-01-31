import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-support-view',
  templateUrl: './support-view.component.html',
  styleUrls: ['./support-view.component.css']
})
export class SupportViewComponent implements OnInit {

  cameraNames = [
    'FRONT',
    'FRONT_LEFT',
    'FRONT_RIGHT',
    'SIDE_LEFT',
    'SIDE_RIGHT',
  ];
  camera: string;


  constructor() { }

  ngOnInit(): void {
  }

}
