import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, retry, shareReplay, tap } from 'rxjs';
import { Evento, RecurrenceType } from '../model/evento.model';
import { environment } from '../../environments/environment';
import { Note } from './notes.service';
import { TodoItem } from './todo.service';

export interface LinkedItems {
  notas: Note[];
  todos: TodoItem[];
}

interface CalendarEventResponse {
  _id: string;
  title: string;
  date: string;
  notes?: string;
  endDate?: string;
  location?: string;
  allDay?: boolean;
  color?: string;
  recurrenceType?: RecurrenceType;
  recurrenceEnd?: string;
}

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/events/calendar`;

  private readonly _eventos = signal<Evento[]>([]);
  private _loaded = false;
  private _inflight$: Observable<Evento[]> | null = null;
  readonly eventos = this._eventos.asReadonly();
  readonly loading = signal(false);

  loadEventos(): Observable<Evento[]> {
    if (this._loaded) return of(this._eventos());
    if (this._inflight$) return this._inflight$;

    this.loading.set(true);
    this._inflight$ = this.http.get<CalendarEventResponse[]>(this.base).pipe(
      retry({ count: 3, delay: 1500 }),
      tap(data => {
        this._eventos.set(data.map(e => this.mapToEvento(e)));
        this._loaded = true;
      }),
      finalize(() => {
        this.loading.set(false);
        this._inflight$ = null;
      }),
      map(() => this._eventos()),
      catchError(() => { this._loaded = false; return of([]); }),
      shareReplay(1),
    );
    return this._inflight$;
  }

  addEvento(evento: Omit<Evento, 'id'>): void {
    const tempId = `temp-${Date.now()}`;
    this._eventos.update(evs => [...evs, { id: tempId, ...evento }]);

    const dto = {
      title: evento.titulo,
      date: this.buildISODate(evento.fecha, evento.hora),
      notes: evento.descripcion,
      recurrenceType: evento.recurrenceType ?? 'none',
      recurrenceEnd: evento.recurrenceEnd?.toISOString() ?? null,
    };

    this.http.post<CalendarEventResponse>(this.base, dto).subscribe({
      next: created => {
        this._eventos.update(evs =>
          evs.map(e => e.id === tempId ? this.mapToEvento(created) : e)
        );
      },
      error: () => {
        this._eventos.update(evs => evs.filter(e => e.id !== tempId));
      }
    });
  }

  updateEvento(id: string, data: Omit<Evento, 'id'>): void {
    this._eventos.update(evs => evs.map(e => e.id === id ? { id, ...data } : e));

    const dto = {
      title: data.titulo,
      date: this.buildISODate(data.fecha, data.hora),
      notes: data.descripcion,
      recurrenceType: data.recurrenceType ?? 'none',
      recurrenceEnd: data.recurrenceEnd?.toISOString() ?? null,
    };

    this.http.put<CalendarEventResponse>(`${this.base}/${id}`, dto).subscribe({
      next: updated => {
        this._eventos.update(evs => evs.map(e => e.id === id ? this.mapToEvento(updated) : e));
      },
      error: () => {
        this._loaded = false;
        this.loadEventos();
      }
    });
  }

  getLinkedItems(eventoId: string): Observable<LinkedItems> {
    return this.http.get<LinkedItems>(`${this.base}/${eventoId}/linked`);
  }

  linkItem(eventoId: string, tipo: 'nota' | 'todo', itemId: string): Observable<Note | TodoItem> {
    return this.http.patch<Note | TodoItem>(`${this.base}/${eventoId}/link`, { tipo, itemId });
  }

  unlinkItem(eventoId: string, tipo: 'nota' | 'todo', itemId: string): Observable<unknown> {
    return this.http.patch(`${this.base}/${eventoId}/unlink/${itemId}`, { tipo });
  }

  deleteEvento(id: string): void {
    this._eventos.update(evs => evs.filter(e => e.id !== id));
    this.http.delete(`${this.base}/${id}`).subscribe();
  }

  private mapToEvento(e: CalendarEventResponse): Evento {
    const fecha = new Date(e.date);
    console.log(`[mapToEvento] id=${e._id} title="${e.title}" date="${e.date}" fecha=${fecha} valid=${!isNaN(fecha.getTime())}`);
    const h = fecha.getHours();
    const m = fecha.getMinutes();
    const hora = (h !== 0 || m !== 0)
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      : undefined;

    return {
      id: e._id,
      titulo: e.title,
      descripcion: e.notes,
      fecha,
      hora,
      recurrenceType: e.recurrenceType ?? 'none',
      recurrenceEnd: e.recurrenceEnd ? new Date(e.recurrenceEnd) : undefined,
    };
  }

  private buildISODate(fecha: Date, hora?: string): string {
    if (hora) {
      const [h, min] = hora.split(':').map(Number);
      const d = new Date(fecha);
      d.setHours(h, min, 0, 0);
      return d.toISOString();
    }
    return fecha.toISOString();
  }
}
