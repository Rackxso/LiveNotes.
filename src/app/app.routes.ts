import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { loggedInGuard } from './guards/logged-in.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    {
        path: 'login',
        canActivate: [loggedInGuard],
        loadComponent: () => import('./pages/auth/login').then(m => m.Login)
    },
    {
        path: 'register',
        canActivate: [loggedInGuard],
        loadComponent: () => import('./pages/auth/register').then(m => m.Register)
    },
    {
        path: 'forgot-password',
        canActivate: [loggedInGuard],
        loadComponent: () => import('./pages/auth/forgot-password').then(m => m.ForgotPassword)
    },
    {
        path: 'reset-password/:token',
        loadComponent: () => import('./pages/auth/reset-password').then(m => m.ResetPassword)
    },
    {
        path: 'email-confirmado',
        loadComponent: () => import('./pages/email-confirmado/email-confirmado').then(m => m.EmailConfirmado)
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/home/home').then(m => m.Home)
    },
    {
        path: 'calendar/month',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/calendarPage/calendarPage').then(m => m.CalendarPage)
    },
    {
        path: 'calendar/week',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/calendarPage/calendarPage').then(m => m.CalendarPage)
    },
    {
        path: 'calendar/day',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/calendarPage/calendarPage').then(m => m.CalendarPage)
    },
    {
        path: 'notes',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/notes/notes').then(m => m.Notes)
    },
    {
        path: 'finance',
        redirectTo: 'finance/overview',
        pathMatch: 'full'
    },
    {
        path: 'finance/overview',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/finance/finance').then(m => m.Finance)
    },
    {
        path: 'finance/transactions',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/finance/finance').then(m => m.Finance)
    },
    {
        path: 'finance/savings',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/finance/finance').then(m => m.Finance)
    },
    {
        path: 'tracker',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/tracker/tracker').then(m => m.Tracker)
    },
    {
        path: 'settings',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/settings/settings').then(m => m.Settings)
    },
    {
        path: 'help',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/help/help').then(m => m.Help)
    },
    {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadComponent: () => import('./pages/admin/admin').then(m => m.AdminComponent)
    }
];
