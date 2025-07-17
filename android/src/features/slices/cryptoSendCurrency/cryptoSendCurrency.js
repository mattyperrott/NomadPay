import { createSlice } from '@reduxjs/toolkit';
const initialState = {
    currencyData: {},
};
const cryptoSendCurrency = createSlice({
    name: 'cryptoSendCurrency',
    initialState,
    reducers: {
        updateCurrency: (state, { payload }) => {
            state.currencyData = payload;
        },
    },
});
export const { updateCurrency, clearCurrency } = cryptoSendCurrency.actions;
export default cryptoSendCurrency.reducer;