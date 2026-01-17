import { ErrorHandler, inject, Injector, Provider } from '@angular/core';
import { RXDB } from '@ngx-odm/rxdb';

export function provideDbErrorHandler(): Provider {
  return {
    provide: ErrorHandler,
    useFactory: () => {
      const injector = inject(Injector);
      return {
        handleError: (error: any) => {
          const dbService = injector.get(RXDB);
          if (dbService && error.code === 'DB6') {
            console.warn(
              `[DB_ERROR_HANDLER] Database schema has changed. Destroying database and reloading page...`
            );
            dbService.destroyDb().then(() => {
              window.location.reload();
            });
          } else {
            console.error(error);
          }
        },
      };
    },
  };
}
