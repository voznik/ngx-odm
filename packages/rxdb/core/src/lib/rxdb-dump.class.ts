import { merge } from '@ngx-odm/rxdb/utils';
import { RxDumpCollectionAny, RxDumpDatabaseAny } from 'rxdb/plugins/core';

export class NgxRxdbDump implements RxDumpDatabaseAny<any> {
  name = 'ngx-rxdb-dump';
  instanceToken!: string;
  timestamp!: number;
  encrypted = false;
  passwordHash = null;
  collections!: RxDumpCollectionAny<any>[];
  /** @internal */
  constructor(data: Partial<NgxRxdbDump>) {
    merge(this, data);
  }
}

export class NgxRxdbCollectionDump<T = any> implements RxDumpCollectionAny<T> {
  encrypted = false;
  passwordHash = undefined;
  schemaHash!: string;
  name!: string;
  docs!: T[];
  /** @internal */
  constructor(data: Partial<RxDumpCollectionAny<T>>) {
    merge(this, data);
  }

  toJSON() {
    return this as RxDumpCollectionAny<any>;
  }
}
