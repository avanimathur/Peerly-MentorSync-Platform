const API_BASE = window.API_BASE;
const token = localStorage.getItem("token");
const statusBox = document.getElementById("status");
const list = document.getElementById("mentorList");

if (!token) window.location.href = "login.html";

function setStatus(message, type = "info") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
  statusBox.style.display = "block";
}

function hideStatus() {
  statusBox.style.display = "none";
}

async function loadMentors() {
  try {
    const res = await fetch(`${API_BASE}/match/mentors`, {
      headers: { Authorization: token }
    });

    const mentors = await res.json();

    if (!res.ok) {
      setStatus(mentors.message || "Failed to load mentors.", "error");
      return;
    }

    if (!Array.isArray(mentors) || mentors.length === 0) {
      setStatus("No mentors found yet. Please complete your profile and check again.", "info");
      return;
    }

    hideStatus();
    mentors.forEach((m) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${m.name}</h3>
        <p>${m.department || "N/A"} | ${m.year || "N/A"}</p>
        <p><strong>Skills:</strong> ${m.skills?.join(", ") || "Not added"}</p>
        <p><strong>Match Score:</strong> ${m.matchScore ?? 0}</p>
        <button data-id="${m._id}">Send Request</button>
      `;

      card.querySelector("button").addEventListener("click", () => sendRequest(m._id));
      list.appendChild(card);
    });
  } catch (error) {
    setStatus("Unable to reach the server. Please try again.", "error");
  }
}

async function sendRequest(mentorId) {
  try {
    const res = await fetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token
      },
      body: JSON.stringify({ mentorId })
    });

    const data = await res.json();
    setStatus(data.message || "Request sent.", res.ok ? "success" : "error");
  } catch (error) {
    setStatus("Unable to send request right now.", "error");
  }
}

loadMentors();
