import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PALETTE } from '../core/labels';
import { Member, MemberRequest } from '../core/models';
import { ToastService } from '../core/toast.service';
import { AvatarComponent } from './avatar.component';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [FormsModule, AvatarComponent],
  template: `
    <div class="modal-backdrop" (click)="closed.emit()">
      <form class="modal modal-sm" (click)="$event.stopPropagation()" (ngSubmit)="submit()">
        <header class="modal-header">
          <h2><i class="bi bi-person-plus"></i> {{ member ? 'Modifier le membre' : 'Nouveau membre' }}</h2>
          <button type="button" class="btn-icon" (click)="closed.emit()"><i class="bi bi-x-lg"></i></button>
        </header>
        <div class="modal-body form-grid">
          <div class="span-2 member-preview">
            <app-avatar [name]="form.fullName || '?'" [color]="form.avatarColor" [size]="64" />
          </div>
          <label class="field span-2">
            <span>Nom complet *</span>
            <input name="fullName" [(ngModel)]="form.fullName" maxlength="120" placeholder="Prénom Nom"
                   [class.invalid]="submitted && !form.fullName.trim()" />
            @if (submitted && !form.fullName.trim()) { <small class="field-error">Le nom est obligatoire</small> }
          </label>
          <label class="field span-2">
            <span>Email *</span>
            <input type="email" name="email" [(ngModel)]="form.email" maxlength="160" placeholder="prenom.nom@entreprise.com"
                   [class.invalid]="submitted && !emailValid" />
            @if (submitted && !emailValid) { <small class="field-error">Email invalide</small> }
          </label>
          <label class="field span-2">
            <span>Rôle / poste</span>
            <input name="role" [(ngModel)]="form.role" maxlength="120" placeholder="Ex. Développeur Frontend" />
          </label>
          <div class="field span-2">
            <span>Couleur de l'avatar</span>
            <div class="color-picker">
              @for (c of palette; track c) {
                <button type="button" class="swatch" [style.background]="c" [class.active]="form.avatarColor === c" (click)="form.avatarColor = c"></button>
              }
            </div>
          </div>
        </div>
        <footer class="modal-footer">
          <span class="spacer"></span>
          <button type="button" class="btn btn-ghost" (click)="closed.emit()">Annuler</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            <i class="bi bi-check-lg"></i> {{ member ? 'Enregistrer' : 'Ajouter' }}
          </button>
        </footer>
      </form>
    </div>
  `,
})
export class MemberFormComponent implements OnInit {
  @Input() member: Member | null = null;
  @Output() saved = new EventEmitter<Member>();
  @Output() closed = new EventEmitter<void>();

  private api = inject(ApiService);
  private toast = inject(ToastService);

  palette = PALETTE;
  form!: MemberRequest;
  saving = false;
  submitted = false;

  get emailValid(): boolean {
    return EMAIL.test(this.form.email.trim());
  }

  ngOnInit() {
    const m = this.member;
    this.form = m
      ? { fullName: m.fullName, email: m.email, role: m.role, avatarColor: m.avatarColor }
      : { fullName: '', email: '', role: '', avatarColor: PALETTE[Math.floor(Math.random() * PALETTE.length)] };
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closed.emit();
  }

  submit() {
    this.submitted = true;
    if (!this.form.fullName.trim() || !this.emailValid) return;
    this.saving = true;
    const request = this.member ? this.api.updateMember(this.member.id, this.form) : this.api.createMember(this.form);
    request.subscribe({
      next: saved => {
        this.toast.success(this.member ? 'Membre mis à jour' : 'Membre ajouté');
        this.saved.emit(saved);
      },
      error: () => (this.saving = false),
    });
  }
}
