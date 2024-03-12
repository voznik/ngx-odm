import { Inject, NgModule } from '@angular/core';
import { NgxRxdbCollection, NgxRxdbCollectionService } from './collection.service';

/**
 * (Fake) Feature module for NgxRxdbModule
 *
 * By being provided with `forChild` method of *root* NgxRxdbModule,
 * and by injecting `NgxRxdbCollectionService` in its constructor,
 * this module actually creates a collection with collectionService and provided config
 */
@NgModule({
  declarations: [],
  exports: [],
})
export class NgxRxdbFeatureModule {
  constructor(
    @Inject(NgxRxdbCollectionService) private collectionService: NgxRxdbCollection
  ) {}
}