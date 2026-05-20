import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { NotesService, NoteDto, Note } from '../../../services/notes.service';
import { EventosService } from '../../../services/eventos.service';
import { PrimaryButton } from '../primary-button/primary-button';
import { SecondaryButton } from '../secondary-button/secondary-button';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'app-add-note-modal',
  imports: [ReactiveFormsModule, PrimaryButton, SecondaryButton],
  templateUrl: './add-note-modal.html',
  styleUrl: './add-note-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddNoteModal {
  private readonly notesService = inject(NotesService);
  private readonly eventosService = inject(EventosService);
  private readonly i18n = inject(I18nService);
  readonly t = this.i18n.t;

  readonly note = input<Note | null>(null);
  readonly existingCategories = input<string[]>([]);
  readonly cerrar = output<void>();
  readonly guardado = output<void>();

  readonly PRESET_CATEGORIES = computed(() => [
    this.t()('noteModal.presetWork'),
    this.t()('noteModal.presetPersonal'),
    this.t()('noteModal.presetHealth'),
  ]);

  readonly form = new FormGroup({
    titulo:    new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    contenido: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    categoria: new FormControl('', { nonNullable: true }),
    eventoId:  new FormControl<string>('', { nonNullable: true }),
  });

  readonly sortedEventos = computed(() =>
    [...this.eventosService.eventos()].sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
  );

  constructor() {
    this.eventosService.loadEventos().subscribe();
    effect(() => {
      const n = this.note();
      if (n) {
        this.form.patchValue({
          titulo: n.titulo,
          contenido: n.contenido,
          categoria: n.categoria ?? '',
          eventoId: n.eventoId ?? '',
        });
      } else {
        this.form.reset();
      }
    });
  }

  formatEventDate(fecha: Date): string {
    return fecha.toLocaleDateString(this.i18n.locale(), { day: '2-digit', month: 'short', year: 'numeric' });
  }

  get isEditing(): boolean { return !!this.note(); }

  readonly allCategories = computed(() => {
    const presets = this.PRESET_CATEGORIES();
    const extras = this.existingCategories().filter(
      c => !presets.map(p => p.toLowerCase()).includes(c.toLowerCase())
    );
    return [...presets, ...extras];
  });

  onGuardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const dto: NoteDto = {
      titulo:    this.form.controls.titulo.value.trim(),
      contenido: this.form.controls.contenido.value.trim(),
      categoria: this.form.controls.categoria.value.trim(),
      eventoId:  this.form.controls.eventoId.value || null,
    };
    const n = this.note();
    const request$ = n
      ? this.notesService.updateNote(n._id, dto)
      : this.notesService.createNote(dto);

    request$.subscribe({
      next: () => {
        this.guardado.emit();
        this.onCerrar();
      },
    });
  }

  onCerrar(): void {
    this.form.reset();
    this.cerrar.emit();
  }
}
