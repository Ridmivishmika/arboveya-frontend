import { Suspense } from 'react';
import CartClient from '@/components/cart/CartClient';

export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <CartClient />
    </Suspense>
  );
}
