import { InjectionToken } from '@angular/core';
import { NgxRxdbCollectionConfig, NgxRxdbConfig } from './rxdb.model';

export const RXDB_CONFIG = new InjectionToken<NgxRxdbConfig>('NgxRxdbConfig');

export const RXDB_CONFIG_COLLECTION = new InjectionToken<NgxRxdbCollectionConfig>('NgxRxdbCollectionConfig');
