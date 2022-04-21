import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productsResponse = await api.get(`/products/${productId}`)
      const product = productsResponse.data;
      const existingProductIndex = cart.findIndex((product) => product.id === productId)  

      const stockResponse = await api.get(`/stock/${productId}`)
      const stockProduct: Stock = stockResponse.data;

      console.log('stockProduct >>>', stockProduct);

      if(existingProductIndex !== -1) {

        if(stockProduct && cart[existingProductIndex].amount + 1 > stockProduct.amount) {
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          const newCart = [
            ...cart
          ];
  
          newCart.splice(existingProductIndex, 1, {...product, amount: cart[existingProductIndex].amount+1});
  
          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
        }
        
      } else {

          const newCart = [
            ...cart,
            {...product, amount: 1 }
          ]

          setCart(newCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }

      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      
      const existingProductIndex = cart.findIndex((product) => product.id === productId);

      if(existingProductIndex === -1) {
        toast.error('Erro na remoção do produto');
      } else {
        const newCart = [...cart];

      newCart.splice(existingProductIndex, 1);
      
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const existingProduct = cart.find((product) => product.id === productId);
      const existingProductIndex = cart.findIndex((product) => product.id === productId);

      const stockResponse = await api.get(`/stock/${productId}`);
      const stockProduct: Stock = stockResponse.data;

      if(existingProduct) {

        const newCart = [
          ...cart
        ] 
        newCart.splice(existingProductIndex, 1, {...existingProduct, amount: amount});

        if(amount > existingProduct.amount) {
          console.log(amount, stockProduct!.amount);
          if(stockProduct && amount <= stockProduct.amount) {

            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        } else {
          if(stockProduct && amount > 0) {
            setCart(newCart);
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          } else {
            toast.error('Quantidade solicitada fora de estoque');
          }
        }
      }


    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
