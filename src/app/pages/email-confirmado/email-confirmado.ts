import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';

interface Config {
  icon: string;
  title: string;
  titleEm: string;
  message: string;
}

const CONFIG_ICONS: Record<string, string> = {
  verificacion: '✅',
  password: '🔐',
  eliminacion: '👋',
  error: '❌',
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
    const key = tipo in CONFIG_ICONS ? tipo : 'error';
    return {
      icon: CONFIG_ICONS[key],
      title:   this.t()(`auth.confirmado.${key}.title`),
      titleEm: this.t()(`auth.confirmado.${key}.titleEm`),
      message: this.t()(`auth.confirmado.${key}.message`),
    };
  });
}
