import { Inject, Injectable, InjectionToken } from '@angular/core';
import Kinto from 'kinto';
import { KintoBaseOptions } from 'kinto/lib/KintoBase';

export type NgxKintoOptions = KintoBaseOptions & {
  custom?: any;
};
export const NGX_KINTO_OPTIONS = new InjectionToken<NgxKintoOptions>(
  'NgxKintoOptions'
);

// @dynamic
@Injectable()
export class NgxKintoService {
  private _db: Kinto;

  public get db(): Kinto {
    return this._db;
  }

  constructor(@Inject(NGX_KINTO_OPTIONS) options: NgxKintoOptions) {
    options = {
      ...options,
      adapterOptions: {
        // dbName: "DemoDB",  // Optional custom database name
        migrateOldData: true,
        // remote: "https://kinto.dev.mozaws.net/v1/",
        // headers: {Authorization: "Basic " + btoa("user:pass")}
      },
    };
    this._db = new Kinto(options);
  }
}
