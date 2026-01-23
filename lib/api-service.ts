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

async function handleResponse(response: Response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
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
    async get(endpoint: string, includeAuth: boolean = false) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: getHeaders(includeAuth),
        });
        return handleResponse(response);
    },

    async post(endpoint: string, data: any, includeAuth: boolean = false) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(includeAuth),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    async put(endpoint: string, data: any, includeAuth: boolean = false) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(includeAuth),
            body: JSON.stringify(data),
        });
        return handleResponse(response);
    },

    async delete(endpoint: string, includeAuth: boolean = false) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(includeAuth),
        });
        return handleResponse(response);
    }
};
