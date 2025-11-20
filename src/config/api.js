// src/config/apiConfig.js

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const MOCK_URL = import.meta.env.VITE_MOCK_API_URL || "http://localhost:4000";
const REAL_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const API_BASE_URL = USE_MOCK ? MOCK_URL : REAL_URL;

// Optional: tiny helper so you always call `apiFetch("/authors")`
export const apiFetch = (path, options = {}) => {
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  return fetch(url, options);
};
