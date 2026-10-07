import { inject, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Pipe({
  name: 'highlight',
})
export class Highlight implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(text: string | number | null | undefined, term: string | null | undefined): SafeHtml {
    const value = String(text ?? '');
    const t = (term ?? '').trim();

    if (!t) {
      return this.sanitizer.bypassSecurityTrustHtml(escapeHtml(value));
    }

    let out = '';
    let last = 0;
    for (const m of value.matchAll(new RegExp(escapeRegex(t), 'gi'))) {
      const at = m.index!;
      out += escapeHtml(value.slice(last, at)) + `<mark class="hl">${escapeHtml(m[0])}</mark>`;
      last = at + m[0].length;
    }
    out += escapeHtml(value.slice(last));

    return this.sanitizer.bypassSecurityTrustHtml(out);
  }
}
