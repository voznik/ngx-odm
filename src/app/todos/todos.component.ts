
import { Component, OnInit } from '@angular/core';
import { routeAnimations } from '../core/services';

@Component({
  selector: 'app-todos',
  template: `
  <nav mat-tab-nav-bar class="d-none d-sm-flex">
    <a mat-tab-link
      *ngFor="let e of examples"
      [routerLink]="e.link"
      routerLinkActive #rla="routerLinkActive"
      [active]="rla.isActive">
      {{e.label}}
    </a>
  </nav>

  <nav class="nav-responsive d-sm-none d-flex justify-content-center">
      <mat-select [placeholder]="'title'" [value]="'todos'">
        <mat-option *ngFor="let e of examples"
          [value]="e"
          [routerLink]="e.link">
            {{e.label}}
        </mat-option>
      </mat-select>
  </nav>

  <div [@routeAnimations]="o.isActivated && o.activatedRoute.routeConfig.path">
    <router-outlet #o="outlet"></router-outlet>
  </div>
  `,
  styles: [
    `
    nav {
      margin-bottom: 20px;

      .mat-tab-link {
        min-width: 120px;
        padding: 0 15px;
      }
    }
    `
  ],
  animations: [routeAnimations],
})
export class TodosComponent implements OnInit {

  examples = [
    { link: 'todos', label: 'Todos' }
  ];

  constructor() { }

  ngOnInit() {
    //
  }

}
