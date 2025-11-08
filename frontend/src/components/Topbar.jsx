const Topbar = ({ user, onLogout }) => (
  <div className="flex justify-between items-center bg-white border-b px-6 py-3">
    <h2 className="text-lg font-semibold">Live Event Dashboard</h2>
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700">Hi, {user?.name || "User"}</span>
      <button onClick={onLogout} className="bg-orange-700 text-white px-4 py-1.5 rounded">
        Logout
      </button>
    </div>
  </div>
);

export default Topbar