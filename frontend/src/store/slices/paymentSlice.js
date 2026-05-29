import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [
    { _id: '1', name: 'Raw Pyrite Bracelet', rating: 4.5, reviews: 2756, price: 399, originalPrice: 999, discount: '60% OFF', stock: 50, category: 'Bracelets', img: '/store_bracelet.png' },
  ],
  orders: [],
  loading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    addOrder: (state, action) => {
      state.orders.unshift(action.payload);
    }
  }
});

export const { addOrder } = paymentSlice.actions;
export default paymentSlice.reducer;
