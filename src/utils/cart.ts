// utils/cart.ts

export interface LocalCartProduct {
  publicId: string;
  name: string;
  price: number;
}

export interface LocalCartItem {
  publicId: string; // local cart item ID
  quantity: number;
  product: LocalCartProduct;
}

export function getLocalCart(): LocalCartItem[] {
  if (typeof window === 'undefined') return []; // Ensure client-side only
  try {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    return [];
  }
}

export function saveLocalCart(cart: LocalCartItem[]) {
  if (typeof window === 'undefined') return; // Ensure client-side only
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
}

export function addToLocalCart(product: LocalCartProduct, quantity: number = 1) {
  const cart = getLocalCart();
  const index = cart.findIndex(item => item.product.publicId === product.publicId);

  if (index >= 0) {
    cart[index].quantity += quantity;
  } else {
    cart.push({
      publicId: crypto.randomUUID(),
      quantity,
      product: {
        publicId: product.publicId,
        name: product.name,
        price: product.price,
      },
    });
  }

  saveLocalCart(cart);
}
export const syncLocalCartToServer = async () => {
  if (typeof window === 'undefined') return;

  const localCart = getLocalCart();
  if (localCart.length === 0) return;

  try {
    for (const item of localCart) {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicId: item.publicId,
          quantity: item.quantity,
        }),
      });
    }

    // After syncing, clear local cart
    saveLocalCart([]);
  } catch (error) {
    console.error('Failed to sync local cart:', error);
  }
};
