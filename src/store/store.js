// store.js
import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '../modules/authentication/store/authenticateApi';
import userInfoSlice from '../modules/authentication/store/userInfoSlice';
import deviceSlice from '../modules/device/store/deviceSlice'
import { DairyApi } from '../modules/dairy/store/dairyApi';
import { DeviceApi } from '../modules/device/store/deviceApi';
import { RecordApi } from '../modules/records/store/recordApi';
import { UploadApi } from '../modules/uploads/store/uploadApi';

const store = configureStore({
    reducer: {
        userInfoSlice,
        deviceSlice,
        [authApi.reducerPath]: authApi.reducer,
        [DairyApi.reducerPath]: DairyApi.reducer,
        [DeviceApi.reducerPath]: DeviceApi.reducer,
        [RecordApi.reducerPath]: RecordApi.reducer,
        [UploadApi.reducerPath]: UploadApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types
                ignoredActions: ['persist/PERSIST'],
                // Ignore these field paths in all actions
                ignoredActionPaths: ['payload.timestamp'],
                // Ignore these paths in the state
                ignoredPaths: ['some.path.to.ignore'],
            },
        }).concat(authApi.middleware, DairyApi.middleware, DeviceApi.middleware, RecordApi.middleware, UploadApi.middleware),
});

export default store;
