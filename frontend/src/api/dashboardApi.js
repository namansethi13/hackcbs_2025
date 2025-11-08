import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

const withAuth = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getOrganizations = async (token) => {
  const { data } = await axios.get(`${API_URL}/orgs`, withAuth(token));
  return data;
};

export const getOrganizationDetails = async (token, organizationId) => {
  const { data } = await axios.get(`${API_URL}/orgs/${organizationId}`, withAuth(token));
  return data;
};

export const getAlerts = async (token, organizationId) => {
  if (!organizationId) {
    throw new Error("organizationId is required to fetch alerts");
  }

  const { data } = await axios.get(
    `${API_URL}/orgs/${organizationId}/alerts`,
    withAuth(token)
  );
  return data;
};

export const getDashboardData = async (token, organizationId) => {
  if (!organizationId) {
    throw new Error("organizationId is required to fetch dashboard data");
  }

  const { data } = await axios.get(
    `${API_URL}/orgs/${organizationId}/dashboard`,
    withAuth(token)
  );
  return data;
};

export const getQuickLinks = async (token, organizationId) => {
  if (!organizationId) {
    throw new Error("organizationId is required to fetch quick links");
  }

  const { data } = await axios.get(
    `${API_URL}/orgs/${organizationId}/quick-links`,
    withAuth(token)
  );
  return data;
};

export const addQuickLink = async (token, organizationId, newLink) => {
  if (!organizationId) {
    throw new Error("organizationId is required to add a quick link");
  }

  const { data } = await axios.post(
    `${API_URL}/orgs/${organizationId}/quick-links`,
    newLink,
    withAuth(token)
  );
  return data;
};

export const createOrganization = async (token, orgName) => {
  const { data } = await axios.post(
    `${API_URL}/orgs`,
    { name: orgName },
    withAuth(token)
  );
  return data;
};

export const addSubordinate = async (
  token,
  orgId,
  subordinateEmail,
  role = "MEMBER"
) => {
  const { data } = await axios.post(
    `${API_URL}/orgs/${orgId}/members`,
    { email: subordinateEmail, role },
    withAuth(token)
  );
  return data;
};

export const getAllUsers = async (token) => {
  const { data } = await axios.get(`${API_URL}/users/all`, withAuth(token));
  return data;
};

export const removeMember = async (token, orgId, userId) => {
  const { data } = await axios.delete(
    `${API_URL}/orgs/${orgId}/members/${userId}`,
    withAuth(token)
  );
  return data;
};

export const updateMemberRole = async (token, orgId, userId, role) => {
  const { data } = await axios.put(
    `${API_URL}/orgs/${orgId}/members/${userId}`,
    { role },
    withAuth(token)
  );
  return data;
};
