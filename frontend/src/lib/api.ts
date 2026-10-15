import {
  SiteSettings,
  BlogPost,
  CreateBlogPostInput,
  UpdateBlogPostInput,
  Product,
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
  ApproveProductInput,
  PublicReviewInput,
  ProductReview,
  PaginatedProducts,
  WellnessNeed,
  CreateWellnessNeedInput,
  UpdateWellnessNeedInput,
  ContactMessageInput,
  ContactMessage
} from "@/types";
import { fallbackSettings } from "./mockData";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5287/api";

export function getBackendOrigin(): string {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5287/api").replace(/\/api\/?$/, "");
}

/**
 * Resolves any image URL (relative /uploads/..., legacy localhost:5287, or remote)
 * to an accessible URL in both local development and hosted production environments.
 */
export function resolveBackendImageUrl(url?: string | null, fallback = "/images/botanical-sprig.jpg"): string {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  const backendOrigin = getBackendOrigin();

  // Handle legacy/local uploads saved in DB with localhost:5287 or 127.0.0.1:5287
  if (trimmed.includes("localhost:5287/uploads/")) {
    const rel = trimmed.substring(trimmed.indexOf("/uploads/"));
    return `${backendOrigin}${rel}`;
  }
  if (trimmed.includes("127.0.0.1:5287/uploads/")) {
    const rel = trimmed.substring(trimmed.indexOf("/uploads/"));
    return `${backendOrigin}${rel}`;
  }

  // Backend static uploads path
  if (trimmed.startsWith("/uploads/")) {
    return `${backendOrigin}${trimmed}`;
  }

  // Frontend public assets
  if (trimmed.startsWith("/images/")) {
    return trimmed;
  }

  // Protocol-relative URLs
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  // Full remote URLs or other relative assets
  return trimmed;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_BASE_URL}/sitesettings`, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to fetch site settings");
    return await res.json();
  } catch (error) {
    return fallbackSettings;
  }
}

// ----------------- Product APIs ----------------- //

export interface GetProductsParams {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export async function getProducts(
  paramsOrSearch?: string | GetProductsParams,
  categoryIdArg?: string
): Promise<Product[]> {
  try {
    const params = new URLSearchParams();

    if (typeof paramsOrSearch === "string") {
      if (paramsOrSearch) params.append("search", paramsOrSearch);
      if (categoryIdArg) params.append("categoryId", categoryIdArg);
      params.append("pageSize", "100");
    } else if (paramsOrSearch && typeof paramsOrSearch === "object") {
      if (paramsOrSearch.search) params.append("search", paramsOrSearch.search);
      if (paramsOrSearch.categoryId) params.append("categoryId", paramsOrSearch.categoryId);
      if (paramsOrSearch.minPrice !== undefined) params.append("minPrice", paramsOrSearch.minPrice.toString());
      if (paramsOrSearch.maxPrice !== undefined) params.append("maxPrice", paramsOrSearch.maxPrice.toString());
      if (paramsOrSearch.minRating !== undefined) params.append("minRating", paramsOrSearch.minRating.toString());
      if (paramsOrSearch.sortBy) params.append("sortBy", paramsOrSearch.sortBy);
      if (paramsOrSearch.page) params.append("page", paramsOrSearch.page.toString());
      params.append("pageSize", paramsOrSearch.pageSize ? paramsOrSearch.pageSize.toString() : "100");
    } else {
      params.append("pageSize", "100");
    }

    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/products?${queryString}` : `${API_BASE_URL}/products`;

    const res = await fetch(url, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();

    // Check if paginated structure { items: [...], totalCount: ... }
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch (error) {
    console.warn("Backend products fetch failed:", error);
    return [];
  }
}

