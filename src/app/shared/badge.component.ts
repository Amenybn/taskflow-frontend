import { Component, Input } from '@angular/core';
import { Option, PRIORITIES, PROJECT_STATUSES, TASK_STATUSES, find } from '../core/labels';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span class="badge" [style.color]="option.color" [style.background]="option.color + '1f'">
      <i [class]="'bi ' + option.icon"></i>{{ option.label }}
    </span>
  `,
})
export class BadgeComponent {
  @Input() kind: 'task' | 'project' | 'priority' = 'task';
  @Input() value: string = '';

  get option(): Option<string> {
    const list = (this.kind === 'task' ? TASK_STATUSES : this.kind === 'project' ? PROJECT_STATUSES : PRIORITIES) as Option<string>[];
    return find(list, this.value);
  }
}
