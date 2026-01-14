import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { RenderScheduler } from '@ngrx/component';
import { filter } from 'rxjs';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `,
  providers: [RenderScheduler],
})
export class AppComponent {
  private router = inject(Router);
  private renderScheduler = inject(RenderScheduler);

  constructor() {
    this.zonelessCD();
  }

  private zonelessCD(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.renderScheduler.schedule());
  }
}
