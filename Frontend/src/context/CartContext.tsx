import React, { createContext, useState, ReactNode } from 'react';

interface Product {
  _id: string;
  name: string;
  price?: number;
  images: string[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  quoteItems: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  addToQuote: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  removeFromQuote: (productId: string) => void;
  clearCart: () => void;
  clearQuote: () => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quoteItems, setQuoteItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        return prev.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const addToQuote = (product: Product, quantity: number) => {
    setQuoteItems(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        return prev.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product._id !== productId));
  };

  const removeFromQuote = (productId: string) => {
    setQuoteItems(prev => prev.filter(item => item.product._id !== productId));
  };

  const clearCart = () => setCart([]);
  const clearQuote = () => setQuoteItems([]);

  return (
    <CartContext.Provider value={{ cart, quoteItems, addToCart, addToQuote, removeFromCart, removeFromQuote, clearCart, clearQuote }}>
      {children}
    </CartContext.Provider>
  );
};
