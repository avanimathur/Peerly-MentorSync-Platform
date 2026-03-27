const API_BASE = window.API_BASE;
const token = localStorage.getItem("token");
const statusBox = document.getElementById("status");
const saveButton = document.getElementById("saveButton");
const departmentInput = document.getElementById("department");
const yearInput = document.getElementById("year");
const skillsInput = document.getElementById("skills");
const interestsInput = document.getElementById("interests");
const bioInput = document.getElementById("bio");

if (!token) window.location.href = "login.html";

function setStatus(message, type = "info") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
  statusBox.style.display = "block";
}

function toArray(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  saveButton.disabled = true;
  setStatus("Saving profile...", "info");

  try {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token
      },
      body: JSON.stringify({
        department: departmentInput.value.trim(),
        year: yearInput.value.trim(),
        skills: toArray(skillsInput.value),
        interests: toArray(interestsInput.value),
        bio: bioInput.value.trim()
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.message || "Could not update profile.", "error");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));
    setStatus("Profile updated successfully.", "success");

    setTimeout(() => {
      window.location.href = "mentors.html";
    }, 600);
  } catch (error) {
    setStatus("Unable to reach the server. Please try again.", "error");
  } finally {
    saveButton.disabled = false;
  }
});
