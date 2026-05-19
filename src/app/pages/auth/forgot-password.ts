import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { PrimaryButton } from '../../components/commons/primary-button/primary-button';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink, PrimaryButton],
  templateUrl: './forgot-password.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
  private readonly http = inject(HttpClient);
  readonly t = inject(I18nService).t;

  protected readonly email   = signal('');
  protected readonly loading = signal(false);
  protected readonly error   = signal<string | null>(null);
  protected readonly success = signal(false);

  protected submit(): void {
    if (!this.email() || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    this.http.post(`${environment.apiUrl}/user/forgot-password`, { email: this.email() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Error al procesar la solicitud.');
      },
    });
  }
}
