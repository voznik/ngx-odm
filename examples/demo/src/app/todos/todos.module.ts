import { CommonModule } from '@angular/common';
import { Inject, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LetDirective } from '@ngrx/component';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import {
  KintoReplicationStrategy,
  conflictHandlerKinto,
  replicateKintoDB,
} from '@ngx-odm/rxdb/replication-kinto';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { lastValueFrom } from 'rxjs';
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
        // 1 means, this transforms data from version 0 to version 1
        1: function (doc) {
          doc.last_modified = new Date(doc.createdAt).getTime(); // string to unix
          return doc;
        },
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
    await lastValueFrom(this.collectionService.initialized$);
    const info = await this.collectionService.info();
    NgxRxdbUtils.logger.log('collection info:', { info });
    if (this.collectionService.db.storage.name !== 'dexie') {
      return;
    }
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
      retryTime: 15000,
      collection: this.collectionService.collection,
      kintoSyncOptions: {
        remote: environment.kintoServer,
        bucket: 'todo',
        collection: 'todos',
        strategy: KintoReplicationStrategy.CLIENT_WINS,
        heartbeat: 60000,
        headers: {
          Authorization: 'Basic ' + btoa('admin:adminadmin'),
        },
      },
      live: true,
      pull: {
        modifier: d => d,
        heartbeat: 60000,
      },
      push: {
        modifier: d => d,
      },
    });

    replicationState.error$.subscribe(err => {
      if (err.message.includes('unauthorized') || err.message.includes('Failed to fetch')) {
        replicationState.cancel();
        NgxRxdbUtils.logger.log('replicationState has error, cancel replication');
        NgxRxdbUtils.logger.log(err.message);
      } else {
        console.error(err);
      }
    });
  }
}
