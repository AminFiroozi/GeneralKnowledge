export interface Category {
  id: number;
  parentId: number | null;
  slug: string;
  name: string;
  nameNorm: string;
  path: string;
  depth: number;
  childCount: number;
  factCount: number;
}

export interface Fact {
  id: number;
  categoryId: number;
  body: string;
  source: string | null;
  categoryName?: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
}
