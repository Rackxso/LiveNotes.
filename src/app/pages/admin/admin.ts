import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AdminService, ViewMode } from '../../services/admin.service';
import { TicketService, AdminTicket } from '../../services/ticket.service';
import { LangSelector } from '../../components/commons/lang-selector/lang-selector';
import { Selector } from '../../components/commons/selector/selector';
import { I18nService } from '../../services/i18n.service';

type EstadoFilter = 'todos' | 'abierto' | 'en_revision' | 'resuelto';

@Component({
  selector: 'app-admin',
  imports: [DatePipe, LangSelector, Selector],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnInit {
  readonly auth       = inject(AuthService);
  readonly adminSvc   = inject(AdminService);
  private readonly ticketSvc = inject(TicketService);
  readonly t = inject(I18nService).t;

  readonly tickets        = signal<AdminTicket[]>([]);
  readonly loading        = signal(false);
  readonly estadoFilter   = signal<EstadoFilter>('todos');
  readonly errorMsg       = signal<string | null>(null);
  readonly selectedTicket = signal<AdminTicket | null>(null);

  readonly filteredTickets = computed(() => {
    const f = this.estadoFilter();
    return f === 'todos'
      ? this.tickets()
      : this.tickets().filter(t => t.estado === f);
  });

  readonly estadoOptions: EstadoFilter[] = ['todos', 'abierto', 'en_revision', 'resuelto'];
  readonly estadoLabel = computed<Record<string, string>>(() => ({
    todos:       this.t()('admin.statusAll'),
    abierto:     this.t()('admin.statusOpen'),
    en_revision: this.t()('admin.statusReview'),
    resuelto:    this.t()('admin.statusResolved'),
  }));
  readonly filterVistas = computed(() => [
    this.t()('admin.statusAll'),
    this.t()('admin.statusOpen'),
    this.t()('admin.statusReview'),
    this.t()('admin.statusResolved'),
  ]);
  readonly labelToFilter = computed<Record<string, EstadoFilter>>(() => ({
    [this.t()('admin.statusAll')]:      'todos',
    [this.t()('admin.statusOpen')]:     'abierto',
    [this.t()('admin.statusReview')]:   'en_revision',
    [this.t()('admin.statusResolved')]: 'resuelto',
  }));
  readonly viewModes = computed(() => [
    { value: 'admin' as ViewMode,   label: this.t()('sidebar.admin') },
    { value: 'free' as ViewMode,    label: this.t()('settings.subscription.planFree') },
    { value: 'premium' as ViewMode, label: this.t()('settings.subscription.planPremium') },
  ]);

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading.set(true);
    this.ticketSvc.getAllAdmin().subscribe({
      next:  ts  => { this.tickets.set(ts); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  openTicket(t: AdminTicket): void   { this.selectedTicket.set(t); }
  closeTicket(): void                { this.selectedTicket.set(null); }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.closeTicket(); }

  deleteTicket(id: string): void {
    const prev = this.tickets();
    this.tickets.update(ts => ts.filter(t => t._id !== id));
    if (this.selectedTicket()?._id === id) this.closeTicket();
    this.ticketSvc.deleteAdmin(id).subscribe({
      error: () => {
        this.tickets.set(prev);
        this.showError(this.t()('admin.errorDeleteTicket'));
      },
    });
  }

  changeEstado(id: string, estado: AdminTicket['estado']): void {
    this.ticketSvc.updateEstado(id, estado).subscribe({
      next: updated => {
        this.tickets.update(ts => ts.map(t => (t._id === id ? updated : t)));
        if (this.selectedTicket()?._id === id) this.selectedTicket.set(updated);
      },
    });
  }

  simulateToggle(): void {
    const next = this.auth.isPremium() ? 1 : 2;
    this.auth.updatePermisosTemporary(next);
  }

  private showError(msg: string): void {
    this.errorMsg.set(msg);
    setTimeout(() => this.errorMsg.set(null), 3000);
  }
}
