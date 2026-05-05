import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Evento } from '../../../model/evento.model';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-event-detail-modal',
  imports: [RouterLink],
  templateUrl: './event-detail-modal.html',
  styleUrl: './event-detail-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailModal {
  private readonly i18n = inject(I18nService);

  readonly evento = input.required<Evento>();
  readonly mostrarEnlaceCalendario = input(true);
  readonly mostrarBotonEditar = input(false);
  readonly cerrar = output<void>();
  readonly editar = output<void>();

  get fechaFormateada(): string {
    const f = this.evento().fecha;
    return f.toLocaleDateString(this.i18n.locale(), {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  onCerrar(): void {
    this.cerrar.emit();
  }

  onEditar(): void {
    this.editar.emit();
  }
}
