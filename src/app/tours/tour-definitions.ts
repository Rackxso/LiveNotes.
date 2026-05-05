export type TourId = 'home' | 'calendar' | 'notes' | 'finance' | 'tracker' | 'global';

export interface TourStepDef {
  element?: string;
  stepId?: string;
  popover: {
    titleKey: string;
    descriptionKey: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
  };
}

export interface TourSegment {
  route: string;
  steps: TourStepDef[];
}

export const TOUR_DEFINITIONS: Record<TourId, TourSegment[]> = {
  home: [
    {
      route: '/',
      steps: [
        { element: '.q1', popover: { titleKey: 'tour.home.step1Title', descriptionKey: 'tour.home.step1Desc', side: 'right' } },
        { element: '.q2', popover: { titleKey: 'tour.home.step2Title', descriptionKey: 'tour.home.step2Desc', side: 'left' } },
        { element: '.q3', popover: { titleKey: 'tour.home.step3Title', descriptionKey: 'tour.home.step3Desc', side: 'right' } },
        { element: '.q4', popover: { titleKey: 'tour.home.step4Title', descriptionKey: 'tour.home.step4Desc', side: 'left' } },
      ],
    },
  ],

  calendar: [
    {
      route: '/calendar/month',
      steps: [
        { element: 'app-month-view',     popover: { titleKey: 'tour.calendar.monthTitle',   descriptionKey: 'tour.calendar.monthDesc',   side: 'bottom' } },
        { element: '.mes',               popover: { titleKey: 'tour.calendar.navTitle',     descriptionKey: 'tour.calendar.navDesc',     side: 'bottom' } },
        { element: '.dias',              popover: { titleKey: 'tour.calendar.daysTitle',    descriptionKey: 'tour.calendar.daysDesc',    side: 'top'    } },
        { element: '.sheet-handle',      stepId: 'calendar-sheet',   popover: { titleKey: 'tour.calendar.sheetTitle',   descriptionKey: 'tour.calendar.sheetDesc',   side: 'top'    } },
        { element: 'app-eventos',        stepId: 'calendar-eventos', popover: { titleKey: 'tour.calendar.eventosTitle', descriptionKey: 'tour.calendar.eventosDesc', side: 'top'    } },
        { element: 'app-primary-button', popover: { titleKey: 'tour.calendar.addBtnTitle', descriptionKey: 'tour.calendar.addBtnDesc', side: 'bottom' } },
      ],
    },
    {
      route: '/calendar/week',
      steps: [
        { element: 'app-week-view', popover: { titleKey: 'tour.calendar.weekTitle', descriptionKey: 'tour.calendar.weekDesc', side: 'bottom' } },
      ],
    },
    {
      route: '/calendar/day',
      steps: [
        { element: 'app-day-view', popover: { titleKey: 'tour.calendar.dayTitle', descriptionKey: 'tour.calendar.dayDesc', side: 'bottom' } },
      ],
    },
  ],

  notes: [
    {
      route: '/notes',
      steps: [
        { element: '[aria-label="Notes"]', popover: { titleKey: 'tour.notes.notesOverviewTitle', descriptionKey: 'tour.notes.notesOverviewDesc', side: 'right'  } },
        { element: '.category-chips',      popover: { titleKey: 'tour.notes.categoriesTitle',    descriptionKey: 'tour.notes.categoriesDesc',    side: 'bottom' } },
        { element: '.notes-grid',          popover: { titleKey: 'tour.notes.gridTitle',           descriptionKey: 'tour.notes.gridDesc',           side: 'top'    } },
        { element: '.header-actions',      popover: { titleKey: 'tour.notes.actionsTitle',        descriptionKey: 'tour.notes.actionsDesc',        side: 'bottom' } },
        { element: '[aria-label="To-do"]', popover: { titleKey: 'tour.notes.todoOverviewTitle',  descriptionKey: 'tour.notes.todoOverviewDesc',  side: 'left'   } },
        { element: '.tabs-row',            popover: { titleKey: 'tour.notes.listsTitle',          descriptionKey: 'tour.notes.listsDesc',          side: 'bottom' } },
        { element: '.quick-add',           popover: { titleKey: 'tour.notes.quickAddTitle',       descriptionKey: 'tour.notes.quickAddDesc',       side: 'top'    } },
        { element: '.tab-body',            popover: { titleKey: 'tour.notes.subItemTitle',        descriptionKey: 'tour.notes.subItemDesc',        side: 'top'    } },
        { element: '.tab-sort-btn',        popover: { titleKey: 'tour.notes.smartSortTitle',      descriptionKey: 'tour.notes.smartSortDesc',      side: 'bottom' } },
      ],
    },
  ],

  finance: [
    {
      route: '/finance/overview',
      steps: [
        { element: '.money-cards',       popover: { titleKey: 'tour.finance.cardsTitle',     descriptionKey: 'tour.finance.cardsDesc',     side: 'bottom' } },
        { element: '.spending-insight',  popover: { titleKey: 'tour.finance.insightTitle',   descriptionKey: 'tour.finance.insightDesc',   side: 'top'    } },
        { element: '.bar-chart',         popover: { titleKey: 'tour.finance.chartTitle',     descriptionKey: 'tour.finance.chartDesc',     side: 'left'   } },
        { element: '.section-card',      popover: { titleKey: 'tour.finance.recentTitle',    descriptionKey: 'tour.finance.recentDesc',    side: 'top'    } },
      ],
    },
    {
      route: '/finance/transactions',
      steps: [
        { element: '.month-summary',  popover: { titleKey: 'tour.finance.txSummaryTitle', descriptionKey: 'tour.finance.txSummaryDesc', side: 'bottom' } },
        { element: '.filter-chips',   popover: { titleKey: 'tour.finance.txFilterTitle',  descriptionKey: 'tour.finance.txFilterDesc',  side: 'bottom' } },
        { element: '.date-group',     popover: { titleKey: 'tour.finance.txGroupTitle',   descriptionKey: 'tour.finance.txGroupDesc',   side: 'top'    } },
      ],
    },
    {
      route: '/finance/savings',
      steps: [
        { element: '.progress-card', popover: { titleKey: 'tour.finance.savingsProgressTitle', descriptionKey: 'tour.finance.savingsProgressDesc', side: 'bottom' } },
        { element: '.goals-grid',    popover: { titleKey: 'tour.finance.goalsGridTitle',        descriptionKey: 'tour.finance.goalsGridDesc',        side: 'top'    } },
        { element: '.add-goal',      popover: { titleKey: 'tour.finance.addGoalTitle',          descriptionKey: 'tour.finance.addGoalDesc',          side: 'top'    } },
      ],
    },
  ],

  tracker: [
    {
      route: '/tracker',
      steps: [
        { element: 'app-habit-tracker',    popover: { titleKey: 'tour.tracker.habitOverviewTitle', descriptionKey: 'tour.tracker.habitOverviewDesc', side: 'right'  } },
        { element: '.ht-today-grid',        popover: { titleKey: 'tour.tracker.habitTodayTitle',    descriptionKey: 'tour.tracker.habitTodayDesc',    side: 'bottom' } },
        { element: '.ht-grid',              popover: { titleKey: 'tour.tracker.habitGridTitle',     descriptionKey: 'tour.tracker.habitGridDesc',     side: 'top'    } },
        { element: '.ht-header-actions',    popover: { titleKey: 'tour.tracker.habitActionsTitle',  descriptionKey: 'tour.tracker.habitActionsDesc',  side: 'bottom' } },
        { element: 'app-mood-tracker',      popover: { titleKey: 'tour.tracker.moodOverviewTitle',  descriptionKey: 'tour.tracker.moodOverviewDesc',  side: 'left'   } },
        { element: '.mt-moods',             popover: { titleKey: 'tour.tracker.moodSelectTitle',    descriptionKey: 'tour.tracker.moodSelectDesc',    side: 'bottom' } },
        { element: '.mt-calendar-grid',     popover: { titleKey: 'tour.tracker.moodCalTitle',       descriptionKey: 'tour.tracker.moodCalDesc',       side: 'top'    } },
        { element: '.mt-streak-card',       popover: { titleKey: 'tour.tracker.moodStreakTitle',    descriptionKey: 'tour.tracker.moodStreakDesc',    side: 'left'   } },
      ],
    },
  ],

  global: [],
};

const GLOBAL_ORDER: TourId[] = ['home', 'calendar', 'notes', 'finance', 'tracker'];
TOUR_DEFINITIONS.global = GLOBAL_ORDER.flatMap(id => TOUR_DEFINITIONS[id]);

export const TOUR_META: Record<TourId, { labelKey: string; metaKey: string; icon: string }> = {
  home:     { labelKey: 'tour.home.label',     metaKey: 'tour.home.meta',     icon: 'fa-solid fa-house' },
  calendar: { labelKey: 'tour.calendar.label', metaKey: 'tour.calendar.meta', icon: 'fa-solid fa-calendar' },
  notes:    { labelKey: 'tour.notes.label',    metaKey: 'tour.notes.meta',    icon: 'fa-solid fa-note-sticky' },
  finance:  { labelKey: 'tour.finance.label',  metaKey: 'tour.finance.meta',  icon: 'fa-solid fa-hand-holding-dollar' },
  tracker:  { labelKey: 'tour.tracker.label',  metaKey: 'tour.tracker.meta',  icon: 'fa-solid fa-chart-line' },
  global:   { labelKey: 'tour.global.label',   metaKey: 'tour.global.meta',   icon: 'fa-solid fa-map' },
};
