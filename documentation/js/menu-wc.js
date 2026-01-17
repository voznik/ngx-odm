'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">@ngx-odm documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                        <li class="link">
                            <a href="contributing.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CONTRIBUTING
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter additional">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#additional-pages"'
                            : 'data-bs-target="#xs-additional-pages"' }>
                            <span class="icon ion-ios-book"></span>
                            <span>Projects</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="additional-pages"' : 'id="xs-additional-pages"' }>
                                    <li class="link ">
                                        <a href="additional-documentation/rxdb.html" data-type="entity-link" data-context-id="additional">rxdb</a>
                                    </li>
                        </ul>
                    </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/NgxRxdbFeatureModule.html" data-type="entity-link" >NgxRxdbFeatureModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/NgxRxdbModule.html" data-type="entity-link" >NgxRxdbModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/RxDBCollectionService.html" data-type="entity-link" >RxDBCollectionService</a>
                            </li>
                            <li class="link">
                                <a href="classes/RxDBService.html" data-type="entity-link" >RxDBService</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/KintInfoResponse.html" data-type="entity-link" >KintInfoResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KintoAggregateResponse.html" data-type="entity-link" >KintoAggregateResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KintoBatchResponse.html" data-type="entity-link" >KintoBatchResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KintoConflictRecord.html" data-type="entity-link" >KintoConflictRecord</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KintoConflictResponse.html" data-type="entity-link" >KintoConflictResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KintoErrorResponse.html" data-type="entity-link" >KintoErrorResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KintoOperationResponse.html" data-type="entity-link" >KintoOperationResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KintoPaginatedParams.html" data-type="entity-link" >KintoPaginatedParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KintoPaginationResult.html" data-type="entity-link" >KintoPaginationResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KintoRequest.html" data-type="entity-link" >KintoRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/KintoResponseBody.html" data-type="entity-link" >KintoResponseBody</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NgxRxdbConfigOptions.html" data-type="entity-link" >NgxRxdbConfigOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RxCollectionCreatorOptions.html" data-type="entity-link" >RxCollectionCreatorOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RxDBDataframeArgs.html" data-type="entity-link" >RxDBDataframeArgs</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RxDbMetadata.html" data-type="entity-link" >RxDbMetadata</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="unit-test.html"><span class="icon ion-ios-podium"></span>Unit test coverage</a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});