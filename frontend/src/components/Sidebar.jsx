import { useState } from "react";
import { Home, Bell, Calendar, Users, Shield } from "lucide-react";

const Sidebar = () => {
  const [active, setActive] = useState("Dashboard");

  const links = [
    { icon: <Home size={18} />, text: "Dashboard" },
    { icon: <Bell size={18} />, text: "Alerts" },
    { icon: <Calendar size={18} />, text: "Scheduling" },
    { icon: <Users size={18} />, text: "Personnel" },
    // { icon: <Shield size={18} />, text: "Equipment" },
  ];

  return (
    <div className="w-64 bg-white border-r p-5 space-y-6">
      <h1 className="text-2xl font-extrabold text-orange-600 tracking-wide">
        CrowdGuard
      </h1>

      <nav className="space-y-2">
        {links.map((link) => (
          <SidebarLink
            key={link.text}
            icon={link.icon}
            text={link.text}
            active={active === link.text}
            onClick={() => setActive(link.text)}
          />
        ))}
      </nav>
    </div>
  );
};

const SidebarLink = ({ icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full gap-3 px-4 py-2.5 rounded-md text-left transition-all duration-200 ${
      active
        ? "bg-orange-50 text-orange-600 font-semibold shadow-sm"
        : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {icon}
    <span>{text}</span>
  </button>
);

export default Sidebar;
