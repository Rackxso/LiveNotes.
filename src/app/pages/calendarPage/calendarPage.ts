import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from '../../components/header/header';
import { MonthView } from '../../components/month-view/month-view';
import { WeekView } from '../../components/week-view/week-view';
import { DayView } from '../../components/day-view/day-view';
import { Eventos } from '../../components/eventos/eventos';
import { EventosService } from '../../services/eventos.service';
import { Evento } from '../../model/evento.model';
import { AddEventModal } from '../../components/commons/add-event-modal/add-event-modal';
import { EventDetailModal } from '../../components/commons/event-detail-modal/event-detail-modal';
import { I18nService } from '../../services/i18n.service';
import { TourService } from '../../services/tour.service';

@Component({
  selector: 'app-calendar-page',
  imports: [Header, MonthView, WeekView, DayView, AddEventModal, Eventos, EventDetailModal],
  templateUrl: './calendarPage.html',
  styleUrl: './calendarPage.css',
})
export class CalendarPage {
  private readonly eventosService = inject(EventosService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly tourService = inject(TourService);
  readonly t = this.i18n.t;

  // Clave interna de vista (invariante al idioma, usada para routing)
  public vistaActual = signal<string>('Month');

  // Vistas traducidas para mostrar en el selector
  public vistasPage = computed<string[]>(() => [
    this.t()('calendar.views.month'),
    this.t()('calendar.views.week'),
    this.t()('calendar.views.day'),
  ]);

  readonly vistasIconos = ['fa-solid fa-calendar', 'fa-solid fa-calendar-week', 'fa-solid fa-calendar-day'];

  // Vista activa traducida para que el Selector la marque correctamente
  public vistaActivaTraducida = computed(() => {
    const map: Record<string, string> = {
      Month: 'calendar.views.month',
      Week: 'calendar.views.week',
      Day: 'calendar.views.day',
    };
    return this.t()(map[this.vistaActual()] ?? 'calendar.views.month');
  });

  public nombreVista = computed(() => this.t()('calendar.pageTitle'));

  constructor() {
    this.eventosService.loadEventos();
    this.route.url.subscribe(segments => {
      const lastIndex = segments.length - 1;
      const view = lastIndex >= 0 ? segments[lastIndex].path : undefined;
      this.vistaActual.set(this.urlViewToKey(view));
    });
    effect(() => {
      const stepId = this.tourService.currentStepId();
      if (stepId === 'calendar-sheet' || stepId === 'calendar-eventos') {
        this.bottomSheetAbierto.set(true);
      }
    }, { allowSignalWrites: true });
  }

  private urlViewToKey(view: string | undefined): string {
    switch (view) {
      case 'week': return 'Week';
      case 'day':  return 'Day';
      default:     return 'Month';
    }
  }

  // Día seleccionado (por defecto hoy)
  public diaSeleccionado = signal<Date>(new Date());

  // Mes visible en el MonthView (se actualiza al navegar entre meses)
  private readonly _today = new Date();
  readonly mesVisible = signal({ anyo: this._today.getFullYear(), mes: this._today.getMonth() });

  private readonly diaSeleccionadoFecha = computed(() => {
    const sel = this.diaSeleccionado();
    const d = new Date(sel);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  readonly eventos = this.eventosService.eventos;

  readonly eventosDia = computed(() => {
    const sel  = this.diaSeleccionado();
    return this.eventos().filter(e =>
      e.fecha.getDate()     === sel.getDate()     &&
      e.fecha.getMonth()    === sel.getMonth()    &&
      e.fecha.getFullYear() === sel.getFullYear()
    );
  });

  private readonly semana = computed(() => {
    const sel   = this.diaSeleccionado();
    const inicio = new Date(sel);
    inicio.setDate(sel.getDate() - sel.getDay());
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  });

  readonly eventosSemana = computed(() => {
    const { inicio, fin } = this.semana();
    const cutoff = this.diaSeleccionadoFecha();
    const sel    = this.diaSeleccionado();
    return this.eventos().filter(e => {
      const fecha = new Date(e.fecha);
      fecha.setHours(0, 0, 0, 0);
      const enSemana = e.fecha >= inicio && e.fecha <= fin;
      const esDia    = e.fecha.getDate()     === sel.getDate()     &&
                       e.fecha.getMonth()    === sel.getMonth()    &&
                       e.fecha.getFullYear() === sel.getFullYear();
      return fecha > cutoff && enSemana && !esDia;
    });
  });

  readonly eventosMes = computed(() => {
    const { anyo, mes }   = this.mesVisible();
    const { inicio, fin } = this.semana();
    const cutoff = this.diaSeleccionadoFecha();
    return this.eventos()
      .filter(e => {
        const fecha = new Date(e.fecha);
        fecha.setHours(0, 0, 0, 0);
        return fecha > cutoff &&
               e.fecha.getFullYear() === anyo &&
               e.fecha.getMonth()    === mes  &&
               !(e.fecha >= inicio && e.fecha <= fin);
      })
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  });

  onVistaSeleccionada(label: string): void {
    // Mapear la etiqueta traducida de vuelta a la clave interna
    const reverse: Record<string, string> = {
      [this.t()('calendar.views.month')]: 'Month',
      [this.t()('calendar.views.week')]:  'Week',
      [this.t()('calendar.views.day')]:   'Day',
    };
    const key = reverse[label] ?? 'Month';
    this.vistaActual.set(key);

    const view = key.toLowerCase();
    if (view === 'month' || view === 'week' || view === 'day') {
      queueMicrotask(() => {
        const urlSegments = this.route.snapshot.url;
        const lastIndex = urlSegments.length - 1;
        const currentView = lastIndex >= 0 ? urlSegments[lastIndex].path : undefined;
        if (currentView !== view) {
          this.router.navigate(['/calendar', view]);
        }
      });
    }
  }

  readonly bottomSheetAbierto = signal(false);

  toggleBottomSheet(): void {
    this.bottomSheetAbierto.update(v => !v);
  }

  public modalAbierto = signal<boolean>(false);
  public fechaModal = signal<Date | null>(null);

  readonly eventoSeleccionado = signal<Evento | null>(null);
  readonly eventoParaEditar = signal<Evento | null>(null);

  abrirDetalleEvento(ev: Evento): void { this.eventoSeleccionado.set(ev); }
  cerrarDetalleEvento(): void { this.eventoSeleccionado.set(null); }

  abrirEdicionEvento(ev: Evento): void {
    this.eventoSeleccionado.set(null);
    this.eventoParaEditar.set(ev);
  }

  abrirModalDia(): void {
    this.fechaModal.set(this.diaSeleccionado());
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.eventoParaEditar.set(null);
  }

  onGuardarEvento(evento: Omit<Evento, 'id'>): void {
    this.eventosService.addEvento(evento);
    this.cerrarModal();
  }

  onActualizarEvento(evento: Evento): void {
    this.eventosService.updateEvento(evento.id, evento);
    this.cerrarModal();
  }

  onDiaSeleccionado(fecha: Date): void {
    this.diaSeleccionado.set(fecha);
    if (this.vistaActual() === 'Month') {
      this.bottomSheetAbierto.set(true);
    }
  }

  onMesVisibleChange(val: { anyo: number; mes: number }): void {
    this.mesVisible.set(val);
  }
}
