const API_BASE = window.API_BASE;
const statusBox = document.getElementById("status");
const registerButton = document.getElementById("registerButton");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const roleInput = document.getElementById("role");

function setStatus(message, type = "info") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
  statusBox.style.display = "block";
}

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  registerButton.disabled = true;
  setStatus("Creating your account...", "info");

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        role: roleInput.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.message || "Registration failed.", "error");
      return;
    }

    setStatus("Account created successfully. Redirecting to login...", "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 700);
  } catch (error) {
    setStatus("Unable to reach the server. Please try again.", "error");
  } finally {
    registerButton.disabled = false;
  }
});
