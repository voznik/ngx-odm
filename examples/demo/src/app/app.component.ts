import { Component } from '@angular/core';

@Component({
  selector: 'demo-root',
  template: `
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      /*  */
      :host {
        display: block;
        font:
          14px 'Helvetica Neue',
          Helvetica,
          Arial,
          sans-serif;
        line-height: 1.4em;
        background: #f5f5f5;
        color: #4d4d4d;
        min-width: 230px;
        max-width: 550px;
        margin: 0 auto;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-weight: 300;
      }

      .flex {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
  standalone: false,
})
export class AppComponent {}
