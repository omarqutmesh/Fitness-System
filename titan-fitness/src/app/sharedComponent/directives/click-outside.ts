import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
})
export class ClickOutside {
  appClickOutside = output<void>();
  private el = inject(ElementRef);

  @HostListener('document:click', ['$event.target'])
  onClick(target: EventTarget | null) {
    if (!this.el.nativeElement.contains(target)) {
      this.appClickOutside.emit();
    }
  }
}
