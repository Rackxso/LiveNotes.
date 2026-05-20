import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TicketService, Ticket } from '../../services/ticket.service';
import { TourService } from '../../services/tour.service';
import { TOUR_META, type TourId } from '../../tours/tour-definitions';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-help',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './help.html',
  styleUrl: './help.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Help {
  private readonly fb            = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  readonly tourService           = inject(TourService);
  private readonly i18n          = inject(I18nService);

  readonly t = this.i18n.t;
  readonly tourIds: TourId[] = ['home', 'calendar', 'notes', 'finance', 'tracker', 'global'];
  readonly tourMeta = TOUR_META;

  readonly form = this.fb.group({
    asunto:      ['', [Validators.required, Validators.maxLength(120)]],
    categoria:   ['', Validators.required],
    descripcion: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  readonly submitting = signal(false);
  readonly submitted  = signal(false);
  readonly error      = signal<string | null>(null);

  readonly myTickets  = signal<Ticket[]>([]);
  readonly loadingTickets = signal(false);

  readonly showHistory = signal(false);

  readonly categorias = computed(() => [
    { value: 'bug',        label: this.t()('help.cat.bug') },
    { value: 'sugerencia', label: this.t()('help.cat.sugerencia') },
    { value: 'pregunta',   label: this.t()('help.cat.pregunta') },
    { value: 'otro',       label: this.t()('help.cat.otro') },
  ]);

  readonly estadoLabel = computed<Record<string, string>>(() => ({
    abierto:     this.t()('admin.statusOpen'),
    en_revision: this.t()('admin.statusReview'),
    resuelto:    this.t()('admin.statusResolved'),
  }));

  submit(): void {
    if (this.form.invalid || this.submitting()) return;
    this.error.set(null);
    this.submitting.set(true);

    const { asunto, categoria, descripcion } = this.form.getRawValue();
    this.ticketService.create({ asunto: asunto!, categoria: categoria as never, descripcion: descripcion! }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.form.reset();
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.message ?? this.t()('help.errorSend'));
      },
    });
  }

  loadHistory(): void {
    if (this.loadingTickets()) return;
    this.showHistory.update(v => !v);
    if (this.showHistory() && this.myTickets().length === 0) {
      this.loadingTickets.set(true);
      this.ticketService.getAll().subscribe({
        next: (tickets) => { this.myTickets.set(tickets); this.loadingTickets.set(false); },
        error: () => this.loadingTickets.set(false),
      });
    }
  }

  newTicket(): void {
    this.submitted.set(false);
    this.error.set(null);
  }
}
