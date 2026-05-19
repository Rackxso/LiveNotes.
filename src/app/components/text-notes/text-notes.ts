import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output } from '@angular/core';
import { NotesService, Note } from '../../services/notes.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-text-notes',
  imports: [],
  templateUrl: './text-notes.html',
  styleUrl: './text-notes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextNotes implements OnInit {
  private readonly notesService = inject(NotesService);
  readonly t = inject(I18nService).t;

  readonly searchQuery = input<string>('');
  readonly selectedCategory = input<string>('all');
  readonly addNote = output<void>();
  readonly editNote = output<Note>();

  readonly notes = this.notesService.notes;

  ngOnInit(): void {
    this.notesService.getNotes().subscribe();
  }

  readonly filteredNotes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategory();
    let items = this.notes();
    if (cat !== 'all') {
      items = items.filter(n => n.categoria === cat);
    }
    if (q) {
      items = items.filter(n =>
        n.titulo.toLowerCase().includes(q) || n.contenido.toLowerCase().includes(q)
      );
    }
    return items;
  });

  onDeleteNote(event: MouseEvent, note: Note): void {
    event.stopPropagation();
    this.notesService.deleteNote(note._id).subscribe();
  }

  categoryClass(categoria: string): string {
    const map: Record<string, string> = {
      work: 'cat-work',
      personal: 'cat-personal',
      health: 'cat-health',
    };
    return map[categoria?.toLowerCase()] ?? 'cat-default';
  }
}
