const severityColors = {
  critical: "bg-red-50 border-l-4 border-red-500",
  high: "bg-yellow-50 border-l-4 border-yellow-500",
  medium: "bg-green-50 border-l-4 border-green-400",
};

const Mainalerts = ({
  alerts,
  organizations = [],
  selectedOrgId,
  onOrgChange,
  onCreateOrgClick,
  onManageMembersClick,
  isLoading = false,
  organizationError = "",
}) => {
  const hasOrganizations = organizations.length > 0;

  const handleOrgChange = (event) => {
    const nextOrgId = event.target.value;
    if (nextOrgId) {
      onOrgChange?.(nextOrgId);
    }
  };

  return (
    <div className="flex-1 space-y-4">
      {/* ===== Header Section ===== */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Real-Time Security Alerts</h3>

          {organizationError ? (
            <p className="text-sm text-red-600">{organizationError}</p>
          ) : isLoading ? (
            <p className="text-sm text-gray-500">Loading organizations...</p>
          ) : hasOrganizations ? (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <span>Organization:</span>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedOrgId ?? ""}
                onChange={handleOrgChange}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-sm text-gray-500">
              Create an organization to start monitoring alerts.
            </p>
          )}
        </div>

        {/* ===== Buttons ===== */}
        <div className="flex gap-2">
          {hasOrganizations && selectedOrgId && (
            <button
              onClick={onManageMembersClick}
              className="text-blue-600 hover:text-blue-700 text-sm whitespace-nowrap border border-blue-600 px-3 py-1 rounded"
            >
              Manage Members
            </button>
          )}
          <button
            onClick={onCreateOrgClick}
            className="text-orange-600 hover:text-orange-700 text-sm whitespace-nowrap border border-orange-600 px-3 py-1 rounded"
          >
            + Create Organization
          </button>
        </div>
      </div>

      {/* ===== Alert Section ===== */}
      {!hasOrganizations ? (
        <div className="bg-white p-6 rounded-lg shadow text-gray-500 text-sm">
          Start by creating an organization to view alerts.
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-gray-500 text-sm">
          No alerts yet.
        </div>
      ) : (
        alerts.map((alert, index) => (
          <div
            key={alert.id || `${alert.timestamp || "alert"}-${index}`}
            className={`${
              severityColors[alert.severity?.toLowerCase()] || "bg-gray-50"
            } p-4 rounded-lg shadow`}
          >
            {/* 🔥 Severity Label */}
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-gray-800">
                {alert.incident_type || "Incident Detected"}
              </p>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  alert.severity === "Critical"
                    ? "bg-red-100 text-red-700"
                    : alert.severity === "High"
                    ? "bg-yellow-100 text-yellow-700"
                    : alert.severity === "Medium"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {alert.severity || "Unknown"}
              </span>
            </div>

            {/* 📝 Description */}
            <p className="text-sm text-gray-700 mb-2">
              {alert.description || "No description available."}
            </p>

            {/* ✅ Recommended Action */}
            {alert.recommended_action && (
              <div className="text-sm text-gray-600 mt-2">
                <strong>Action:</strong> {alert.recommended_action}
              </div>
            )}

            {/* 🕒 Timestamp */}
            <p className="text-xs text-gray-500 mt-2">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default Mainalerts;
