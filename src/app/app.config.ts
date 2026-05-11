import { APP_INITIALIZER, ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { credentialsInterceptor } from './interceptors/credentials.interceptor';
import { authErrorInterceptor } from './interceptors/auth-error.interceptor';
import { langInterceptor } from './interceptors/lang.interceptor';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor, authErrorInterceptor, langInterceptor])),
    { provide: APP_INITIALIZER, useFactory: (t: ThemeService) => () => t, deps: [ThemeService], multi: true },
    { provide: APP_INITIALIZER, useFactory: (auth: AuthService) => () => auth.refreshOnStartup(), deps: [AuthService], multi: true },
  ]
};
