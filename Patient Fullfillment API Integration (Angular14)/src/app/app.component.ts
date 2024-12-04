import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'crudApplication';
  isImageLoaded:boolean;
  constructor() {
    // Initially, we assume the image hasn't loaded.
    this.isImageLoaded = false; 
  }

}
