import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ConfirmService } from '../core/confirm.service';
import { PROJECT_STATUSES } from '../core/labels';
import { Member, Project, ProjectStatus } from '../core/models';
import { ToastService } from '../core/toast.service';
import { AvatarComponent } from '../shared/avatar.component';
import { BadgeComponent } from '../shared/badge.component';
import { ProjectFormComponent } from '../shared/project-form.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyPipe, AvatarComponent, BadgeComponent, ProjectFormComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>Projets</h1>
        <p class="subtitle">{{ projects.length }} projets · suivez l'avancement, les échéances et les budgets.</p>
      </div>
      <div class="actions">
        <button class="btn btn-primary" (click)="openForm(null)"><i class="bi bi-plus-lg"></i> Nouveau projet</button>
      </div>
    </div>

    <div class="toolbar">
      <div class="search">
        <i class="bi bi-search"></i>
        <input [(ngModel)]="q" placeholder="Rechercher un projet..." />
      </div>
      <div class="chips">
        <button class="chip" [class.active]="status === null" (click)="status = null">Tous <span>{{ projects.length }}</span></button>
        @for (s of statuses; track s.value) {
          <button class="chip" [class.active]="status === s.value" (click)="status = s.value">
            <span class="dot" [style.background]="s.color"></span>{{ s.label }} <span>{{ count(s.value) }}</span>
          </button>
        }
      </div>
    </div>

    @if (loading) {
      <div class="loading"><span class="spinner"></span> Chargement...</div>
    } @else {
      <div class="project-grid">
        @for (p of filtered; track p.id) {
          <article class="card project-card" (click)="open(p)">
            <div class="pc-stripe" [style.background]="p.color"></div>
            <div class="pc-body">
              <div class="pc-head">
                <span class="tag" [style.color]="p.color" [style.background]="p.color + '1f'">{{ p.code }}</span>
                <app-badge kind="project" [value]="p.status" />
                <span class="spacer"></span>
                <button class="btn-icon btn-sm" title="Modifier" (click)="$event.stopPropagation(); openForm(p)"><i class="bi bi-pencil"></i></button>
                <button class="btn-icon btn-sm danger" title="Supprimer" (click)="$event.stopPropagation(); remove(p)"><i class="bi bi-trash3"></i></button>
              </div>
              <h3>{{ p.name }}</h3>
              <p class="pc-desc">{{ p.description || 'Aucune description.' }}</p>
              <div class="pc-progress">
                <div class="progress"><div class="progress-bar" [style.width.%]="p.progress" [style.background]="p.color"></div></div>
                <span>{{ p.progress }}%</span>
              </div>
              <div class="pc-stats">
                <span><i class="bi bi-check2-square"></i> {{ p.doneCount }}/{{ p.taskCount }} tâches</span>
                @if (p.dueDate) {
                  <span [class.text-danger]="p.overdue"><i class="bi bi-calendar3"></i> {{ p.dueDate | date: 'd MMM y' }}</span>
                }
                @if (p.budget) {
                  <span><i class="bi bi-wallet2"></i> {{ p.budget | currency: 'EUR' : 'symbol' : '1.0-0' }}</span>
                }
              </div>
              <div class="pc-footer">
                <app-badge kind="priority" [value]="p.priority" />
                <span class="spacer"></span>
                @if (p.ownerName) {
                  <span class="owner"><app-avatar [name]="p.ownerName" [color]="p.ownerColor" [size]="24" /> {{ p.ownerName }}</span>
                }
              </div>
            </div>
          </article>
        } @empty {
          <div class="empty-state">
            <i class="bi bi-folder-x"></i>
            <h3>Aucun projet trouvé</h3>
            <p>Modifiez vos filtres ou créez votre premier projet.</p>
            <button class="btn btn-primary" (click)="openForm(null)"><i class="bi bi-plus-lg"></i> Nouveau projet</button>
          </div>
        }
      </div>
    }

    @if (showForm) {
      <app-project-form [project]="editing" [members]="members" (saved)="onSaved($event)" (closed)="showForm = false" />
    }
  `,
})
export class ProjectsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  projects: Project[] = [];
  members: Member[] = [];
  statuses = PROJECT_STATUSES;
  status: ProjectStatus | null = null;
  q = '';
  loading = true;
  showForm = false;
  editing: Project | null = null;

  get filtered(): Project[] {
    const q = this.q.trim().toLowerCase();
    return this.projects.filter(
      p =>
        (this.status === null || p.status === this.status) &&
        (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)),
    );
  }

  ngOnInit() {
    this.load();
  }

  load() {
    forkJoin({ projects: this.api.projects(), members: this.api.members() }).subscribe({
      next: ({ projects, members }) => {
        this.projects = projects;
        this.members = members;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  count(status: ProjectStatus): number {
    return this.projects.filter(p => p.status === status).length;
  }

  open(p: Project) {
    this.router.navigate(['/projects', p.id]);
  }

  openForm(p: Project | null) {
    this.editing = p;
    this.showForm = true;
  }

  onSaved(saved: Project) {
    this.showForm = false;
    const idx = this.projects.findIndex(p => p.id === saved.id);
    this.projects = idx >= 0 ? this.projects.map(p => (p.id === saved.id ? saved : p)) : [saved, ...this.projects];
  }

  async remove(p: Project) {
    const ok = await this.confirm.ask({
      title: 'Supprimer le projet',
      message: `Le projet « ${p.name} » et ses ${p.taskCount} tâches seront définitivement supprimés.`,
    });
    if (!ok) return;
    this.api.deleteProject(p.id).subscribe(() => {
      this.projects = this.projects.filter(x => x.id !== p.id);
      this.toast.success('Projet supprimé');
    });
  }
}
