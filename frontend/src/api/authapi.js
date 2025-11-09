// src/api/authapi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// Helper to attach Authorization header
const withAuthHeaders = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

/**
 * Verify Auth0 User
 * Sends the access token to backend `/auth/verify`
 * so middleware can validate it and sync user in the database.
 */
export const verifyAuth0User = async (token) => {
  try {
    const res = await axios.post(`${API_URL}/auth/verify`, {}, withAuthHeaders(token));
    return res.data; // expected: { success: true, user: {...} }
  } catch (err) {
    console.error("Auth0 verification failed:", err);
    throw err;
  }
};

/**
 * Get Authenticated User Profile
 * Used when you want to fetch your logged-in user's info.
 */
export const getMyProfile = async (token) => {
  const res = await axios.get(`${API_URL}/users/me`, withAuthHeaders(token));
  return res.data;
};
