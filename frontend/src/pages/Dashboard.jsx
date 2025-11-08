import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getAlerts, getOrganizations } from "../api/dashboardApi";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Mainalerts from "../components/Mainalerts";
import RightPanel from "../components/RightPanel";
import CreateOrganizationDrawer from "../components/CreateOrganizationDrawer";
import OrganizationMembersPanel from "../components/OrganizationMembersPanel";

const Dashboard = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [alerts, setAlerts] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [organizationsError, setOrganizationsError] = useState("");
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openMembersPanel, setOpenMembersPanel] = useState(false);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  const fetchOrganizations = useCallback(
    async (preferredOrgId) => {
      if (!token) {
        return;
      }

      setOrganizationsLoading(true);
      setOrganizationsError("");

      try {
        const data = await getOrganizations(token);
        const orgs = Array.isArray(data?.organizations)
          ? data.organizations
          : [];

        setOrganizations(orgs);

        if (orgs.length === 0) {
          setSelectedOrgId(null);
          return;
        }

        if (preferredOrgId) {
          const preferred = orgs.find((org) => org.id === preferredOrgId);
          setSelectedOrgId(preferred ? preferred.id : orgs[0].id);
          return;
        }

        setSelectedOrgId((current) => {
          if (current && orgs.some((org) => org.id === current)) {
            return current;
          }
          return orgs[0].id;
        });
      } catch (error) {
        console.error("Unable to load organizations", error);
        setOrganizations([]);
        setSelectedOrgId(null);
        setOrganizationsError("Unable to load organizations right now.");
      } finally {
        setOrganizationsLoading(false);
      }
    },
    [token]
  );

  const fetchAlerts = useCallback(async () => {
    if (!token || !selectedOrgId) {
      setAlerts([]);
      return;
    }

    try {
      const data = await getAlerts(token, selectedOrgId);
      setAlerts(Array.isArray(data?.alerts) ? data.alerts : []);
    } catch (error) {
      console.error("Error fetching alerts", error);
      setAlerts([]);
    }
  }, [token, selectedOrgId]);

  useEffect(() => {
    const getToken = async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        setToken(accessToken);
        sessionStorage.setItem("access_token", accessToken)
      } catch (error) {
        console.error("Error getting token", error);
        navigate("/login");
      }
    };
    getToken();
  }, [getAccessTokenSilently, navigate]);

  useEffect(() => {
    if (!token) return;
    fetchOrganizations();
  }, [token, fetchOrganizations]);

  useEffect(() => {
    if (!token || !selectedOrgId) {
      setAlerts([]);
      return;
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [token, selectedOrgId, fetchAlerts]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleOrganizationCreated = (org) => {
    const preferredId = org?.id || org?.org?.id || null;
    setOpenDrawer(false);
    fetchOrganizations(preferredId);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar user={user} onLogout={handleLogout} />

        <div className="flex flex-1 p-6 gap-6">
          <Mainalerts
            alerts={alerts}
            organizations={organizations}
            selectedOrgId={selectedOrgId}
            onOrgChange={setSelectedOrgId}
            onCreateOrgClick={() => setOpenDrawer(true)}
            onManageMembersClick={() => setOpenMembersPanel(true)}
            isLoading={organizationsLoading}
            organizationError={organizationsError}
          />

          <RightPanel organizationId={selectedOrgId} />
        </div>

        <footer className="text-center text-gray-500 text-sm py-4 border-t mt-4">
          © {new Date().getFullYear()} CrowdGuard. All rights reserved.
        </footer>
      </div>

      <CreateOrganizationDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        token={token}
        onCreated={handleOrganizationCreated}
      />

      {openMembersPanel && selectedOrgId && (
        <OrganizationMembersPanel
          organizationId={selectedOrgId}
          onClose={() => setOpenMembersPanel(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
