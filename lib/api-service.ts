const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
    authToken = token;
    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }
}

export function getAuthToken() {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('auth_token');
    }
    return authToken;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    // Return the full response object to preserve success flag and other metadata
    return result as T;
}

function getHeaders(includeAuth: boolean = false) {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
}

export const apiService = {
    async get<T = any>(endpoint: string, includeAuth: boolean = false): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: getHeaders(includeAuth),
        });
        return handleResponse<T>(response);
    },

    async post<T = any>(endpoint: string, data: any, includeAuth: boolean = false): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(includeAuth),
            body: JSON.stringify(data),
        });
        return handleResponse<T>(response);
    },

    async put<T = any>(endpoint: string, data: any, includeAuth: boolean = false): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(includeAuth),
            body: JSON.stringify(data),
        });
        return handleResponse<T>(response);
    },

    async delete<T = any>(endpoint: string, includeAuth: boolean = false): Promise<T> {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(includeAuth),
        });
        return handleResponse<T>(response);
    }
};
