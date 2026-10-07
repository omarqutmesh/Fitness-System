import { Component, inject } from '@angular/core';
import { PopupService } from '../../services/popup.service';

@Component({
  selector: 'app-popup-host',
  templateUrl: './popup-host.html',
})
export class PopupHost {
  popup = inject(PopupService);
}
