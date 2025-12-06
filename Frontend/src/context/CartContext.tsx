import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface Product {
  _id: string;
  name: string;
  price?: number;
  retailerPrice?: number;
  images: string[];
  category?: string;
  description?: string;
  isTelecom?: boolean;
  maxDirectPurchaseQty?: number;
  warrantyPeriodMonths?: number;
  extendedWarrantyAvailable?: boolean;
  extendedWarrantyMonths?: number;
  extendedWarrantyPrice?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  useRetailerPrice?: boolean;
}

interface CartContextType {
  cart: CartItem[];
  quoteItems: CartItem[];
  addToCart: (product: Product, quantity: number, useRetailerPrice?: boolean) => void;
  addToQuote: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  removeFromQuote: (productId: string) => void;
  clearCart: () => void;
  clearQuote: () => void;
  setUserId: (userId: string | null) => void;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to get user-specific storage key
const getStorageKey = (baseKey: string, userId: string | null) => {
  return userId ? `${baseKey}_${userId}` : baseKey;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserIdState] = useState<string | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return user._id || null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const key = getStorageKey('cart', userId);
    const savedCart = localStorage.getItem(key);
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [quoteItems, setQuoteItems] = useState<CartItem[]>(() => {
    const key = getStorageKey('quoteItems', userId);
    const savedQuote = localStorage.getItem(key);
    return savedQuote ? JSON.parse(savedQuote) : [];
  });

  // Handle user changes via custom event
  const handleUserChange = useCallback((newUserId: string | null) => {
    if (newUserId !== userId) {
      setUserIdState(newUserId);
      // Load user-specific cart and quote items
      const cartKey = getStorageKey('cart', newUserId);
      const quoteKey = getStorageKey('quoteItems', newUserId);
      const savedCart = localStorage.getItem(cartKey);
      const savedQuote = localStorage.getItem(quoteKey);
      setCart(savedCart ? JSON.parse(savedCart) : []);
      setQuoteItems(savedQuote ? JSON.parse(savedQuote) : []);
    }
  }, [userId]);

  // Listen for user changes in localStorage (login/logout) from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        let newUserId: string | null = null;
        if (e.newValue) {
          try {
            const user = JSON.parse(e.newValue);
            newUserId = user._id || null;
          } catch {
            newUserId = null;
          }
        }
        handleUserChange(newUserId);
      }
    };
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleUserChange]);

  // Update cart when userId changes
  const setUserId = useCallback((newUserId: string | null) => {
    handleUserChange(newUserId);
  }, [handleUserChange]);

  useEffect(() => {
    const key = getStorageKey('cart', userId);
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, userId]);

  useEffect(() => {
    const key = getStorageKey('quoteItems', userId);
    localStorage.setItem(key, JSON.stringify(quoteItems));
  }, [quoteItems, userId]);

  const addToCart = (product: Product, quantity: number, useRetailerPrice?: boolean) => {
    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      if (existing) {
        return prev.map(item => 
          item.product._id === product._id 
            ? { ...item, quantity: item.quantity + quantity, useRetailerPrice: useRetailerPrice ?? item.useRetailerPrice } 
            : item
        );
      }
      return [...prev, { product, quantity, useRetailerPrice }];
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
    <CartContext.Provider value={{ cart, quoteItems, addToCart, addToQuote, removeFromCart, removeFromQuote, clearCart, clearQuote, setUserId }}>
      {children}
    </CartContext.Provider>
  );
};
