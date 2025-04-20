// Load saved history and settings from localStorage
let history = JSON.parse(localStorage.getItem("habitHistory")) || [];
let settings = JSON.parse(localStorage.getItem("habitSettings")) || {
  startDate: new Date().toLocaleDateString("en-CA"),
  streakDuration: 10,
  habits: [
    { id: "walk", name: "Walk 20k steps or more" },
    { id: "fast", name: "Water fast" },
    { id: "chordii", name: "Assemble 50 chordii" },
    { id: "sauna", name: "Sauna" },
  ],
};

// Get today's date in local timezone
const today = new Date();
let selectedDate = today.toLocaleDateString("en-CA"); // Formats as YYYY-MM-DD

// Helper function to parse YYYY-MM-DD as local date
function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day); // Month is 0-based in JS
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Render the habit list
function renderHabits() {
  const habitsContainer = document.getElementById("habits");
  habitsContainer.innerHTML = "";

  settings.habits.forEach((habit) => {
    const todoEl = document.createElement("label");
    todoEl.className = "todo";
    todoEl.dataset.id = habit.id;

    const entry = history.find((e) => e.date === selectedDate);
    const isChecked =
      entry?.habits.some((h) => h.id === habit.id && h.completed) || false;

    todoEl.innerHTML = `
      <input class="todo__state" type="checkbox" id="${habit.id}" ${
      isChecked ? "checked" : ""
    } onchange="updateProgress()">
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 25" class="todo__icon">
        <use xlink:href="#todo__line" class="todo__line"></use>
        <use xlink:href="#todo__box" class="todo__box"></use>
        <use xlink:href="#todo__check" class="todo__check"></use>
        <use xlink:href="#todo__circle" class="todo__circle"></use>
      </svg>
      <div class="todo__text">${habit.name}</div>
      <button class="edit-button" onclick="editHabit('${habit.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
    `;

    habitsContainer.appendChild(todoEl);
  });

  updateProgress();
}

// Edit a specific habit
function editHabit(habitId) {
  const habit = settings.habits.find((h) => h.id === habitId);
  if (!habit) return;

  const newName = prompt("Edit habit name:", habit.name);
  if (newName !== null && newName.trim() !== "") {
    habit.name = newName.trim();
    saveSettings();
    renderHabits();
  }
}

// Edit mode for the habit list
function editHabitList() {
  const modal = document.createElement("div");
  modal.className = "modal";

  let habitsHTML = "";
  settings.habits.forEach((habit) => {
    habitsHTML += `
      <div class="habit-item">
        <input type="text" value="${habit.name}" id="edit-${habit.id}">
        <button class="delete-button" onclick="removeHabitFromModal('${habit.id}')">×</button>
      </div>
    `;
  });

  modal.innerHTML = `
    <h3>Edit Habit List</h3>
    <div id="habit-list-editor">
      ${habitsHTML}
    </div>
    <button class="add-button" onclick="addHabitInModal()">+ Add Habit</button>
    <button onclick="saveHabitList()">Save Changes</button>
    <button onclick="closeModal()">Cancel</button>
  `;

  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  // Window variables for modal operations
  window.habitItemsInModal = [...settings.habits];

  backdrop.addEventListener("click", closeModal);

  // Close modal on Escape key
  function handleEscape(e) {
    if (e.key === "Escape") {
      closeModal();
    }
  }
  document.addEventListener("keydown", handleEscape);
}

// Add habit in the modal
function addHabitInModal() {
  const habitListEditor = document.getElementById("habit-list-editor");
  const newId = generateId();
  const habitItem = document.createElement("div");
  habitItem.className = "habit-item";
  habitItem.innerHTML = `
    <input type="text" placeholder="New habit" id="edit-${newId}">
    <button class="delete-button" onclick="removeHabitFromModal('${newId}')">×</button>
  `;

  habitListEditor.appendChild(habitItem);
  window.habitItemsInModal.push({ id: newId, name: "" });

  // Focus the new input
  document.getElementById(`edit-${newId}`).focus();
}

// Remove habit from the modal
function removeHabitFromModal(habitId) {
  const index = window.habitItemsInModal.findIndex((h) => h.id === habitId);
  if (index !== -1) {
    window.habitItemsInModal.splice(index, 1);

    // Remove from DOM
    const habitItems = document.querySelectorAll(".habit-item");
    habitItems.forEach((item) => {
      const itemId = item.querySelector("input").id.replace("edit-", "");
      if (itemId === habitId) {
        item.remove();
      }
    });
  }
}

