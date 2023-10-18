# @ngx-odm/rxdb

> Angular 10+ wrapper for **RxDB** - A realtime Database for the Web

## Demo

![Example screenshot](examples/demo/src/assets/images/screenshot.png)

[demo](https://voznik.github.io/ngx-odm/) - based on TodoMVC

## Table of contents

- [@ngx-odm/rxdb](#ngx-odmrxdb)
  - [Demo](#demo)
  - [Table of contents](#table-of-contents)
  - [General info](#general-info)
  - [Technologies](#technologies)
  - [Install](#install)
  - [Usage](#usage)
    - [In your `AppModule`](#in-your-appmodule)
    - [In your `FeatureModule`](#in-your-featuremodule)
    - [In your `FeatureService`](#in-your-featureservice)
  - [Features](#features)
  - [Diagrams](#diagrams)
  - [Status](#status)
  - [Inspiration](#inspiration)
  - [Contact](#contact)

## General info

If you don't want to setup RxDB manually in your next Angular project - just import `NgxRxdbModule`

## Technologies

| RxDB |Angular 10+|
|------|------|
|[![RxDB](https://cdn.rawgit.com/pubkey/rxdb/ba7c9b80/docs/files/logo/logo_text.svg)](https://rxdb.info/)|[![Angular](https://angular.io/assets/images/logos/angular/angular.svg )](https://angular.io/)|

## Install

`npm install @ngx-odm/rxdb`

## Usage

### In your `AppModule`

```typescript
@NgModule({
  imports: [
    // ... other imports
    // ...
    NgxRxdbModule.forRoot({
      // optional, NgxRxdbConfig extends RxDatabaseCreator, will be merged with default config
      name: 'ngx',                        // <- name (required, 'ngx')
      adapter: 'idb',                     // <- storage-adapter (required, default: 'idb')
      password: '123456789',              // <- password (optional)
      multiInstance: true,                // <- multiInstance (optional, default: true)
      queryChangeDetection: false,        // <- queryChangeDetection (optional, default: false)
      options: {                          // NgxRxdb options (optional)
        schemas: [ ...CollectionConfigs], // array of NgxRxdbCollectionConfig (optional)
        dumpPath: 'assets/dump.json'      // path to datbase dump file (optional)
      }
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### In your `FeatureModule`

>Schemas define how your data looks. Which field should be used as primary, which fields should be used as indexes and what should be encrypted. The schema also validates that every inserted document of your collections conforms to the schema. Every collection has its own schema. With RxDB, schemas are defined with the jsonschema-standard which you might know from other projects.
> https://rxdb.info/rx-schema.html

```typescript
// create or import your schema
const todoSchema: RxSchema = require('../../../assets/data/todo.schema.json');
// create config
// NgxRxdbCollectionConfig extends RxCollectionCreator
const todoCollectionConfig: NgxRxdbCollectionConfig = {
  name: 'todo',                           // <- name (required)
  schema: todoSchema,                     // <- name (required)
  statics: {},                            // <- collection methods (optional)
  methods: {},                            // <- instance-methods methods (optional)
  options: {
    initialDocs: [] // docs to be imported into empty collection (optional)
  }
};

@NgModule({
  imports: [
    // ... other imports
    NgxRxdbModule.forFeature(todoCollectionConfig),
  ],
  // declarations
  // providers
})
export class TodosModule {}
```

### In your `FeatureService`

```typescript
@Injectable()
export class TodosService {
  // store & get filter as property of a `local` document
  filter$ = this.collectionService
    .getLocal('local', 'filterValue')
    .pipe(startWith('ALL'), distinctUntilChanged());
  // get count of documents in collection as observable (use fast calculation with static colection method)
  count$ = this.collectionService.count();

  constructor(private collectionService: NgxRxdbCollectionService<Todo>) {}
  // get documents from collection as observable using `RxQuery` mango-queries
  selectTodos(): Observable<Todo[]> {
    return this.filter$.pipe(
      switchMap(filterValue => {
        const queryObj = {
          selector: {
            createdAt: {
              $gt: null,
            },
            completed: filterValue === 'COMPLETED',
          },
          sort: [{ createdAt: 'desc' } as any],
        };
        return this.collectionService.docs(queryObj);
      })
    );
  }

  // add new document
  add(name: string): void {
    const payload: Todo = { guid: uuid(), name, done: false, dateCreated: Date.now() };
    this.collectionService.insert(payload);
  }

  // update prop od existing document
  toggle(guid: string, done: boolean): void {
    this.collectionService.update(guid, { done });
  }

  // use `bulk` to delete all dcouments by qeury
  removeDoneTodos(): void {
    const rulesObject = { done: { $eq: true } };
    this.collectionService.removeBulkBy(rulesObject);
  }
  // ...
}
```

## Features

By using this module you can

* Automatically initialize db with settings, optionally provide db dumb to pre-fill with collections & documents
* Automatically initialize RxCollection for each _lazy-loaded Feature module_ with config
* Work straight with `db.collection` or via _NgxRxdbCollectionService_ wrapper with some helper methods

To-do list:

* Enable sync
* ...

## Diagrams

![NgxRxdbModule Initialization UML](examples/uml.NgxRxdbModule.png)
NgxRxdbModule Initialization UML

![NgxRxdbService Sequence UML](examples/uml.NgxRxdbService.png)
NgxRxdbModule Initialization UML

## Status

Project is: _in progress_

## Inspiration

Project inspired by

* [rxdb-angular2-example](https://github.com/pubkey/rxdb/blob/master/examples/angular2/README.md#rxdb-angular2-example)
* [Angular NgRx Material Starter](https://tomastrajan.github.io/angular-ngrx-material-starter#/examples/todos)
* _The Angular Library Series_ from [Angular In Depth](https://blog.angularindepth.com/)

## Contact

Created by [@voznik](https://github.com/voznik) - feel free to contact me!
