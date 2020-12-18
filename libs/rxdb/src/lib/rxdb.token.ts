import { InjectionToken } from '@angular/core';
import { NgxRxdbCollectionConfig, NgxRxdbConfig } from './rxdb.interface';

export const RXDB_CONFIG = new InjectionToken<NgxRxdbConfig>('NgxRxdbConfig');
export const RXDB_FEATURE_CONFIG = new InjectionToken<NgxRxdbCollectionConfig>(
  'NgxRxdbCollectionConfig'
);
