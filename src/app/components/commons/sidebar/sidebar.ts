import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService } from '../../../services/i18n.service';
import { AuthService } from '../../../services/auth.service';
import { AdminService } from '../../../services/admin.service';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly i18n   = inject(I18nService);
  readonly auth           = inject(AuthService);
  readonly adminService   = inject(AdminService);
  private readonly router = inject(Router);
  readonly t = this.i18n.t;

  readonly expanded     = signal(false);
  readonly userMenuOpen = signal(false);

  readonly userName    = computed(() => this.auth.user()?.name ?? '');
  readonly userInitial = computed(() => this.userName().charAt(0).toUpperCase());

  toggle(): void { this.expanded.update(v => !v); }

  toggleUserMenu(): void { this.userMenuOpen.update(v => !v); }

  logout(): void {
    this.auth.logout().subscribe({
      next:  () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
    this.userMenuOpen.set(false);
  }

  readonly mainNav = computed<NavItem[]>(() => [
    { label: this.t()('nav.home'),     icon: 'fa-solid fa-house',               route: '/',               exact: true },
    { label: this.t()('nav.calendar'), icon: 'fa-solid fa-calendar',            route: '/calendar/month' },
    { label: this.t()('nav.tracker'), icon: 'fa-solid fa-chart-line', route: '/tracker' },
    { label: this.t()('nav.notes'),    icon: 'fa-solid fa-note-sticky',         route: '/notes' },
    { label: this.t()('nav.finances'), icon: 'fa-solid fa-hand-holding-dollar', route: '/finance' },
    
  ]);

  readonly secondaryNav = computed<NavItem[]>(() => [
    { label: this.t()('nav.settings'), icon: 'fa-solid fa-gear',            route: '/settings' },
    { label: this.t()('nav.help'),     icon: 'fa-solid fa-circle-question', route: '/help' },
  ]);
}
