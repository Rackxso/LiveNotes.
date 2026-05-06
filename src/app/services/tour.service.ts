import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs';
import { driver } from 'driver.js';
import type { Driver, DriveStep } from 'driver.js';
import { TOUR_DEFINITIONS, type TourId, type TourSegment } from '../tours/tour-definitions';
import { I18nService } from './i18n.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly router      = inject(Router);
  private readonly http        = inject(HttpClient);
  private readonly i18n        = inject(I18nService);
  private readonly authService = inject(AuthService);
  private readonly base        = `${environment.apiUrl}/user`;

  readonly tourActive          = signal(false);
  readonly currentTourId       = signal<TourId | null>(null);
  readonly globalSegmentIndex  = signal(0);
  readonly currentStepId       = signal<string | null>(null);

  private readonly _completedTours = signal<Set<string>>(new Set());
  readonly completedTours          = this._completedTours.asReadonly();

  private driverInstance: Driver | null = null;
  private pendingSegments: TourSegment[] = [];
  private pendingSegmentIndex = 0;
  private isGlobal = false;

  private readonly _toursLoaded = signal(false);
  private _pendingTourCheck = false;

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        if (!this.tourActive()) return;
        const url = (e as NavigationEnd).urlAfterRedirects.split('?')[0];
        this.launchSegmentForUrl(url);
      });

    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.loadCompletedTours();
      } else {
        this._completedTours.set(new Set());
        this._toursLoaded.set(false);
      }
    });

    // Deferred check: when tours finish loading, fire any pending auto-show check
    effect(() => {
      if (!this._toursLoaded()) return;
      if (!this._pendingTourCheck) return;
      this._pendingTourCheck = false;
      if (!untracked(() => this._completedTours().has('global_seen'))) {
        this.markGlobalSeen();
        setTimeout(() => this.startGlobalTour(), 500);
      }
    });
  }

  private loadCompletedTours(): void {
    const email = this.authService.user()?.email;
    if (!email) return;
    this.http.get<{ completedTours: string[] }>(`${this.base}/${email}/tours`)
      .subscribe(data => {
        this._completedTours.set(new Set(data.completedTours));
        this._toursLoaded.set(true);
      });
  }

  startTour(tourId: TourId): void {
    const segments = TOUR_DEFINITIONS[tourId];
    if (!segments?.length) return;
    this.isGlobal = false;
    this.pendingSegments = [...segments];
    this.pendingSegmentIndex = 0;
    this.currentTourId.set(tourId);
    this.tourActive.set(true);
    this.router.navigate([segments[0].route]);
  }

  startGlobalTour(): void {
    const segments = TOUR_DEFINITIONS['global'];
    if (!segments?.length) return;
    this.isGlobal = true;
    this.pendingSegments = [...segments];
    this.pendingSegmentIndex = 0;
    this.currentTourId.set('global');
    this.tourActive.set(true);
    this.globalSegmentIndex.set(0);
    this.router.navigate([segments[0].route]);
  }

  private launchSegmentForUrl(url: string): void {
    const segment = this.pendingSegments[this.pendingSegmentIndex];
    if (!segment) return;

    const segmentPath = segment.route.split('?')[0];
    if (url !== segmentPath) return;

    this.destroyDriver();

    const t = this.i18n.t();
    const steps: DriveStep[] = segment.steps.map(s => ({
      element: s.element,
      popover: {
        title: t(s.popover.titleKey),
        description: t(s.popover.descriptionKey),
        side: s.popover.side,
      },
      ...(s.stepId && {
        onHighlightStarted: () => this.currentStepId.set(s.stepId!),
      }),
    }));

    this.driverInstance = driver({
      animate: true,
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: t('tour.next'),
      prevBtnText: t('tour.prev'),
      doneBtnText: t('tour.done'),
      steps,
      onDestroyStarted: () => {
        this.driverInstance?.destroy();
        this.onSegmentDone();
      },
    });

    setTimeout(() => this.driverInstance?.drive(), 150);
  }

  private onSegmentDone(): void {
    this.pendingSegmentIndex++;

    if (this.pendingSegmentIndex >= this.pendingSegments.length) {
      this.finishTour();
      return;
    }

    if (this.isGlobal) {
      this.globalSegmentIndex.set(this.pendingSegmentIndex);
    }

    const next = this.pendingSegments[this.pendingSegmentIndex];
    this.router.navigate([next.route]);
  }

  private finishTour(): void {
    const id = this.currentTourId();
    if (id) this.markCompleted(id);
    this.tourActive.set(false);
    this.currentTourId.set(null);
    this.currentStepId.set(null);
    this.globalSegmentIndex.set(0);
    this.pendingSegments = [];
    this.pendingSegmentIndex = 0;
    this.isGlobal = false;
    this.destroyDriver();
  }

  private destroyDriver(): void {
    try { this.driverInstance?.destroy(); } catch { /* already destroyed */ }
    this.driverInstance = null;
  }

  markCompleted(tourId: TourId): void {
    this._completedTours.update(s => new Set([...s, tourId]));
    const email = this.authService.user()?.email;
    if (email) {
      this.http.patch(`${this.base}/${email}/tours/${tourId}`, {}).subscribe();
    }
  }

  isCompleted(tourId: TourId): boolean {
    return this._completedTours().has(tourId);
  }

  resetTour(tourId: TourId): void {
    this._completedTours.update(s => { const n = new Set(s); n.delete(tourId); return n; });
  }

  resetAll(): void {
    this._completedTours.set(new Set());
    const email = this.authService.user()?.email;
    if (email) {
      this.http.delete(`${this.base}/${email}/tours`).subscribe();
    }
  }

  startTourIfNewUser(): void {
    if (!this._toursLoaded()) {
      this._pendingTourCheck = true;
      return;
    }
    if (this._completedTours().has('global_seen')) return;
    this.markGlobalSeen();
    setTimeout(() => this.startGlobalTour(), 500);
  }

  private markGlobalSeen(): void {
    this._completedTours.update(s => new Set([...s, 'global_seen']));
    const email = this.authService.user()?.email;
    if (email) {
      this.http.patch(`${this.base}/${email}/tours/global_seen`, {}).subscribe();
    }
  }
}
