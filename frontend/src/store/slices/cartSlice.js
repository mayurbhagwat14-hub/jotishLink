import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCart, updateCart, createOrder } from '../../api/storeApis';

export const fetchCartThunk = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCart();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateCartThunk = createAsyncThunk(
  'cart/updateCart',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await updateCart(productId, quantity);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createOrderThunk = createAsyncThunk(
  'cart/createOrder',
  async ({ shippingAddress, paymentMethod, paymentData }, { rejectWithValue }) => {
    try {
      const response = await createOrder(shippingAddress, paymentMethod, paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  cart: { items: [] },
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.cart = action.payload?.data?.cart || { items: [] };
      })
      .addCase(fetchCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCartThunk.fulfilled, (state, action) => {
        state.cart = action.payload?.data?.cart || { items: [] };
      })
      .addCase(createOrderThunk.fulfilled, (state) => {
        state.cart = { items: [] }; // Clear cart on successful order
      });
  },
});

export default cartSlice.reducer;
