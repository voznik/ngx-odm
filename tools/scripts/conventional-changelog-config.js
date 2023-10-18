'use strict';

module.exports = {
  types: [
    { type: 'feat', section: 'Features' },
    { type: 'fix', section: 'Bug Fixes' },
    { type: 'chore', hidden: false },
    { type: 'docs', hidden: false },
    { type: 'style', hidden: false },
    { type: 'refactor', section: 'Features', hidden: false },
    { type: 'perf', section: 'Features', hidden: false },
    { type: 'test', hidden: true },
    { type: 'build', hidden: true },
  ],
};
