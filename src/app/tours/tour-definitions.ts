import type { DriveStep } from 'driver.js';

export type TourId = 'home' | 'calendar' | 'notes' | 'finance' | 'tracker' | 'global';

export interface TourSegment {
  route: string;
  steps: DriveStep[];
}

export const TOUR_DEFINITIONS: Record<TourId, TourSegment[]> = {
  home: [
    {
      route: '/',
      steps: [
        {
          element: '.q1',
          popover: {
            title: 'Resumen del día',
            description: 'Aquí ves el saludo, la fecha de hoy y un resumen rápido de tus finanzas del mes.',
            side: 'right',
          },
        },
        {
          element: '.q2',
          popover: {
            title: 'Calendario',
            description: 'Vista rápida de la semana actual con tus eventos del día y los próximos.',
            side: 'left',
          },
        },
        {
          element: '.q3',
          popover: {
            title: 'Finanzas',
            description: 'Resumen de ingresos, gastos y progreso de tus metas de ahorro.',
            side: 'right',
          },
        },
        {
          element: '.q4',
          popover: {
            title: 'Notas y tareas',
            description: 'Acceso rápido a tus notas recientes y lista de tareas pendientes.',
            side: 'left',
          },
        },
      ],
    },
  ],

  calendar: [
    {
      route: '/calendar/month',
      steps: [
        {
          element: 'app-header',
          popover: {
            title: 'Calendario mensual',
            description: 'Vista completa del mes. Haz clic en cualquier día para ver sus eventos.',
            side: 'bottom',
          },
        },
        {
          element: '.month-grid, .calendar-grid, app-month-view',
          popover: {
            title: 'Cuadrícula mensual',
            description: 'Navega por los días del mes y visualiza todos tus eventos de un vistazo.',
            side: 'top',
          },
        },
      ],
    },
    {
      route: '/calendar/week',
      steps: [
        {
          element: 'app-header',
          popover: {
            title: 'Vista semanal',
            description: 'Organiza tu semana hora por hora con la vista de columnas.',
            side: 'bottom',
          },
        },
      ],
    },
    {
      route: '/calendar/day',
      steps: [
        {
          element: 'app-header',
          popover: {
            title: 'Vista diaria',
            description: 'El detalle completo de un día: todos los eventos en orden cronológico.',
            side: 'bottom',
          },
        },
      ],
    },
  ],

  notes: [
    {
      route: '/notes',
      steps: [
        {
          element: '[aria-label="Notes"]',
          popover: {
            title: 'Notas',
            description: 'Escribe y organiza tus notas por categorías. Usa la búsqueda para encontrarlas rápido.',
            side: 'right',
          },
        },
        {
          element: '.category-chips',
          popover: {
            title: 'Filtros por categoría',
            description: 'Crea categorías propias y filtra tus notas al instante.',
            side: 'bottom',
          },
        },
        {
          element: '[aria-label="To-do"]',
          popover: {
            title: 'Lista de tareas',
            description: 'Gestiona tus tareas pendientes junto a tus notas en la misma pantalla.',
            side: 'left',
          },
        },
      ],
    },
  ],

  finance: [
    {
      route: '/finance/overview',
      steps: [
        {
          element: '.finance-body, app-finance-overview',
          popover: {
            title: 'Resumen financiero',
            description: 'Vista general de ingresos, gastos y balance del mes actual.',
            side: 'bottom',
          },
        },
      ],
    },
    {
      route: '/finance/transactions',
      steps: [
        {
          element: '.finance-body, app-finance-transactions',
          popover: {
            title: 'Transacciones',
            description: 'Registra y consulta todos tus movimientos: ingresos y gastos con categorías.',
            side: 'bottom',
          },
        },
      ],
    },
    {
      route: '/finance/savings',
      steps: [
        {
          element: '.finance-body, app-finance-savings',
          popover: {
            title: 'Ahorros',
            description: 'Define metas de ahorro y sigue tu progreso mes a mes.',
            side: 'bottom',
          },
        },
      ],
    },
  ],

  tracker: [
    {
      route: '/tracker',
      steps: [
        {
          element: 'app-habit-tracker',
          popover: {
            title: 'Seguimiento de hábitos',
            description: 'Registra y visualiza el cumplimiento de tus hábitos diarios.',
            side: 'right',
          },
        },
        {
          element: 'app-mood-tracker',
          popover: {
            title: 'Estado de ánimo',
            description: 'Registra cómo te sientes cada día y observa patrones a lo largo del tiempo.',
            side: 'left',
          },
        },
      ],
    },
  ],

  global: [],
};

const GLOBAL_ORDER: TourId[] = ['home', 'calendar', 'notes', 'finance', 'tracker'];

TOUR_DEFINITIONS.global = GLOBAL_ORDER.flatMap(id => TOUR_DEFINITIONS[id]);

export const TOUR_META: Record<TourId, { label: string; description: string; icon: string }> = {
  home:     { label: 'Inicio',     description: 'Conoce el panel principal con el resumen del día.',         icon: 'fa-solid fa-house' },
  calendar: { label: 'Calendario', description: 'Descubre las vistas mensual, semanal y diaria.',            icon: 'fa-solid fa-calendar' },
  notes:    { label: 'Notas',      description: 'Aprende a organizar notas por categorías y tareas.',        icon: 'fa-solid fa-note-sticky' },
  finance:  { label: 'Finanzas',   description: 'Navega por el resumen, transacciones y ahorros.',          icon: 'fa-solid fa-hand-holding-dollar' },
  tracker:  { label: 'Tracker',    description: 'Usa el seguimiento de hábitos y estado de ánimo.',         icon: 'fa-solid fa-chart-line' },
  global:   { label: 'Tour completo', description: 'Recorre toda la aplicación de principio a fin.',        icon: 'fa-solid fa-map' },
};
