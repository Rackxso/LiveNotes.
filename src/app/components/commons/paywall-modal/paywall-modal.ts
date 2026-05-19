import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { PremiumService } from '../../../services/premium.service';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-paywall-modal',
  imports: [TitleCasePipe],
  templateUrl: './paywall-modal.html',
  styleUrl: './paywall-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaywallModal {
  private readonly premium = inject(PremiumService);
  readonly auth = inject(AuthService);
  readonly t = inject(I18nService).t;

  readonly feature = input<string>('presupuestos');

  readonly closed = output<void>();

  readonly upgrading = signal(false);
  readonly toggling = signal(false);

  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  open(): void {
    this.dialogEl().nativeElement.showModal();
  }

  close(): void {
    this.dialogEl().nativeElement.close();
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogEl().nativeElement) this.close();
  }

  upgrade(): void {
    if (this.upgrading()) return;
    this.upgrading.set(true);
    this.premium.createCheckoutSession().subscribe({
      next: ({ url }) => window.location.href = url,
      error: () => this.upgrading.set(false),
    });
  }

  simulateToggle(): void {
    if (this.toggling()) return;
    this.toggling.set(true);
    this.premium.simulateToggle().subscribe({
      next: () => {
        this.toggling.set(false);
        this.close();
      },
      error: () => this.toggling.set(false),
    });
  }
}
