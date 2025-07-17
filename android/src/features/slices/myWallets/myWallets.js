import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import config from '../../../../config';
import {getInfo} from '../../auth/login/loginApi';

const URL = `${config.BASE_URL_VERSION}/available-cards`;
const initialState = {
  cardsData: [],
  cardsLoader: false,
  isRefresh: false,
};

export const getMyCards = createAsyncThunk(
  'cards/getMyCards',
  async obj => {
    const {token} = obj;
    const response = await getInfo(token, URL);
    const {status: {code} = {}, records} = response?.response;
    return records;
  },
);
export const refreshMyCards = createAsyncThunk(
  'cards/refreshMyCards',
  async obj => {
    const {token} = obj;
    const response = await getInfo(token, URL);
    const {status: {code} = {}, records} = response?.response;
    return records;
  },
);

const myCards = createSlice({
  name: 'myCards',
  initialState,
  reducers: {
    clearCards: state => {
      state.cardsData = [];
    },
  },
  extraReducers: builder => {
    builder.addCase(getMyCards.pending, state => {
      state.cardsLoader = true;
    });
    builder.addCase(getMyCards.fulfilled, (state, {payload}) => {
      state.cardsLoader = false;
      state.cardsData = payload;
    });
    builder.addCase(getMyCards.rejected, state => {
      state.cardsLoader = false;
    });
    builder.addCase(refreshMyCards.pending, state => {
      state.isRefresh = true;
    });
    builder.addCase(refreshMyCards.fulfilled, (state, {payload}) => {
      state.isRefresh = false;
      state.cardsData = payload;
    });
    builder.addCase(refreshMyCards.rejected, state => {
      state.isRefresh = false;
    });
  },
});

export const {clearCards} = myCards.actions;
export default myCards.reducer;