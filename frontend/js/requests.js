const API_BASE = window.API_BASE;
const token = localStorage.getItem("token");
const statusBox = document.getElementById("status");
const list = document.getElementById("requestList");

if (!token) window.location.href = "login.html";

function setStatus(message, type = "info") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
  statusBox.style.display = "block";
}

function hideStatus() {
  statusBox.style.display = "none";
}

async function loadRequests() {
  try {
    const res = await fetch(`${API_BASE}/requests/incoming`, {
      headers: { Authorization: token }
    });

    const requests = await res.json();

    if (!res.ok) {
      setStatus(requests.message || "Failed to load requests.", "error");
      return;
    }

    if (!Array.isArray(requests) || requests.length === 0) {
      setStatus("No incoming requests yet.", "info");
      return;
    }

    hideStatus();

    requests.forEach((r) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${r.mentee?.name || "Unknown mentee"}</h3>
        <p>${r.mentee?.department || "N/A"} | ${r.mentee?.year || "N/A"}</p>
        <p><strong>Status:</strong> ${r.status}</p>
        <div class="inline-actions">
          <button data-action="accepted">Accept</button>
          <button class="danger" data-action="rejected">Reject</button>
        </div>
      `;

      const [acceptBtn, rejectBtn] = card.querySelectorAll("button");
      acceptBtn.addEventListener("click", () => updateStatus(r._id, "accepted"));
      rejectBtn.addEventListener("click", () => updateStatus(r._id, "rejected"));

      list.appendChild(card);
    });
  } catch (error) {
    setStatus("Unable to reach the server. Please try again.", "error");
  }
}

async function updateStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/requests/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token
      },
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      setStatus("Failed to update request.", "error");
      return;
    }

    setStatus("Request updated successfully.", "success");
    setTimeout(() => window.location.reload(), 400);
  } catch (error) {
    setStatus("Unable to update request right now.", "error");
  }
}

loadRequests();
