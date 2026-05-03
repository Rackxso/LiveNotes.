import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, finalize } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Frontend interfaces (used by components) ────────────────────────────────

export interface Transaction {
  id: string;
  name: string;
  category: string;
  categoryColor: string;
  date: Date;
  amount: number;
  metaId?: string | null;
}

export interface SavingsGoal {
  id: string;
  name: string;
  saved: number;
  target: number;
  color: string;
  movimientos?: { fecha: string; importe: number }[];
}

export interface BudgetCategory {
  id: string;
  categoriaId: string;
  name: string;
  budget: number;
  color: string;
}

export interface MonthlyStats {
  month: string;
  income: number;
  expenses: number;
  saved: number;
}

export interface Deposit {
  id: number;
  goalName: string;
  date: Date;
  amount: number;
}

// ── Backend response shapes ──────────────────────────────────────────────────

export interface ApiCategoria {
  _id: string;
  nombre: string;
  color?: string;
}

export interface ApiPresupuestoDto {
  nombre: string;
  color: string;
  limite: number;
  mes: number;
  anio: number;
}

interface ApiPresupuesto {
  _id: string;
  categoria: ApiCategoria;
  limite: number;
  mes: number;
  anio: number;
  acumulado: number;
  superado: boolean;
}

interface ApiMovimiento {
  _id: string;
  name: string;
  fecha: string;
  tipo: boolean;
  importe: number;
  metaId?: string | null;
  categorias: ApiCategoria[];
}

interface ApiMeta {
  _id: string;
  name: string;
  meta: number;
  acumulado: number;
  completada: boolean;
  movimientos: { fecha: string; importe: number }[];
}

export interface ApiMovimientoDto {
  name: string;
  fecha: string;
  tipo: boolean;
  importe: number;
  destinatario?: string;
  metodo?: 'Transferencia' | 'Tarjeta' | 'Factura' | 'Subscripcion' | 'Bizum' | 'Efectivo' | 'Otro';
  metaId?: string;
  categorias?: string[];
}

export interface ApiMetaDto {
  name: string;
  meta: number;
  acumulado?: number;
}

// ── Goal colors cycle ────────────────────────────────────────────────────────

