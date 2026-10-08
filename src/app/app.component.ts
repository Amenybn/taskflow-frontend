import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ApiService } from './core/api.service';
import { ConfirmService } from './core/confirm.service';
import { ToastService } from './core/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout" [class.menu-open]="menuOpen">
      <aside class="sidebar">
        <a class="brand" routerLink="/dashboard">
          <span class="brand-logo"><i class="bi bi-lightning-charge-fill"></i></span>
          <span class="brand-name">TaskFlow</span>
        </a>
        <nav class="nav">
          <span class="nav-section">Pilotage</span>
          @for (item of nav; track item.path) {
            @if (item.section) { <span class="nav-section">{{ item.section }}</span> }
            <a [routerLink]="item.path" routerLinkActive="active">
              <i [class]="'bi ' + item.icon"></i><span>{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="sidebar-footer">
          <div class="db-status" [class.online]="dbProduct" [title]="dbProduct ? 'Base connectée' : 'Base injoignable'">
            <span class="pulse"></span>
            <div>
              <strong>{{ dbProduct || 'Hors ligne' }}</strong>
              <small>{{ dbProduct ? 'Base de données connectée' : 'Backend injoignable' }}</small>
            </div>
          </div>
        </div>
      </aside>
      <div class="sidebar-overlay" (click)="menuOpen = false"></div>

      <main class="main">
        <header class="topbar">
          <button class="btn-icon menu-toggle" (click)="menuOpen = !menuOpen"><i class="bi bi-list"></i></button>
          <div class="topbar-title">Gestion de projets & tâches</div>
          <span class="spacer"></span>
          <span class="topbar-date"><i class="bi bi-calendar3"></i> {{ today }}</span>
        </header>
        <div class="content">
          <router-outlet />
        </div>
      </main>
    </div>

    <div class="toast-container">
      @for (t of toast.toasts; track t.id) {
        <div class="toast" [class]="'toast toast-' + t.type" (click)="toast.dismiss(t.id)">
          <i class="bi" [class.bi-check-circle-fill]="t.type === 'success'" [class.bi-x-circle-fill]="t.type === 'error'"
             [class.bi-info-circle-fill]="t.type === 'info'"></i>
          <span>{{ t.message }}</span>
        </div>
      }
    </div>

    @if (confirm.current; as c) {
      <div class="modal-backdrop" (click)="confirm.answer(false)">
        <div class="modal modal-sm confirm" (click)="$event.stopPropagation()">
          <div class="modal-body">
            <div class="confirm-icon" [class.danger]="c.danger"><i class="bi bi-exclamation-triangle"></i></div>
            <h2>{{ c.title }}</h2>
            <p>{{ c.message }}</p>
          </div>
          <footer class="modal-footer">
            <span class="spacer"></span>
            <button class="btn btn-ghost" (click)="confirm.answer(false)">Annuler</button>
            <button class="btn" [class.btn-danger]="c.danger" [class.btn-primary]="!c.danger" (click)="confirm.answer(true)">
              {{ c.confirmLabel }}
            </button>
          </footer>
        </div>
      </div>
    }
  `,
})
export class AppComponent implements OnInit {
  toast = inject(ToastService);
  confirm = inject(ConfirmService);
  private api = inject(ApiService);
  private router = inject(Router);

  menuOpen = false;
  dbProduct: string | null = null;
  today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  nav = [
    { path: '/dashboard', label: 'Tableau de bord', icon: 'bi-grid-1x2', section: null },
    { path: '/projects', label: 'Projets', icon: 'bi-folder2-open', section: null },
    { path: '/tasks', label: 'Tâches', icon: 'bi-kanban', section: null },
    { path: '/team', label: 'Équipe', icon: 'bi-people', section: null },
    { path: '/system', label: 'Persistance & Système', icon: 'bi-database-check', section: 'Administration' },
  ];

  ngOnInit() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => (this.menuOpen = false));
    this.api.system().subscribe({ next: i => (this.dbProduct = i.databaseProduct), error: () => (this.dbProduct = null) });
  }
}
