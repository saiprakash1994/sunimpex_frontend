import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { APIUrl } from '../../../ApiUrl/apiUrl';
import { AppConstants, getItemFromLocalStorage } from '../../../shared/utils/localStorage';

export const DairyApi = createApi({
    reducerPath: 'DairyApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${APIUrl.URL}`,
        prepareHeaders: (headers) => {
            const token = getItemFromLocalStorage(AppConstants.accessToken);
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['getAll'],
    endpoints: () => ({})
});