// Save the habit list from the modal
function saveHabitList() {
  const newHabits = [];

  window.habitItemsInModal.forEach((habit) => {
    const input = document.getElementById(`edit-${habit.id}`);
    if (input && input.value.trim() !== "") {
      newHabits.push({
        id: habit.id,
        name: input.value.trim(),
      });
    }
  });

  // Update settings with new habits
  settings.habits = newHabits;
  saveSettings();
  renderHabits();
  closeModal();
}

// Close the modal
function closeModal() {
  const modal = document.querySelector(".modal");
  const backdrop = document.querySelector(".backdrop");

  if (modal) document.body.removeChild(modal);
  if (backdrop) document.body.removeChild(backdrop);

  document.removeEventListener("keydown", closeModal);

  // Clean up window variable
  delete window.habitItemsInModal;
}

// Update progress circle
function updateProgress() {
  const habitCount = settings.habits.length;
  if (habitCount === 0) {
    document.getElementById("progress-text").textContent = "0%";
    document.getElementById("progress").style.strokeDashoffset =
      2 * Math.PI * 55; // Hide the progress circle
    return;
  }

  const checkedCount = settings.habits.filter(
    (habit) => document.getElementById(habit.id)?.checked
  ).length;

  const progress = (checkedCount / habitCount) * 100;
  const circle = document.getElementById("progress");
  const circumference = 2 * Math.PI * 55;
  const offset = circumference - (progress / 100) * circumference;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = offset;
  document.getElementById("progress-text").textContent = `${Math.round(
    progress
  )}%`;
}

// Update streak display
function updateStreakTracker() {
  const streakGrid = document.getElementById("streak-grid");
  streakGrid.innerHTML = "";
  const startDate = parseLocalDate(settings.startDate);
  const streakDuration = parseInt(settings.streakDuration) || 10;

  for (let i = 0; i < streakDuration; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toLocaleDateString("en-CA");
    const entry = history.find((e) => e.date === dateStr);
    const dayDiv = document.createElement("div");
    dayDiv.className = "streak-day";
    dayDiv.textContent = i + 1; // Display day number

    if (
      entry &&
      entry.habits.length > 0 &&
      entry.habits.every((h) => h.completed)
    ) {
      dayDiv.classList.add("completed");
    }

    // Add click event to load habits for this date
    dayDiv.addEventListener("click", () => loadHabitsForDate(dateStr));
    streakGrid.appendChild(dayDiv);
  }

  document.getElementById(
    "streak-title"
  ).textContent = `${streakDuration}-Day Challenge`;
}

// Load habits for a selected date
function loadHabitsForDate(date) {
  selectedDate = date; // Update the global selectedDate

  // Update date display using local date
  document.getElementById("date-display").textContent =
    parseLocalDate(date).toLocaleDateString();

  renderHabits();
}

// Open settings menu
function openSettingsMenu() {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <h3>Settings</h3>
    <label for="start-date">Start Date:</label>
    <input type="date" id="start-date" value="${settings.startDate}">
    <label for="streak-duration">Streak Duration (days):</label>
    <input type="number" id="streak-duration" value="${settings.streakDuration}" min="1" max="30">
    <button onclick="saveSettingsFromModal()">Save</button>
    <button onclick="closeModal()">Cancel</button>
  `;

  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";

  document.body.appendChild(backdrop);
  document.body.appendChild(modal);

  // Focus on the start date input
  document.getElementById("start-date").focus();

  // Close modal on backdrop click
  backdrop.addEventListener("click", closeModal);
}

// Save settings from modal
function saveSettingsFromModal() {
  const startDate = document.getElementById("start-date").value;
  const streakDuration = document.getElementById("streak-duration").value;

  if (startDate && streakDuration) {
    settings.startDate = startDate;
    settings.streakDuration = parseInt(streakDuration);
    saveSettings();
    updateStreakTracker();
    closeModal();
  }
}

// Save settings to localStorage
function saveSettings() {
  localStorage.setItem("habitSettings", JSON.stringify(settings));
}

// Save progress for the selected date
function saveDay() {
  const habits = settings.habits.map((habit) => ({
    id: habit.id,
    name: habit.name,
    completed: document.getElementById(habit.id)?.checked || false,
  }));

  const existingIndex = history.findIndex(
    (entry) => entry.date === selectedDate
  );

  if (existingIndex !== -1) {
    history[existingIndex].habits = habits;
  } else {
    history.push({ date: selectedDate, habits });
  }

  localStorage.setItem("habitHistory", JSON.stringify(history));
  updateStreakTracker();

  // Show saved confirmation
  const button = document.querySelector("button");
  const originalText = button.textContent;
  button.textContent = "Saved!";
  button.disabled = true;
  setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 1000);
}

// Initial setup
document.getElementById("date-display").textContent =
  parseLocalDate(selectedDate).toLocaleDateString();
renderHabits();
updateStreakTracker();
