import { NgxRxdbUtils } from './utils';

describe('NgxRxdb Utils: qsify', () => {
  it('should return an empty string when given an empty object', () => {
    const obj = {};
    const result = NgxRxdbUtils.qsify(obj);
    expect(result).toBe('');
  });

  it('should correctly encode and concatenate key-value pairs', () => {
    const obj = {
      name: 'John Doe',
      age: 30,
      hobbies: ['reading', 'coding'],
      isActive: true,
    };
    const result = NgxRxdbUtils.qsify(obj);
    expect(result).toBe('name=John%20Doe&age=30&hobbies=reading,coding&isActive=true');
  });

  it('should ignore undefined values', () => {
    const obj = {
      name: 'John Doe',
      age: undefined,
      hobbies: ['reading', undefined, 'coding'],
      isActive: true,
    };
    const result = NgxRxdbUtils.qsify(obj);
    expect(result).toBe('name=John%20Doe&hobbies=reading,coding&isActive=true');
  });
});
