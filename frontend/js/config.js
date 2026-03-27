(function configureApiBase() {
  const storedApiBase = localStorage.getItem("apiBaseUrl");

  if (storedApiBase) {
    window.API_BASE = storedApiBase.replace(/\/$/, "");
    return;
  }

  if (window.location.protocol === "file:") {
    window.API_BASE = "http://localhost:5000/api";
    return;
  }

  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (isLocalhost) {
    window.API_BASE = `${window.location.protocol}//${window.location.hostname}:5000/api`;
    return;
  }

  window.API_BASE = `${window.location.origin}/api`;
})();
