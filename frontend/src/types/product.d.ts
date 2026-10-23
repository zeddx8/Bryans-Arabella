export interface ProductCard {
  id: number; name: string; slug: string; brand: string; price: number;
  stock_quantity: number; in_stock: boolean;
  category: string | null; category_slug: string | null;
  image: string | null; image2: string | null;
  rating: number | null; review_count: number;
}
export interface ProductImage { id: number; url: string; is_primary: boolean }
export interface ProductDetail {
  id: number; name: string; slug: string; sku: string | null; brand: string; price: number;
  stock_quantity: number; in_stock: boolean; description: string;
  category: string | null; category_slug: string | null;
  rating: number | null; review_count: number;
  images: ProductImage[]; suggested: ProductCard[];
}
export interface Review { id: number; rating: number; title: string | null; comment: string | null; created_at: string; author: string }
export interface Meta { page: number; limit: number; total: number; pages: number }
export interface CatalogResponse {
  data: ProductCard[]; meta: Meta;
  filters: { brands: string[]; categories: { id: number; name: string; slug: string }[] };
}
