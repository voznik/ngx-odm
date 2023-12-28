import { ApplicationRef, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {
  private router = inject(Router)
  private appRef = inject(ApplicationRef)
  constructor() {
    this.zonelessRouterStarter();
  }

  private zonelessRouterStarter(): void {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        // takeUntilDestroyed()
      )
      .subscribe(() => {
        this.appRef.tick();
      });
  }
}
