import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PALETTE, PRIORITIES, PROJECT_STATUSES } from '../core/labels';
import { Member, Project, ProjectRequest } from '../core/models';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="modal-backdrop" (click)="closed.emit()">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="submit()">
        <header class="modal-header">
          <h2><i class="bi bi-kanban"></i> {{ project ? 'Modifier le projet' : 'Nouveau projet' }}</h2>
          <button type="button" class="btn-icon" (click)="closed.emit()"><i class="bi bi-x-lg"></i></button>
        </header>
        <div class="modal-body form-grid">
          <label class="field span-2-sm">
            <span>Nom du projet *</span>
            <input name="name" [(ngModel)]="form.name" maxlength="150" placeholder="Ex. Application mobile"
                   [class.invalid]="submitted && !form.name.trim()" />
            @if (submitted && !form.name.trim()) { <small class="field-error">Le nom est obligatoire</small> }
          </label>
          <label class="field">
            <span>Code *</span>
            <input name="code" [(ngModel)]="form.code" maxlength="10" placeholder="Ex. MOBILE" class="uppercase"
                   [class.invalid]="submitted && !form.code.trim()" />
            @if (submitted && !form.code.trim()) { <small class="field-error">Le code est obligatoire</small> }
          </label>
          <label class="field span-2">
            <span>Description</span>
            <textarea name="description" rows="3" [(ngModel)]="form.description" placeholder="Objectifs, périmètre..."></textarea>
          </label>
          <div class="field span-2">
            <span>Statut</span>
            <div class="segmented">
              @for (s of statuses; track s.value) {
                <button type="button" [class.active]="form.status === s.value" [style.--c]="s.color" (click)="form.status = s.value">
                  <i [class]="'bi ' + s.icon"></i>{{ s.label }}
                </button>
              }
            </div>
          </div>
          <div class="field span-2">
            <span>Priorité</span>
            <div class="segmented">
              @for (p of priorities; track p.value) {
                <button type="button" [class.active]="form.priority === p.value" [style.--c]="p.color" (click)="form.priority = p.value">
                  <i [class]="'bi ' + p.icon"></i>{{ p.label }}
                </button>
              }
            </div>
          </div>
          <label class="field">
            <span>Date de début</span>
            <input type="date" name="startDate" [(ngModel)]="form.startDate" />
          </label>
          <label class="field">
            <span>Échéance</span>
            <input type="date" name="dueDate" [(ngModel)]="form.dueDate" />
          </label>
          <label class="field">
            <span>Responsable</span>
            <select name="ownerId" [(ngModel)]="form.ownerId">
              <option [ngValue]="null">Aucun</option>
              @for (m of members; track m.id) { <option [ngValue]="m.id">{{ m.fullName }}</option> }
            </select>
          </label>
          <label class="field">
            <span>Budget (€)</span>
            <input type="number" min="0" step="500" name="budget" [(ngModel)]="form.budget" placeholder="0" />
          </label>
          <div class="field span-2">
            <span>Couleur</span>
            <div class="color-picker">
              @for (c of palette; track c) {
                <button type="button" class="swatch" [style.background]="c" [class.active]="form.color === c" (click)="form.color = c"></button>
              }
            </div>
          </div>
        </div>
        <footer class="modal-footer">
          <span class="spacer"></span>
          <button type="button" class="btn btn-ghost" (click)="closed.emit()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            <i class="bi bi-check-lg"></i> {{ project ? 'Enregistrer' : 'Créer le projet' }}
          </button>
        </footer>
      </form>
    </div>
  `,
})
export class ProjectFormComponent implements OnInit {
  @Input() project: Project | null = null;
  @Input() members: Member[] = [];
  @Output() saved = new EventEmitter<Project>();
  @Output() closed = new EventEmitter<void>();

  private api = inject(ApiService);
  private toast = inject(ToastService);

  statuses = PROJECT_STATUSES;
  priorities = PRIORITIES;
  palette = PALETTE;
  form!: ProjectRequest;
  saving = false;
  submitted = false;

  ngOnInit() {
    const p = this.project;
    this.form = p
      ? {
          name: p.name, code: p.code, description: p.description, status: p.status, priority: p.priority,
          startDate: p.startDate, dueDate: p.dueDate, color: p.color, budget: p.budget, ownerId: p.ownerId,
        }
      : {
          name: '', code: '', description: '', status: 'PLANNED', priority: 'MEDIUM',
          startDate: new Date().toISOString().slice(0, 10), dueDate: null, color: PALETTE[0], budget: null, ownerId: null,
        };
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closed.emit();
  }

  submit() {
    this.submitted = true;
    if (!this.form.name.trim() || !this.form.code.trim()) return;
    this.saving = true;
    const body: ProjectRequest = {
      ...this.form,
      startDate: this.form.startDate || null,
      dueDate: this.form.dueDate || null,
      budget: this.form.budget === null || (this.form.budget as unknown) === '' ? null : Number(this.form.budget),
    };
    const request = this.project ? this.api.updateProject(this.project.id, body) : this.api.createProject(body);
    request.subscribe({
      next: saved => {
        this.toast.success(this.project ? 'Projet mis à jour' : 'Projet créé');
        this.saved.emit(saved);
      },
      error: () => (this.saving = false),
    });
  }
}
