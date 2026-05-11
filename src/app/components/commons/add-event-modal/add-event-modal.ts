import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Evento, RecurrenceType } from '../../../model/evento.model';
import { I18nService } from '../../../services/i18n.service';
import { NotesService, Note } from '../../../services/notes.service';
import { TodoService, TodoItem } from '../../../services/todo.service';
import { EventosService } from '../../../services/eventos.service';
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
  private readonly notesService = inject(NotesService);
  private readonly todoService = inject(TodoService);
  private readonly eventosService = inject(EventosService);
  private readonly router = inject(Router);
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

  readonly linkedNotas = signal<Note[]>([]);
  selectedNotaId = '';

  readonly availableNotas = computed(() => {
    const linked = new Set(this.linkedNotas().map(n => n._id));
    return this.notesService.notes().filter(n => !linked.has(n._id));
  });

  private readonly _linkedTodos = signal<TodoItem[]>([]);
  selectedTodoList = '';

  readonly linkedTodoLists = computed(() =>
    [...new Set(this._linkedTodos().map(t => t.idLista).filter((l): l is string => !!l))]
  );

  readonly availableTodoLists = computed(() => {
    const linked = new Set(this.linkedTodoLists());
    return [...new Set(this.todoService.todos().map(t => t.idLista).filter((l): l is string => !!l))]
      .filter(l => !linked.has(l));
  });

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

      if (this.notesService.notes().length === 0) {
        this.notesService.getNotes().subscribe();
      }
      if (this.todoService.todos().length === 0) {
        this.todoService.getTodos().subscribe();
      }
      this.eventosService.getLinkedItems(ev.id).subscribe(items => {
        this.linkedNotas.set(items.notas);
        this._linkedTodos.set(items.todos);
      });
    } else {
      const f = this.fechaInicial();
      if (f) this.fecha = this.dateToInputValue(f);
    }
  }

  linkNota(): void {
    const ev = this.eventoEditar();
    if (!this.selectedNotaId || !ev) return;
    this.eventosService.linkItem(ev.id, 'nota', this.selectedNotaId).subscribe({
      next: nota => {
        this.linkedNotas.update(ns => [...ns, nota as Note]);
        this.selectedNotaId = '';
      },
    });
  }

  unlinkNota(notaId: string): void {
    const ev = this.eventoEditar();
    if (!ev) return;
    this.eventosService.unlinkItem(ev.id, 'nota', notaId).subscribe({
      next: () => this.linkedNotas.update(ns => ns.filter(n => n._id !== notaId)),
    });
  }

  linkTodoList(): void {
    const ev = this.eventoEditar();
    if (!this.selectedTodoList || !ev) return;
    const todos = this.todoService.todos().filter(t => t.idLista === this.selectedTodoList);
    todos.forEach(t => this.todoService.updateTodo(t._id, { eventoId: ev.id }).subscribe());
    this._linkedTodos.update(existing => [...existing, ...todos]);
    this.selectedTodoList = '';
  }

  unlinkTodoList(listName: string): void {
    const todosToUnlink = this._linkedTodos().filter(t => t.idLista === listName);
    todosToUnlink.forEach(t => this.todoService.updateTodo(t._id, { eventoId: null }).subscribe());
    this._linkedTodos.update(ts => ts.filter(t => t.idLista !== listName));
  }

  navigateToNota(nota: Note): void {
    this.cerrar.emit();
    this.router.navigate(['/notes'], { queryParams: { noteId: nota._id } });
  }

  navigateToTodo(listName: string): void {
    this.cerrar.emit();
    this.router.navigate(['/notes'], { queryParams: { todoList: listName } });
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
    this.linkedNotas.set([]);
    this.selectedNotaId = '';
    this._linkedTodos.set([]);
    this.selectedTodoList = '';
    this.cerrar.emit();
  }
}
