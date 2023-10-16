/* eslint-disable jsdoc/require-jsdoc */
import { AsyncPipe } from '@angular/common';
import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  Pipe,
  PipeTransform,
} from '@angular/core';

/**
 * @deprecated
 * @see https://github.com/pubkey/rxdb/blob/master/examples/angular/src/app/pipes/async-no-zone.pipe.ts
 * Because RxDB calculates queries with caching and things,
 * they do not run in angulars zone.
 * @link https://stackoverflow.com/questions/35513015/async-pipe-not-rendering-the-stream-updates
 * To not have to run changeDetection on each emit for each subscribed query,
 * we use a different async-pipe that runs the change-detection on emit.
 * @note in Angular 10+ you may need to disable checking of a binding expression
 *  by surrounding the expression in a call to the $any() cast pseudo-function
 * in your html template, e.g.
 *
 * ``` *ngIf="$any(todos$ | asyncNoZone) as todos"> ```
 */
@Pipe({
  name: 'asyncNoZone',
  pure: false,
})
export class NgxRxdbAsyncNoZonePipe extends AsyncPipe implements PipeTransform {}
// monkeypatch the private method with detectChanges() instead of markForCheck()
NgxRxdbAsyncNoZonePipe.prototype['_updateLatestValue'] = function (
  async: unknown,
  value: Record<string, unknown>
): void {
  if (async === this['_obj']) {
    this['_latestValue'] = value;
    this['_ref'].detectChanges();
  }
};

///////////////////////////////////

export class NgxLetContext {
  $implicit: unknown = null;
  ngxLet: unknown = null;
}
/**
 * We often use *ngIf="stream$ | async as stream" to subscribe to an observable property and
 * rename it to a template variable. But with nested template, *ngIf might remove your template which may not be expected.
 *
 * `*ngxLet` just hold a reference to the result of `async` pipe in a template variable and
 * don't have any special logic like structure directives such as `*ngIf` or `*ngFor`
 * so it run faster and very handy.
 * You can also subscribe to multiple observable separately with `*ngxLet` like this:
 * @example ```html
 * <ng-container
 *   ngxLet="{
 *         device: device$ | async,
 *         date: filterDate$ | async
 *       } as options">
 *   <pick-date
 *     [registeredAt]="options.device?.registeredAt"
 *     [firstDate]="options.date?.from"
 *     [secondDate]="options.date?.to"
 *   ></pick-date>
 * </ng-container>
 * ```
 */
@Directive({
  selector: '[ngxLet]',
})
export class NgxRxdbLetDirective implements OnInit {
  private _context = new NgxLetContext();

  @Input()
  set ngxLet(value: unknown) {
    this._context.$implicit = this._context.ngxLet = value;
  }

  constructor(
    private _vcr: ViewContainerRef,
    private _templateRef: TemplateRef<NgxLetContext>
  ) {}

  ngOnInit() {
    this._vcr.createEmbeddedView(this._templateRef, this._context);
  }
}
