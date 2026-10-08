import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, Input, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ConfirmService } from '../core/confirm.service';
import { daysUntil } from '../core/labels';
import { Member, Project, Task, TaskStatus } from '../core/models';
import { ToastService } from '../core/toast.service';
import { AvatarComponent } from '../shared/avatar.component';
import { BadgeComponent } from '../shared/badge.component';
import { KanbanBoardComponent } from '../shared/kanban-board.component';
import { ProjectFormComponent } from '../shared/project-form.component';
import { TaskFormComponent } from '../shared/task-form.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe, AvatarComponent, BadgeComponent, KanbanBoardComponent, ProjectFormComponent, TaskFormComponent],
  template: `
    <a routerLink="/projects" class="back-link"><i class="bi bi-arrow-left"></i> Retour aux projets</a>

    @if (project; as p) {
      <div class="detail-hero card" [style.--c]="p.color">
        <div class="hero-main">
          <div class="hero-title">
            <span class="hero-code" [style.background]="p.color">{{ p.code }}</span>
            <div>
              <h1>{{ p.name }}</h1>
              <div class="hero-badges">
                <app-badge kind="project" [value]="p.status" />
                <app-badge kind="priority" [value]="p.priority" />
                @if (p.overdue) { <span class="badge badge-danger"><i class="bi bi-alarm"></i>En retard</span> }
              </div>
            </div>
          </div>
          <p class="hero-desc">{{ p.description || 'Aucune description.' }}</p>
        </div>
        <div class="hero-actions">
          <button class="btn btn-ghost" (click)="showProjectForm = true"><i class="bi bi-pencil"></i> Modifier</button>
          <button class="btn btn-danger-ghost" (click)="removeProject()"><i class="bi bi-trash3"></i></button>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat card">
          <svg viewBox="0 0 36 36" class="ring">
            <circle cx="18" cy="18" r="15.9" class="ring-track" />
            <circle cx="18" cy="18" r="15.9" class="ring-fill" [attr.stroke]="p.color" [attr.stroke-dasharray]="p.progress + ' 100'" />
            <text x="18" y="21">{{ p.progress }}%</text>
          </svg>
          <div><div class="stat-label">Avancement</div><div class="stat-value">{{ p.doneCount }} / {{ p.taskCount }} tâches</div></div>
        </div>
        <div class="stat card">
          <i class="bi bi-calendar-range stat-icon"></i>
          <div>
            <div class="stat-label">Période</div>
            <div class="stat-value">{{ (p.startDate | date: 'd MMM') || '—' }} → {{ (p.dueDate | date: 'd MMM y') || '—' }}</div>
            @if (remaining !== null) {
              <small [class.text-danger]="remaining < 0">{{ remaining < 0 ? (-remaining) + ' j de retard' : remaining + ' j restants' }}</small>
            }
          </div>
        </div>
        <div class="stat card">
          <i class="bi bi-wallet2 stat-icon"></i>
          <div><div class="stat-label">Budget</div><div class="stat-value">{{ p.budget ? (p.budget | currency: 'EUR' : 'symbol' : '1.0-0') : '—' }}</div></div>
        </div>
        <div class="stat card">
          <app-avatar [name]="p.ownerName" [color]="p.ownerColor" [size]="40" />
          <div><div class="stat-label">Responsable</div><div class="stat-value">{{ p.ownerName || 'Non défini' }}</div></div>
        </div>
      </div>

      <div class="section-header">
        <h2>Tâches du projet</h2>
        <button class="btn btn-primary" (click)="openTask(null, 'TODO')"><i class="bi bi-plus-lg"></i> Nouvelle tâche</button>
      </div>
      <app-kanban-board [tasks]="tasks" [showProject]="false" (edit)="openTask($event)" (add)="openTask(null, $event)" (statusChange)="changeStatus($event)" />

      @if (showProjectForm) {
        <app-project-form [project]="p" [members]="members" (saved)="onProjectSaved($event)" (closed)="showProjectForm = false" />
      }
      @if (showTaskForm) {
        <app-task-form [task]="editingTask" [projects]="[p]" [members]="members" [defaultProjectId]="p.id" [defaultStatus]="defaultStatus"
                       (saved)="onTaskSaved($event)" (deleted)="onTaskDeleted($event)" (closed)="showTaskForm = false" />
      }
    } @else {
      <div class="loading"><span class="spinner"></span> Chargement du projet...</div>
    }
  `,
})
export class ProjectDetailComponent implements OnInit {
  @Input() id!: string;

  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  project: Project | null = null;
  tasks: Task[] = [];
  members: Member[] = [];
  showProjectForm = false;
  showTaskForm = false;
  editingTask: Task | null = null;
  defaultStatus: TaskStatus = 'TODO';

  get remaining(): number | null {
    return this.project?.status === 'COMPLETED' ? null : daysUntil(this.project?.dueDate ?? null);
  }

  ngOnInit() {
    const id = Number(this.id);
    forkJoin({ project: this.api.project(id), tasks: this.api.tasks({ projectId: id }), members: this.api.members() }).subscribe({
      next: ({ project, tasks, members }) => {
        this.project = project;
        this.tasks = tasks;
        this.members = members;
      },
      error: () => this.router.navigate(['/projects']),
    });
  }

  refreshProject() {
    if (this.project) this.api.project(this.project.id).subscribe(p => (this.project = p));
  }

  openTask(task: Task | null, status: TaskStatus = 'TODO') {
    this.editingTask = task;
    this.defaultStatus = status;
    this.showTaskForm = true;
  }

  changeStatus({ task, status }: { task: Task; status: TaskStatus }) {
    this.api.updateTaskStatus(task.id, status).subscribe({
      next: updated => {
        this.tasks = this.tasks.map(t => (t.id === updated.id ? updated : t));
        this.refreshProject();
      },
      error: () => (this.tasks = [...this.tasks]),
    });
  }

  onTaskSaved(saved: Task) {
    this.showTaskForm = false;
    const exists = this.tasks.some(t => t.id === saved.id);
    this.tasks = exists ? this.tasks.map(t => (t.id === saved.id ? saved : t)) : [saved, ...this.tasks];
    this.refreshProject();
  }

  onTaskDeleted(deleted: Task) {
    this.showTaskForm = false;
    this.tasks = this.tasks.filter(t => t.id !== deleted.id);
    this.refreshProject();
  }

  onProjectSaved(saved: Project) {
    this.showProjectForm = false;
    this.project = saved;
  }

  async removeProject() {
    const p = this.project;
    if (!p) return;
    const ok = await this.confirm.ask({
      title: 'Supprimer le projet',
      message: `Le projet « ${p.name} » et ses ${p.taskCount} tâches seront définitivement supprimés.`,
    });
    if (!ok) return;
    this.api.deleteProject(p.id).subscribe(() => {
      this.toast.success('Projet supprimé');
      this.router.navigate(['/projects']);
    });
  }
}
