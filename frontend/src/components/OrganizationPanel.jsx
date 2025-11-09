import { useState } from "react";
import { createOrganization, addSubordinate } from "../api/dashboardApi";

const OrganizationPanel = ({ token }) => {
  const [orgName, setOrgName] = useState("");
  const [orgId, setOrgId] = useState("");
  const [subEmail, setSubEmail] = useState("");

  const handleCreateOrg = async () => {
    try {
      const data = await createOrganization(token, orgName);
      alert("Organization created successfully!");
      setOrgId(data.orgId);
    } catch {
      alert("Error creating organization.");
    }
  };

  const handleAddSub = async () => {
    try {
      await addSubordinate(token, orgId, subEmail);
      alert("Subordinate added!");
    } catch {
      alert("Error adding subordinate.");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-semibold mb-3">Organization Management</h2>

      <input
        type="text"
        placeholder="Organization Name"
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <button
        onClick={handleCreateOrg}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
      >
        Create Organization
      </button>

      <hr className="my-4" />

      <input
        type="text"
        placeholder="Subordinate Email"
        value={subEmail}
        onChange={(e) => setSubEmail(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <button
        onClick={handleAddSub}
        className="bg-green-500 text-white px-4 py-2 rounded w-full"
      >
        Add Subordinate
      </button>
    </div>
  );
};

export default OrganizationPanel;
