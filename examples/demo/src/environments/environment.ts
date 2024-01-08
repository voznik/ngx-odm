// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  baseUrl: '/api/v1',
  kintoServer: '/kinto/v1',
  bucket: 'todo',
  collection: 'todos',
  couchDbRemote: 'localhost:5983', // process.env.COUCHDB_SERVER,
  couchDbSyncLive: true,
  couchDbSyncHeartbeat: 60,
};
