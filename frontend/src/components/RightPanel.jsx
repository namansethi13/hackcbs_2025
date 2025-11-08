import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getDashboardData, getQuickLinks, addQuickLink } from "../api/dashboardApi";

const RightPanel = ({ organizationId }) => {
  const { token } = useSelector((state) => state.auth);

  const [dashboardData, setDashboardData] = useState({
    eventStatus: "Select an organization to view status.",
    upcomingPatrols: [],
  });
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  const [quickLinks, setQuickLinks] = useState([]);
  const [linksError, setLinksError] = useState("");
  const [newLink, setNewLink] = useState({ label: "", url: "" });
  const [loading, setLoading] = useState(false);

  const formatPatrolTime = (value) => {
    if (!value) {
      return "Scheduled time TBD";
    }

    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
      return value;
    }

    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    if (!token || !organizationId) {
      setDashboardData({
        eventStatus: "Select an organization to view status.",
        upcomingPatrols: [],
      });
      setDashboardError("");
      setIsDashboardLoading(false);
      return;
    }

    let isSubscribed = true;

    const fetchDashboard = async () => {
      setIsDashboardLoading(true);
      setDashboardError("");

      try {
        const data = await getDashboardData(token, organizationId);
        if (!isSubscribed) {
          return;
        }

        setDashboardData({
          eventStatus: data?.eventStatus || "No status available",
          upcomingPatrols: Array.isArray(data?.upcomingPatrols)
            ? data.upcomingPatrols
            : [],
        });
      } catch (error) {
        console.error("Error fetching dashboard data", error);
        if (!isSubscribed) {
          return;
        }

        setDashboardData({
          eventStatus: "Error fetching data",
          upcomingPatrols: [],
        });
        setDashboardError("Unable to load event status.");
      } finally {
        if (isSubscribed) {
          setIsDashboardLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isSubscribed = false;
    };
  }, [token, organizationId]);

  useEffect(() => {
    if (!token || !organizationId) {
      setQuickLinks([]);
      setLinksError("");
      return;
    }

    let isSubscribed = true;

    const fetchLinks = async () => {
      setLinksError("");

      try {
        const data = await getQuickLinks(token, organizationId);
        if (!isSubscribed) {
          return;
        }

        setQuickLinks(Array.isArray(data?.links) ? data.links : []);
      } catch (error) {
        console.error("Error fetching quick links", error);
        if (!isSubscribed) {
          return;
        }

        setQuickLinks([]);
        setLinksError("Unable to load quick links.");
      }
    };

    fetchLinks();

    return () => {
      isSubscribed = false;
    };
  }, [token, organizationId]);

  const handleAddLink = async (event) => {
    event.preventDefault();
    if (!organizationId || !newLink.label.trim() || !newLink.url.trim()) {
      return;
    }

    try {
      setLoading(true);
      setLinksError("");
      const response = await addQuickLink(token, organizationId, newLink);
      const addedLink = response?.link || response;
      setQuickLinks((prev) => [addedLink, ...prev]);
      setNewLink({ label: "", url: "" });
    } catch (error) {
      console.error("Error adding quick link", error);
      setLinksError("Unable to add quick link.");
    } finally {
      setLoading(false);
    }
  };

  const isQuickLinkFormDisabled = loading || !organizationId;
  const statusClassName = dashboardError
    ? "text-red-600"
    : organizationId
    ? "text-green-600 font-medium"
    : "text-gray-600";
  const statusText = isDashboardLoading
    ? "Loading..."
    : dashboardData.eventStatus || "No status available";

  return (
    <div className="w-80 space-y-4">
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <h4 className="font-semibold text-gray-800 mb-2">Event Status</h4>
        <p className={`text-sm ${statusClassName}`}>{statusText}</p>
        {dashboardError && (
          <p className="text-xs text-red-600 mt-1">{dashboardError}</p>
        )}
      </div>

      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <h4 className="font-semibold text-gray-800 mb-2">Upcoming Patrols</h4>
        <ul className="text-sm text-gray-600 space-y-2">
          {organizationId ? (
            dashboardData.upcomingPatrols.length > 0 ? (
              dashboardData.upcomingPatrols.map((patrol) => (
                <li key={patrol.id || `${patrol.name}-${patrol.time}`}>
                  {patrol.name} ({formatPatrolTime(patrol.time)})
                </li>
              ))
            ) : (
              <li>No upcoming patrols</li>
            )
          ) : (
            <li>Select an organization to view patrols</li>
          )}
        </ul>
      </div>

      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
        <h4 className="font-semibold text-gray-800 mb-3">Quick Links</h4>

        {linksError && (
          <p className="text-xs text-red-600 mb-2">{linksError}</p>
        )}

        <ul className="text-sm text-orange-600 space-y-2 mb-3">
          {organizationId ? (
            quickLinks.length > 0 ? (
              quickLinks.map((link) => (
                <li key={link.id || `${link.label}-${link.url}`}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))
            ) : (
              <li>No quick links yet</li>
            )
          ) : (
            <li>Select an organization to manage quick links</li>
          )}
        </ul>

        <form onSubmit={handleAddLink} className="space-y-2">
          <input
            type="text"
            placeholder="Label"
            className="w-full border rounded p-2 text-sm"
            value={newLink.label}
            onChange={(event) =>
              setNewLink({ ...newLink, label: event.target.value })
            }
            disabled={isQuickLinkFormDisabled}
          />
          <input
            type="url"
            placeholder="https://example.com"
            className="w-full border rounded p-2 text-sm"
            value={newLink.url}
            onChange={(event) =>
              setNewLink({ ...newLink, url: event.target.value })
            }
            disabled={isQuickLinkFormDisabled}
          />
          <button
            type="submit"
            disabled={isQuickLinkFormDisabled}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white w-full py-2 rounded text-sm font-medium"
          >
            {loading ? "Saving..." : "Add Quick Link"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RightPanel;
