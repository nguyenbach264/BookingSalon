import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [], 
}; 

const cartSlice = createSlice({
  name: "cartItems",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;

      const existingItem = state.items.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...product, quantity: 1, });
      }
    },

    updateQuantity: (state, action) => {
      const { id, delta } = action.payload;
      const item = state.items.find(
        (item) => item.id === id
      );
      if (item) {
        item.quantity = Math.max(1, item.quantity + delta);
      }
    },

    removeItem: (state, action) => {
      state.items = state.items.filter(
        (item) => item.id !== action.payload
      );
    }, 

    clearCart: (state, action) => {
      state.items = []; 
    },
  }
}); 

export const {addToCart, updateQuantity, removeItem, clearCart} = cartSlice.actions;
export const selectCartItems = (state) => state.cart.items;
export default cartSlice.reducer;