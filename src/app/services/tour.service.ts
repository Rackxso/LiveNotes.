import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { driver } from 'driver.js';
import type { Driver, DriveStep } from 'driver.js';
import { TOUR_DEFINITIONS, type TourId, type TourSegment } from '../tours/tour-definitions';
import { I18nService } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly router = inject(Router);
  private readonly i18n   = inject(I18nService);

  readonly tourActive         = signal(false);
  readonly currentTourId      = signal<TourId | null>(null);
  readonly globalSegmentIndex = signal(0);
  readonly currentStepId      = signal<string | null>(null);

  private driverInstance: Driver | null = null;
  private pendingSegments: TourSegment[] = [];
  private pendingSegmentIndex = 0;
  private isGlobal = false;

  constructor() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        if (!this.tourActive()) return;
        const url = (e as NavigationEnd).urlAfterRedirects.split('?')[0];
        this.launchSegmentForUrl(url);
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

    // Small delay to let the page render before highlighting elements
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
    localStorage.setItem(`tour_completed_${tourId}`, 'true');
  }

  isCompleted(tourId: TourId): boolean {
    return localStorage.getItem(`tour_completed_${tourId}`) === 'true';
  }

  resetTour(tourId: TourId): void {
    localStorage.removeItem(`tour_completed_${tourId}`);
  }

  resetAll(): void {
    const ids: TourId[] = ['home', 'calendar', 'notes', 'finance', 'tracker', 'global'];
    ids.forEach(id => this.resetTour(id));
  }

  startTourIfNewUser(): void {
    const key = 'tour_new_user';
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, 'true');
    // Small delay so the app finishes initial navigation first
    setTimeout(() => this.startGlobalTour(), 500);
  }
}
