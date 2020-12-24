import { AsyncPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

/**
 * @see https://github.com/pubkey/rxdb/blob/master/examples/angular/src/app/pipes/async-no-zone.pipe.ts
 * Because RxDB calculates queries with caching and things,
 * they do not run in angulars zone.
 * @link https://stackoverflow.com/questions/35513015/async-pipe-not-rendering-the-stream-updates
 * To not have to run changeDetection on each emit for each subscribed query,
 * we use a different async-pipe that runs the change-detection on emit.
 *
 * @note in Angular 10+ you may need to disable checking of a binding expression
 *  by surrounding the expression in a call to the $any() cast pseudo-function
 * in your html template, e.g.
 *
 * ``` *ngIf="$any(todos$ | asyncNoZone) as todos"> ```
 *
 */
@Pipe({
  name: 'asyncNoZone',
  pure: false,
})
export class NgxRxdbAsyncNoZonePipe extends AsyncPipe implements PipeTransform {}
// monkeypatch the private method with detectChanges() instead of markForCheck()
NgxRxdbAsyncNoZonePipe.prototype['_updateLatestValue'] = function (
  async: any,
  value: AnyObject
): void {
  if (async === this['_obj']) {
    this['_latestValue'] = value;
    this['_ref'].detectChanges();
  }
};
