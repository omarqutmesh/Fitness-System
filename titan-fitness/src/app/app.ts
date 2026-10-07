import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DialogHost } from './sharedComponent/dialog-host/dialog-host';
import { PopupHost } from './sharedComponent/popup-host/popup-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DialogHost, PopupHost],
  templateUrl: './app.html',
})
export class App {}
