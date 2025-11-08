import { createSlice } from "@reduxjs/toolkit";

const isBrowser = typeof window !== "undefined";

const readFromStorage = (key) => {
    if (!isBrowser) {
        return null;
    }
    try {
        return window.localStorage.getItem(key);
    } catch (error) {
        return null;
    }
};

const writeToStorage = (key, value) => {
    if (!isBrowser) {
        return;
    }
    try {
        if (value === null || typeof value === "undefined") {
            window.localStorage.removeItem(key);
        } else {
            window.localStorage.setItem(key, value);
        }
    } catch (error) {
        // Swallow storage errors (e.g., disabled cookies, private mode)
    }
};

const storedToken = readFromStorage("token");
let storedUser = null;

const rawUser = readFromStorage("user");
if (rawUser) {
    try {
        storedUser = JSON.parse(rawUser);
    } catch (error) {
        storedUser = null;
    }
}

const initialState = {
    user: storedUser,
    token: storedToken,
    isAuthenticated: Boolean(storedToken),
};

const persistAuthState = (token, user) => {
    writeToStorage("token", token ?? null);
    writeToStorage("user", user ? JSON.stringify(user) : null);
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            const { token, user } = action.payload || {};
            state.user = user || null;
            state.token = token || null;
            state.isAuthenticated = Boolean(token);
            persistAuthState(token || null, user || null);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            persistAuthState(null, null);
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
