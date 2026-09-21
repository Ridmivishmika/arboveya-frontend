import { Suspense } from 'react';
import { getProducts, getCategories, getWellnessNeeds } from '@/lib/api';
import ShopClient from '@/components/shop/ShopClient';

export const dynamic = 'force-dynamic';

export default async function ShopPage({
  searchParams
}: {
  searchParams?: Promise<{ category?: string; categoryId?: string; wellnessNeed?: string; need?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const initialCategoryParam = resolvedParams.category || resolvedParams.categoryId || 'All Products';
  const initialWellnessNeedParam = resolvedParams.wellnessNeed || resolvedParams.need || 'All Wellness Needs';

  const [products, categories, wellnessNeeds] = await Promise.all([
    getProducts(),
    getCategories(),
    getWellnessNeeds()
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ShopClient 
        initialProducts={products} 
        initialCategories={categories}
        initialWellnessNeeds={wellnessNeeds}
        initialCategoryParam={initialCategoryParam}
        initialWellnessNeedParam={initialWellnessNeedParam}
      />
    </Suspense>
  );
}
