export const TODO_SCHEMA = {
  definitions: {},
  type: 'object',
  title: 'Todo',
  description: 'Todo Schema',
  required: ['id', 'title', 'createdAt'],
  version: 3,
  properties: {
    id: {
      type: 'string',
      title: 'Id',
      pattern: '^(.*)$',
      maxLength: 36,
      readOnly: true,
    },
    title: {
      type: 'string',
      title: 'Title',
    },
    completed: {
      type: 'boolean',
      title: 'Done',
    },
    createdAt: {
      type: 'string',
      title: 'Created Date',
      format: 'date-time',
      readOnly: true,
    },
    last_modified: {
      type: 'number',
      title: 'Last Modified Date',
      multipleOf: 1,
    },
  },
  __indexes: ['createdAt'],
  primaryKey: 'id',
  attachments: {
    encrypted: false,
  },
};
