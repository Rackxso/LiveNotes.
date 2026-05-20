import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TodoService, TodoItem, SubItem } from '../../services/todo.service';
import { EventosService } from '../../services/eventos.service';
import { I18nService } from '../../services/i18n.service';
import { TaskSortView } from './task-sort-view/task-sort-view';

@Component({
  selector: 'app-to-do',
  imports: [TaskSortView, FormsModule],
  templateUrl: './to-do.html',
  styleUrl: './to-do.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToDo implements OnInit {
  private readonly todoService = inject(TodoService);
  private readonly eventosService = inject(EventosService);
  private readonly i18n = inject(I18nService);
  readonly t = this.i18n.t;

  readonly searchQuery = input<string>('');
  readonly initialList = input<string>('');
  readonly selectedList = signal<string>('all');
  readonly newTaskText = signal<string>('');
  readonly addingList = signal<boolean>(false);
  readonly newListName = signal<string>('');
  readonly pendingDeleteList = signal<string | null>(null);
  readonly draggedId = signal<string | null>(null);
  readonly localItemOrder = signal<string[]>([]);
  readonly draggedSubId = signal<string | null>(null);
  readonly draggedSubTodoId = signal<string | null>(null);
  readonly localSubOrders = signal<Record<string, string[]>>({});
  readonly hoveredItemId = signal<string | null>(null);
  readonly focusedInlineSubId = signal<string | null>(null);
  readonly inlineSubTexts = signal<Record<string, string>>({});
  readonly editingItemId = signal<string | null>(null);
  readonly editingSubKey = signal<{ todoId: string; subId: string } | null>(null);
  readonly editingText = signal<string>('');
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  readonly todos = this.todoService.todos;

  private readonly _customLists = signal<string[]>(
    JSON.parse(localStorage.getItem('ln_todo_lists') ?? '[]')
  );

  readonly sortedEventos = computed(() =>
    [...this.eventosService.eventos()].sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
  );

  readonly currentListEventoId = computed(() => {
    const list = this.selectedList();
    if (list === 'all') return '';
    const inList = this.todos().filter(t => t.idLista === list);
    if (inList.length === 0) return '';
    const first = inList[0].eventoId ?? '';
    return inList.every(t => (t.eventoId ?? '') === first) ? first : '';
  });

  readonly sortViewOpen = signal(false);
  readonly canOpenSortView = computed(() => this.selectedList() !== 'all');
  readonly sortViewTasks = computed(() =>
    this.displayTodos().filter(t => !t.completado)
  );
  readonly algoritmosPorLista = signal<Record<string, string>>({});
  readonly algoritmoActual = computed(() => this.algoritmosPorLista()[this.selectedList()] ?? null);

  onAlgoritmoAplicado(nombre: string): void {
    this.algoritmosPorLista.update(m => ({ ...m, [this.selectedList()]: nombre }));
  }

  readonly draggedListName = signal<string | null>(null);

  constructor() {
    effect(() => {
      const list = this.initialList();
      if (list) this.selectedList.set(list);
    });
  }

  ngOnInit(): void {
    this.eventosService.loadEventos().subscribe();
    this.todoService.getTodos().subscribe(todos => {
      const fromTodos = [...new Set(todos.map(t => t.idLista).filter(l => l !== ''))];
      this._customLists.update(existing => {
        const newLists = fromTodos.filter(l => !existing.includes(l));
        if (newLists.length === 0) return existing;
        const updated = [...existing, ...newLists];
        localStorage.setItem('ln_todo_lists', JSON.stringify(updated));
        return updated;
      });
    });
  }

  readonly lists = computed(() => this._customLists());

  readonly filteredTodos = computed(() => {
    let items = this.todos();
    const list = this.selectedList();
    if (list !== 'all') {
      items = items.filter(t => t.idLista === list);
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      items = items.filter(t => t.texto.toLowerCase().includes(q));
    }
    return items;
  });

  readonly displayTodos = computed(() => {
    const order = this.localItemOrder();
    const todos = this.filteredTodos();
    if (order.length === 0) return todos;
    const map = new Map(todos.map(t => [t._id, t]));
    const orderedSet = new Set(order);
    const ordered = order.map(id => map.get(id)).filter((t): t is TodoItem => !!t);
    const extra = todos.filter(t => !orderedSet.has(t._id));
    return [...ordered, ...extra];
  });

  toggle(id: string): void {
    const todo = this.todos().find(t => t._id === id);
    if (!todo) return;
    this.todoService.updateTodo(id, { completado: !todo.completado }).subscribe();
  }

  toggleSubItem(todoId: string, subId: string): void {
    const todo = this.todos().find(t => t._id === todoId);
    const sub = todo?.subItems.find(s => s._id === subId);
    if (!sub) return;
    this.todoService.updateSubItem(todoId, subId, { completado: !sub.completado }).subscribe();
  }

  addTask(): void {
    const text = this.newTaskText().trim();
    if (!text) return;
    const list = this.selectedList() === 'all' ? '' : this.selectedList();
    this.todoService.createTodo({ idLista: list, texto: text }).subscribe();
    this.newTaskText.set('');
  }

  onQuickAddKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.addTask();
    }
  }

  deleteTask(id: string): void {
    this.todoService.deleteTodo(id).subscribe();
  }

  deleteSubItem(todoId: string, subId: string): void {
    this.todoService.deleteSubItem(todoId, subId).subscribe();
  }

  selectList(list: string): void {
    this.selectedList.set(list);
    this.localItemOrder.set([]);
  }


  startAddingList(): void {
    this.addingList.set(true);
    this.newListName.set('');
  }

  confirmNewList(): void {
    const name = this.newListName().trim();
    if (name) {
      this._customLists.update(lists => {
        if (lists.includes(name)) return lists;
        const updated = [...lists, name];
        localStorage.setItem('ln_todo_lists', JSON.stringify(updated));
        return updated;
      });
      this.selectList(name);
    }
    this.addingList.set(false);
  }

  cancelNewList(): void {
    this.addingList.set(false);
  }

  requestDeleteList(list: string, event: Event): void {
    event.stopPropagation();
    this.pendingDeleteList.set(list);
  }

  confirmDeleteWithItems(): void {
    const list = this.pendingDeleteList();
    if (!list) return;
    this.todoService.deleteByList(list).subscribe(() => {
      if (this.selectedList() === list) this.selectedList.set('all');
    });
    this.removeCustomList(list);
    this.pendingDeleteList.set(null);
  }

  confirmDeleteKeepItems(): void {
    const list = this.pendingDeleteList();
    if (!list) return;
    this.todoService.reassignList(list).subscribe(() => {
      if (this.selectedList() === list) this.selectedList.set('all');
    });
    this.removeCustomList(list);
    this.pendingDeleteList.set(null);
  }

  private removeCustomList(name: string): void {
    this._customLists.update(lists => {
      const updated = lists.filter(l => l !== name);
      localStorage.setItem('ln_todo_lists', JSON.stringify(updated));
      return updated;
    });
  }

  cancelDeleteList(): void {
    this.pendingDeleteList.set(null);
  }

  onListDragStart(event: DragEvent, name: string): void {
    this.draggedListName.set(name);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onListDragOver(event: DragEvent, targetName: string): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const source = this.draggedListName();
    if (!source || source === targetName) return;
    this._customLists.update(lists => {
      const updated = [...lists];
      const fromIdx = updated.indexOf(source);
      const toIdx = updated.indexOf(targetName);
      if (fromIdx === -1 || toIdx === -1) return lists;
      updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, source);
      return updated;
    });
  }

  onListDrop(): void {
    localStorage.setItem('ln_todo_lists', JSON.stringify(this._customLists()));
    this.draggedListName.set(null);
  }

  onListDragEnd(): void {
    this.draggedListName.set(null);
  }

  onDragStart(event: DragEvent, id: string): void {
    this.draggedId.set(id);
    if (this.localItemOrder().length === 0) {
      this.localItemOrder.set(this.displayTodos().map(t => t._id));
    }
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, targetId: string): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const sourceId = this.draggedId();
    if (!sourceId || sourceId === targetId) return;
    const order = [...this.localItemOrder()];
    const fromIdx = order.indexOf(sourceId);
    const toIdx = order.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    order.splice(fromIdx, 1);
    order.splice(toIdx, 0, sourceId);
    this.localItemOrder.set(order);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const order = this.localItemOrder();
    if (order.length === 0) { this.draggedId.set(null); return; }
    const items = order.map((id, idx) => ({ _id: id, order: idx }));
    this.todoService.reorderTodos(items).subscribe();
    this.draggedId.set(null);
  }

  onDragEnd(): void {
    this.draggedId.set(null);
  }

  displaySubItems(todoId: string, subItems: SubItem[]): SubItem[] {
    const localOrder = this.localSubOrders()[todoId];
    if (localOrder && localOrder.length > 0) {
      const map = new Map(subItems.map(s => [s._id, s]));
      const orderedSet = new Set(localOrder);
      const ordered = localOrder.map(id => map.get(id)).filter((s): s is SubItem => !!s);
      const extra = subItems.filter(s => !orderedSet.has(s._id));
      return [...ordered, ...extra];
    }
    return [...subItems].sort((a, b) => a.order - b.order);
  }

  onSubDragStart(event: DragEvent, todoId: string, subId: string): void {
    event.stopPropagation();
    this.draggedSubId.set(subId);
    this.draggedSubTodoId.set(todoId);
    const currentOrder = this.localSubOrders()[todoId];
    if (!currentOrder || currentOrder.length === 0) {
      const todo = this.todos().find(t => t._id === todoId);
      if (todo) {
        const ids = this.displaySubItems(todoId, todo.subItems).map(s => s._id);
        this.localSubOrders.update(m => ({ ...m, [todoId]: ids }));
      }
    }
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onSubDragOver(event: DragEvent, todoId: string, targetSubId: string): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const sourceId = this.draggedSubId();
    if (!sourceId || sourceId === targetSubId || this.draggedSubTodoId() !== todoId) return;
    const order = [...(this.localSubOrders()[todoId] ?? [])];
    const fromIdx = order.indexOf(sourceId);
    const toIdx = order.indexOf(targetSubId);
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    order.splice(fromIdx, 1);
    order.splice(toIdx, 0, sourceId);
    this.localSubOrders.update(m => ({ ...m, [todoId]: order }));
  }

  onSubDrop(event: DragEvent, todoId: string): void {
    event.preventDefault();
    event.stopPropagation();
    const order = this.localSubOrders()[todoId];
    if (!order || order.length === 0) { this.draggedSubId.set(null); return; }
    const items = order.map((id, idx) => ({ _id: id, order: idx }));
    this.todoService.reorderSubItems(todoId, items).subscribe();
    this.draggedSubId.set(null);
    this.draggedSubTodoId.set(null);
  }

  onSubDragEnd(): void {
    this.draggedSubId.set(null);
    this.draggedSubTodoId.set(null);
  }

  showInlineAdd(itemId: string): boolean {
    return this.hoveredItemId() === itemId || this.focusedInlineSubId() === itemId;
  }

  onItemMouseLeave(itemId: string): void {
    if (this.hoveredItemId() === itemId) this.hoveredItemId.set(null);
  }

  addInlineSubItem(todoId: string): void {
    const text = (this.inlineSubTexts()[todoId] ?? '').trim();
    if (!text) return;
    this.todoService.createSubItem(todoId, { texto: text }).subscribe();
    this.inlineSubTexts.update(m => ({ ...m, [todoId]: '' }));
  }

  onInlineSubKeydown(event: KeyboardEvent, todoId: string): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addInlineSubItem(todoId);
    } else if (event.key === 'Escape') {
      this.inlineSubTexts.update(m => ({ ...m, [todoId]: '' }));
      this.focusedInlineSubId.set(null);
      (event.target as HTMLElement).blur();
    }
  }

  getInlineSubText(todoId: string): string {
    return this.inlineSubTexts()[todoId] ?? '';
  }

  setInlineSubText(todoId: string, value: string): void {
    this.inlineSubTexts.update(m => ({ ...m, [todoId]: value }));
  }

  startEditItem(item: TodoItem, event: Event): void {
    event.stopPropagation();
    this.editingSubKey.set(null);
    this.editingItemId.set(item._id);
    this.editingText.set(item.texto);
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('.todo-edit-input');
      input?.focus();
      input?.select();
    }, 0);
  }

  startEditSubItem(todoId: string, sub: SubItem, event: Event): void {
    event.stopPropagation();
    this.editingItemId.set(null);
    this.editingSubKey.set({ todoId, subId: sub._id });
    this.editingText.set(sub.texto);
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('.todo-edit-input');
      input?.focus();
      input?.select();
    }, 0);
  }

  commitEditItem(id: string): void {
    if (this.editingItemId() !== id) return;
    const text = this.editingText().trim();
    if (text && text !== this.todos().find(t => t._id === id)?.texto) {
      this.todoService.updateTodo(id, { texto: text }).subscribe();
    }
    this.editingItemId.set(null);
  }

  commitEditSubItem(todoId: string, subId: string): void {
    const key = this.editingSubKey();
    if (!key || key.subId !== subId) return;
    const text = this.editingText().trim();
    const current = this.todos().find(t => t._id === todoId)?.subItems.find(s => s._id === subId)?.texto;
    if (text && text !== current) {
      this.todoService.updateSubItem(todoId, subId, { texto: text }).subscribe();
    }
    this.editingSubKey.set(null);
  }

  cancelEdit(): void {
    this.editingItemId.set(null);
    this.editingSubKey.set(null);
  }

  onTextTouchStart(item: TodoItem, event: TouchEvent): void {
    event.stopPropagation();
    this.longPressTimer = setTimeout(() => {
      this.startEditItem(item, event);
    }, 500);
  }

  onSubTextTouchStart(todoId: string, sub: SubItem, event: TouchEvent): void {
    event.stopPropagation();
    this.longPressTimer = setTimeout(() => {
      this.startEditSubItem(todoId, sub, event);
    }, 500);
  }

  cancelLongPress(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  onEditKeydown(event: KeyboardEvent, commitFn: () => void): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitFn();
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }

  onListEventoChange(list: string, eventoId: string): void {
    const todos = this.todos().filter(t => t.idLista === list);
    todos.forEach(t => {
      this.todoService.updateTodo(t._id, { eventoId: eventoId || null }).subscribe();
    });
  }

  formatDate(fechaLimite: string | null): string {
    if (!fechaLimite) return '';
    const date = new Date(fechaLimite);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return this.t()('calendar.today');
    if (date.toDateString() === tomorrow.toDateString()) return this.t()('todo.tomorrow');
    return date.toLocaleDateString(this.i18n.locale(), { day: 'numeric', month: 'short' });
  }
}
