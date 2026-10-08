import { Component, Input } from '@angular/core';
import { initials } from '../core/labels';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    <span class="avatar" [title]="name || 'Non assigné'"
          [class.avatar-empty]="!name"
          [style.background]="name ? (color || '#64748b') : null"
          [style.width.px]="size" [style.height.px]="size" [style.font-size.px]="size * 0.4">
      @if (name) { {{ letters }} } @else { <i class="bi bi-person"></i> }
    </span>
  `,
})
export class AvatarComponent {
  @Input() name: string | null | undefined = null;
  @Input() color: string | null | undefined = null;
  @Input() size = 32;

  get letters(): string {
    return initials(this.name);
  }
}
