export interface Category {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  productCount?: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCategoryInput {
  name: string;
  description?: string;
  imageUrl?: string;
}
