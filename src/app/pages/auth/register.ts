import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PrimaryButton } from '../../components/commons/primary-button/primary-button';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, PrimaryButton],
  templateUrl: './register.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly t = inject(I18nService).t;

  protected readonly form = new FormGroup({
    name:            new FormControl('', [Validators.required, Validators.minLength(2)]),
    email:           new FormControl('', [Validators.required, Validators.email]),
    password:        new FormControl('', [Validators.required, Validators.minLength(6)]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: matchPasswords });

  protected readonly loading   = signal(false);
  protected readonly error     = signal<string | null>(null);
  protected readonly success   = signal(false);
  protected readonly showPass  = signal(false);
  protected readonly showPass2 = signal(false);

  protected togglePass():  void { this.showPass.update(v => !v); }
  protected togglePass2(): void { this.showPass2.update(v => !v); }

  protected get nameInvalid(): boolean {
    const c = this.form.controls.name;
    return c.invalid && c.touched;
  }
  protected get emailInvalid(): boolean {
    const c = this.form.controls.email;
    return c.invalid && c.touched;
  }
  protected get passwordInvalid(): boolean {
    const c = this.form.controls.password;
    return c.invalid && c.touched;
  }
  protected get confirmInvalid(): boolean {
    const c = this.form.controls.confirmPassword;
    return (c.invalid || this.form.hasError('mismatch')) && c.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.form.value;
    this.loading.set(true);
    this.error.set(null);

    this.auth.register(name!, email!, password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err: { error?: { message?: string } }) => {
        console.log(err)
        this.error.set(err.error?.message ?? 'Error al registrarse. Inténtalo de nuevo.');
        this.loading.set(false);
      }
    });
  }
}

function matchPasswords(group: FormGroup): { mismatch: true } | null {
  const p  = group.get('password')?.value;
  const p2 = group.get('confirmPassword')?.value;
  return p && p2 && p !== p2 ? { mismatch: true } : null;
}
