import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ConfirmService } from '../core/confirm.service';
import { PRIORITIES, TASK_STATUSES } from '../core/labels';
import { Member, Project, Task, TaskRequest, TaskStatus } from '../core/models';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="modal-backdrop" (click)="closed.emit()">
      <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="submit()">
        <header class="modal-header">
          <h2><i class="bi bi-check2-square"></i> {{ task ? 'Modifier la tâche' : 'Nouvelle tâche' }}</h2>
          <button type="button" class="btn-icon" (click)="closed.emit()"><i class="bi bi-x-lg"></i></button>
        </header>
        <div class="modal-body form-grid">
          <label class="field span-2">
            <span>Titre *</span>
            <input name="title" [(ngModel)]="form.title" placeholder="Ex. Intégrer le paiement" maxlength="200" autofocus
                   [class.invalid]="submitted && !form.title.trim()" />
            @if (submitted && !form.title.trim()) { <small class="field-error">Le titre est obligatoire</small> }
          </label>
          <label class="field span-2">
            <span>Description</span>
            <textarea name="description" rows="3" [(ngModel)]="form.description" placeholder="Détails, critères d'acceptation..."></textarea>
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
            <span>Projet *</span>
            <select name="projectId" [(ngModel)]="form.projectId" [class.invalid]="submitted && !form.projectId">
              @for (p of projects; track p.id) { <option [ngValue]="p.id">{{ p.code }} — {{ p.name }}</option> }
            </select>
          </label>
          <label class="field">
            <span>Assigné à</span>
            <select name="assigneeId" [(ngModel)]="form.assigneeId">
              <option [ngValue]="null">Non assigné</option>
              @for (m of members; track m.id) { <option [ngValue]="m.id">{{ m.fullName }}</option> }
            </select>
          </label>
          <label class="field">
            <span>Échéance</span>
            <input type="date" name="dueDate" [(ngModel)]="form.dueDate" />
          </label>
          <label class="field">
            <span>Estimation (heures)</span>
            <input type="number" min="0" max="1000" name="estimatedHours" [(ngModel)]="form.estimatedHours" />
          </label>
        </div>
        <footer class="modal-footer">
          @if (task) {
            <button type="button" class="btn btn-danger-ghost" (click)="remove()"><i class="bi bi-trash3"></i> Supprimer</button>
          }
          <span class="spacer"></span>
          <button type="button" class="btn btn-ghost" (click)="closed.emit()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            <i class="bi bi-check-lg"></i> {{ task ? 'Enregistrer' : 'Créer la tâche' }}
          </button>
        </footer>
      </form>
    </div>
  `,
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;
  @Input() projects: Project[] = [];
  @Input() members: Member[] = [];
  @Input() defaultProjectId: number | null = null;
  @Input() defaultStatus: TaskStatus = 'TODO';
  @Output() saved = new EventEmitter<Task>();
  @Output() deleted = new EventEmitter<Task>();
  @Output() closed = new EventEmitter<void>();

  private api = inject(ApiService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  statuses = TASK_STATUSES;
  priorities = PRIORITIES;
  form!: TaskRequest;
  saving = false;
  submitted = false;

  ngOnInit() {
    const t = this.task;
    this.form = t
      ? {
          title: t.title, description: t.description, status: t.status, priority: t.priority, dueDate: t.dueDate,
          estimatedHours: t.estimatedHours, projectId: t.projectId, assigneeId: t.assigneeId,
        }
      : {
          title: '', description: '', status: this.defaultStatus, priority: 'MEDIUM', dueDate: null, estimatedHours: null,
          projectId: this.defaultProjectId ?? this.projects[0]?.id ?? null, assigneeId: null,
        };
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closed.emit();
  }

  submit() {
    this.submitted = true;
    if (!this.form.title.trim() || !this.form.projectId) return;
    this.saving = true;
    const body: TaskRequest = { ...this.form, dueDate: this.form.dueDate || null };
    const request = this.task ? this.api.updateTask(this.task.id, body) : this.api.createTask(body);
    request.subscribe({
      next: saved => {
        this.toast.success(this.task ? 'Tâche mise à jour' : 'Tâche créée');
        this.saved.emit(saved);
      },
      error: () => (this.saving = false),
    });
  }

  async remove() {
    const task = this.task;
    if (!task) return;
    const ok = await this.confirm.ask({ title: 'Supprimer la tâche', message: `« ${task.title} » sera définitivement supprimée.` });
    if (!ok) return;
    this.api.deleteTask(task.id).subscribe(() => {
      this.toast.success('Tâche supprimée');
      this.deleted.emit(task);
    });
  }
}
