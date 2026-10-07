import { AfterViewInit, Directive, ElementRef, inject, input } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
})
export class Autofocus implements AfterViewInit {
  enabled = input<boolean | ''>('', { alias: 'appAutofocus' });
  private el = inject(ElementRef);

  ngAfterViewInit() {
    if (this.enabled() !== false) {
      setTimeout(() => this.el.nativeElement.focus());
    }
  }
}
