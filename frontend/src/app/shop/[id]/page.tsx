import { notFound } from 'next/navigation';
import { getProductById, getRelatedProducts } from '@/lib/api';
import ProductDetailClient from '@/components/shop/ProductDetailClient';

export default async function ProductPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, related] = await Promise.all([
    getProductById(id),
    getRelatedProducts(id, 4)
  ]);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} relatedProducts={related} />;
}
