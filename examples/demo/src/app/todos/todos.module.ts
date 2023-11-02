import { CommonModule } from '@angular/common';
import { Inject, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LetDirective } from '@ngrx/component';
import { NgxRxdbModule } from '@ngx-odm/rxdb';
import { NgxRxdbCollection, NgxRxdbCollectionService } from '@ngx-odm/rxdb/collection';
import { getFetchWithAuthorizationBasic } from '@ngx-odm/rxdb/core';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { lastValueFrom } from 'rxjs';
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
        initialDocs: TODOS_INITIAL_STATE.items, // populate collection with initial data
      },
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
    const replicationState = replicateCouchDB({
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
