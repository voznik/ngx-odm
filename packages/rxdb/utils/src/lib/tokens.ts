import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

/**
 * An abstraction over global window object
 * @internal
 */
export const WINDOW = new InjectionToken<Window>(
  'An abstraction over global window object',
  {
    /* istanbul ignore next */
    factory: () => {
      const { defaultView } = inject(DOCUMENT);
      if (!defaultView) {
        throw new Error('Window is not available');
      }

      return defaultView;
    },
  }
);

/**
 * An abstraction over window.localStorage object
 * @internal
 */
export const LOCAL_STORAGE = new InjectionToken<Storage>(
  'An abstraction over window.localStorage object',
  {
    /* istanbul ignore next */
    factory: () => inject(WINDOW).localStorage,
  }
);
