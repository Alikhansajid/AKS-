export type ProductImage = {
  id: number;
  url: string;
  createdAt: string;
};

export type Category = {
  id: number;
  publicId: string;
  name: string;
  slug: string;
  parentId: number | null;
  children: Category[];
  updatedById: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Product = {
  id: number;
  publicId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  categoryId: number;
  updatedById: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  category: Category;
  images: ProductImage[];
};

export type RawProduct = {
  id: number;
  publicId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  categoryId: number;
  updatedById: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  category: Category;
  images: ProductImage[];
};