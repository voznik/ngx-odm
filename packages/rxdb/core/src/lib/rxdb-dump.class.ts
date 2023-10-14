import { RxDumpCollectionAny, RxDumpDatabaseAny } from 'rxdb/plugins/core';

export class NgxRxdbDump implements RxDumpDatabaseAny<any> {
  name = 'ngx-rxdb-dump';
  instanceToken!: string;
  timestamp!: number;
  encrypted = false;
  passwordHash = null;
  collections!: RxDumpCollectionAny<any>[];

  constructor(data: Partial<NgxRxdbDump>) {
    Object.assign(this, data);
  }
}

export class NgxRxdbCollectionDump<T = any> implements RxDumpCollectionAny<T> {
  encrypted = false;
  passwordHash = null;
  schemaHash!: string;
  name!: string;
  docs!: T[];

  constructor(data: Partial<RxDumpCollectionAny<T>>) {
    Object.assign(this, data);
  }
}
