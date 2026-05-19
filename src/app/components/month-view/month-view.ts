import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Evento } from '../../model/evento.model';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-month-view',
  imports: [],
  templateUrl: './month-view.html',
  styleUrl: './month-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthView {
  private readonly i18n = inject(I18nService);
  readonly t = this.i18n.t;

  private readonly today = new Date();

  // Inputs
  readonly eventos = input<Evento[]>([]);
  readonly diaSeleccionado = input<Date>(new Date());

  // Outputs
  readonly diaSeleccionadoChange = output<Date>();
  readonly mesVisibleChange      = output<{ anyo: number; mes: number }>();
  readonly eventoSeleccionado    = output<Evento>();

  readonly anyo = signal<number>(this.today.getFullYear());
  readonly mes = signal<number>(this.today.getMonth());

  /** Días de la semana localizados (Lun/Mon, …, Dom/Sun) */
  readonly diasSemana = computed<string[]>(() => {
    const locale = this.i18n.locale();
    const base = new Date(2006, 0, 2); // 2 ene 2006 era lunes
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: 'short' });
    });
  });

  readonly nombreMes = computed(() =>
    new Date(this.anyo(), this.mes(), 1).toLocaleString(this.i18n.locale(), { month: 'long' })
  );

  readonly filas = computed(() => {
    const totalCeldas = this.celdasVacias().length + this.diasMes().length;
    return Math.ceil(totalCeldas / 7);
  });

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
    dia === this.today.getDate() &&
    this.mes() === this.today.getMonth() &&
    this.anyo() === this.today.getFullYear();

  readonly esSeleccionado = (dia: number): boolean => {
    const sel = this.diaSeleccionado();
    return dia === sel.getDate() &&
      this.mes() === sel.getMonth() &&
      this.anyo() === sel.getFullYear();
  };

  readonly eventosPorDia = computed(() => {
    const evs = this.eventos();
    const m   = this.mes();
    const a   = this.anyo();
    const map = new Map<number, Evento[]>();
    for (const e of evs) {
      if (e.fecha.getMonth() === m && e.fecha.getFullYear() === a) {
        const d = e.fecha.getDate();
        const list = map.get(d) ?? [];
        list.push(e);
        map.set(d, list);
      }
    }
    return map;
  });

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

  irAHoy(): void {
    this.mes.set(this.today.getMonth());
    this.anyo.set(this.today.getFullYear());
  }
}
