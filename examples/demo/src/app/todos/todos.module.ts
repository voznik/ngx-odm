import { CommonModule } from '@angular/common';
import { Inject, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LetDirective, PushPipe } from '@ngrx/component';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import {
  KintoReplicationStrategy,
  conflictHandlerKinto,
  replicateKintoDB,
} from '@ngx-odm/rxdb/replication-kinto';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { fromEvent, lastValueFrom, takeWhile } from 'rxjs';
import { environment } from '../../environments/environment';
import { TodosComponent } from './components/todos/todos.component';
import { TodosPipe } from './components/todos/todos.pipe';
import { TODOS_INITIAL_STATE, Todo } from './models';
import { TodosService } from './services';
import { TodosRoutingModule } from './todos-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    LetDirective,
    PushPipe,
    TodosRoutingModule,
    NgxRxdbModule.forFeature({
      name: 'todo',
      localDocuments: true,
      schema: undefined, // to load schema from remote url pass `undefined` here
      options: {
        schemaUrl: 'assets/data/todo.schema.json', // load schema from remote url
        initialDocs: TODOS_INITIAL_STATE.items, // populate collection with initial data,
        recreate: undefined,
        replication: true,
      },
      autoMigrate: true,
      migrationStrategies: {
        1: function (doc) {
          if (doc._deleted) {
            return null;
          }
          doc.last_modified = new Date(doc.createdAt).getTime(); // string to unix
          return doc;
        },
        2: function (doc) {
          if (doc._deleted) {
            return null;
          }
          doc.createdAt = new Date(doc.createdAt).toISOString(); // to string
          return doc;
        },
        3: d => d,
      },
      conflictHandler: conflictHandlerKinto,
    }),
  ],
  declarations: [TodosComponent, TodosPipe],
  providers: [TodosService],
})
export class TodosModule {
  constructor(
    @Inject(NgxRxdbCollectionService) private collectionService: NgxRxdbCollection<Todo>
  ) {
    this.onCollectionInit();
  }

  async onCollectionInit() {
    await this.collectionService.initialized$.toPromise();
    const info = await this.collectionService.info();
    NgxRxdbUtils.logger.log('collection info:', { info });

    /* const replicationState = replicateCouchDB({
      replicationIdentifier: 'demo-couchdb-replication',
      retryTime: 15000,
      collection: this.collectionService.collection,
      url: 'http://localhost:5984/demo/',
      live: true,
      fetch: getFetchWithAuthorizationBasic('admin ', 'adminadmin'),
      pull: {
        batchSize: 60,
        modifier: docData => {
          return docData;
        },
        heartbeat: 60000,
      },
      push: {
        batchSize: 60,
        modifier: docData => {
          return docData;
        },
      },
    }); */

    const replicationState = replicateKintoDB<Todo>({
      replicationIdentifier: 'demo-kinto-replication:todo',
      collection: this.collectionService.collection,
      kintoSyncOptions: {
        remote: environment.kintoServer,
        bucket: 'todo',
        collection: 'todos',
        strategy: KintoReplicationStrategy.CLIENT_WINS,
        heartbeat: 60000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + btoa('admin:adminadmin'),
        },
      },
      retryTime: 15000,
      live: true,
      autoStart: true,
      pull: {
        batchSize: 60,
        modifier: d => d,
      },
      push: {
        modifier: d => d,
      },
    });

    // Re-sync replication when back online
    fromEvent(window, 'online')
      .pipe(takeWhile(() => !replicationState.isStopped()))
      .subscribe(() => {
        NgxRxdbUtils.logger.log('online');
        replicationState.reSync();
      });

    replicationState.error$.subscribe(err => {
      if (
        err.message.includes('unauthorized')
        // || err.message.includes('Failed to fetch')
      ) {
        replicationState.cancel();
        NgxRxdbUtils.logger.log('replicationState has error, cancel replication');
        NgxRxdbUtils.logger.log(err.message);
      } else {
        console.error(err);
      }
    });
  }
}
