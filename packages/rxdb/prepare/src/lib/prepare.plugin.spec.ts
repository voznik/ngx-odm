/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-non-null-assertion */
import { getMockRxCollection } from '@ngx-odm/rxdb/testing';
import { RxCollection, RxCollectionCreator, RxQuery } from 'rxdb';
import { RxDBPreparePlugin } from './prepare.plugin';

describe('RxDBPreparePlugin', () => {
  describe('test hook "createRxCollection:after"', () => {
    let collection: RxCollection;
    let creator: RxCollectionCreator;
    let collectionCount: RxQuery;
    let createRxCollectionAfter: any; // RxPluginHooks['after']

    beforeEach(async () => {
      collection = await getMockRxCollection();
      collectionCount = collection.count();
      creator = { options: {} } as RxCollectionCreator;
      createRxCollectionAfter = RxDBPreparePlugin.hooks!.createRxCollection!.after!;
    });

    it('should not import initial docs if collection is not empty', async () => {
      jest.spyOn(collectionCount, 'exec').mockResolvedValue(1);
      await createRxCollectionAfter({ collection, creator });
      expect(collection.importJSON).not.toHaveBeenCalled();
    });

    it('should not import initial docs if initialDocs is empty', async () => {
      creator.options.initialDocs = [];
      await createRxCollectionAfter({ collection, creator });
      expect(collection.importJSON).not.toHaveBeenCalled();
    });

    it('should not import initial docs if collection has already been imported', async () => {
      jest.spyOn(collection as any, 'getMetadata').mockResolvedValueOnce({
        isNewDb: false,
      });
      await createRxCollectionAfter({ collection, creator });
      expect(collection.importJSON).not.toHaveBeenCalled();
    });

    it('should import initial docs if collection is empty and initialDocs is not empty', async () => {
      creator.options.recreate = true;
      creator.options.initialDocs = [{ foo: 'bar' }];
      await createRxCollectionAfter({ collection, creator });
      expect(collection.importJSON).toHaveBeenCalledWith({
        name: collection.name,
        schemaHash: expect.any(String),
        docs: creator.options.initialDocs,
      });
    });

    it('should not throw if count fails', async () => {
      const error = new Error('count failed');
      jest.spyOn(collectionCount, 'exec').mockRejectedValue(error);
      expect(
        async () => await createRxCollectionAfter({ collection, creator })
      ).not.toThrow();
    });

    it('should not throw if importJSON fails', async () => {
      const error = new Error('importJSON failed');
      jest.spyOn(collection, 'importJSON').mockRejectedValue(error);
      expect(
        async () => await createRxCollectionAfter({ collection, creator })
      ).not.toThrow();
    });
  });
});
