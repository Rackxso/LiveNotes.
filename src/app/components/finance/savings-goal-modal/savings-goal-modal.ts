import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiMetaDto, FinanceService } from '../../../services/finance.service';
import { PrimaryButton } from '../../commons/primary-button/primary-button';
import { SecondaryButton } from '../../commons/secondary-button/secondary-button';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-savings-goal-modal',
  imports: [ReactiveFormsModule, PrimaryButton, SecondaryButton],
  templateUrl: './savings-goal-modal.html',
  styleUrl: './savings-goal-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavingsGoalModal {
  private readonly financeService = inject(FinanceService);
  readonly t = inject(I18nService).t;

  readonly saved   = output<void>();
  readonly deleted = output<void>();

  readonly mode       = signal<'create' | 'edit'>('create');
  readonly editingId  = signal<string | null>(null);
  readonly editingName = signal<string>('');

  private readonly dialogEl = viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');

  readonly form = new FormGroup({
    name:   new FormControl('', { validators: [Validators.required], nonNullable: true }),
    target: new FormControl(0,  { validators: [Validators.required, Validators.min(0.01)], nonNullable: true }),
  });

  open(goal?: { id: string; name: string; target: number }): void {
    if (goal) {
      this.mode.set('edit');
      this.editingId.set(goal.id);
      this.editingName.set(goal.name);
      this.form.reset({ name: goal.name, target: goal.target });
    } else {
      this.mode.set('create');
      this.editingId.set(null);
      this.editingName.set('');
      this.form.reset({ name: '', target: 0 });
    }
    this.dialogEl().nativeElement.showModal();
  }

  close(): void {
    this.dialogEl().nativeElement.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialogEl().nativeElement) this.close();
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();

    if (this.mode() === 'edit') {
      const id = this.editingId()!;
      const dto: Partial<ApiMetaDto> = { meta: v.target };
      this.financeService.updateMeta(id, dto).subscribe(() => {
        this.saved.emit();
        this.close();
      });
    } else {
      const dto: ApiMetaDto = { name: v.name, meta: v.target };
      this.financeService.createMeta(dto).subscribe(() => {
        this.saved.emit();
        this.close();
      });
    }
  }

  deleteGoal(): void {
    const id = this.editingId();
    if (!id) return;
    this.financeService.deleteMeta(id).subscribe(() => {
      this.deleted.emit();
      this.close();
    });
  }
}
