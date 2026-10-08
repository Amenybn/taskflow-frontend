import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList, CdkDropListGroup, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Option, PRIORITIES, TASK_STATUSES, find } from '../core/labels';
import { Task, TaskStatus } from '../core/models';
import { AvatarComponent } from './avatar.component';

type Column = Option<TaskStatus> & { tasks: Task[] };

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, CdkDragPlaceholder, AvatarComponent, DatePipe],
  template: `
    <div class="kanban" cdkDropListGroup>
      @for (col of columns; track col.value) {
        <section class="kanban-col">
          <header class="kanban-col-header">
            <span class="dot" [style.background]="col.color"></span>
            <h3>{{ col.label }}</h3>
            <span class="count">{{ col.tasks.length }}</span>
            <button class="btn-icon btn-sm" title="Ajouter une tâche" (click)="add.emit(col.value)"><i class="bi bi-plus-lg"></i></button>
          </header>
          <div class="kanban-list" cdkDropList [cdkDropListData]="col.tasks" (cdkDropListDropped)="drop($event, col.value)">
            @for (t of col.tasks; track t.id) {
              <article class="kanban-card" cdkDrag [cdkDragData]="t" (cdkDragStarted)="dragging = true" (cdkDragEnded)="endDrag()"
                       (click)="open(t)" [style.border-left-color]="priority(t).color">
                <div class="kanban-placeholder" *cdkDragPlaceholder></div>
                <div class="kc-top">
                  @if (showProject) {
                    <span class="tag" [style.color]="t.projectColor" [style.background]="t.projectColor + '1f'">{{ t.projectCode }}</span>
                  }
                  <span class="prio" [style.color]="priority(t).color"><i [class]="'bi ' + priority(t).icon"></i>{{ priority(t).label }}</span>
                </div>
                <p class="kc-title">{{ t.title }}</p>
                <div class="kc-meta">
                  @if (t.dueDate) {
                    <span [class.text-danger]="t.overdue" title="Échéance"><i class="bi bi-calendar3"></i> {{ t.dueDate | date: 'd MMM' }}</span>
                  }
                  @if (t.estimatedHours) {
                    <span title="Estimation"><i class="bi bi-clock"></i> {{ t.estimatedHours }} h</span>
                  }
                  <span class="spacer"></span>
                  <app-avatar [name]="t.assigneeName" [color]="t.assigneeColor" [size]="26" />
                </div>
              </article>
            } @empty {
              <div class="kanban-empty">Déposez une tâche ici</div>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class KanbanBoardComponent implements OnChanges {
  @Input() tasks: Task[] = [];
  @Input() showProject = true;
  @Output() edit = new EventEmitter<Task>();
  @Output() add = new EventEmitter<TaskStatus>();
  @Output() statusChange = new EventEmitter<{ task: Task; status: TaskStatus }>();

  columns: Column[] = [];
  dragging = false;

  ngOnChanges() {
    this.columns = TASK_STATUSES.map(s => ({ ...s, tasks: this.tasks.filter(t => t.status === s.value) }));
  }

  priority(t: Task) {
    return find(PRIORITIES, t.priority);
  }

  drop(event: CdkDragDrop<Task[]>, status: TaskStatus) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.statusChange.emit({ task: event.item.data as Task, status });
  }

  endDrag() {
    setTimeout(() => (this.dragging = false), 80);
  }

  open(t: Task) {
    if (!this.dragging) this.edit.emit(t);
  }
}
