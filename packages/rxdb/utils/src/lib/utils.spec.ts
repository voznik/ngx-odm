import { of } from 'rxjs';
import { mapFindResultToJsonArray } from './utils';

describe('NgxRxdb Utils', () => {
  describe('mapFindResultToJsonArray', () => {
    it('should map find result to JSON array without rev and attachments', () => {
      const input = [
        { _id: '1', _rev: 'rev1', _attachments: {}, _deleted: false, _meta: {} },
        { _id: '2', _rev: 'rev2', _attachments: {}, _deleted: false, _meta: {} },
      ];
      const expectedOutput = [{ _id: '1' }, { _id: '2' }];

      of(input)
        .pipe(mapFindResultToJsonArray())
        .subscribe(output => {
          expect(output).toEqual(expectedOutput);
        });
    });

    it('should map find result to JSON array with rev and attachments', () => {
      const input = [
        { _id: '1', _rev: 'rev1', _attachments: {}, _deleted: false, _meta: {} },
        { _id: '2', _rev: 'rev2', _attachments: {}, _deleted: false, _meta: {} },
      ];
      const expectedOutput = [
        { _id: '1', _rev: 'rev1', _attachments: {}, _deleted: false, _meta: {} },
        { _id: '2', _rev: 'rev2', _attachments: {}, _deleted: false, _meta: {} },
      ];

      of(input)
        .pipe(mapFindResultToJsonArray(true))
        .subscribe(output => {
          expect(output).toEqual(expectedOutput);
        });
    });
  });
});
