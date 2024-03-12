import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { TODOS_COLLECTION_CONFIG, TODO_SCHEMA } from '@shared';
// import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { NgxRxdbUtils } from '@ngx-odm/rxdb/utils';
import { loadRxDBPlugins } from '@ngx-odm/rxdb/config';

const { logger } = NgxRxdbUtils;
const syncURL = 'http://' + window.location.hostname + ':10102/';

logger.log('host: ' + syncURL);

let dbPromise = null;

const _create = async () => {
  await loadRxDBPlugins();

  logger.log('DatabaseService: creating database..');
  const db = await createRxDatabase({
    name: 'heroesreactdb',
    storage: getRxStorageDexie(),
  });
  logger.log('DatabaseService: created database');
  window['db'] = db; // write to window for debugging

  // create collections
  logger.log('DatabaseService: create collections');
  await db.addCollections({
    [TODOS_COLLECTION_CONFIG.name]: { ...TODOS_COLLECTION_CONFIG, schema: TODO_SCHEMA },
  });

  /*

  // sync
  logger.log('DatabaseService: sync');
  await Promise.all(
    Object.values(db.collections).map(async col => {
      try {
        // create the CouchDB database
        await fetch(syncURL + col.name + '/', {
          method: 'PUT',
        });
      } catch (err) {
        logger.log('e', err);
      }
    })
  );

  logger.log('DatabaseService: sync - start live');

  Object.values(db.collections)
    .map(col => col.name)
    .map(colName => {
      const url = syncURL + colName + '/';
      logger.log('url: ' + url);
      const replicationState = replicateCouchDB({
        collection: db[colName],
        url,
        live: true,
        pull: {},
        push: {},
        autoStart: true,
      });
      replicationState.error$.subscribe(err => {
        logger.log('Got replication error:');
        console.dir(err);
      });
    }); */

  return db;
};

export const get = () => {
  if (!dbPromise) dbPromise = _create();
  return dbPromise;
};
