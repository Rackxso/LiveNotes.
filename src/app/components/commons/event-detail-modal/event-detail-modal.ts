import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Evento } from '../../../model/evento.model';
import { I18nService } from '../../../services/i18n.service';
import { EventosService, LinkedItems } from '../../../services/eventos.service';
import { Note } from '../../../services/notes.service';
import { TodoItem } from '../../../services/todo.service';

@Component({
  selector: 'app-event-detail-modal',
  imports: [RouterLink],
  templateUrl: './event-detail-modal.html',
  styleUrl: './event-detail-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventDetailModal {
  private readonly i18n = inject(I18nService);
  private readonly eventosService = inject(EventosService);
  private readonly router = inject(Router);

  readonly evento = input.required<Evento>();
  readonly mostrarEnlaceCalendario = input(true);
  readonly mostrarBotonEditar = input(false);
  readonly cerrar = output<void>();
  readonly editar = output<void>();
  readonly eliminar = output<void>();

  readonly linkedNotas = signal<Note[]>([]);
  readonly linkedTodos = signal<TodoItem[]>([]);

  constructor() {
    effect(() => {
      const ev = this.evento();
      this.linkedNotas.set([]);
      this.linkedTodos.set([]);
      this.eventosService.getLinkedItems(ev.id).subscribe((items: LinkedItems) => {
        this.linkedNotas.set(items.notas);
        this.linkedTodos.set(items.todos);
      });
    });
  }

  navigateToNota(nota: Note): void {
    this.cerrar.emit();
    this.router.navigate(['/notes'], { queryParams: { noteId: nota._id } });
  }

  navigateToTodo(todo: TodoItem): void {
    this.cerrar.emit();
    this.router.navigate(['/notes'], { queryParams: { todoList: todo.idLista } });
  }

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

  onEliminar(): void {
    this.eliminar.emit();
  }
}
