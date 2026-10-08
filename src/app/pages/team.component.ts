import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ConfirmService } from '../core/confirm.service';
import { Member } from '../core/models';
import { ToastService } from '../core/toast.service';
import { AvatarComponent } from '../shared/avatar.component';
import { MemberFormComponent } from '../shared/member-form.component';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, AvatarComponent, MemberFormComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>Équipe</h1>
        <p class="subtitle">{{ members.length }} membres · répartition de la charge de travail.</p>
      </div>
      <div class="actions">
        <button class="btn btn-primary" (click)="openForm(null)"><i class="bi bi-person-plus"></i> Ajouter un membre</button>
      </div>
    </div>

    <div class="toolbar">
      <div class="search">
        <i class="bi bi-search"></i>
        <input [(ngModel)]="q" placeholder="Rechercher par nom, email ou rôle..." />
      </div>
    </div>

    @if (loading) {
      <div class="loading"><span class="spinner"></span> Chargement de l'équipe...</div>
    } @else {
      <div class="member-grid">
        @for (m of filtered; track m.id) {
          <article class="card member-card">
            <div class="mc-banner" [style.background]="m.avatarColor"></div>
            <div class="mc-actions">
              <button class="btn-icon btn-sm light" title="Modifier" (click)="openForm(m)"><i class="bi bi-pencil"></i></button>
              <button class="btn-icon btn-sm light" title="Supprimer" (click)="remove(m)"><i class="bi bi-trash3"></i></button>
            </div>
            <app-avatar class="mc-avatar" [name]="m.fullName" [color]="m.avatarColor" [size]="72" />
            <h3>{{ m.fullName }}</h3>
            <p class="mc-role">{{ m.role || 'Membre' }}</p>
            <a class="mc-email" [href]="'mailto:' + m.email"><i class="bi bi-envelope"></i> {{ m.email }}</a>
            <div class="mc-stats">
              <div><strong>{{ m.openTaskCount }}</strong><span>Ouvertes</span></div>
              <div><strong>{{ m.doneTaskCount }}</strong><span>Terminées</span></div>
              <div><strong>{{ rate(m) }}%</strong><span>Complétion</span></div>
            </div>
            <div class="mc-footer">
              <small>Membre depuis le {{ m.createdAt | date: 'd MMM y' }}</small>
              <a class="link" [routerLink]="['/tasks']" [queryParams]="{ assignee: m.id }">Voir ses tâches <i class="bi bi-arrow-right"></i></a>
            </div>
          </article>
        } @empty {
          <div class="empty-state">
            <i class="bi bi-people"></i>
            <h3>Aucun membre</h3>
            <p>Ajoutez les membres de votre équipe pour leur assigner des tâches.</p>
          </div>
        }
      </div>
    }

    @if (showForm) {
      <app-member-form [member]="editing" (saved)="onSaved($event)" (closed)="showForm = false" />
    }
  `,
})
export class TeamComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  members: Member[] = [];
  q = '';
  loading = true;
  showForm = false;
  editing: Member | null = null;

  get filtered(): Member[] {
    const q = this.q.trim().toLowerCase();
    return this.members.filter(
      m => !q || m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.role ?? '').toLowerCase().includes(q),
    );
  }

  ngOnInit() {
    this.api.members().subscribe({
      next: m => {
        this.members = m;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  rate(m: Member): number {
    return m.taskCount ? Math.round((m.doneTaskCount / m.taskCount) * 100) : 0;
  }

  openForm(m: Member | null) {
    this.editing = m;
    this.showForm = true;
  }

  onSaved(saved: Member) {
    this.showForm = false;
    const exists = this.members.some(m => m.id === saved.id);
    this.members = (exists ? this.members.map(m => (m.id === saved.id ? saved : m)) : [...this.members, saved]).sort((a, b) =>
      a.fullName.localeCompare(b.fullName),
    );
  }

  async remove(m: Member) {
    const ok = await this.confirm.ask({
      title: 'Retirer le membre',
      message: `${m.fullName} sera retiré de l'équipe. Ses ${m.taskCount} tâches deviendront non assignées.`,
      confirmLabel: 'Retirer',
    });
    if (!ok) return;
    this.api.deleteMember(m.id).subscribe(() => {
      this.members = this.members.filter(x => x.id !== m.id);
      this.toast.success('Membre retiré');
    });
  }
}
