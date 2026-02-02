import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api-service';

export function useApi<T>(endpoint: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiService.get(endpoint);

            // Check if result has success property (API response format)
            if (typeof result === 'object' && result !== null && 'success' in result) {
                const apiResult = result as any;
                if (apiResult.success) {
                    setData(apiResult.data);
                } else {
                    const errorMsg = apiResult.error || 'Failed to fetch data';
                    setError(errorMsg);
                }
            } else {
                // Fallback: if result doesn't have success property, assume it's the data itself
                setData(result as T);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refresh: fetchData };
}
