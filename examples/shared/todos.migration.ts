// in this example we have 3 migrations, since the beginning of development
export const todosMigrations = {
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
};
