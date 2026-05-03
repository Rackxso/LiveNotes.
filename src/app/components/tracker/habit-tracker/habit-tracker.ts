import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HabitsService, Habit } from '../../../services/habits.service';
import { I18nService } from '../../../services/i18n.service';
import { PrimaryButton } from '../../commons/primary-button/primary-button';
import { AddHabitModal } from '../add-habit-modal/add-habit-modal';

@Component({
  selector: 'app-habit-tracker',
  imports: [PrimaryButton, AddHabitModal],
  templateUrl: './habit-tracker.html',
  styleUrl: './habit-tracker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HabitTracker {
  private readonly habitsService = inject(HabitsService);
  private readonly i18n = inject(I18nService);
  readonly t = this.i18n.t;

  readonly habits = this.habitsService.habits;
  readonly showModal = signal(false);

  readonly selectMode = signal(false);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly showDeleteModal = signal(false);

  toggleSelectMode(): void {
    this.selectMode.update(v => !v);
    this.selectedIds.set(new Set());
  }

  toggleSelect(id: string): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  confirmDelete(): void {
    const ids = [...this.selectedIds()];
    ids.forEach(id => this.habitsService.deleteHabit(id).subscribe());
    this.selectedIds.set(new Set());
    this.selectMode.set(false);
    this.showDeleteModal.set(false);
  }

  private readonly today = new Date();

  readonly WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  readonly currentMonthDays = computed<number[]>(() => {
    const daysInMonth = new Date(this.today.getFullYear(), this.today.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  });

  readonly currentWeekDays = computed<Date[]>(() => {
    const diff = (this.today.getDay() + 6) % 7;
    const monday = new Date(this.today);
    monday.setDate(this.today.getDate() - diff);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  });

  isToday(date: Date): boolean {
    return (
      date.getDate() === this.today.getDate() &&
      date.getMonth() === this.today.getMonth() &&
      date.getFullYear() === this.today.getFullYear()
    );
  }

  dotForDate(habit: Habit, date: Date): boolean {
    if (!habit.completionDates?.length) return false;
    const check = new Date(date);
    check.setHours(0, 0, 0, 0);
    return habit.completionDates.some(d => {
      const cd = new Date(d);
      cd.setHours(0, 0, 0, 0);
      return cd.getTime() === check.getTime();
    });
  }

  isDoneToday(habit: Habit): boolean {
    if (!habit.ultimoHecho) return false;
    const last = new Date(habit.ultimoHecho);
    return (
      last.getFullYear() === this.today.getFullYear() &&
      last.getMonth() === this.today.getMonth() &&
      last.getDate() === this.today.getDate()
    );
  }

  dotForDay(habit: Habit, dayNum: number): boolean {
    if (!habit.completionDates?.length) return false;
    return habit.completionDates.some(d => {
      const cd = new Date(d);
      return cd.getMonth() === this.today.getMonth() &&
             cd.getFullYear() === this.today.getFullYear() &&
             cd.getDate() === dayNum;
    });
  }

  mark(id: string): void {
    this.habitsService.markHabit(id).subscribe();
  }
}
