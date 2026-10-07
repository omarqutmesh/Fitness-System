import { afterNextRender, Component, ElementRef, inject, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.html',
})
export class Modal {
  title = input.required<string>();
  wide = input(false);
  closed = output<void>();

  constructor() {
    const el = inject(ElementRef);
    afterNextRender(() => {
      const first = el.nativeElement.querySelector(
        '.dialog-body input:not([disabled]):not([type="checkbox"]):not([type="radio"]), ' +
          '.dialog-body select:not([disabled]), .dialog-body textarea:not([disabled])',
      );
      first?.focus();
    });
  }
}
