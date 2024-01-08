export const environment = {
  production: true,
  baseUrl: '/api/v1',
  kintoServer: 'https://demo.kinto-storage.org/v1/',
  bucket: 'default',
  collection: 'todos',
  couchDbRemote: 'localhost:5983', // process.env.COUCHDB_SERVER,
  couchDbSyncLive: true,
  couchDbSyncHeartbeat: 60,
};
