export interface Product {
  id: number;
  publicId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
}
