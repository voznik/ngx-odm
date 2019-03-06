import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { LocalStorageService, routeAnimations } from '@app/core/services';
import { environment as env } from '@env/environment';
import browser from 'browser-detect';
import { Observable, of } from 'rxjs';

declare var require: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [routeAnimations]
})
export class AppComponent implements OnInit {
  isProd = env.production;
  envName = 'env.envName';
  version = 'env.versions.app';
  year = new Date().getFullYear();
  logo = require('../assets/logo.png');
  navigation = [
    { link: 'todos', label: 'Todos' },
  ];
  navigationSideMenu = [
    ...this.navigation,
    // { link: 'settings', label: 'anms.menu.settings' }
  ];

  stickyHeader$: Observable<boolean> = of(true);
  theme$: Observable<string> = of('default-theme'); // black-theme

  constructor(
    private storageService: LocalStorageService
  ) {}

  private static isIEorEdgeOrSafari() {
    return ['ie', 'edge', 'safari'].includes(browser().name);
  }

  ngOnInit(): void {
    this.storageService.testLocalStorage();
    if (isPlatformBrowser(PLATFORM_ID) && AppComponent.isIEorEdgeOrSafari()) {
      //
    }

  }

  toggleTheme() {

  }

}
