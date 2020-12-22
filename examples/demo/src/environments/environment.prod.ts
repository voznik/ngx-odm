export const environment = {
  production: true,
  baseUrl: process.env.API_URL || '/api/v1',
  couchDbRemote: process.env.COUCHDB_SERVER,
  couchDbSyncLive: Boolean(process.env.COUCHDB_SYNC_LIVE),
  couchDbSyncHeartbeat: Boolean(process.env.COUCHDB_SYNC_HEARTBEAT),
};
