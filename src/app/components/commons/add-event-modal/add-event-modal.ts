import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Evento, RecurrenceType } from '../../../model/evento.model';
import { I18nService } from '../../../services/i18n.service';
import { PrimaryButton } from '../primary-button/primary-button';
import { SecondaryButton } from '../secondary-button/secondary-button';

@Component({
  selector: 'app-add-event-modal',
  imports: [FormsModule, PrimaryButton, SecondaryButton],
  templateUrl: './add-event-modal.html',
  styleUrl: './add-event-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEventModal {
  private readonly i18n = inject(I18nService);
  readonly t = this.i18n.t;

  readonly fechaInicial = input<Date | null>(null);
  readonly eventoEditar = input<Evento | null>(null);
  readonly cerrar = output<void>();
  readonly guardar = output<Omit<Evento, 'id'>>();
  readonly actualizar = output<Evento>();

  titulo = '';
  descripcion = '';
  fecha = '';
  hora = '';
  recurrenceType: RecurrenceType = 'none';
  recurrenceEnd = '';

  readonly recurrenceOptions: { value: RecurrenceType; labelKey: string }[] = [
    { value: 'none',    labelKey: 'modal.recurrence.none' },
    { value: 'daily',   labelKey: 'modal.recurrence.daily' },
    { value: 'weekly',  labelKey: 'modal.recurrence.weekly' },
    { value: 'monthly', labelKey: 'modal.recurrence.monthly' },
  ];

  ngOnInit(): void {
    const ev = this.eventoEditar();
    if (ev) {
      this.titulo = ev.titulo;
      this.descripcion = ev.descripcion ?? '';
      this.fecha = this.dateToInputValue(ev.fecha);
      this.hora = ev.hora ?? '';
      this.recurrenceType = ev.recurrenceType ?? 'none';
      this.recurrenceEnd = ev.recurrenceEnd ? this.dateToInputValue(ev.recurrenceEnd) : '';
    } else {
      const f = this.fechaInicial();
      if (f) this.fecha = this.dateToInputValue(f);
    }
  }

  get esEdicion(): boolean {
    return this.eventoEditar() !== null;
  }

  private dateToInputValue(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onGuardar(): void {
    if (!this.titulo.trim() || !this.fecha) return;
    const [yyyy, mm, dd] = this.fecha.split('-').map(Number);
    const data: Omit<Evento, 'id'> = {
      titulo: this.titulo.trim(),
      descripcion: this.descripcion.trim() || undefined,
      fecha: new Date(yyyy, mm - 1, dd),
      hora: this.hora || undefined,
      recurrenceType: this.recurrenceType,
      recurrenceEnd: this.recurrenceType !== 'none' && this.recurrenceEnd
        ? new Date(this.recurrenceEnd)
        : undefined,
    };

    const ev = this.eventoEditar();
    if (ev) {
      this.actualizar.emit({ id: ev.id, ...data });
    } else {
      this.guardar.emit(data);
    }
    this.onCerrar();
  }

  onCerrar(): void {
    this.titulo = '';
    this.descripcion = '';
    this.fecha = '';
    this.hora = '';
    this.recurrenceType = 'none';
    this.recurrenceEnd = '';
    this.cerrar.emit();
  }
}
