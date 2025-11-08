import React from "react";
import { useAuth0 } from "@auth0/auth0-react";

function Login() {
  const { loginWithRedirect, isLoading } = useAuth0();

  React.useEffect(() => {
    if (!isLoading) {
      loginWithRedirect({
        appState: { returnTo: "/dashboard" }
      });
    }
  }, [isLoading, loginWithRedirect]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-200 relative">
      {/* Brand */}
      <div className="absolute top-6 left-8 text-2xl font-extrabold text-orange-600 tracking-wide">
        CrowdGuard
      </div>

      {/* Auth0 Login Card */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md border border-gray-100 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Welcome Back
          </h2>

          {/* Auth0 Login Button */}
          <button
            onClick={() => loginWithRedirect()}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition-all shadow-md"
          >
            Login with Auth0
          </button>

          {/* Signup Link */}
          {/* <p className="text-sm text-gray-600 text-center mt-4">
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-orange-600 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p> */}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-xs pb-4">
        © {new Date().getFullYear()} CrowdGuard. All rights reserved.
      </div>
    </div>
  );
}

export default Login;
