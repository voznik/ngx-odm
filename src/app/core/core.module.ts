import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ErrorHandler, NgModule, Optional, SkipSelf } from '@angular/core';
import { AnimationsService, AppErrorHandler, LocalStorageService, TitleService } from './services';


@NgModule({
  imports: [
    // angular
    CommonModule,
    HttpClientModule,
  ],
  declarations: [],
  providers: [
    LocalStorageService,
    AnimationsService,
    TitleService,
    { provide: ErrorHandler, useClass: AppErrorHandler },
  ],
  exports: []
})
export class CoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: CoreModule
  ) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only in AppModule');
    }
  }
}