export async function getProductsPaginated(
  paramsObj: GetProductsParams = {}
): Promise<PaginatedProducts<Product>> {
  try {
    const params = new URLSearchParams();
    if (paramsObj.search) params.append("search", paramsObj.search);
    if (paramsObj.categoryId) params.append("categoryId", paramsObj.categoryId);
    if (paramsObj.minPrice !== undefined) params.append("minPrice", paramsObj.minPrice.toString());
    if (paramsObj.maxPrice !== undefined) params.append("maxPrice", paramsObj.maxPrice.toString());
    if (paramsObj.minRating !== undefined) params.append("minRating", paramsObj.minRating.toString());
    if (paramsObj.sortBy) params.append("sortBy", paramsObj.sortBy);
    if (paramsObj.page) params.append("page", paramsObj.page.toString());
    if (paramsObj.pageSize) params.append("pageSize", paramsObj.pageSize.toString());

    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/products?${queryString}` : `${API_BASE_URL}/products`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    if (data && Array.isArray(data.items)) {
      return data;
    }
    return {
      items: Array.isArray(data) ? data : [],
      totalCount: Array.isArray(data) ? data.length : 0,
      page: 1,
      pageSize: 20,
      totalPages: 1
    };
  } catch (error) {
    console.warn("Error in getProductsPaginated:", error);
    return {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0
    };
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      cache: "no-store"
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.warn("Error fetching product by ID from backend:", error);
  }

  return null;
}

export async function getRelatedProducts(productId: string, limit: number = 4): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/related?limit=${limit}`, {
      cache: "no-store"
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.warn("Error fetching related products:", error);
  }
  return [];
}

export async function submitPublicReview(productId: string, review: PublicReviewInput, token?: string): Promise<ProductReview> {
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('arboveya_token') : '') || '';
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}/products/${productId}/public-reviews`, {
    method: "POST",
    headers,
    body: JSON.stringify(review)
  });

  if (!res.ok) {
    let errorMsg = "Failed to submit review";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function createProduct(input: CreateProductInput, token?: string): Promise<Product> {
  const authToken = token || await getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers,
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    let errorMsg = "Failed to create product";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function updateProduct(id: string, input: UpdateProductInput, token?: string): Promise<Product> {
  const authToken = token || await getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    let errorMsg = "Failed to update product";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function deleteProduct(id: string, token?: string): Promise<void> {
  const authToken = token || await getAdminToken();
  const headers: Record<string, string> = {
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "DELETE",
    headers
  });

  if (!res.ok && res.status !== 204) {
    let errorMsg = "Failed to delete product";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }
}

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/products/upload-image`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    let errorMsg = "Failed to upload image";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  if (data.imageUrl && data.imageUrl.startsWith("/")) {
    const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${backendOrigin}${data.imageUrl}`;
  }
  return data.imageUrl;
}
export async function uploadMultipleProductImages(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch(`${API_BASE_URL}/products/upload-images`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    let errorMsg = "Failed to upload images";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  const data = await res.json();
  const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  return (data.imageUrls || []).map((url: string) =>
    url.startsWith("/") ? `${backendOrigin}${url}` : url
  );
}

export async function updateOrderTracking(
  orderId: string,
  trackingNumber: string,
  shippingCarrier?: string,
  orderStatus: string = "Shipped",
  token?: string
): Promise<any> {
  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("arboveya_token") : "") || "";
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/tracking`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: JSON.stringify({
      trackingNumber,
      shippingCarrier,
      orderStatus
    })
  });

  if (!res.ok) {
    let errorMsg = "Failed to update order tracking";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function getPendingProducts(token?: string): Promise<Product[]> {
  try {
    const authToken = token || await getAdminToken();
    const headers: Record<string, string> = {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    };
    const res = await fetch(`${API_BASE_URL}/products/admin/pending`, {
      headers,
      cache: "no-store"
    });
    if (!res.ok) throw new Error("Failed to fetch pending products");
    return await res.json();
  } catch (err) {
    console.error("Error fetching pending products:", err);
    return [];
  }
}

export async function approveProduct(
  id: string,
  input: ApproveProductInput,
  token?: string
): Promise<Product> {
  const authToken = token || await getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}/products/${id}/approve`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    let errorMsg = "Failed to approve product";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  return await res.json();
}

// ----------------- Category APIs ----------------- //

export async function getCategories(search?: string): Promise<Category[]> {
  try {
    const url = search
      ? `${API_BASE_URL}/categories?search=${encodeURIComponent(search)}`
      : `${API_BASE_URL}/categories`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("Error fetching categories from backend:", error);
    return [];
  }
}

export async function getAdminToken(): Promise<string> {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem("arboveya_token");
    if (existing) return existing;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@arboveya.com",
        password: "AdminSecurePassword123!"
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof window !== "undefined" && data.token) {
        localStorage.setItem("arboveya_token", data.token);
      }
      return data.token;
    }
  } catch (e) {
    console.error("Admin auto-login error:", e);
  }
  return "";
}

export async function createCategory(input: CreateCategoryInput, token?: string): Promise<Category> {
  const authToken = token || await getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}/categories`, {
    method: "POST",
    headers,
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    let errorMsg = "Failed to create category";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function updateCategory(id: string, input: UpdateCategoryInput, token?: string): Promise<Category> {
  const authToken = token || await getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    let errorMsg = "Failed to update category";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function deleteCategory(id: string, token?: string): Promise<void> {
  const authToken = token || await getAdminToken();
  const headers: Record<string, string> = {
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "DELETE",
    headers
  });

  if (!res.ok && res.status !== 204) {
    let errorMsg = "Failed to delete category";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }
}

export async function uploadCategoryImage(file: File, token?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const authToken = token || await getAdminToken();
  const headers: Record<string, string> = {
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  };

  try {
    const res = await fetch(`${API_BASE_URL}/categories/upload-image`, {
      method: "POST",
      headers,
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      if (data.imageUrl && data.imageUrl.startsWith("/")) {
        const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
        return `${backendOrigin}${data.imageUrl}`;
      }
      return data.imageUrl;
    }
  } catch (_) {
    // fallback to products upload endpoint if categories endpoint is unreachable
  }

  // Graceful fallback to products upload-image endpoint which uses same storage
  return uploadProductImage(file);
}

// ----------------- Wellness Need APIs ----------------- //

export async function getWellnessNeeds(search?: string): Promise<WellnessNeed[]> {
  try {
    const url = search
      ? `${API_BASE_URL}/wellness-needs?search=${encodeURIComponent(search)}`
      : `${API_BASE_URL}/wellness-needs`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch wellness needs: ${res.statusText}`);
    const data = await res.json();
    return (data || []).map((item: any) => ({
      ...item,
      name: item.name || item.title || '',
      title: item.title || item.name || '',
      slug: item.slug || (item.name ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '')
    }));
  } catch (error) {
    console.error("Error fetching wellness needs from backend:", error);
    return [];
  }
}

export async function createWellnessNeed(input: CreateWellnessNeedInput, token?: string): Promise<WellnessNeed> {
  const authToken = token || await getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}/wellness-needs`, {
    method: "POST",
    headers,
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    let errorMsg = "Failed to create wellness need";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function updateWellnessNeed(id: string, input: UpdateWellnessNeedInput, token?: string): Promise<WellnessNeed> {
  const authToken = token || await getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}/wellness-needs/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input)
  });

  if (!res.ok) {
    let errorMsg = "Failed to update wellness need";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }

  return await res.json();
}

export async function deleteWellnessNeed(id: string, token?: string): Promise<void> {
  const authToken = token || await getAdminToken();
  const headers: Record<string, string> = {
    ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}/wellness-needs/${id}`, {
    method: "DELETE",
    headers
  });

  if (!res.ok && res.status !== 204) {
    let errorMsg = "Failed to delete wellness need";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) { }
    throw new Error(errorMsg);
  }
}

// ----------------- Blog APIs ----------------- //

export async function getPublishedBlogs(search?: string): Promise<BlogPost[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    const query = params.toString() ? "?" + params.toString() : "";
    const url = API_BASE_URL + "/blogs" + query;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch blogs");
    return await res.json();
  } catch (error) {
    console.warn("Using fallback blogs:", error);
    return [];
  }
}

export async function getMyBlogs(token: string): Promise<BlogPost[]> {
  const res = await fetch(API_BASE_URL + "/blogs/my-blogs", {
    headers: { Authorization: "Bearer " + token },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch user blogs");
  return await res.json();
}

export async function createBlog(input: CreateBlogPostInput, token: string): Promise<BlogPost> {
  const res = await fetch(API_BASE_URL + "/blogs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create blog post");
  }
  return await res.json();
}

export async function updateBlog(id: string, input: UpdateBlogPostInput, token: string): Promise<BlogPost> {
  const res = await fetch(API_BASE_URL + "/blogs/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update blog post");
  }
  return await res.json();
}

export async function deleteBlog(id: string, token: string): Promise<void> {
  const res = await fetch(API_BASE_URL + "/blogs/" + id, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete blog post");
  }
}

export async function getModerationBlogs(token: string, isApproved?: boolean): Promise<BlogPost[]> {
  const params = new URLSearchParams();
  if (isApproved !== undefined) params.append("isApproved", isApproved.toString());
  const query = params.toString() ? "?" + params.toString() : "";
  const url = API_BASE_URL + "/blogs/moderation" + query;
  const res = await fetch(url, {
    headers: { Authorization: "Bearer " + token },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch moderation blogs");
  return await res.json();
}

export async function moderateBlog(id: string, isApproved: boolean, token: string): Promise<BlogPost> {
  const res = await fetch(API_BASE_URL + "/blogs/" + id + "/moderation", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ isApproved }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to moderate blog post");
  }
  return await res.json();
}

export async function uploadBlogImage(file: File, token?: string): Promise<string> {
  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("arboveya_token") : "") || "";
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/blogs/upload-image`, {
    method: "POST",
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
    },
    body: formData
  });

  if (!res.ok) {
    let errorMsg = "Failed to upload image";
    try {
      const errBody = await res.json();
      errorMsg = errBody.message || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const data = await res.json();
  const backendOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  return data.imageUrl.startsWith("/") ? `${backendOrigin}${data.imageUrl}` : data.imageUrl;
}

// ----------------- Auth / Password Recovery APIs ----------------- //

export interface ForgotPasswordResponse {
  message: string;
  resetCode?: string;
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to send reset code");
  }
  return data;
}

export async function resetPassword(
  email: string,
  resetCode: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, resetCode, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to reset password");
  }
  return data;
}

// ----------------- Contact Messages API ----------------- //

export async function submitContactMessage(
  data: ContactMessageInput,
  token?: string
): Promise<ContactMessage> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/contact`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  const resData = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(resData.message || "Failed to send your inquiry. Please try again.");
  }
  return resData;
}

export async function getContactMessages(
  status?: string,
  search?: string,
  token?: string
): Promise<ContactMessage[]> {
  const params = new URLSearchParams();
  if (status && status !== "All") params.append("status", status);
  if (search) params.append("search", search);

  const query = params.toString();
  const url = query ? `${API_BASE_URL}/contact?${query}` : `${API_BASE_URL}/contact`;

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch contact inquiries.");
  }
  return await res.json();
}

export async function updateContactMessageStatus(
  id: string,
  status: string,
  adminNotes?: string,
  token?: string
): Promise<ContactMessage> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/contact/${id}/status`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ status, adminNotes }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Failed to update inquiry status.");
  }
  return data;
}

export async function deleteContactMessage(
  id: string,
  token?: string
): Promise<boolean> {
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/contact/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to delete contact inquiry.");
  }
  return true;
}


