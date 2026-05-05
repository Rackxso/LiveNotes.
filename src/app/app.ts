import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { SidebarComponent } from './components/commons/sidebar/sidebar';
import { PosthogService } from './services/posthog.service';
import { TourService } from './services/tour.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly router    = inject(Router);
  private readonly posthog   = inject(PosthogService);
  private readonly tourService = inject(TourService);

  private isAuthUrl(url: string): boolean {
    return url.startsWith('/login') || url.startsWith('/register') || url.startsWith('/forgot-password');
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        if (!this.isAuthUrl(url)) {
          this.tourService.startTourIfNewUser();
        }
      });
  }

  protected readonly isAuthPage = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => this.isAuthUrl((e as NavigationEnd).urlAfterRedirects)),
      startWith(this.isAuthUrl(this.router.url))
    ),
    { initialValue: false }
  );
}
