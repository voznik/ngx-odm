import { ApplicationRef, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, tap } from 'rxjs';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  private router = inject(Router);
  private appRef = inject(ApplicationRef);
  constructor() {
    this.zonelessCD();
  }

  private zonelessCD(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        tap(() => {
          this.appRef.tick();
        }),
        takeUntilDestroyed()
      )
      .subscribe();
  }
}
