export const DEFAULT_LIST_SIZE = 10;
export const MAX_LIST_SIZE = 100;

export type ListRepoArgs = {
  skip: number;
  take: number;
  sortField: string;
  order: 'asc' | 'desc';
};

export function normalizePage(page: number): number {
  if (!Number.isFinite(page) || page < 0) {
    return 0;
  }
  return Math.floor(page);
}

export function normalizeSize(size: number): number {
  if (!Number.isFinite(size) || size <= 0) {
    return DEFAULT_LIST_SIZE;
  }
  return Math.min(Math.floor(size), MAX_LIST_SIZE);
}

export function normalizeSortOrder(raw: string | undefined): 'asc' | 'desc' {
  if (raw === undefined || raw === '') {
    return 'asc';
  }
  return raw.toLowerCase() === 'desc' ? 'desc' : 'asc';
}

export function resolveSortField(
  raw: string | undefined,
  pairs: ReadonlyArray<readonly [string, string]>,
  defaultField: string,
): string {
  if (raw === undefined || raw === '') {
    return defaultField;
  }
  const n = raw.toLowerCase().replace(/_/g, '');
  for (const [key, prismaField] of pairs) {
    if (key === n) {
      return prismaField;
    }
  }
  return defaultField;
}

export function buildListRepoArgs(
  pageRaw: number,
  sizeRaw: number,
  sortRaw: string | undefined,
  orderRaw: string | undefined,
  pairs: ReadonlyArray<readonly [string, string]>,
  defaultSortField: string,
): ListRepoArgs {
  const page = normalizePage(pageRaw);
  const size = normalizeSize(sizeRaw);
  const order = normalizeSortOrder(orderRaw);
  const sortField = resolveSortField(sortRaw, pairs, defaultSortField);
  return {
    skip: page * size,
    take: size,
    sortField,
    order,
  };
}
