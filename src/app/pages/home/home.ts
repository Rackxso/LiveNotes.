import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { AuthService } from '../../services/auth.service';
import { EventosService } from '../../services/eventos.service';
import { FinanceService } from '../../services/finance.service';
import { HabitsService, Habit } from '../../services/habits.service';
import { Note } from '../../services/notes.service';
import { GoalProgress } from '../../components/commons/goal-progress/goal-progress';
import { ToDo } from '../../components/to-do/to-do';
import { TextNotes } from '../../components/text-notes/text-notes';
import { AddNoteModal } from '../../components/commons/add-note-modal/add-note-modal';
import { EventDetailModal } from '../../components/commons/event-detail-modal/event-detail-modal';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DecimalPipe, GoalProgress, ToDo, TextNotes, AddNoteModal, EventDetailModal],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly i18n           = inject(I18nService);
  private readonly auth           = inject(AuthService);
  private readonly eventosService = inject(EventosService);
  private readonly financeService = inject(FinanceService);
  private readonly habitsService  = inject(HabitsService);
  readonly t = this.i18n.t;

  private readonly _today = new Date();

  readonly diaSeleccionado = signal<Date>(new Date());

  readonly userName                = computed(() => this.auth.user()?.name ?? '');
  readonly requiresPasswordUpdate  = this.auth.requiresPasswordUpdate;
  readonly eventos                 = this.eventosService.eventos;
  readonly isLoading               = computed(() =>
    this.eventosService.loading() || this.financeService.loading()
  );

  constructor() {
    this.eventosService.loadEventos().subscribe();
    this.financeService.loadTransactions().subscribe();
    this.financeService.loadSavingsGoals().subscribe();
    this.habitsService.getHabits().subscribe();
  }

  readonly fechaHoy = computed(() =>
    this._today.toLocaleDateString(this.i18n.locale(), {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  );

  readonly eventosHoy = computed(() => {
    const t = this._today;
    return this.eventos().filter(e =>
      e.fecha.getDate()     === t.getDate()     &&
      e.fecha.getMonth()    === t.getMonth()    &&
      e.fecha.getFullYear() === t.getFullYear()
    );
  });

  // ── Q2: Strip semanal ────────────────────────────────

  readonly diasSemana = computed(() => {
    const sel    = this.diaSeleccionado();
    const locale = this.i18n.locale();
    const dow    = sel.getDay(); // 0=Dom
    // Offset para que el lunes sea el primer día
    const offset = dow === 0 ? -6 : 1 - dow;
    const lunes  = new Date(sel);
    lunes.setDate(sel.getDate() + offset);
    lunes.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return {
        fecha:  d,
        nombre: d.toLocaleDateString(locale, { weekday: 'short' })
                  .replace('.', '')
                  .slice(0, 3),
      };
    });
  });

  readonly semanaLabel = computed(() => {
    const dias   = this.diasSemana();
    const inicio = dias[0].fecha;
    const fin    = dias[6].fecha;
    const locale = this.i18n.locale();
    if (inicio.getMonth() === fin.getMonth()) {
      return `${inicio.getDate()} – ${fin.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}`;
    }
    return `${inicio.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${fin.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}`;
  });

  readonly eventosDiaSeleccionado = computed(() => {
    const sel = this.diaSeleccionado();
    return this.eventos().filter(e =>
      e.fecha.getDate()     === sel.getDate()     &&
      e.fecha.getMonth()    === sel.getMonth()    &&
      e.fecha.getFullYear() === sel.getFullYear()
    );
  });

  readonly proximosEventos = computed(() => {
    const sel = this.diaSeleccionado();
    const siguienteDia = new Date(
      sel.getFullYear(),
      sel.getMonth(),
      sel.getDate() + 1
    );
    return this.eventos()
      .filter(e => e.fecha >= siguienteDia)
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .slice(0, 4);
  });

  formatUpcomingDate(fecha: Date): string {
    return fecha.toLocaleDateString(this.i18n.locale(), {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  }

  readonly esDiaHoy = (fecha: Date): boolean => {
    const t = this._today;
    return fecha.getDate()     === t.getDate()     &&
           fecha.getMonth()    === t.getMonth()    &&
           fecha.getFullYear() === t.getFullYear();
  };

  readonly esDiaSeleccionado = (fecha: Date): boolean => {
    const sel = this.diaSeleccionado();
    return fecha.getDate()     === sel.getDate()     &&
           fecha.getMonth()    === sel.getMonth()    &&
           fecha.getFullYear() === sel.getFullYear();
  };

  readonly tieneEventosDia = (fecha: Date): boolean =>
    this.eventos().some(e =>
      e.fecha.getDate()     === fecha.getDate()     &&
      e.fecha.getMonth()    === fecha.getMonth()    &&
      e.fecha.getFullYear() === fecha.getFullYear()
    );

  irSemanaAnterior(): void {
    this.diaSeleccionado.update(d => {
      const nd = new Date(d);
      nd.setDate(d.getDate() - 7);
      return nd;
    });
  }

  irSemanaSiguiente(): void {
    this.diaSeleccionado.update(d => {
      const nd = new Date(d);
      nd.setDate(d.getDate() + 7);
      return nd;
    });
  }

  // ── Finanzas ─────────────────────────────────────────

  readonly currentMonthStats = computed(() => {
    const label = this._today.toLocaleString('en-US', { month: 'short' });
    return this.financeService.monthlyStats().find(s => s.month === label) ?? null;
  });

  readonly totalSaved         = this.financeService.totalSaved;

  readonly recentTransactions = computed(() =>
    this.financeService.transactions().slice(0, 3)
  );

  readonly hasMoreTransactions = computed(() =>
    this.financeService.transactions().length > 3
  );

  // ── Evento detalle ────────────────────────────────────

  readonly eventoSeleccionado = signal<import('../../model/evento.model').Evento | null>(null);

  abrirEventoModal(ev: import('../../model/evento.model').Evento): void { this.eventoSeleccionado.set(ev); }
  cerrarEventoModal(): void { this.eventoSeleccionado.set(null); }

  // ── Notas ─────────────────────────────────────────────

  readonly showAddNoteModal = signal(false);
  readonly editingNote = signal<Note | null>(null);

  openAddNoteModal(): void  { this.editingNote.set(null); this.showAddNoteModal.set(true); }
  closeAddNoteModal(): void { this.showAddNoteModal.set(false); this.editingNote.set(null); }
  openEditNoteModal(note: Note): void { this.editingNote.set(note); this.showAddNoteModal.set(true); }

  onDiaSeleccionado(fecha: Date): void { this.diaSeleccionado.set(fecha); }

  // ── Hábitos (Q1) ──────────────────────────────────────

  readonly habits = this.habitsService.habits;

  isDoneToday(habit: Habit): boolean {
    if (!habit.ultimoHecho) return false;
    const last = new Date(habit.ultimoHecho);
    const t = this._today;
    return last.getFullYear() === t.getFullYear() &&
           last.getMonth()    === t.getMonth()    &&
           last.getDate()     === t.getDate();
  }

  markHabit(id: string): void {
    this.habitsService.markHabit(id).subscribe();
  }
}
