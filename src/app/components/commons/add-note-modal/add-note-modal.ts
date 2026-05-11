import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { NotesService, NoteDto, Note } from '../../../services/notes.service';
import { EventosService } from '../../../services/eventos.service';
import { PrimaryButton } from '../primary-button/primary-button';
import { SecondaryButton } from '../secondary-button/secondary-button';

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

  readonly note = input<Note | null>(null);
  readonly existingCategories = input<string[]>([]);
  readonly cerrar = output<void>();
  readonly guardado = output<void>();

  readonly PRESET_CATEGORIES = ['Work', 'Personal', 'Health'];

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
    return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  get isEditing(): boolean { return !!this.note(); }

  get allCategories(): string[] {
    const extras = this.existingCategories().filter(
      c => !this.PRESET_CATEGORIES.map(p => p.toLowerCase()).includes(c.toLowerCase())
    );
    return [...this.PRESET_CATEGORIES, ...extras];
  }

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
