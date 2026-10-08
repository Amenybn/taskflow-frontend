import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { SystemInfo } from '../core/models';

const TABLE_LABELS: Record<string, { label: string; icon: string }> = {
  projects: { label: 'Projets', icon: 'bi-folder2' },
  tasks: { label: 'Tâches', icon: 'bi-check2-square' },
  members: { label: 'Membres', icon: 'bi-people' },
  activities: { label: 'Activités', icon: 'bi-activity' },
  server_boots: { label: 'Démarrages', icon: 'bi-power' },
};

@Component({
  selector: 'app-system',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page-header">
      <div>
        <h1>Persistance & Système</h1>
        <p class="subtitle">Où sont stockées les données, et la preuve qu'elles survivent aux redémarrages.</p>
      </div>
      <div class="actions">
        <button class="btn btn-ghost" (click)="load()"><i class="bi bi-arrow-clockwise"></i> Actualiser</button>
      </div>
    </div>

    @if (info; as i) {
      <div class="persist-banner card" [class.ok]="i.persistent">
        <i class="bi" [class.bi-shield-check]="i.persistent" [class.bi-exclamation-triangle]="!i.persistent"></i>
        <div>
          <h2>{{ i.persistent ? 'Base de données persistante' : 'Base de données en mémoire (non persistante)' }}</h2>
          <p>{{ i.storage }}</p>
        </div>
        <div class="boot-counter">
          <strong>{{ i.bootCount }}</strong>
          <span>démarrage{{ i.bootCount > 1 ? 's' : '' }} du serveur<br />sur la même base</span>
        </div>
      </div>

      <div class="dash-grid">
        <section class="card">
          <header class="card-header"><h2><i class="bi bi-database"></i> Base de données</h2></header>
          <div class="card-body">
            <dl class="info-list">
              <dt>Moteur</dt><dd>{{ i.databaseProduct }} <small>{{ i.databaseVersion }}</small></dd>
              <dt>URL JDBC</dt><dd><code>{{ i.jdbcUrl }}</code></dd>
              <dt>Stockage</dt><dd>{{ i.storage }}</dd>
              <dt>Première initialisation</dt><dd>{{ i.firstBootAt | date: 'd MMM y, HH:mm:ss' }}</dd>
            </dl>
          </div>
        </section>

        <section class="card">
          <header class="card-header"><h2><i class="bi bi-server"></i> Serveur backend</h2></header>
          <div class="card-body">
            <dl class="info-list">
              <dt>Application</dt><dd>TaskFlow API v{{ i.appVersion }}</dd>
              <dt>Java</dt><dd>{{ i.javaVersion }}</dd>
              <dt>Hôte / conteneur</dt><dd><code>{{ i.hostname }}</code></dd>
              <dt>Démarré le</dt><dd>{{ i.startedAt | date: 'd MMM y, HH:mm:ss' }}</dd>
              <dt>Uptime</dt><dd>{{ uptime(i.uptimeSeconds) }}</dd>
            </dl>
          </div>
        </section>

        <section class="card">
          <header class="card-header"><h2><i class="bi bi-table"></i> Enregistrements en base</h2></header>
          <div class="card-body records">
            @for (r of records; track r.key) {
              <div class="record">
                <i [class]="'bi ' + r.icon"></i>
                <span>{{ r.label }}</span>
                <code class="muted">{{ r.key }}</code>
                <strong>{{ r.value }}</strong>
              </div>
            }
          </div>
        </section>

        <section class="card">
          <header class="card-header"><h2><i class="bi bi-clock-history"></i> Historique des démarrages</h2></header>
          <div class="card-body list">
            @for (b of i.recentBoots; track b.id; let first = $first) {
              <div class="list-row">
                <span class="boot-id">#{{ b.id }}</span>
                <span class="grow">{{ b.bootedAt | date: 'd MMM y, HH:mm:ss' }}</span>
                <code class="muted">{{ b.hostname }}</code>
                @if (first) { <span class="badge badge-success">Actuel</span> }
              </div>
            }
          </div>
        </section>

        <section class="card span-2 howto">
          <header class="card-header"><h2><i class="bi bi-lightbulb"></i> Démontrer la persistance</h2></header>
          <div class="card-body">
            <ol>
              <li>Créez un projet ou déplacez une tâche dans le tableau Kanban.</li>
              <li>Redémarrez ou redéployez le backend : <code>docker compose restart backend</code> (ou supprimez et recréez le conteneur).</li>
              <li>Revenez sur l'application : vos données sont toujours là, et le compteur de <strong>démarrages</strong> ci-dessus a augmenté — la même base a été réutilisée.</li>
            </ol>
          </div>
        </section>
      </div>
    } @else {
      <div class="loading"><span class="spinner"></span> Lecture des informations système...</div>
    }
  `,
})
export class SystemComponent implements OnInit {
  private api = inject(ApiService);

  info: SystemInfo | null = null;
  records: { key: string; label: string; icon: string; value: number }[] = [];

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.system().subscribe(i => {
      this.info = i;
      this.records = Object.entries(i.records).map(([key, value]) => ({
        key,
        value,
        label: TABLE_LABELS[key]?.label ?? key,
        icon: TABLE_LABELS[key]?.icon ?? 'bi-table',
      }));
    });
  }

  uptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [d ? `${d} j` : '', h ? `${h} h` : '', m ? `${m} min` : '', `${s} s`].filter(Boolean).join(' ');
  }
}
