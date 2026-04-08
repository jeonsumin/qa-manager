export const success = (data: unknown) => ({success: true, data});

export const successList = (
    data: unknown,
    pagination: { page: number; limit: number; total: number; totalPages: number }
) => ({success: true, data, pagination});

export const errorResponse = (code: string, message: string) => ({
    success: false,
    error: {code, message},
});
