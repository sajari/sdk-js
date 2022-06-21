export default {
  list: 0,
  price: 1,
  rating: 2,
  color: 3,
};

export interface FitterItem {
  count: number;
  value: string;
}

export type FilterItems = Record<string, FitterItem>;

export interface Facet {
  field: string;
  title: string;
  sort?: boolean;
  type?: number;
  buckets: Record<string, string>;
  transform?: string;
}
