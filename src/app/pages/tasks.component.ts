import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { PRIORITIES, TASK_STATUSES } from '../core/labels';
import { Member, Priority, Project, Task, TaskStatus } from '../core/models';
import { ToastService } from '../core/toast.service';
import { AvatarComponent } from '../shared/avatar.component';
import { BadgeComponent } from '../shared/badge.component';
import { KanbanBoardComponent } from '../shared/kanban-board.component';
import { TaskFormComponent } from '../shared/task-form.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [FormsModule, DatePipe, AvatarComponent, BadgeComponent, KanbanBoardComponent, TaskFormComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>Tâches</h1>
        <p class="subtitle">Glissez-déposez les cartes pour changer leur statut — chaque changement est enregistré en base.</p>
      </div>
      <div class="actions">
        <div class="view-toggle">
          <button [class.active]="view === 'kanban'" (click)="view = 'kanban'" title="Vue Kanban"><i class="bi bi-kanban"></i> Kanban</button>
          <button [class.active]="view === 'list'" (click)="view = 'list'" title="Vue liste"><i class="bi bi-list-ul"></i> Liste</button>
        </div>
        <button class="btn btn-primary" (click)="openForm(null)" [disabled]="!projects.length"><i class="bi bi-plus-lg"></i> Nouvelle tâche</button>
      </div>
    </div>

    <div class="toolbar">
      <div class="search">
        <i class="bi bi-search"></i>
        <input [(ngModel)]="q" (ngModelChange)="applyFilters()" placeholder="Rechercher une tâche..." />
      </div>
      <select [(ngModel)]="projectId" (ngModelChange)="applyFilters()">
        <option [ngValue]="null">Tous les projets</option>
        @for (p of projects; track p.id) { <option [ngValue]="p.id">{{ p.code }} — {{ p.name }}</option> }
      </select>
      <select [(ngModel)]="assigneeId" (ngModelChange)="applyFilters()">
        <option [ngValue]="null">Tous les membres</option>
        <option [ngValue]="0">Non assignées</option>
        @for (m of members; track m.id) { <option [ngValue]="m.id">{{ m.fullName }}</option> }
      </select>
      <select [(ngModel)]="priority" (ngModelChange)="applyFilters()">
        <option [ngValue]="null">Toutes priorités</option>
        @for (p of priorities; track p.value) { <option [ngValue]="p.value">{{ p.label }}</option> }
      </select>
      @if (hasFilters) {
        <button class="btn btn-ghost btn-sm" (click)="resetFilters()"><i class="bi bi-x-circle"></i> Réinitialiser</button>
      }
      <span class="spacer"></span>
      <span class="muted">{{ filtered.length }} / {{ tasks.length }} tâches</span>
    </div>

    @if (loading) {
      <div class="loading"><span class="spinner"></span> Chargement des tâches...</div>
    } @else if (view === 'kanban') {
      <app-kanban-board [tasks]="filtered" (edit)="openForm($event)" (add)="openForm(null, $event)" (statusChange)="changeStatus($event.task, $event.status)" />
    } @else {
      <div class="card table-wrap">
        <table class="table">
          <thead>
            <tr><th>Tâche</th><th>Projet</th><th>Assigné</th><th>Priorité</th><th>Statut</th><th>Échéance</th><th></th></tr>
          </thead>
          <tbody>
            @for (t of filtered; track t.id) {
              <tr>
                <td class="t-title" (click)="openForm(t)">{{ t.title }}</td>
                <td><span class="tag" [style.color]="t.projectColor" [style.background]="t.projectColor + '1f'">{{ t.projectCode }}</span></td>
                <td><span class="owner"><app-avatar [name]="t.assigneeName" [color]="t.assigneeColor" [size]="24" /> {{ t.assigneeName || '—' }}</span></td>
                <td><app-badge kind="priority" [value]="t.priority" /></td>
                <td>
                  <select class="status-select" [ngModel]="t.status" (ngModelChange)="changeStatus(t, $event)">
                    @for (s of statuses; track s.value) { <option [ngValue]="s.value">{{ s.label }}</option> }
                  </select>
                </td>
                <td [class.text-danger]="t.overdue">{{ (t.dueDate | date: 'd MMM y') || '—' }}</td>
                <td><button class="btn-icon btn-sm" (click)="openForm(t)"><i class="bi bi-pencil"></i></button></td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="empty-inline">Aucune tâche ne correspond aux filtres.</td></tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (showForm) {
      <app-task-form [task]="editing" [projects]="projects" [members]="members" [defaultProjectId]="projectId" [defaultStatus]="defaultStatus"
                     (saved)="onSaved($event)" (deleted)="onDeleted($event)" (closed)="showForm = false" />
    }
  `,
})
export class TasksComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  tasks: Task[] = [];
  filtered: Task[] = [];
  projects: Project[] = [];
  members: Member[] = [];
  statuses = TASK_STATUSES;
  priorities = PRIORITIES;

  view: 'kanban' | 'list' = 'kanban';
  q = '';
  projectId: number | null = null;
  assigneeId: number | null = null;
  priority: Priority | null = null;
  loading = true;

  showForm = false;
  editing: Task | null = null;
  defaultStatus: TaskStatus = 'TODO';

  get hasFilters(): boolean {
    return !!this.q || this.projectId !== null || this.assigneeId !== null || this.priority !== null;
  }

  ngOnInit() {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('assignee')) this.assigneeId = Number(qp.get('assignee'));
    if (qp.get('project')) this.projectId = Number(qp.get('project'));

    forkJoin({ tasks: this.api.tasks(), projects: this.api.projects(), members: this.api.members() }).subscribe({
      next: ({ tasks, projects, members }) => {
        this.tasks = tasks;
        this.projects = projects;
        this.members = members;
        this.loading = false;
        this.applyFilters();
      },
      error: () => (this.loading = false),
    });
  }

  applyFilters() {
    const q = this.q.trim().toLowerCase();
    this.filtered = this.tasks.filter(
      t =>
        (this.projectId === null || t.projectId === this.projectId) &&
        (this.assigneeId === null || (this.assigneeId === 0 ? t.assigneeId === null : t.assigneeId === this.assigneeId)) &&
        (this.priority === null || t.priority === this.priority) &&
        (!q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)),
    );
  }

  resetFilters() {
    this.q = '';
    this.projectId = this.assigneeId = null;
    this.priority = null;
    this.applyFilters();
  }

  openForm(task: Task | null, status: TaskStatus = 'TODO') {
    this.editing = task;
    this.defaultStatus = status;
    this.showForm = true;
  }

  changeStatus(task: Task, status: TaskStatus) {
    this.api.updateTaskStatus(task.id, status).subscribe({
      next: updated => {
        this.replace(updated);
        const label = TASK_STATUSES.find(s => s.value === status)?.label;
        this.toast.success(`« ${updated.title} » → ${label}`);
      },
      error: () => this.applyFilters(),
    });
  }

  onSaved(saved: Task) {
    this.showForm = false;
    if (this.tasks.some(t => t.id === saved.id)) {
      this.replace(saved);
    } else {
      this.tasks = [saved, ...this.tasks];
      this.applyFilters();
    }
  }

  onDeleted(deleted: Task) {
    this.showForm = false;
    this.tasks = this.tasks.filter(t => t.id !== deleted.id);
    this.applyFilters();
  }

  private replace(updated: Task) {
    this.tasks = this.tasks.map(t => (t.id === updated.id ? updated : t));
    this.applyFilters();
  }
}
