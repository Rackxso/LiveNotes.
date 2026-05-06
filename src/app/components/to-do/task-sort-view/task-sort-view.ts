import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { forkJoin } from 'rxjs';
import { TodoItem, TodoService } from '../../../services/todo.service';
import { I18nService } from '../../../services/i18n.service';
import { jumpingCat, balancedFlow, pilaScore, SortableTodo } from '../../../utils/sort-algorithms';

const PILA_BADGE_CLASS: Record<number, string> = {
  0: 'badge-critica',
  1: 'badge-alta',
  2: 'badge-media',
  3: 'badge-baja',
};

const IMP_CHIP_CLASS: Record<number, string> = {
  0: 'chip-critica',
  1: 'chip-alta',
  2: 'chip-media',
  3: 'chip-baja',
};

@Component({
  selector: 'app-task-sort-view',
  templateUrl: './task-sort-view.html',
  styleUrl: './task-sort-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskSortView implements OnInit {
  private readonly todoService = inject(TodoService);
  readonly t = inject(I18nService).t;

  readonly tasks = input.required<TodoItem[]>();
  readonly cerrar = output<void>();
  readonly aplicado = output<string>();

  readonly importanciaOrder = signal<TodoItem[]>([]);
  readonly dificultadOrder = signal<TodoItem[]>([]);
  readonly localTasks = signal<TodoItem[]>([]);
  readonly previewOrder = signal<TodoItem[] | null>(null);
  readonly phase = signal<'setup' | 'preview'>('setup');
  readonly saving = signal(false);
  private lastAlgorithm = '';

  readonly draggedImpId = signal<string | null>(null);
  readonly draggedDifId = signal<string | null>(null);
  readonly activeInfo = signal<'jumpingCat' | 'balancedFlow' | 'pilaScore' | null>(null);

  // Maps task _id → computed group value based on current position
  readonly impGroupMap = computed(() => {
    const order = this.importanciaOrder();
    const n = Math.max(order.length, 1);
    return new Map(order.map((t, i) => [t._id, Math.min(3, Math.floor(i * 4 / n))]));
  });

  readonly difGroupMap = computed(() => {
    const order = this.dificultadOrder();
    const n = Math.max(order.length, 1);
    return new Map(order.map((t, i) => [t._id, 5 - Math.min(4, Math.floor(i * 5 / n))]));
  });

  ngOnInit(): void {
    const tasks = this.tasks();
    this.importanciaOrder.set([...tasks].sort((a, b) => (a.importancia ?? 3) - (b.importancia ?? 3)));
    this.dificultadOrder.set([...tasks].sort((a, b) => (b.dificultad ?? 3) - (a.dificultad ?? 3)));
    this.localTasks.set(tasks.map(t => ({ ...t, dificultad: t.dificultad ?? 3, importancia: t.importancia ?? 3 })));
  }

  // ── Importancia column ────────────────────────────────────────────────────

  moveImp(id: string, dir: -1 | 1): void {
    this.importanciaOrder.update(list => {
      const arr = [...list];
      const idx = arr.findIndex(t => t._id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return list;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }

  onImpDragStart(event: DragEvent, id: string): void {
    this.draggedImpId.set(id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onImpDragOver(event: DragEvent, targetId: string): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const sourceId = this.draggedImpId();
    if (!sourceId || sourceId === targetId) return;
    this.importanciaOrder.update(list => {
      const arr = [...list];
      const fromIdx = arr.findIndex(t => t._id === sourceId);
      const toIdx = arr.findIndex(t => t._id === targetId);
      if (fromIdx === -1 || toIdx === -1) return list;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
  }

  onImpDrop(event: DragEvent): void {
    event.preventDefault();
    this.draggedImpId.set(null);
  }

  onImpDragEnd(): void {
    this.draggedImpId.set(null);
  }

  // ── Dificultad column ─────────────────────────────────────────────────────

  moveDif(id: string, dir: -1 | 1): void {
    this.dificultadOrder.update(list => {
      const arr = [...list];
      const idx = arr.findIndex(t => t._id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return list;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }

  onDifDragStart(event: DragEvent, id: string): void {
    this.draggedDifId.set(id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDifDragOver(event: DragEvent, targetId: string): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const sourceId = this.draggedDifId();
    if (!sourceId || sourceId === targetId) return;
    this.dificultadOrder.update(list => {
      const arr = [...list];
      const fromIdx = arr.findIndex(t => t._id === sourceId);
      const toIdx = arr.findIndex(t => t._id === targetId);
      if (fromIdx === -1 || toIdx === -1) return list;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
  }

  onDifDrop(event: DragEvent): void {
    event.preventDefault();
    this.draggedDifId.set(null);
  }

  onDifDragEnd(): void {
    this.draggedDifId.set(null);
  }

  // ── Algorithms ────────────────────────────────────────────────────────────

  runJumpingCat(): void {
    this.lastAlgorithm = 'JumpingCat';
    this.runAlgorithm(jumpingCat);
  }

  runBalancedFlow(): void {
    this.lastAlgorithm = 'BalancedFlow';
    this.runAlgorithm(balancedFlow);
  }

  runPilaScore(): void {
    this.lastAlgorithm = 'PilaScore';
    this.runAlgorithm(pilaScore);
  }

  // Converts column positions → importancia (0–3) and dificultad (1–5) by equal-sized groups,
  // updates localTasks so confirmOrder can persist the values, and returns the enriched list.
  private applyPositionsToValues(): TodoItem[] {
    const impOrder = this.importanciaOrder();
    const difOrder = this.dificultadOrder();
    const nImp = Math.max(impOrder.length, 1);
    const nDif = Math.max(difOrder.length, 1);

    const impMap = new Map(impOrder.map((t, i) => [t._id, Math.min(3, Math.floor(i * 4 / nImp))]));
    const difMap = new Map(difOrder.map((t, i) => [t._id, 5 - Math.min(4, Math.floor(i * 5 / nDif))]));

    const result = this.tasks().map(t => ({
      ...t,
      importancia: impMap.get(t._id) ?? t.importancia ?? 3,
      dificultad:  difMap.get(t._id) ?? t.dificultad  ?? 3,
    }));
    this.localTasks.set(result);
    return result;
  }

  private runAlgorithm(fn: (tasks: SortableTodo[]) => SortableTodo[]): void {
    const tasksWithValues = this.applyPositionsToValues();
    const sortable = tasksWithValues.map(t => ({
      _id:        t._id,
      importancia: t.importancia,
      dificultad:  t.dificultad,
    }));
    const sorted = fn(sortable);
    const taskMap = new Map(tasksWithValues.map(t => [t._id, t]));
    const ordered = sorted.map(s => taskMap.get(s._id)).filter((t): t is TodoItem => !!t);
    this.previewOrder.set(ordered);
    this.phase.set('preview');
  }

  confirmOrder(): void {
    const preview = this.previewOrder();
    if (!preview) return;
    this.saving.set(true);

    const original = this.tasks();
    const originalMap = new Map(original.map(t => [t._id, t]));

    const updateCalls = this.localTasks()
      .filter(t => {
        const orig = originalMap.get(t._id);
        return orig && (orig.dificultad !== t.dificultad || orig.importancia !== t.importancia);
      })
      .map(t => this.todoService.updateTodo(t._id, { dificultad: t.dificultad, importancia: t.importancia }));

    const reorderItems = preview.map((t, i) => ({ _id: t._id, order: i }));
    const reorderCall = this.todoService.reorderTodos(reorderItems);

    const calls = updateCalls.length > 0 ? [...updateCalls, reorderCall] : [reorderCall];

    forkJoin(calls).subscribe({
      next: () => {
        this.saving.set(false);
        this.aplicado.emit(this.lastAlgorithm);
        this.cerrar.emit();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  toggleInfo(algo: 'jumpingCat' | 'balancedFlow' | 'pilaScore', event: Event): void {
    event.stopPropagation();
    this.activeInfo.update(v => v === algo ? null : algo);
  }

  closeInfo(): void {
    this.activeInfo.set(null);
  }

  backToSetup(): void {
    this.phase.set('setup');
    this.previewOrder.set(null);
  }

  pilaLabel(importancia: number): string {
    const keys: Record<number, string> = {
      0: 'todo.sort.critica',
      1: 'todo.sort.alta',
      2: 'todo.sort.media',
      3: 'todo.sort.baja',
    };
    return this.t()(keys[importancia] ?? 'todo.sort.baja');
  }

  pilaBadgeClass(importancia: number): string {
    return PILA_BADGE_CLASS[importancia] ?? 'badge-baja';
  }

  impChipClass(group: number): string {
    return IMP_CHIP_CLASS[group] ?? 'chip-baja';
  }

  impGroupLabel(group: number): string {
    return (['C', 'A', 'M', 'B'] as const)[group] ?? 'B';
  }
}
