import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Evento } from '../../../model/evento.model';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-mini-calendar',
  imports: [],
  templateUrl: './mini-calendar.html',
  styleUrl: './mini-calendar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniCalendar {
  private readonly i18n = inject(I18nService);
  readonly t = this.i18n.t;

  private readonly _today = new Date();

  readonly eventos = input<Evento[]>([]);
  readonly diaSeleccionado = input<Date>(new Date());
  readonly diaSeleccionadoChange = output<Date>();
  readonly mesVisibleChange = output<{ anyo: number; mes: number }>();

  readonly anyo = signal<number>(this._today.getFullYear());
  readonly mes = signal<number>(this._today.getMonth());

  readonly diasSemana = computed<string[]>(() => {
    const locale = this.i18n.locale();
    const base = new Date(2006, 0, 2); // 2 ene 2006 era lunes
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: 'narrow' });
    });
  });

  readonly nombreMes = computed(() =>
    new Date(this.anyo(), this.mes(), 1)
      .toLocaleString(this.i18n.locale(), { month: 'long' })
  );

  private readonly diasEnMes = computed(() =>
    new Date(this.anyo(), this.mes() + 1, 0).getDate()
  );

  readonly offsetInicio = computed(() =>
    (new Date(this.anyo(), this.mes(), 1).getDay() + 6) % 7
  );

  readonly celdasVacias = computed(() =>
    Array<null>(this.offsetInicio()).fill(null)
  );

  readonly diasMes = computed(() =>
    Array.from({ length: this.diasEnMes() }, (_, i) => i + 1)
  );

  readonly esHoy = (dia: number): boolean =>
    dia === this._today.getDate() &&
    this.mes() === this._today.getMonth() &&
    this.anyo() === this._today.getFullYear();

  readonly esSeleccionado = (dia: number): boolean => {
    const sel = this.diaSeleccionado();
    return dia === sel.getDate() &&
      this.mes() === sel.getMonth() &&
      this.anyo() === sel.getFullYear();
  };

  readonly tieneEventos = (dia: number): boolean =>
    this.eventos().some(e =>
      e.fecha.getDate() === dia &&
      e.fecha.getMonth() === this.mes() &&
      e.fecha.getFullYear() === this.anyo()
    );

  seleccionarDia(dia: number): void {
    this.diaSeleccionadoChange.emit(new Date(this.anyo(), this.mes(), dia));
  }

  irAlMesAnterior(): void {
    if (this.mes() === 0) { this.mes.set(11); this.anyo.update(a => a - 1); }
    else { this.mes.update(m => m - 1); }
    this.mesVisibleChange.emit({ anyo: this.anyo(), mes: this.mes() });
  }

  irAlMesSiguiente(): void {
    if (this.mes() === 11) { this.mes.set(0); this.anyo.update(a => a + 1); }
    else { this.mes.update(m => m + 1); }
    this.mesVisibleChange.emit({ anyo: this.anyo(), mes: this.mes() });
  }
}
