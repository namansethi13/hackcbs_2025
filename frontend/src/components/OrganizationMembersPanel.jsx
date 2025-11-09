import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getOrganizationDetails,
  getAllUsers,
  addSubordinate,
  removeMember,
  updateMemberRole,
} from "../api/dashboardApi";
import { inviteUserByEmail } from "../api/invitationApi";
import { X, UserPlus, Trash2, Shield } from "lucide-react";

const OrganizationMembersPanel = ({ organizationId, onClose }) => {
  const token = sessionStorage.getItem("access_token");
  const [orgDetails, setOrgDetails] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("MEMBER");
  const [isAdding, setIsAdding] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    if (!token || !organizationId) {
      console.log(token)
      setError("Missing token or organization ID");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        console.log("Fetching org details for:", organizationId);
        console.log("Using token:", token ? "Present" : "Missing");

        const orgData = await getOrganizationDetails(token, organizationId);
        console.log("Org data received:", orgData);

        if (!orgData || !orgData.organization) {
          throw new Error("Invalid organization data received");
        }

        setOrgDetails(orgData.organization);

        console.log("Fetching all users...");
        const usersData = await getAllUsers(token);
        console.log("Users data received:", usersData);
        setAllUsers(usersData.users || []);

        console.log("Data loaded successfully");
      } catch (err) {
        console.error("Error loading data:", err);
        console.error("Error response:", err.response?.data);
        console.error("Error status:", err.response?.status);

        let errorMessage = "Failed to load data. ";

        if (err.response?.status === 403) {
          errorMessage += "You don't have permission to view this organization.";
        } else if (err.response?.status === 404) {
          errorMessage += "Organization not found.";
        } else if (err.response?.status === 401) {
          errorMessage += "Your session has expired. Please login again.";
        } else if (err.response?.data?.error) {
          errorMessage += err.response.data.error;
        } else if (err.message) {
          errorMessage += err.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, organizationId]);

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setIsAdding(true);
    setError("");
    try {
      const user = allUsers.find((u) => u.id === selectedUser);
      await addSubordinate(token, organizationId, user.email, selectedRole);

      // Refresh org details
      const orgData = await getOrganizationDetails(token, organizationId);
      setOrgDetails(orgData.organization);
      setSelectedUser("");
      setSelectedRole("MEMBER");
    } catch (err) {
      console.error("Error adding member:", err);
      setError(err.response?.data?.error || "Failed to add member");
    } finally {
      setIsAdding(false);
    }
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail) return;

    setIsInviting(true);
    setError("");
    try {
      await inviteUserByEmail(token, organizationId, inviteEmail, selectedRole);
      setInviteEmail("");
      setSelectedRole("MEMBER");
      // Show success message
      alert("Invitation sent successfully!");
    } catch (err) {
      console.error("Error sending invitation:", err);
      setError(err.response?.data?.error || "Failed to send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      await removeMember(token, organizationId, userId);
      const orgData = await getOrganizationDetails(token, organizationId);
      setOrgDetails(orgData.organization);
    } catch (err) {
      console.error("Error removing member:", err);
      setError(err.response?.data?.error || "Failed to remove member");
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateMemberRole(token, organizationId, userId, newRole);
      const orgData = await getOrganizationDetails(token, organizationId);
      setOrgDetails(orgData.organization);
    } catch (err) {
      console.error("Error updating role:", err);
      setError(err.response?.data?.error || "Failed to update role");
    }
  };

  const memberIds = orgDetails?.members?.map((m) => m.user?.id) || [];
  const availableUsers = allUsers.filter((u) => !memberIds.includes(u.id));

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700";
      case "SUB_ADMIN":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 w-full max-w-4xl">
          <p className="text-center text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Manage Organization Members
            </h2>
            <p className="text-sm text-gray-600 mt-1">{orgDetails?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add New Member and Invite Sections */}
          <div className="space-y-4">
            {/* Invite by Email Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <UserPlus size={20} />
                Invite by Email
              </h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  disabled={isInviting}
                />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  disabled={isInviting}
                >
                  <option value="MEMBER">Member</option>
                  <option value="SUB_ADMIN">Sub Admin</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  onClick={handleInviteByEmail}
                  disabled={!inviteEmail || isInviting}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition"
                >
                  {isInviting ? "Inviting..." : "Send Invite"}
                </button>
              </div>
            </div>

            {/* Add Existing User Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <UserPlus size={20} />
                Add Existing User
              </h3>
              <div className="flex gap-3">
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  disabled={isAdding}
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || "Unnamed"} ({user.email})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  disabled={isAdding}
                >
                  <option value="MEMBER">Member</option>
                  <option value="SUB_ADMIN">Sub Admin</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <button
                  onClick={handleAddMember}
                  disabled={!selectedUser || isAdding}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition"
                >
                  {isAdding ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>

          {/* Current Members List */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield size={20} />
              Current Members ({orgDetails?.members?.length || 0})
            </h3>
            {orgDetails?.members?.length > 0 ? (
              <div className="space-y-2">
                {orgDetails.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {member.user?.name || "Unnamed User"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {member.user?.email || "No email"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined: {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleUpdateRole(member.user?.id, e.target.value)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          member.role
                        )} border-0 cursor-pointer`}
                        disabled={member.role === "ADMIN" && orgDetails.ownerId === member.user?.id}
                      >
                        <option value="MEMBER">Member</option>
                        <option value="SUB_ADMIN">Sub Admin</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      {!(member.role === "ADMIN" && orgDetails.ownerId === member.user?.id) && (
                        <button
                          onClick={() => handleRemoveMember(member.user?.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Remove member"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No members yet. Add your first member above.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrganizationMembersPanel;
