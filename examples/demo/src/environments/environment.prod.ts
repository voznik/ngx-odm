export const environment = {
  production: true,
  baseUrl: '/api/v1',
  kintoServer: 'https://demo.kinto-storage.org/v1/',
  couchDbRemote: process.env.COUCHDB_SERVER,
  couchDbSyncLive: Boolean(process.env.COUCHDB_SYNC_LIVE),
  couchDbSyncHeartbeat: Boolean(process.env.COUCHDB_SYNC_HEARTBEAT),
};
