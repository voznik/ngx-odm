# NgxRxdb

> Angular 7+ wrapper for **RxDB** - A realtime Database for the Web

## Demo

[demo](https://voznik.github.io/ngx-rxdb/)

## Table of contents

* [General info](#general-info)
* [Screenshots](#screenshots)
* [Technologies](#technologies)
* [Install](#install)
* [Usage](#usage)
* [Features](#features)
* [Status](#status)
* [Inspiration](#inspiration)
* [Contact](#contact)

## General info

If you don't want to setup RxDB manually in your next Angular project - just import `NgxRxdbModule`

## Screenshots

![Example screenshot](./screenshot.png)

## Technologies

| RxDB |Angular 7+|
|------|------|
|[![RxDB](https://cdn.rawgit.com/pubkey/rxdb/ba7c9b80/docs/files/logo/logo_text.svg)](https://rxdb.info/)|[![Angular](https://angular.io/assets/images/logos/angular/angular.svg )](https://angular.io/)|

## Install

Describe how to install / setup your local environement / add link to demo version.

## Usage

### In your `AppModule`

```typescript
@NgModule({
  imports: [
    // ... other imports
    // ...
    NgxRxdbModule.forRoot({
      // optional, NgxRxdbConfig extends RxDatabaseCreator, will be merged with default config
      name: 'ngx',                        // <- name (optional, 'ngx')
      adapter: 'idb',                     // <- storage-adapter (optional, default: 'idb')
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
  // ...
  filter$ = new BehaviorSubject<TodosFilter>('ALL');
  constructor(private collectionService: NgxRxdbCollectionService<Todo>) {}
  // get documents from collection as observable using `RxQuery` mango-queries
  selectTodos(): Observable<Todo[]> {
    return this.filter$.pipe(
      switchMap(filterValue => {
        const rulesObject = {
          $and: [{ dateCreated: { $gt: null } }],
        };
        filterValue === 'ALL'
          ? noop()
          : rulesObject.$and.push({ done: { $eq: filterValue === 'DONE' } });
        return this.collectionService.docs(rulesObject, '-dateCreated');
      })
    );
  }

  // add new document
  add(name: string): void {
    const payload: Todo = { guid: uuid(), name, done: false, dateCreated: Date.now() };
    this.collectionService.insert(payload).subscribe(doc => console.log(doc));
  }

  // update prop od existing document
  toggle(guid: string, done: boolean): void {
    this.collectionService.update(guid, { done }).subscribe(doc => console.log(doc));
  }

  // use `pouchdb.bulkDocs` to delete all dcouments by qeury
  removeDoneTodos(): void {
    const rulesObject = { done: { $eq: true } };
    this.collectionService.removeBulkBy(rulesObject).subscribe(res => this.changeFilter('ALL'));
  }
  // ...
}
```

### AOT

ATM, set **"buildOptimizer": false** in your `angular.json` _production_ configuration

## Features

By using this module you can

* Automatically initialize db with settings, optionally provide db dumb to pre-fill with collections & documents
* Automatically initialize RxCollection for each _lazy-loaded Feature module_ with config
* Work straight with `db.collection` or via _NgxRxdbCollectionService_ wrapper with some helper methods

To-do list:

* Enable sync
* ...

## Status

Project is: _in progress_

## Inspiration

Project inspired by

* [rxdb-angular2-example](https://github.com/pubkey/rxdb/blob/master/examples/angular2/README.md#rxdb-angular2-example)
* [Angular NgRx Material Starter](https://tomastrajan.github.io/angular-ngrx-material-starter#/examples/todos)
* _The Angular Library Series_ from [Angular In Depth](https://blog.angularindepth.com/)

## Contact

Created by [@voznik](https://github.com/voznik) - feel free to contact me!
