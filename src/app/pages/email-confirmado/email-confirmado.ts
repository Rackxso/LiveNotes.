import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';

interface Config {
  icon: string;
  title: string;
  titleEm: string;
  message: string;
}

const CONFIGS: Record<string, Config> = {
  verificacion: {
    icon: '✅',
    title: '¡Email',
    titleEm: 'verificado!',
    message: 'Tu cuenta ya está activa. Puedes iniciar sesión.',
  },
  password: {
    icon: '🔐',
    title: '¡Contraseña',
    titleEm: 'actualizada!',
    message: 'Tu contraseña ha sido cambiada correctamente. Inicia sesión con la nueva.',
  },
  eliminacion: {
    icon: '👋',
    title: 'Cuenta',
    titleEm: 'eliminada',
    message: 'Tu cuenta ha sido eliminada permanentemente. Gracias por haber usado LiveNotes.',
  },
  error: {
    icon: '❌',
    title: 'Enlace',
    titleEm: 'no válido',
    message: 'El enlace no es válido o ha expirado. Vuelve a intentarlo desde la app.',
  },
};

@Component({
  selector: 'app-email-confirmado',
  imports: [RouterLink],
  templateUrl: './email-confirmado.html',
  styleUrl: './email-confirmado.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailConfirmado {
  private readonly route = inject(ActivatedRoute);
  readonly t = inject(I18nService).t;

  protected readonly config = computed<Config>(() => {
    const tipo = this.route.snapshot.queryParamMap.get('tipo') ?? 'error';
    return CONFIGS[tipo] ?? CONFIGS['error'];
  });
}
