const API_BASE = window.API_BASE;
const statusBox = document.getElementById("status");
const loginButton = document.getElementById("loginButton");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

function setStatus(message, type = "info") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
  statusBox.style.display = "block";
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  loginButton.disabled = true;
  setStatus("Signing you in...", "info");

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passwordInput.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.message || "Login failed.", "error");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setStatus("Login successful. Redirecting...", "success");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 500);
  } catch (error) {
    setStatus("Unable to reach the server. Please try again.", "error");
  } finally {
    loginButton.disabled = false;
  }
});
