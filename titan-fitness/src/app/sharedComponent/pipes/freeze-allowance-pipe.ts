import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'freezeAllowance',
})
export class FreezeAllowance implements PipeTransform {
  transform(days: number, freezes: number): string {
    if (!days) return 'None';
    return `${days} days / ${freezes} ${freezes === 1 ? 'freeze' : 'freezes'}`;
  }
}
