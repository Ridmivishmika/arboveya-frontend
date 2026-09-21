export * from "./category";

export interface SiteSettings {
  id?: number;
  homePageHeroText?: string;
  aboutHeroSubtitle?: string;
  aboutUsContent?: string;
  mission?: string;
  vision?: string;
  facebookLink?: string;
  whatsAppNumber?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id?: string;
  weight: string;
  price: number;
  stockQuantity: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  weight?: string;
  categoryId?: string;
  categoryName?: string;
  wellnessNeedId?: string;
  wellnessNeedName?: string;
  wellnessNeed?: string;
  keyBenefits?: string;
  ingredients?: string;
  howToUse?: string;
  galleryImages?: string;
  isBestSeller?: boolean;
  averageRating?: number;
  rating?: number;
  reviewCount?: number;
  sellerId?: string;
  sellerName?: string;
  approvalStatus?: string;
  adminFeedback?: string;
  createdAt?: string;
  updatedAt?: string;
  variants?: ProductVariant[];
}

export interface ApproveProductInput {
  categoryId: string;
  wellnessNeedId?: string;
  approvalStatus?: string;
  adminFeedback?: string;
}

export interface PaginatedProducts<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProductInput {
  name: string;
  categoryId?: string;
  wellnessNeedId?: string;
  price: number;
  stockQuantity: number;
  description?: string;
  imageUrl?: string;
  weight?: string;
  keyBenefits?: string;
  ingredients?: string;
  howToUse?: string;
  galleryImages?: string;
  isBestSeller?: boolean;
  variants?: ProductVariant[];
}

export interface UpdateProductInput {
  name?: string;
  categoryId?: string;
  wellnessNeedId?: string;
  price?: number;
  stockQuantity?: number;
  description?: string;
  imageUrl?: string;
  weight?: string;
  keyBenefits?: string;
  ingredients?: string;
  howToUse?: string;
  galleryImages?: string;
  isBestSeller?: boolean;
  variants?: ProductVariant[];
}

export interface ProductReview {
  id?: string;
  authorName: string;
  rating: number;
  date: string;
  comment: string;
  verified?: boolean;
}

export interface PublicReviewInput {
  authorName: string;
  rating: number;
  comment: string;
  userId?: string;
  userEmail?: string;
}

export interface WellnessNeed {
  id: string;
  name?: string;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  slug: string;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWellnessNeedInput {
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
}

export interface UpdateWellnessNeedInput {
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
}

export interface ProductTypeItem {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export interface BlogPost {
  id: string;
  authorId: string;
  authorName?: string;
  authorEmail?: string;
  authorRole?: string;
  authorIsSellerApproved?: boolean;
  isPublished?: boolean;
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateBlogPostInput {
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
}

export interface UpdateBlogPostInput {
  title?: string;
  content?: string;
  category?: string;
  imageUrl?: string;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  phoneNumber?: string;
  userType?: 'Buyer' | 'Seller' | 'General';
  subject: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  userType: string;
  subject: string;
  message: string;
  status: string; // "Unread", "Read", "Resolved"
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