const GOAL_COLORS = [
  'var(--purple)', 'var(--green)', 'var(--red)',
  'var(--accent-color)', 'var(--blue)',
];

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);
  private readonly baseMovimientos = `${environment.apiUrl}/movimientos`;
  private readonly baseMetas = `${environment.apiUrl}/metas`;
  private readonly basePresupuestos = `${environment.apiUrl}/presupuestos`;
  private readonly baseCategorias = `${environment.apiUrl}/categorias`;

  // ── Signals ────────────────────────────────────────────────────────────────

  readonly transactions = signal<Transaction[]>([]);
  readonly savingsGoals = signal<SavingsGoal[]>([]);
  readonly budgetCategories = signal<BudgetCategory[]>([]);

  readonly categorias = signal<ApiCategoria[]>([]);

  readonly loading = signal(false);
  private _activeLoads = 0;

  private _startLoad(): void { this._activeLoads++; this.loading.set(true); }
  private _endLoad(): void   { if (--this._activeLoads === 0) this.loading.set(false); }

  private _txLoaded = false;
  private _goalsLoaded = false;
  private _categoriasLoaded = false;
  private _presupuestosLoaded = false;

  // ── Computed ───────────────────────────────────────────────────────────────

  readonly monthlyStats = computed<MonthlyStats[]>(() => {
    const txs = this.transactions();
    const map = new Map<string, { income: number; expenses: number; year: number; monthNum: number }>();

    for (const tx of txs) {
      const d = tx.date;
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, { income: 0, expenses: 0, year: d.getFullYear(), monthNum: d.getMonth() });
      }
      const entry = map.get(key)!;
      if (tx.amount > 0) entry.income += tx.amount;
      else entry.expenses += Math.abs(tx.amount);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, { income, expenses, year, monthNum }]) => ({
        month: new Date(year, monthNum).toLocaleString('en-US', { month: 'short' }),
        income,
        expenses,
        saved: income - expenses,
      }));
  });

  readonly recentDeposits = computed<Deposit[]>(() => {
    let autoId = 0;
    return this.savingsGoals()
      .flatMap(g =>
        (g.movimientos ?? []).map(m => ({
          id: autoId++,
          goalName: g.name,
          date: new Date(m.fecha),
          amount: m.importe,
        }))
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10);
  });

  readonly totalSaved = computed(() =>
    this.savingsGoals().reduce((sum, g) => sum + g.saved, 0)
  );

  readonly totalTarget = computed(() =>
    this.savingsGoals().reduce((sum, g) => sum + g.target, 0)
  );

  readonly totalProgress = computed(() => {
    const target = this.totalTarget();
    return target ? Math.round((this.totalSaved() / target) * 100) : 0;
  });

  readonly avgMonthlySaved = computed(() => {
    const stats = this.monthlyStats();
    if (!stats.length) return 0;
    return stats.reduce((sum, s) => sum + s.saved, 0) / stats.length;
  });

  readonly categorySpending = computed(() => {
    const txs = this.transactions();
    return this.budgetCategories().map(cat => {
      const spent = txs
        .filter(t => t.category === cat.name && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return { ...cat, spent };
    });
  });

  // ── HTTP: Movimientos ──────────────────────────────────────────────────────

  loadTransactions(): Observable<ApiMovimiento[]> {
    if (this._txLoaded) return of([]);
    this._txLoaded = true;
    this._startLoad();
    return this.http.get<ApiMovimiento[]>(this.baseMovimientos).pipe(
      tap(data => this.transactions.set(data.map(m => this.mapToTransaction(m)))),
      finalize(() => this._endLoad())
    );
  }

  createMovimiento(dto: ApiMovimientoDto): Observable<ApiMovimiento> {
    return this.http.post<ApiMovimiento>(this.baseMovimientos, dto).pipe(
      tap(m => {
        this.transactions.update(txs => [this.mapToTransaction(m), ...txs]);
        if (dto.metaId) {
          const delta = dto.tipo ? dto.importe : -dto.importe;
          this.savingsGoals.update(goals =>
            goals.map(g => g.id === dto.metaId ? {
              ...g,
              saved: g.saved + delta,
              movimientos: [...(g.movimientos ?? []), { fecha: dto.fecha, importe: dto.importe }],
            } : g)
          );
        }
      })
    );
  }

  deleteMovimiento(id: string): Observable<unknown> {
    const tx = this.transactions().find(t => t.id === id);
    return this.http.delete(`${this.baseMovimientos}/${id}`).pipe(
      tap(() => {
        this.transactions.update(txs => txs.filter(t => t.id !== id));
        if (tx?.metaId) {
          this.savingsGoals.update(goals =>
            goals.map(g => {
              if (g.id !== tx.metaId) return g;
              const idx = g.movimientos?.findIndex(m => m.importe === tx.amount) ?? -1;
              const newMovimientos = idx !== -1
                ? [...(g.movimientos ?? []).slice(0, idx), ...(g.movimientos ?? []).slice(idx + 1)]
                : g.movimientos;
              return { ...g, saved: g.saved - tx.amount, movimientos: newMovimientos };
            })
          );
        }
      })
    );
  }

  // ── HTTP: Metas ────────────────────────────────────────────────────────────

  loadSavingsGoals(): Observable<ApiMeta[]> {
    if (this._goalsLoaded) return of([]);
    this._goalsLoaded = true;
    this._startLoad();
    return this.http.get<ApiMeta[]>(this.baseMetas).pipe(
      tap(data => this.savingsGoals.set(data.map((m, i) => this.mapToSavingsGoal(m, i)))),
      finalize(() => this._endLoad())
    );
  }

  createMeta(dto: ApiMetaDto): Observable<ApiMeta> {
    const colorIdx = this.savingsGoals().length % GOAL_COLORS.length;
    return this.http.post<ApiMeta>(this.baseMetas, dto).pipe(
      tap(m => this.savingsGoals.update(goals => [...goals, this.mapToSavingsGoal(m, colorIdx)]))
    );
  }

  updateMeta(id: string, dto: Partial<ApiMetaDto>): Observable<ApiMeta> {
    return this.http.put<ApiMeta>(`${this.baseMetas}/${id}`, dto).pipe(
      tap(updated => this.savingsGoals.update(goals =>
        goals.map(g => g.id === id ? this.mapToSavingsGoal(updated, goals.findIndex(x => x.id === id)) : g)
      ))
    );
  }

  deleteMeta(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseMetas}/${id}`).pipe(
      tap(() => this.savingsGoals.update(goals => goals.filter(g => g.id !== id)))
    );
  }

  // ── HTTP: Categorias ───────────────────────────────────────────────────────

  loadCategorias(): Observable<ApiCategoria[]> {
    if (this._categoriasLoaded) return of(this.categorias());
    this._categoriasLoaded = true;
    return this.http.get<ApiCategoria[]>(this.baseCategorias).pipe(
      tap(data => this.categorias.set(data))
    );
  }

  // ── HTTP: Presupuestos ─────────────────────────────────────────────────────

  loadPresupuestos(mes?: number, anio?: number): Observable<ApiPresupuesto[]> {
    if (this._presupuestosLoaded) return of([] as ApiPresupuesto[]);
    this._presupuestosLoaded = true;
    const today = new Date();
    const m = mes ?? today.getMonth() + 1;
    const a = anio ?? today.getFullYear();
    return this.http.get<ApiPresupuesto[]>(`${this.basePresupuestos}?mes=${m}&anio=${a}`).pipe(
      tap(data => this.budgetCategories.set(data.map(p => this.mapToBudgetCategory(p))))
    );
  }

  createPresupuesto(dto: ApiPresupuestoDto): Observable<ApiPresupuesto> {
    return this.http.post<ApiPresupuesto>(this.basePresupuestos, dto).pipe(
      tap(p => this.budgetCategories.update(cats => [...cats, this.mapToBudgetCategory(p)]))
    );
  }

  updatePresupuesto(id: string, limite: number): Observable<unknown> {
    return this.http.put(`${this.basePresupuestos}/${id}`, { limite }).pipe(
      tap(() => this.budgetCategories.update(cats =>
        cats.map(c => c.id === id ? { ...c, budget: limite } : c)
      ))
    );
  }

  deletePresupuesto(id: string): Observable<unknown> {
    return this.http.delete(`${this.basePresupuestos}/${id}`).pipe(
      tap(() => this.budgetCategories.update(cats => cats.filter(c => c.id !== id)))
    );
  }

  resetState(): void {
    this._txLoaded = false;
    this._goalsLoaded = false;
    this._categoriasLoaded = false;
    this._presupuestosLoaded = false;
    this._activeLoads = 0;
    this.loading.set(false);
    this.transactions.set([]);
    this.savingsGoals.set([]);
    this.budgetCategories.set([]);
    this.categorias.set([]);
  }

  // ── Local write helpers (used by components pending full API integration) ──

  addTransaction(data: Omit<Transaction, 'id'>): void {
    const tempId = `local-${Date.now()}`;
    this.transactions.update(txs => [{ ...data, id: tempId }, ...txs]);
  }

  depositToGoal(goalId: string, amount: number, name: string, date: Date): void {
    const goal = this.savingsGoals().find(g => g.id === goalId);
    if (!goal) return;

    this.savingsGoals.update(goals =>
      goals.map(g => g.id === goalId ? { ...g, saved: g.saved + amount } : g)
    );

    this.addTransaction({
      name,
      amount,
      date,
      categoryColor: '',
      category: `→ ${goal.name}`,
    });
  }

  // ── Mapping helpers ────────────────────────────────────────────────────────

  private mapToTransaction(m: ApiMovimiento): Transaction {
    const cat = m.categorias?.[0];
    const isSavings = !cat && !!m.metaId;
    return {
      id: m._id,
      name: m.name,
      category: cat?.nombre ?? (isSavings ? 'Ahorro' : 'Sin trazar'),
      categoryColor: cat?.color ?? (isSavings ? '#3b82f6' : ''),
      date: new Date(m.fecha),
      amount: m.tipo ? m.importe : -m.importe,
      metaId: m.metaId ?? null,
    };
  }

  private mapToSavingsGoal(m: ApiMeta, colorIndex: number): SavingsGoal {
    return {
      id: m._id,
      name: m.name,
      saved: m.acumulado,
      target: m.meta,
      color: GOAL_COLORS[colorIndex % GOAL_COLORS.length],
      movimientos: m.movimientos,
    };
  }

  private mapToBudgetCategory(p: ApiPresupuesto): BudgetCategory {
    return {
      id: p._id,
      categoriaId: p.categoria._id,
      name: p.categoria.nombre,
      budget: p.limite,
      color: p.categoria.color ?? '#888888',
    };
  }
}
