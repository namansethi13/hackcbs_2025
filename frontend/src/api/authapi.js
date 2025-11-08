import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

const withAuthHeaders = (token) => ({
    headers: { Authorization: `Bearer ${token}` },
});

export const loginUser = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    return res.data;
};

export const signupUser = async (name, email, password) => {
    const res = await axios.post(`${API_URL}/auth/signup`, { name, email, password });
    return res.data;
};

export const getMyProfile = async (token) => {
    const res = await axios.get(`${API_URL}/users/me`, withAuthHeaders(token));
    return res.data;
};
