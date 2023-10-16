import { Inject, NgModule } from '@angular/core';
import { NgxRxdbAsyncNoZonePipe, NgxRxdbLetDirective } from './rxdb-collection.pipe';
import { NgxRxdbCollectionService, NgxRxdbCollection } from './rxdb-collection.service';

/**
 * (Fake) Feature module for NgxRxdbModule
 *
 * By being provided with `forChild` method of *root* NgxRxdbModule,
 * and by injecting `NgxRxdbCollectionService` in its constructor,
 * this module actually creates a collection with collectionService and provided config
 */
@NgModule({
  declarations: [NgxRxdbAsyncNoZonePipe, NgxRxdbLetDirective],
  exports: [NgxRxdbAsyncNoZonePipe, NgxRxdbLetDirective],
})
export class NgxRxdbFeatureModule {
  constructor(
    @Inject(NgxRxdbCollectionService) private collectionService: NgxRxdbCollection<any>
  ) {
    collectionService.info().subscribe!(info => {
      console.debug('collectionService:info', info);
    });
  }
}
