import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, Observable, of, retry, tap } from 'rxjs';
import { Evento } from '../model/evento.model';
import { environment } from '../../environments/environment';

interface CalendarEventResponse {
  _id: string;
  title: string;
  date: string;
  notes?: string;
  endDate?: string;
  location?: string;
  allDay?: boolean;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class EventosService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/events/calendar`;

  private readonly _eventos = signal<Evento[]>([]);
  private _loaded = false;
  readonly eventos = this._eventos.asReadonly();
  readonly loading = signal(false);

  loadEventos(): Observable<Evento[]> {
    if (this._loaded) return of(this._eventos());
    this._loaded = true;
    this.loading.set(true);
    return this.http.get<CalendarEventResponse[]>(this.base).pipe(
      retry({ count: 3, delay: 1500 }),
      tap(data => this._eventos.set(data.map(e => this.mapToEvento(e)))),
      finalize(() => this.loading.set(false)),
      map(() => this._eventos()),
      catchError(() => { this._loaded = false; return of([]); })
    );
  }

  addEvento(evento: Omit<Evento, 'id'>): void {
    const tempId = `temp-${Date.now()}`;
    this._eventos.update(evs => [...evs, { id: tempId, ...evento }]);

    const dto = {
      title: evento.titulo,
      date: this.buildISODate(evento.fecha, evento.hora),
      notes: evento.descripcion,
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

  deleteEvento(id: string): void {
    this._eventos.update(evs => evs.filter(e => e.id !== id));
    this.http.delete(`${this.base}/${id}`).subscribe();
  }

  private mapToEvento(e: CalendarEventResponse): Evento {
    const fecha = new Date(e.date);
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
