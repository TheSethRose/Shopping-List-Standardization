
export interface PurchaseRecord {
  orderNumber: string;
  orderDate: string;
  productName: string;
  quantity: number;
  price: string;
  deliveryStatus: string;
  productLink: string;
}

export interface ProductFrequency {
  productName: string;
  count: number;
  productLink: string;
}

export interface MatchResult {
  term: string;
  exact_name: string;
  url: string;
  count: number;
  all_matches: ProductFrequency[];
}
