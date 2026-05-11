import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Note {
  _id: string;
  titulo: string;
  contenido: string;
  categoria: string;
  eventoId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDto {
  titulo: string;
  contenido: string;
  categoria?: string;
  eventoId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notas`;

  private readonly _notes = signal<Note[]>([]);
  readonly notes = this._notes.asReadonly();

  getNotes(): Observable<Note[]> {
    return this.http.get<Note[]>(this.base).pipe(
      tap(data => this._notes.set(data))
    );
  }

  getNote(id: string): Observable<Note> {
    return this.http.get<Note>(`${this.base}/${id}`);
  }

  createNote(dto: NoteDto): Observable<Note> {
    return this.http.post<Note>(this.base, dto).pipe(
      tap(note => this._notes.update(notes => [note, ...notes]))
    );
  }

  updateNote(id: string, dto: Partial<NoteDto>): Observable<Note> {
    return this.http.put<Note>(`${this.base}/${id}`, dto).pipe(
      tap(updated => this._notes.update(notes => notes.map(n => n._id === id ? updated : n)))
    );
  }

  deleteNote(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`).pipe(
      tap(() => this._notes.update(notes => notes.filter(n => n._id !== id)))
    );
  }
}
