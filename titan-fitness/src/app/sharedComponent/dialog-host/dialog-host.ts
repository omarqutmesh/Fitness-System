import { Component, inject } from '@angular/core';
import { DialogService } from '../../services/dialog.service';
import { CheckinDialog } from '../dialogs/checkin-dialog/checkin-dialog';
import { ClassDialog } from '../dialogs/class-dialog/class-dialog';
import { MemberDialog } from '../dialogs/member-dialog/member-dialog';

@Component({
  selector: 'app-dialog-host',
  imports: [MemberDialog, ClassDialog, CheckinDialog],
  templateUrl: './dialog-host.html',
})
export class DialogHost {
  dialog = inject(DialogService);
}
