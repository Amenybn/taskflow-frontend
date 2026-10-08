import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ACTIVITY_ICONS, PRIORITIES, TASK_STATUSES, daysUntil } from '../core/labels';
import { Activity, Dashboard } from '../core/models';
import { TimeAgoPipe } from '../core/time-ago.pipe';
import { AvatarComponent } from '../shared/avatar.component';
import { BadgeComponent } from '../shared/badge.component';

interface Segment {
  label: string;
  color: string;
  value: number;
  dash: string;
  offset: number;
}

const RADIUS = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, TimeAgoPipe, AvatarComponent, BadgeComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>Tableau de bord</h1>
        <p class="subtitle">{{ greeting }} — voici l'état de vos projets au {{ today | date: 'EEEE d MMMM y' }}.</p>
      </div>
      <div class="actions">
        <a class="btn btn-ghost" routerLink="/tasks"><i class="bi bi-kanban"></i> Ouvrir le tableau</a>
        <a class="btn btn-primary" routerLink="/projects"><i class="bi bi-plus-lg"></i> Nouveau projet</a>
      </div>
    </div>

    @if (data; as d) {
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-icon" style="--c: #6366f1"><i class="bi bi-folder2-open"></i></div>
          <div><div class="kpi-value">{{ d.totalProjects }}</div><div class="kpi-label">Projets · {{ d.activeProjects }} en cours</div></div>
        </div>
        <div class="kpi">
          <div class="kpi-icon" style="--c: #3b82f6"><i class="bi bi-list-task"></i></div>
          <div><div class="kpi-value">{{ d.totalTasks }}</div><div class="kpi-label">Tâches · {{ d.inProgressTasks }} en cours</div></div>
        </div>
        <div class="kpi">
          <div class="kpi-icon" style="--c: #10b981"><i class="bi bi-graph-up-arrow"></i></div>
          <div><div class="kpi-value">{{ d.completionRate }}%</div><div class="kpi-label">Taux de complétion · {{ d.completedTasks }} terminées</div></div>
        </div>
        <div class="kpi">
          <div class="kpi-icon" style="--c: #ef4444"><i class="bi bi-exclamation-triangle"></i></div>
          <div><div class="kpi-value">{{ d.overdueTasks }}</div><div class="kpi-label">Tâches en retard</div></div>
        </div>
        <div class="kpi">
          <div class="kpi-icon" style="--c: #f59e0b"><i class="bi bi-people"></i></div>
          <div><div class="kpi-value">{{ d.totalMembers }}</div><div class="kpi-label">Membres d'équipe</div></div>
        </div>
      </div>

      <div class="dash-grid">
        <section class="card">
          <header class="card-header"><h2>Répartition des tâches</h2></header>
          <div class="card-body donut-wrap">
            <svg viewBox="0 0 160 160" class="donut">
              <circle cx="80" cy="80" [attr.r]="radius" class="donut-track" />
              @for (s of segments; track s.label) {
                <circle cx="80" cy="80" [attr.r]="radius" fill="none" stroke-width="20" [attr.stroke]="s.color"
                        [attr.stroke-dasharray]="s.dash" [attr.stroke-dashoffset]="s.offset" transform="rotate(-90 80 80)" />
              }
              <text x="80" y="76" class="donut-value">{{ d.totalTasks }}</text>
              <text x="80" y="96" class="donut-label">tâches</text>
            </svg>
            <ul class="legend">
              @for (s of segments; track s.label) {
                <li><span class="dot" [style.background]="s.color"></span>{{ s.label }}<strong>{{ s.value }}</strong></li>
              }
            </ul>
          </div>
        </section>

        <section class="card">
          <header class="card-header"><h2>Tâches ouvertes par priorité</h2></header>
          <div class="card-body">
            @for (p of priorities; track p.value) {
              <div class="hbar">
                <span class="hbar-label"><i [class]="'bi ' + p.icon" [style.color]="p.color"></i> {{ p.label }}</span>
                <div class="hbar-track"><div class="hbar-fill" [style.width.%]="pct(d.tasksByPriority[p.value], maxPriority)" [style.background]="p.color"></div></div>
                <strong>{{ d.tasksByPriority[p.value] }}</strong>
              </div>
            }
          </div>
        </section>

        <section class="card span-2">
          <header class="card-header">
            <h2>Avancement des projets</h2>
            <a routerLink="/projects" class="link">Tous les projets <i class="bi bi-arrow-right"></i></a>
          </header>
          <div class="card-body project-progress">
            @for (p of d.projects; track p.id) {
              <a class="pp-row" [routerLink]="['/projects', p.id]">
                <span class="pp-color" [style.background]="p.color"></span>
                <div class="pp-name"><strong>{{ p.name }}</strong><small>{{ p.code }} · {{ p.doneCount }}/{{ p.taskCount }} tâches</small></div>
                <app-badge kind="project" [value]="p.status" />
                <div class="progress"><div class="progress-bar" [style.width.%]="p.progress" [style.background]="p.color"></div></div>
                <span class="pp-pct">{{ p.progress }}%</span>
              </a>
            } @empty {
              <div class="empty-inline">Aucun projet pour l'instant.</div>
            }
          </div>
        </section>

        <section class="card">
          <header class="card-header"><h2>Échéances à venir</h2></header>
          <div class="card-body list">
            @for (t of d.upcomingTasks; track t.id) {
              <div class="list-row">
                <span class="tag" [style.color]="t.projectColor" [style.background]="t.projectColor + '1f'">{{ t.projectCode }}</span>
                <span class="grow ellipsis">{{ t.title }}</span>
                <span class="due" [class.text-danger]="t.overdue">{{ dueLabel(t.dueDate) }}</span>
                <app-avatar [name]="t.assigneeName" [color]="t.assigneeColor" [size]="24" />
              </div>
            } @empty {
              <div class="empty-inline">Aucune échéance à venir 🎉</div>
            }
          </div>
        </section>

        <section class="card">
          <header class="card-header">
            <h2>Charge de l'équipe</h2>
            <a routerLink="/team" class="link">Équipe <i class="bi bi-arrow-right"></i></a>
          </header>
          <div class="card-body list">
            @for (w of d.workload; track w.memberId) {
              <div class="list-row">
                <app-avatar [name]="w.fullName" [color]="w.avatarColor" [size]="30" />
                <div class="grow">
                  <div class="wl-name">{{ w.fullName }} <small>{{ w.role }}</small></div>
                  <div class="progress thin"><div class="progress-bar" [style.width.%]="pct(w.openTasks, maxWorkload)" [style.background]="w.avatarColor"></div></div>
                </div>
                <span class="wl-count" title="Tâches ouvertes / terminées">{{ w.openTasks }} <small>/ {{ w.doneTasks }} ✓</small></span>
              </div>
            }
          </div>
        </section>

        <section class="card span-2">
          <header class="card-header"><h2>Activité récente</h2></header>
          <div class="card-body">
            <ul class="timeline">
              @for (a of d.recentActivity; track a.id) {
                <li>
                  <span class="tl-icon" [style.--c]="icon(a).color"><i [class]="'bi ' + icon(a).icon"></i></span>
                  <span class="tl-text">{{ a.message }}</span>
                  <span class="tl-time">{{ a.createdAt | timeAgo }}</span>
                </li>
              }
            </ul>
          </div>
        </section>
      </div>
    } @else {
      <div class="loading"><span class="spinner"></span> Chargement du tableau de bord...</div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);

  data: Dashboard | null = null;
  segments: Segment[] = [];
  priorities = PRIORITIES;
  radius = RADIUS;
  today = new Date();
  maxPriority = 1;
  maxWorkload = 1;

  get greeting(): string {
    const h = this.today.getHours();
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  }

  ngOnInit() {
    this.api.dashboard().subscribe(d => {
      this.data = d;
      this.maxPriority = Math.max(1, ...Object.values(d.tasksByPriority));
      this.maxWorkload = Math.max(1, ...d.workload.map(w => w.openTasks));
      const total = Math.max(1, d.totalTasks);
      let acc = 0;
      this.segments = TASK_STATUSES.map(s => {
        const value = d.tasksByStatus[s.value] ?? 0;
        const len = (value / total) * CIRCUMFERENCE;
        const seg = { label: s.label, color: s.color, value, dash: `${len} ${CIRCUMFERENCE - len}`, offset: -acc };
        acc += len;
        return seg;
      });
    });
  }

  pct(value: number, max: number): number {
    return Math.round((value / max) * 100);
  }

  icon(a: Activity) {
    return ACTIVITY_ICONS[a.type];
  }

  dueLabel(date: string | null): string {
    const d = daysUntil(date);
    if (d === null) return '';
    if (d < 0) return `${-d} j de retard`;
    if (d === 0) return "Aujourd'hui";
    if (d === 1) return 'Demain';
    return `Dans ${d} j`;
  }
}
