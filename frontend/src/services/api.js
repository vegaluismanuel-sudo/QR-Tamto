const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${API_URL}/images/upload`, {
        method: 'POST',
        body: formData,
    });
    return response.json();
};

export const saveReport = async (reportData) => {
    const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
    });
    return response.json();
};

export const getReports = async () => {
    const response = await fetch(`${API_URL}/reports`);
    return response.json();
};

export const getReportById = async (id) => {
    const response = await fetch(`${API_URL}/reports/${id}`);
    return response.json();
};

export const deleteReport = async (id) => {
    const response = await fetch(`${API_URL}/reports/${id}`, {
        method: 'DELETE',
    });
    return response.json();
};

export const login = async (username, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
    }
    return response.json();
};
