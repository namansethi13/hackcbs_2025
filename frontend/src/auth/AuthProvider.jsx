import { Auth0Provider } from "@auth0/auth0-react";

const AuthProviderWithConfig = ({ children }) => {
  const domain = "dev-hxbv3eu0f4ouih6a.us.auth0.com";
  const clientId = "ijuwaVn0qcarEVVrMV8YCNC7XAaRtm5P";
  const audience = "https://dev-hxbv3eu0f4ouih6a.us.auth0.com/api/v2/";

  const onRedirectCallback = (appState) => {
    const returnTo = appState?.returnTo || window.location.pathname;
    if (returnTo === "/login" && window.location.pathname === "/login") {
      window.history.replaceState({}, document.title, "/dashboard");
    } else {
      window.history.replaceState({}, document.title, returnTo);
    }
  };

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/dashboard`,
        audience: audience,
        scope: "openid profile email",
      }}
      useRefreshTokens={true}
      cacheLocation="localstorage"
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
};

export default AuthProviderWithConfig;
