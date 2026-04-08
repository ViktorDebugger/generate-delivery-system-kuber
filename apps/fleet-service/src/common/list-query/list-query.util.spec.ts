import {
  buildListRepoArgs,
  normalizePage,
  normalizeSize,
  normalizeSortOrder,
  resolveSortField,
} from './list-query.util';

const PAIRS = [
  ['id', 'id'],
  ['fullname', 'fullName'],
] as const;

describe('normalizePage', () => {
  it('maps negative and non-finite to 0', () => {
    expect(normalizePage(-1)).toBe(0);
    expect(normalizePage(Number.NaN)).toBe(0);
  });

  it('floors valid pages', () => {
    expect(normalizePage(2.7)).toBe(2);
  });
});

describe('normalizeSize', () => {
  it('uses default when non-positive or non-finite', () => {
    expect(normalizeSize(0)).toBe(10);
    expect(normalizeSize(-3)).toBe(10);
    expect(normalizeSize(Number.NaN)).toBe(10);
  });

  it('caps at MAX_LIST_SIZE', () => {
    expect(normalizeSize(500)).toBe(100);
  });
});

describe('normalizeSortOrder', () => {
  it('defaults to asc', () => {
    expect(normalizeSortOrder(undefined)).toBe('asc');
    expect(normalizeSortOrder('')).toBe('asc');
    expect(normalizeSortOrder('Asc')).toBe('asc');
  });

  it('accepts desc case-insensitively', () => {
    expect(normalizeSortOrder('DESC')).toBe('desc');
  });
});

describe('resolveSortField', () => {
  it('maps underscore and case', () => {
    expect(resolveSortField('Full_Name', PAIRS, 'id')).toBe('fullName');
  });

  it('falls back to default for unknown', () => {
    expect(resolveSortField('nope', PAIRS, 'id')).toBe('id');
  });
});

describe('buildListRepoArgs', () => {
  it('computes skip from page and size', () => {
    const a = buildListRepoArgs(2, 5, 'fullName', 'desc', PAIRS, 'id');
    expect(a.skip).toBe(10);
    expect(a.take).toBe(5);
    expect(a.sortField).toBe('fullName');
    expect(a.order).toBe('desc');
  });
});
