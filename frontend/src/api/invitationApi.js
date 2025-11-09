import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

const withAuth = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const inviteUserByEmail = async (token, organizationId, email, role = "MEMBER") => {
  const { data } = await axios.post(
    `${API_URL}/orgs/${organizationId}/invite`,
    { email, role },
    withAuth(token)
  );
  return data;
};