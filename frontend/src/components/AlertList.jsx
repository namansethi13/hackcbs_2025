const AlertList = ({ alerts }) => {
  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      <h2 className="text-lg font-semibold mb-3">Live Alerts</h2>
      {alerts.length === 0 ? (
        <p>No alerts yet.</p>
      ) : (
        <ul>
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`p-3 mb-2 rounded border-l-4 ${
                alert.severity === "high"
                  ? "border-red-500 bg-red-50"
                  : alert.severity === "medium"
                  ? "border-yellow-400 bg-yellow-50"
                  : "border-green-400 bg-green-50"
              }`}
            >
              <p className="font-semibold">
                {alert.severity.toUpperCase()} — {alert.description}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AlertList;
