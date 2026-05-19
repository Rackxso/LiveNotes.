import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { PrimaryButton } from '../../components/commons/primary-button/primary-button';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink, PrimaryButton],
  templateUrl: './reset-password.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword {
  private readonly route  = inject(ActivatedRoute);
  private readonly http   = inject(HttpClient);
  readonly t = inject(I18nService).t;

  protected readonly newPassword     = signal('');
  protected readonly confirmPassword = signal('');
  protected readonly loading         = signal(false);
  protected readonly error           = signal<string | null>(null);
  protected readonly success         = signal(false);

  protected submit(): void {
    const np = this.newPassword();
    const cp = this.confirmPassword();
    if (!np || np.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (np !== cp) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    const token = this.route.snapshot.paramMap.get('token');
    this.loading.set(true);
    this.error.set(null);
    this.http.post(`${environment.apiUrl}/user/reset-password/${token}`, { newPassword: np }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'El enlace no es válido o ha expirado.');
      },
    });
  }
}
