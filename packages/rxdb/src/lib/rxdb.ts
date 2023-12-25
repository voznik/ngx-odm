import {
  DestroyRef,
  Injectable,
  Injector,
  Type,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import {
  SignalStoreFeature,
  patchState,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  InnerSignalStore,
  SignalStoreConfig,
  SignalStoreProps,
} from '@ngrx/signals/src/signal-store-models';
import { STATE_SIGNAL } from '@ngrx/signals/src/state-signal';

export function signalStore(
  ...args: [SignalStoreConfig, ...SignalStoreFeature[]] | SignalStoreFeature[]
): Type<SignalStoreProps<any>> {
  const signalStoreArgs = [...args];

  const config: Partial<SignalStoreConfig> =
    'providedIn' in signalStoreArgs[0]
      ? (signalStoreArgs.shift() as SignalStoreConfig)
      : {};
  const features = signalStoreArgs as SignalStoreFeature[];

  @Injectable({ providedIn: config.providedIn || null })
  class SignalStore {
    constructor() {
      const innerStore = features.reduce(
        (store, feature) => feature(store),
        getInitialInnerStore()
      );
      const { slices, signals, methods, hooks } = innerStore;
      const props = { ...slices, ...signals, ...methods };

      (this as any)[STATE_SIGNAL] = innerStore[STATE_SIGNAL];

      for (const key in props) {
        (this as any)[key] = props[key];
      }

      if (hooks.onInit) {
        hooks.onInit();
      }

      if (hooks.onDestroy) {
        const injector = inject(Injector);

        inject(DestroyRef).onDestroy(() => {
          runInInjectionContext(injector, hooks.onDestroy!);
        });
      }
    }
  }

  return SignalStore;
}

export function getInitialInnerStore(): InnerSignalStore {
  return {
    [STATE_SIGNAL]: signal({}),
    slices: {},
    signals: {},
    methods: {},
    hooks: {},
  };
}
