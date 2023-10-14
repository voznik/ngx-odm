import { Inject, NgModule } from '@angular/core';
import { NgxRxdbCollectionService, NgxRxdbCollection } from './rxdb-collection.service';
import { NgxRxdbAsyncNoZonePipe } from './rxdb-async-no-zone.pipe';

/**
 * (Fake) Feature module for NgxRxdbModule
 *
 * By being provided with `forChild` method of *root* NgxRxdbModule,
 * and by injecting `NgxRxdbCollectionService` in its constructor,
 * this module actually creates a collection with collectionService and provided config
 */
@NgModule({
  declarations: [NgxRxdbAsyncNoZonePipe],
  exports: [NgxRxdbAsyncNoZonePipe],
})
export class NgxRxdbFeatureModule {
  constructor(
    @Inject(NgxRxdbCollectionService) private collectionService: NgxRxdbCollection<any>
  ) {
    collectionService.info().subscribe!(info => {
      console.log('NgxRxdbFeatureModule:collectionService:info', info);
    });
  }
}
