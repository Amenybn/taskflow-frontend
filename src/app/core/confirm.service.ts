import { Injectable } from '@angular/core';

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  current: (ConfirmRequest & { resolve: (ok: boolean) => void }) | null = null;

  ask(request: ConfirmRequest): Promise<boolean> {
    return new Promise(resolve => {
      this.current = { danger: true, confirmLabel: 'Supprimer', ...request, resolve };
    });
  }

  answer(ok: boolean) {
    this.current?.resolve(ok);
    this.current = null;
  }
}
