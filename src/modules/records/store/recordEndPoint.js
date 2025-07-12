import { RecordApi } from "./recordApi";

export const recordDetails = RecordApi.injectEndpoints({
    endpoints: (builder) => ({
        getAllRecords: builder.query({
            query: (body) => {
                const basePath = "reports/datewise-report";
                const params = body?.params || {};
                const queryString = new URLSearchParams(params).toString();
                return `${basePath}?${queryString}`;
            },
            providesTags: ["devicerecords"],
            keepUnusedDataFor: 300, // Keep data for 5 minutes
        }),
        getMultipleRecords: builder.query({
            query: (body) => {
                const basePath = "reports/datewise-report/multiple";
                const params = body?.params || {};
                const queryString = new URLSearchParams(params).toString();
                return `${basePath}?${queryString}`;
            },
            providesTags: ["multidevicerecords"],
            keepUnusedDataFor: 300, // Keep data for 5 minutes
        }),
        getMemberCodewiseReport: builder.query({
            query: (body) => {
                const basePath = "reports/codewise-report";
                const params = body?.params || {};
                const queryString = new URLSearchParams(params).toString();
                return `${basePath}?${queryString}`;
            },
            providesTags: ["membercodereports"],
            keepUnusedDataFor: 300, // Keep data for 5 minutes
        }),
        getAbsentMemberReport: builder.query({
            query: (body) => {
                const basePath = "reports/absent-members-report";
                const params = body?.params || {};
                const queryString = new URLSearchParams(params).toString();
                return `${basePath}?${queryString}`;
            },
            providesTags: ["absentmemberreports"],
            keepUnusedDataFor: 300, // Keep data for 5 minutes
        }),
        getCumulativeReport: builder.query({
            query: (body) => {
                const basePath = "reports/cumulative-report";
                const params = body?.params || {};
                const queryString = new URLSearchParams(params).toString();
                return `${basePath}?${queryString}`;
            },
            providesTags: ["cumulativereports"],
            keepUnusedDataFor: 300, // Keep data for 5 minutes
        }),
        getDatewiseDetailedReport: builder.query({
            query: (body) => {
                const basePath = "reports/datewise-detailed-report";
                const params = body?.params || {};
                const queryString = new URLSearchParams(params).toString();
                return `${basePath}?${queryString}`;
            },
            providesTags: ["datewisedetailedreports"],
            keepUnusedDataFor: 300, // Keep data for 5 minutes
        }),
        getDatewiseSummaryReport: builder.query({
            query: (body) => {
                const basePath = "reports/datewise-summary-report";
                const params = body?.params || {};
                const queryString = new URLSearchParams(params).toString();
                return `${basePath}?${queryString}`;
            },
            providesTags: ["datewisesummaryreports"],
            keepUnusedDataFor: 300, // Keep data for 5 minutes
        }),
    }),
});

export const {

    useGetAllRecordsQuery,
    useGetMultipleRecordsQuery,
    useGetMemberCodewiseReportQuery,
    useGetAbsentMemberReportQuery,
    useGetCumulativeReportQuery,
    useGetDatewiseDetailedReportQuery,
    useGetDatewiseSummaryReportQuery,
    useLazyGetAllRecordsQuery,
    useLazyGetAbsentMemberReportQuery,
    useLazyGetMemberCodewiseReportQuery,
    useLazyGetCumulativeReportQuery,
    useLazyGetDatewiseDetailedReportQuery,
    useLazyGetDatewiseSummaryReportQuery
} = recordDetails;
