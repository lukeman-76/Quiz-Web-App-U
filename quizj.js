const ADMIN_PASSWORD = "pa55w0rd";

let leaderboardAccess = false;
let userRecordsAccess = false;
let adminPanelAccess = false;

// Base questions (stored in original order)
const baseQuestionsByCategory = {
  General: [
    {q:"HTML stands for?",o:["Hyper Text Markup Language","High Tech Language","Hyper Tool Language","None of above"],correct:0},
    {q:"CSS is used for?",o:["Structure","Styling","Logic","Database"],correct:1},
    {q:"JavaScript is a?",o:["Programming Language","Markup Language","Style Language","Database Language"],correct:0},
    {q:"Which symbol is used for comments in JavaScript?",o:["//","<!--","**","##"],correct:0},
    {q:"What does SQL stand for?",o:["Structured Query Language","Simple Query Language","Styled Question Language","System Query Language"],correct:0},
    {q:"What does HTTP stand for?",o:["HyperText Transfer Protocol","High Transfer Text Protocol","Hyper Transfer Text Protocol","HighText Transfer Protocol"],correct:0},
    {q:"Which company developed Java?",o:["Sun Microsystems","Microsoft","Apple","IBM"],correct:0}
  ],
  Technology: [
    {q:"What does CPU stand for?",o:["Central Processing Unit","Computer Personal Unit","Central Program Unit","Core Processing Unit"],correct:0},
    {q:"Which company created Windows OS?",o:["Microsoft","Apple","Google","IBM"],correct:0},
    {q:"What does RAM stand for?",o:["Random Access Memory","Read Access Memory","Run Access Memory","Random Allocation Memory"],correct:0},
    {q:"Who is known as the father of computers?",o:["Charles Babbage","Alan Turing","Bill Gates","Steve Jobs"],correct:0},
    {q:"What does AI stand for?",o:["Artificial Intelligence","Automated Intelligence","Artificial Interface","Advanced Intelligence"],correct:0},
    {q:"Which company created the iPhone?",o:["Apple","Samsung","Nokia","Google"],correct:0},
    {q:"What does URL stand for?",o:["Uniform Resource Locator","Universal Resource Link","Uniform Reference Link","Universal Reference Locator"],correct:0},
    {q:"Which programming language is known as the backbone of web development?",o:["JavaScript","Python","Java","C++"],correct:0},
    {q:"What does IoT stand for?",o:["Internet of Things","Interface of Things","Internet of Technology","Integrated of Things"],correct:0},
    {q:"Who founded Microsoft?",o:["Bill Gates","Steve Jobs","Mark Zuckerberg","Larry Page"],correct:0}
  ],
  Science: [
    {q:"What is the chemical symbol for Gold?",o:["Au","Ag","Fe","Pb"],correct:0},
    {q:"What is the hardest natural substance?",o:["Diamond","Iron","Gold","Platinum"],correct:0},
    {q:"What planet is known as the Red Planet?",o:["Mars","Jupiter","Venus","Saturn"],correct:0},
    {q:"What gas do plants absorb from the air?",o:["Carbon Dioxide","Oxygen","Nitrogen","Hydrogen"],correct:0},
    {q:"What is the closest star to Earth?",o:["The Sun","Proxima Centauri","Alpha Centauri","Betelgeuse"],correct:0},
    {q:"What is the chemical formula for Water?",o:["H2O","CO2","O2","NaCl"],correct:0},
    {q:"Who developed the theory of relativity?",o:["Albert Einstein","Isaac Newton","Galileo Galilei","Nikola Tesla"],correct:0},
    {q:"What is the largest organ in the human body?",o:["Skin","Heart","Liver","Brain"],correct:0},
    {q:"What is the process by which plants make food?",o:["Photosynthesis","Respiration","Digestion","Fermentation"],correct:0},
    {q:"What is the boiling point of water at sea level?",o:["100°C","90°C","110°C","80°C"],correct:0}
  ]
};

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomizeQuestionOptions(question) {
  const correctOptionText = question.o[question.correct];
  const newOptions = [...question.o];
  const newCorrectIndex = Math.floor(Math.random() * 4);
  
  [newOptions[newCorrectIndex], newOptions[question.correct]] = [newOptions[question.correct], newOptions[newCorrectIndex]];
  
  return {
    q: question.q,
    o: newOptions,
    a: newCorrectIndex,
    originalCorrect: question.correct
  };
}

function prepareRandomizedQuiz(category) {
  const baseQuestions = baseQuestionsByCategory[category];
  let shuffledQuestions = shuffleArray([...baseQuestions]);
  let randomizedQuestions = shuffledQuestions.map(q => randomizeQuestionOptions(q));
  return randomizedQuestions;
}

let registeredUsers = [];
let currentUser = null;
let questions = [];
let current = 0;
let score = 0;
let answered = false;
let time = 10;
let timerInterval;
let category = "General";
let currentView = "home";
let userAnswers = [];
let userCorrectness = [];

function clearTimer() {
  if(timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function loadData() {
  try {
    const savedQuestionsGeneral = localStorage.getItem("questions_General");
    const savedQuestionsTech = localStorage.getItem("questions_Technology");
    const savedQuestionsScience = localStorage.getItem("questions_Science");
    
    window.adminQuestionsByCategory = {
      General: savedQuestionsGeneral ? JSON.parse(savedQuestionsGeneral) : [...baseQuestionsByCategory.General],
      Technology: savedQuestionsTech ? JSON.parse(savedQuestionsTech) : [...baseQuestionsByCategory.Technology],
      Science: savedQuestionsScience ? JSON.parse(savedQuestionsScience) : [...baseQuestionsByCategory.Science]
    };
    
    const savedUsers = localStorage.getItem("registeredUsers");
    registeredUsers = savedUsers ? JSON.parse(savedUsers) : [];
  } catch(e) {
    window.adminQuestionsByCategory = {
      General: [...baseQuestionsByCategory.General],
      Technology: [...baseQuestionsByCategory.Technology],
      Science: [...baseQuestionsByCategory.Science]
    };
    registeredUsers = [];
    showToast("Error loading data", "error");
  }
}

function saveQuestionsForCategory(cat) {
  try {
    localStorage.setItem(`questions_${cat}`, JSON.stringify(window.adminQuestionsByCategory[cat]));
    showToast(`Questions saved for ${cat}!`, "success");
  } catch(e) {
    showToast("Error saving questions", "error");
  }
}

function saveUserData() {
  try {
    localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
  } catch(e) {
    console.error("Failed to save user data", e);
  }
}

function saveScore() {
  if (!currentUser) return;
  try {
    let scores = JSON.parse(localStorage.getItem("scores")) || [];
    currentUser.lastScore = score;
    currentUser.lastPercentage = (score/questions.length)*100;
    currentUser.lastDate = new Date().toISOString();
    currentUser.totalQuizzesTaken = (currentUser.totalQuizzesTaken || 0) + 1;
    currentUser.bestScore = Math.max(currentUser.bestScore || 0, score);
    currentUser.bestPercentage = Math.max(currentUser.bestPercentage || 0, (score/questions.length)*100);
    
    const userIndex = registeredUsers.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) registeredUsers[userIndex] = currentUser;
    saveUserData();
    
    scores.push({name: currentUser.fullName, username: currentUser.username, score: score, total: questions.length, category: category, date: new Date().toISOString(), percentage: (score/questions.length)*100});
    if(scores.length > 50) scores = scores.slice(-50);
    localStorage.setItem("scores", JSON.stringify(scores));
  } catch(e) { console.error("Failed to save score", e); }
}

function showToast(message, type = "success") {
  const existingToasts = document.querySelectorAll(".toast");
  existingToasts.forEach(toast => toast.remove());
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  if (type === "error") toast.style.background = "#dc2626";
  else if (type === "correct") toast.style.background = "#16a34a";
  else if (type === "wrong") toast.style.background = "#ea580c";
  else toast.style.background = "rgba(15, 23, 42, 0.95)";
  toast.style.color = "#ffffff";
  toast.style.fontWeight = "bold";
  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast && toast.remove) {
      toast.style.animation = "fadeOutDown 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

function escapeHtml(str) {
  if(!str) return "";
  return str.replace(/[&<>]/g, function(m) {
    if(m === '&') return '&amp;';
    if(m === '<') return '&lt;';
    if(m === '>') return '&gt;';
    return m;
  });
}

function showLogoutConfirmation() {
  const modal = document.createElement("div");
  modal.className = "confirm-modal-overlay";
  modal.innerHTML = `
    <div class="confirm-modal">
      <h4>Confirm Logout</h4>
      <p>Are you sure you want to logout? Your progress will be saved.</p>
      <div class="confirm-buttons">
        <button class="confirm-btn-yes" onclick="performLogout()">Yes, Logout</button>
        <button class="confirm-btn-no" onclick="this.closest('.confirm-modal-overlay').remove()">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  modal.addEventListener('click', function(e) {
    if(e.target === modal) modal.remove();
  });
}

function performLogout() {
  const modal = document.querySelector(".confirm-modal-overlay");
  if(modal) modal.remove();
  
  currentUser = null;
  leaderboardAccess = false;
  userRecordsAccess = false;
  adminPanelAccess = false;
  renderSidebar();
  navigateTo('home');
  showToast("Successfully logged out!", "success");
}

function renderSidebar() {
  const sidebar = document.getElementById("sidebar");
  const isDark = localStorage.getItem("darkMode") === "true";
  
  let userInfoHtml = '';
  
  if (currentUser) {
    const avatarLetter = currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U';
    userInfoHtml = `
      <div class="user-profile-card" onclick="showLogoutConfirmation()">
        <div class="logout-popup">
          <span class="logout-text">Logout</span>
        </div>
        <div class="user-avatar">${avatarLetter}</div>
        <div class="user-name">${escapeHtml(currentUser.fullName)}</div>
        <div class="user-username">${escapeHtml(currentUser.username)}</div>
        <div class="user-stats">
          <div class="stat-item">
            <div class="stat-value">${currentUser.bestScore || 0}</div>
            <div class="stat-label">Best Score</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${currentUser.totalQuizzesTaken || 0}</div>
            <div class="stat-label">Quizzes</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${Math.round(currentUser.bestPercentage || 0)}%</div>
            <div class="stat-label">Best Percent</div>
          </div>
        </div>
      </div>
    `;
  } else {
    userInfoHtml = `
      <div class="login-prompt">
        <div style="font-size: 40px; margin-bottom: 10px;"></div>
        <p>Not logged in</p>
        <button onclick="navigateTo('home')" style="background: var(--primary); margin-top: 5px;">Register or Login</button>
      </div>
    `;
  }
  
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="logo">Quiz Web App</div>
      <div style="font-size: 12px; color: var(--text-light); margin-top: 5px;">Professional Assessment Tool</div>
    </div>
    ${userInfoHtml}
    <div class="nav-menu">
      <div class="nav-menu-item ${currentView === 'home' ? 'active' : ''}" onclick="navigateTo('home')">
        <span class="nav-icon"> </span>
        <span>Registration</span>
      </div>
      <div class="nav-menu-item ${currentView === 'quiz' ? 'active' : ''}" onclick="navigateTo('quiz')">
        <span class="nav-icon"> </span>
        <span>Take Quiz</span>
      </div>
      <div class="nav-menu-item ${currentView === 'leaderboard' ? 'active' : ''}" onclick="requestAdminAccess('leaderboard')">
        <span class="nav-icon"> </span>
        <span>Leaderboard</span>
      </div>
      <div class="nav-menu-item ${currentView === 'userrecords' ? 'active' : ''}" onclick="requestAdminAccess('userrecords')">
        <span class="nav-icon"> </span>
        <span>User Records</span>
      </div>
      <div class="nav-menu-item ${currentView === 'admin' ? 'active' : ''}" onclick="requestAdminAccess('admin')">
        <span class="nav-icon"> </span>
        <span>Admin Panel</span>
      </div>
    </div>
    <button class="dark-btn" onclick="toggleDark()">${isDark ? 'Light Mode' : 'Dark Mode'}</button>
  `;
}

function requestAdminAccess(targetSection) {
  if(targetSection === 'leaderboard' && leaderboardAccess) {
    navigateTo('leaderboard');
    return;
  }
  if(targetSection === 'userrecords' && userRecordsAccess) {
    navigateTo('userrecords');
    return;
  }
  if(targetSection === 'admin' && adminPanelAccess) {
    navigateTo('admin');
    return;
  }
  
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  
  let sectionTitle = "";
  if(targetSection === 'leaderboard') sectionTitle = "Leaderboard";
  else if(targetSection === 'userrecords') sectionTitle = "User Records";
  else sectionTitle = "Admin Panel";
  
  modal.innerHTML = `
    <div class="password-modal">
      <h3>Access ${sectionTitle}</h3>
      <p>Please enter administrator password</p>
      <input type="password" id="adminPassModal" placeholder="Enter password" autocomplete="off">
      <button id="verifyAdminBtn">Verify Access</button>
      <div id="adminErrorMsg" class="error-msg">Incorrect password. Please try again.</div>
    </div>
  `;
  
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById("adminPassModal")?.focus(), 100);
  
  modal.addEventListener('click', function(e) {
    if(e.target === modal) modal.remove();
  });
  
  const verifyBtn = document.getElementById("verifyAdminBtn");
  verifyBtn.onclick = function() {
    const pass = document.getElementById("adminPassModal")?.value;
    if(pass === ADMIN_PASSWORD) {
      if(targetSection === 'leaderboard') leaderboardAccess = true;
      else if(targetSection === 'userrecords') userRecordsAccess = true;
      else if(targetSection === 'admin') adminPanelAccess = true;
      modal.remove();
      showToast(`Access granted to ${sectionTitle}!`, "success");
      navigateTo(targetSection);
    } else {
      const errDiv = document.getElementById("adminErrorMsg");
      if(errDiv) errDiv.style.display = "block";
      showToast("Incorrect admin password!", "error");
    }
  };
  
  const passInput = document.getElementById("adminPassModal");
  passInput.addEventListener("keypress", function(e) {
    if(e.key === "Enter") verifyBtn.click();
  });
}

function navigateTo(view) {
  clearTimer();
  currentView = view;
  renderSidebar();
  
  if(view === "home") renderRegistrationPage();
  else if(view === "quiz") renderQuizPage();
  else if(view === "leaderboard") {
    if(leaderboardAccess) renderLeaderboardPage();
    else { showToast("Admin access required!", "error"); renderLeaderboardPage(); }
  }
  else if(view === "userrecords") {
    if(userRecordsAccess) renderUserRecordsPage();
    else { showToast("Admin access required!", "error"); renderUserRecordsPage(); }
  }
  else if(view === "admin") {
    if(adminPanelAccess) renderAdminPage();
    else { showToast("Admin access required!", "error"); renderAdminPage(); }
  }
}

function renderRegistrationPage() {
  document.getElementById("app").innerHTML = `
    <h2>Create Your Account</h2>
    <p style="color:var(--text-light); margin-bottom: 20px;">Join Quiz Web App to test your knowledge and track progress</p>
    
    <div class="form-row">
      <div class="form-group">
        <label>Full Name <span style="color: var(--error-text);">*</span></label>
        <input type="text" id="fullName" placeholder="Enter your full name">
        <div class="error-message" id="fullNameError">Full name is required</div>
      </div>
      <div class="form-group">
        <label>Email Address <span style="color: var(--error-text);">*</span></label>
        <input type="email" id="email" placeholder="you@example.com">
        <div class="error-message" id="emailError">Valid email address is required</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label>Age <span class="optional-label">(optional)</span></label>
        <input type="number" id="age" placeholder="Your age">
        <div class="error-message" id="ageError">Age must be between 5 and 120 if provided</div>
      </div>
      <div class="form-group">
        <label>Education Level <span style="color: var(--error-text);">*</span></label>
        <select id="education">
          <option value="">Select</option>
          <option value="High School">High School</option>
          <option value="Diploma">Diploma</option>
          <option value="Bachelor">Bachelor</option>
          <option value="Master">Master</option>
          <option value="PhD">PhD</option>
        </select>
        <div class="error-message" id="educationError">Please select education level</div>
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label>Country <span class="optional-label">(optional)</span></label>
        <input type="text" id="country" placeholder="Your country">
        <div class="error-message" id="countryError"></div>
      </div>
      <div class="form-group">
        <label>Interests <span class="optional-label">(optional)</span></label>
        <select id="interests">
          <option value="">Select primary interest</option>
          <option value="Technology">Technology</option>
          <option value="Science">Science</option>
          <option value="General">General</option>
        </select>
        <div class="error-message" id="interestsError"></div>
      </div>
    </div>
    
    <div class="form-group">
      <label>Username <span style="color: var(--error-text);">*</span></label>
      <input type="text" id="username" placeholder="Choose a username">
      <div class="error-message" id="usernameError">Username is required and must be unique</div>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label>Password <span style="color: var(--error-text);">*</span></label>
        <input type="password" id="password" placeholder="Create password (min 4 characters)">
        <div class="error-message" id="passwordError">Password must be at least 4 characters</div>
      </div>
      <div class="form-group">
        <label>Confirm Password <span style="color: var(--error-text);">*</span></label>
        <input type="password" id="confirmPassword" placeholder="Confirm password">
        <div class="error-message" id="confirmError">Passwords do not match</div>
      </div>
    </div>
    
    <button onclick="registerNewUser()">Create Account</button>
    <div class="button-group" style="margin-top: 15px;">
      <button onclick="navigateTo('quiz')">Already have an account? Login</button>
    </div>
  `;
  
  attachValidationEvents();
}

function attachValidationEvents() {
  const fields = ['fullName', 'email', 'age', 'education', 'country', 'interests', 'username', 'password', 'confirmPassword'];
  
  fields.forEach(field => {
    const element = document.getElementById(field);
    if (element) {
      element.addEventListener('input', () => clearFieldError(field));
      element.addEventListener('change', () => clearFieldError(field));
    }
  });
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorMsg = document.getElementById(fieldId + 'Error');
  if (input && errorMsg) {
    input.classList.remove('error');
    errorMsg.classList.remove('show');
  }
}

function showFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorMsg = document.getElementById(fieldId + 'Error');
  if (input && errorMsg) {
    input.classList.add('error');
    errorMsg.classList.add('show');
  }
}

function registerNewUser() {
  const fullName = document.getElementById("fullName")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const age = document.getElementById("age")?.value.trim();
  const education = document.getElementById("education")?.value;
  const country = document.getElementById("country")?.value.trim();
  const interests = document.getElementById("interests")?.value;
  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value;
  const confirm = document.getElementById("confirmPassword")?.value;
  
  let hasError = false;
  
  const allFields = ['fullName', 'email', 'age', 'education', 'country', 'interests', 'username', 'password', 'confirmPassword'];
  allFields.forEach(field => clearFieldError(field));
  
  if(!fullName) {
    showFieldError('fullName');
    hasError = true;
  }
  
  if(!email || !email.includes('@')) {
    showFieldError('email');
    hasError = true;
  }
  
  if(age && (parseInt(age) < 5 || parseInt(age) > 120)) {
    showFieldError('age');
    hasError = true;
  }
  
  if(!education) {
    showFieldError('education');
    hasError = true;
  }
  
  if(!username) {
    showFieldError('username');
    hasError = true;
  } else if(registeredUsers.find(u => u.username === username)) {
    showFieldError('username');
    document.getElementById("usernameError").textContent = "Username already taken!";
    hasError = true;
  } else {
    document.getElementById("usernameError").textContent = "Username is required and must be unique";
  }
  
  if(!password || password.length < 4) {
    showFieldError('password');
    hasError = true;
  }
  
  if(password !== confirm) {
    showFieldError('confirmPassword');
    hasError = true;
  }
  
  if(email && registeredUsers.find(u => u.email === email)) {
    showFieldError('email');
    document.getElementById("emailError").textContent = "Email already registered! Please login.";
    hasError = true;
  } else {
    document.getElementById("emailError").textContent = "Valid email address is required";
  }
  
  if(hasError) {
    showToast("Please fill all required fields correctly!", "error");
    return;
  }
  
  const finalAge = age ? parseInt(age) : null;
  const finalCountry = country || null;
  const finalInterests = interests || null;
  
  currentUser = { 
    fullName, 
    email, 
    age: finalAge, 
    education, 
    country: finalCountry, 
    interests: finalInterests, 
    username, 
    password, 
    registrationDate: new Date().toISOString(), 
    totalQuizzesTaken: 0, 
    bestScore: 0, 
    bestPercentage: 0, 
    lastScore: 0, 
    lastPercentage: 0, 
    lastDate: null 
  };
  registeredUsers.push(currentUser);
  saveUserData();
  showToast(`Welcome ${fullName}!`, "success");
  renderSidebar();
  navigateTo('quiz');
}

function renderQuizPage() {
  if(currentUser) {
    renderQuizWelcome();
  } else {
    document.getElementById("app").innerHTML = `
      <h2>Login to Your Account</h2>
      <p style="color:var(--text-light); margin-bottom: 20px;">Enter your credentials to start the quiz</p>
      <div class="form-group">
        <label>Username</label>
        <input type="text" id="loginUsername" placeholder="Enter your username">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="loginPassword" placeholder="Enter your password">
      </div>
      <button onclick="loginUser()">Login</button>
      <div class="button-group" style="margin-top: 15px;">
        <button onclick="navigateTo('home')">New User? Register</button>
      </div>
    `;
  }
}

function loginUser() {
  const username = document.getElementById("loginUsername")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;
  
  if(!username || !password) {
    showToast("Please enter username and password!", "error"); 
    return;
  }
  
  const user = registeredUsers.find(u => u.username === username && u.password === password);
  if(user) { currentUser = user; showToast(`Welcome back!`, "success"); renderSidebar(); renderQuizWelcome(); }
  else { showToast("Invalid credentials!", "error"); }
}

function renderQuizWelcome() {
  document.getElementById("app").innerHTML = `
    <h2>Ready to Test Your Knowledge?</h2>
    <p style="color:var(--text-light); margin: 15px 0;">Select a category to begin your quiz</p>
    <div class="form-group">
      <label>Quiz Category</label>
      <select id="categorySelect" style="margin-bottom: 20px;">
        <option value="" selected disabled>-- Select Category --</option>
        <option value="General">General Knowledge</option>
        <option value="Technology">Technology</option>
        <option value="Science">Science</option>
      </select>
    </div>
    <button onclick="startQuiz()">Start Quiz</button>
    <div class="button-group" style="margin-top: 15px;">
      <button onclick="currentUser=null; renderSidebar(); renderQuizPage()">Logout</button>
    </div>
  `;
}

function startQuiz() { 
  const categorySelect = document.getElementById("categorySelect");
  const selectedCategory = categorySelect.value;
  
  if(!selectedCategory) {
    showToast("Please select a category to begin your quiz!", "error");
    categorySelect.style.borderColor = "var(--error-border)";
    categorySelect.classList.add("error");
    setTimeout(() => {
      categorySelect.classList.remove("error");
      categorySelect.style.borderColor = "";
    }, 2000);
    return;
  }
  
  categorySelect.classList.remove("error");
  categorySelect.style.borderColor = "";
  
  category = selectedCategory;
  questions = prepareRandomizedQuiz(category);
  
  current = 0; 
  score = 0; 
  answered = false; 
  time = 10; 
  userAnswers = [];
  userCorrectness = [];
  loadQuestion(); 
}

function loadQuestion() {
  if(current >= questions.length) { 
    showResult(); 
    return; 
  }
  
  answered = false;
  time = 10;
  clearTimer();
  
  const q = questions[current];
  document.getElementById("app").innerHTML = `
    <div class="top">
      <span>${escapeHtml(currentUser.fullName)}</span>
      <span>${current+1}/${questions.length}</span>
      <span id="timer">${time}s</span>
    </div>
    <div class="progress-bar">
      <div class="progress" style="width:${((current)/(questions.length))*100}%"></div>
    </div>
    <h3>${escapeHtml(q.q)}</h3>
    <div id="opts"></div>
    <div class="button-group">
      <button onclick="nextQuestion()">Next</button>
      <button onclick="cancelQuiz()" class="quit-btn">Cancel</button>
    </div>
  `;
  
  q.o.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = "option";
    div.innerHTML = `<span style="font-weight:bold;">${String.fromCharCode(65+i)}.</span> ${escapeHtml(opt)}`;
    div.onclick = () => selectAnswer(i);
    document.getElementById("opts").appendChild(div);
  });
  
  startTimer();
}

function startTimer() {
  clearTimer();
  timerInterval = setInterval(() => {
    if(time > 0 && !answered) {
      time--;
      const timerEl = document.getElementById("timer");
      if(timerEl) timerEl.textContent = `${time}s`;
      if(time === 0) {
        clearTimer();
        if(!answered) {
          answered = true;
          const options = document.querySelectorAll(".option");
          options.forEach(opt => opt.style.pointerEvents = "none");
          userAnswers[current] = -1;
          userCorrectness[current] = false;
          showToast(`TIME'S UP! Moving to next question.`, "error");
        }
      }
    } else if(answered) {
      clearTimer();
    }
  }, 1000);
}

function selectAnswer(selectedIndex) {
  if(answered) return;
  answered = true;
  clearTimer();
  
  const correctIndex = questions[current].a;
  const options = document.querySelectorAll(".option");
  options.forEach(opt => opt.style.pointerEvents = "none");
  
  options[selectedIndex].classList.add("selected");
  
  userAnswers[current] = selectedIndex;
  const isCorrect = (selectedIndex === correctIndex);
  userCorrectness[current] = isCorrect;
  
  if(isCorrect) { 
    score++; 
    showToast("Correct answer! +1 point", "correct"); 
  } else {
    showToast("Incorrect answer", "wrong");
  }
}

function nextQuestion() {
  if(!answered && time > 0) { 
    showToast("Please select an answer first!", "error"); 
    return; 
  }
  current++;
  if(current < questions.length) {
    loadQuestion();
  } else {
    showResult();
  }
}

function cancelQuiz() {
  if(confirm("Cancel quiz? Your progress will be lost!")) { 
    clearTimer(); 
    renderQuizWelcome(); 
    showToast("Quiz cancelled"); 
  }
}

function showResult() {
  clearTimer(); 
  saveScore();
  const percentage = (score/questions.length)*100;
  
  let gradeClass = "";
  let gradeText = "";
  if(percentage >= 90) {
    gradeClass = "grade-excellent";
    gradeText = "EXCELLENT";
  } else if(percentage >= 70) {
    gradeClass = "grade-good";
    gradeText = "GOOD JOB";
  } else if(percentage >= 50) {
    gradeClass = "grade-average";
    gradeText = "AVERAGE";
  } else {
    gradeClass = "grade-poor";
    gradeText = "NEEDS IMPROVEMENT";
  }
  
  let answersReviewHtml = `
    <div class="answers-review">
      <h4>Answer Review</h4>
  `;
  
  questions.forEach((q, idx) => {
    const userAnswer = userAnswers[idx];
    const isCorrect = userCorrectness[idx];
    const correctAnswerText = q.o[q.a];
    const letterCorrect = String.fromCharCode(65 + q.a);
    
    let userAnswerText = "";
    let userLetter = "";
    let answerStatusClass = "";
    
    if (userAnswer === undefined || userAnswer === -1) {
      userAnswerText = "No answer provided";
      userLetter = "-";
      answerStatusClass = "wrong-selection";
    } else {
      userAnswerText = q.o[userAnswer];
      userLetter = String.fromCharCode(65 + userAnswer);
      answerStatusClass = isCorrect ? "correct-selection" : "wrong-selection";
    }
    
    answersReviewHtml += `
      <div class="review-item">
        <div class="review-question">${idx+1}. ${escapeHtml(q.q)}</div>
        <div class="review-answer"><span>Correct Answer:</span> ${letterCorrect}. ${escapeHtml(correctAnswerText)}</div>
        <div class="user-selection ${answerStatusClass}">
          <span>Your Answer:</span> ${userLetter}. ${escapeHtml(userAnswerText)}
        </div>
      </div>
    `;
  });
  
  answersReviewHtml += `</div>`;
  
  document.getElementById("app").innerHTML = `
    <h2>Quiz Assessment Report</h2>
    
    <div class="result-card">
      <div class="result-score-section">
        <div class="score-circle">
          <div class="score-number">${score}</div>
          <div class="score-total">/${questions.length}</div>
        </div>
        <div class="score-percentage">${percentage.toFixed(1)}%</div>
        <div class="grade-badge ${gradeClass}">${gradeText}</div>
      </div>
      
      <div class="result-details">
        <div class="detail-item">
          <div class="detail-label">Participant</div>
          <div class="detail-value">${escapeHtml(currentUser.fullName)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Category</div>
          <div class="detail-value">${escapeHtml(category)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Best Score</div>
          <div class="detail-value">${currentUser.bestScore || 0}/${questions.length}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Total Quizzes</div>
          <div class="detail-value">${currentUser.totalQuizzesTaken || 0}</div>
        </div>
      </div>
      
      ${answersReviewHtml}
      
      <div class="action-buttons">
        <div class="action-btn action-btn-primary" onclick="downloadCertificate()">Download Certificate</div>
        <div class="action-btn action-btn-secondary" onclick="startNewQuiz()">Start New Quiz</div>
        <div class="action-btn action-btn-danger" onclick="returnToDashboard()">Return to Dashboard</div>
      </div>
    </div>
  `;
}

function startNewQuiz() {
  renderQuizWelcome();
  showToast("Select a category to begin a new quiz", "success");
}

function returnToDashboard() {
  navigateTo('home');
  showToast("Returning to dashboard", "success");
}

function downloadCertificate() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const percentage = (score/questions.length)*100;
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const certificateId = 'QZ-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.rect(8, 8, 281, 194);
  
  doc.setDrawColor(79, 172, 254);
  doc.setLineWidth(1.2);
  doc.rect(12, 12, 273, 186);
  
  doc.setDrawColor(79, 172, 254);
  doc.setLineWidth(1);
  doc.line(12, 22, 28, 22);
  doc.line(12, 22, 12, 38);
  doc.line(285, 22, 269, 22);
  doc.line(285, 22, 285, 38);
  doc.line(12, 188, 28, 188);
  doc.line(12, 188, 12, 172);
  doc.line(285, 188, 269, 188);
  doc.line(285, 188, 285, 172);
  
  doc.setDrawColor(79, 172, 254);
  doc.setFillColor(79, 172, 254);
  doc.circle(148, 32, 9, 'F');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Q", 145, 35);
  
  doc.setFontSize(28);
  doc.setTextColor(79, 172, 254);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICATE OF ACHIEVEMENT", 148, 62, { align: "center" });
  
  doc.setDrawColor(79, 172, 254);
  doc.setLineWidth(0.4);
  doc.line(70, 69, 226, 69);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("This certificate is proudly presented to", 148, 88, { align: "center" });
  
  doc.setFontSize(34);
  doc.setTextColor(244, 67, 54);
  doc.setFont("helvetica", "bold");
  doc.text(escapeHtml(currentUser.fullName), 148, 115, { align: "center" });
  
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.text(`For outstanding performance in the ${category} Knowledge Assessment`, 148, 138, { align: "center" });
  doc.text(`successfully completing the examination with a score of ${score} out of ${questions.length}`, 148, 150, { align: "center" });
  doc.text(`achieving a proficiency rate of ${percentage.toFixed(1)}%.`, 148, 162, { align: "center" });
  
  let gradeText = "";
  if(percentage >= 90) gradeText = "DISTINCTION - EXCELLENT PERFORMANCE";
  else if(percentage >= 75) gradeText = "COMMENDABLE ACHIEVEMENT";
  else if(percentage >= 60) gradeText = "SATISFACTORY COMPLETION";
  else if(percentage >= 50) gradeText = "PASSING GRADE";
  else gradeText = "PARTICIPATION RECOGNIZED";
  
  doc.setFontSize(10);
  doc.setTextColor(79, 172, 254);
  doc.setFont("helvetica", "bold");
  doc.text(gradeText, 148, 178, { align: "center" });
  
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.setFont("helvetica", "italic");
  doc.text(`Certificate ID: ${certificateId}`, 148, 192, { align: "center" });
  doc.text(`Issue Date: ${currentDate}`, 148, 199, { align: "center" });
  
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.5);
  doc.line(40, 215, 105, 215);
  doc.line(191, 215, 256, 215);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Assessment Coordinator", 72, 223, { align: "center" });
  doc.text("Director of Examinations", 224, 223, { align: "center" });
  
  doc.setDrawColor(79, 172, 254);
  doc.setLineWidth(0.7);
  doc.circle(148, 211, 13, 'S');
  doc.circle(148, 211, 9, 'S');
  doc.setFontSize(7);
  doc.setTextColor(79, 172, 254);
  doc.setFont("helvetica", "bold");
  doc.text("VERIFIED", 148, 213, { align: "center" });
  
  doc.save(`${currentUser.username}_certificate_of_achievement.pdf`);
  showToast("Certificate downloaded successfully!", "success");
}

function renderLeaderboardPage() {
  if(!leaderboardAccess) { 
    document.getElementById("app").innerHTML = `<h2>Access Denied</h2><p>Administrator access required.</p><button onclick="requestAdminAccess('leaderboard')">Request Access</button>`; 
    return; 
  }
  let scores = [];
  try { scores = JSON.parse(localStorage.getItem("scores")) || []; } catch(e){}
  const bestScores = {};
  scores.forEach(s => { const key = s.username || s.name; if(!bestScores[key] || s.score > bestScores[key].score) bestScores[key] = s; });
  const sorted = Object.values(bestScores).sort((a,b)=>b.score - a.score).slice(0,10);
  document.getElementById("app").innerHTML = `<h2>Top 10 Leaderboard</h2><ul class="leaderboard">${sorted.map((s,idx)=>`<li><span>${idx+1}. ${escapeHtml(s.name)}</span><span>${s.score}/${s.total || 5} (${((s.score/(s.total || 5))*100).toFixed(1)}%)</span></li>`).join('')}${sorted.length===0?'<li>No scores yet. Be the first!</li>':''}</ul><div class="button-group"><button onclick="clearLeaderboardData()" class="quit-btn">Clear All Scores</button><button onclick="navigateTo('home')">Back to Home</button></div>`;
}

function clearLeaderboardData() { if(confirm("Clear all scores?")) { localStorage.removeItem("scores"); showToast("Leaderboard cleared!"); renderLeaderboardPage(); } }

function renderUserRecordsPage() {
  if(!userRecordsAccess) { 
    document.getElementById("app").innerHTML = `<h2>Access Denied</h2><p>Administrator access required.</p><button onclick="requestAdminAccess('userrecords')">Request Access</button>`; 
    return; 
  }
  if(registeredUsers.length === 0) { document.getElementById("app").innerHTML = `<h2>User Records</h2><p>No users registered yet.</p><button onclick="navigateTo('home')">Back</button>`; return; }
  const sortedUsers = [...registeredUsers].sort((a,b)=>(b.bestScore||0)-(a.bestScore||0));
  document.getElementById("app").innerHTML = `<h2>User Records</h2><p>Total Registered Users: ${registeredUsers.length}</p><div class="admin-panel-scroll">${sortedUsers.map((user,idx)=>`<div class="question-item"><strong>${idx+1}. ${escapeHtml(user.fullName)}</strong><small>Username: ${escapeHtml(user.username)} | Email: ${escapeHtml(user.email)}</small><small>Education: ${escapeHtml(user.education)} | Country: ${escapeHtml(user.country||'N/A')}</small><small>Registered: ${new Date(user.registrationDate).toLocaleDateString()}</small><small>Best Score: ${user.bestScore||0}/${5} | Quizzes: ${user.totalQuizzesTaken||0}</small></div>`).join('')}</div><div class="button-group"><button onclick="clearAllUsers()" class="quit-btn">Clear All Users</button><button onclick="navigateTo('home')">Back to Home</button></div>`;
}

function clearAllUsers() { if(confirm("Clear ALL user records?")) { registeredUsers = []; currentUser = null; saveUserData(); showToast("All users cleared!"); renderUserRecordsPage(); } }

function renderAdminPage() {
  if(!adminPanelAccess) { 
    document.getElementById("app").innerHTML = `<h2>Access Denied</h2><p>Administrator access required.</p><button onclick="requestAdminAccess('admin')">Request Access</button>`; 
    return; 
  }
  
  let categoryOptions = '';
  for (let cat in window.adminQuestionsByCategory) {
    categoryOptions += `<option value="${cat}">${cat}</option>`;
  }
  
  document.getElementById("app").innerHTML = `<h2>Admin Panel <span style="background:var(--correct); padding:4px 10px; border-radius:20px; font-size:14px;">Secured</span></h2>
    <div class="form-group">
      <label>Select Category</label>
      <select id="adminCategorySelect" class="admin-category-select" onchange="loadQuestionsForAdmin()">
        ${categoryOptions}
      </select>
    </div>
    <h3>Add New Question to <span id="selectedCategoryName">General</span></h3>
    <div class="form-group"><label>Question</label><input id="newQ" placeholder="Enter question"></div>
    <div class="form-row"><div class="form-group"><label>Option 1</label><input id="opt1" placeholder="Option 1"></div><div class="form-group"><label>Option 2</label><input id="opt2" placeholder="Option 2"></div></div>
    <div class="form-row"><div class="form-group"><label>Option 3</label><input id="opt3" placeholder="Option 3"></div><div class="form-group"><label>Option 4</label><input id="opt4" placeholder="Option 4"></div></div>
    <div class="form-group"><label>Correct Option</label><select id="correct"><option value="0">Option 1 is correct</option><option value="1">Option 2 is correct</option><option value="2">Option 3 is correct</option><option value="3">Option 4 is correct</option></select></div>
    <button onclick="addQuestionToCategory()">Add Question</button>
    <h3>Manage Questions for <span id="manageCategoryName">General</span> ( <span id="questionCount">0</span> questions )</h3>
    <div class="admin-panel-scroll" id="questionListAdmin"></div>
    <div class="button-group"><button onclick="resetCategoryQuestions()" class="quit-btn">Reset Current Category to Default</button><button onclick="navigateTo('home')">Back to Home</button></div>`;
  
  loadQuestionsForAdmin();
}

function loadQuestionsForAdmin() {
  const select = document.getElementById("adminCategorySelect");
  if (!select) return;
  const selectedCat = select.value;
  const categoryQuestions = window.adminQuestionsByCategory[selectedCat] || [];
  
  document.getElementById("selectedCategoryName").innerText = selectedCat;
  document.getElementById("manageCategoryName").innerText = selectedCat;
  document.getElementById("questionCount").innerText = categoryQuestions.length;
  
  const container = document.getElementById("questionListAdmin");
  if (!container) return;
  
  container.innerHTML = categoryQuestions.map((q, idx) => `<div class="question-item"><strong>Q${idx+1}: ${escapeHtml(q.q)}</strong><small>${q.o.map((opt,i)=>`${String.fromCharCode(65+i)}. ${escapeHtml(opt)}`).join(" | ")}</small><button onclick="deleteQuestionFromCategory(${idx})" class="delete-btn">Delete</button></div>`).join('');
}

function addQuestionToCategory() {
  const select = document.getElementById("adminCategorySelect");
  if (!select) return;
  const selectedCat = select.value;
  
  const qtext = document.getElementById("newQ")?.value.trim();
  const opts = [document.getElementById("opt1")?.value.trim(), document.getElementById("opt2")?.value.trim(), document.getElementById("opt3")?.value.trim(), document.getElementById("opt4")?.value.trim()];
  const correctIdx = parseInt(document.getElementById("correct")?.value);
  
  if(!qtext || opts.some(opt=>!opt)) { showToast("Fill all fields!", "error"); return; }
  
  window.adminQuestionsByCategory[selectedCat].push({q: qtext, o: opts, correct: correctIdx});
  saveQuestionsForCategory(selectedCat);
  showToast(`Question added to ${selectedCat}!`, "success");
  
  document.getElementById("newQ").value = "";
  document.getElementById("opt1").value = "";
  document.getElementById("opt2").value = "";
  document.getElementById("opt3").value = "";
  document.getElementById("opt4").value = "";
  
  loadQuestionsForAdmin();
}

function deleteQuestionFromCategory(idx) {
  const select = document.getElementById("adminCategorySelect");
  if (!select) return;
  const selectedCat = select.value;
  
  if(confirm("Delete this question?")) {
    window.adminQuestionsByCategory[selectedCat].splice(idx, 1);
    saveQuestionsForCategory(selectedCat);
    showToast(`Question deleted from ${selectedCat}!`, "success");
    loadQuestionsForAdmin();
  }
}

function resetCategoryQuestions() {
  const select = document.getElementById("adminCategorySelect");
  if (!select) return;
  const selectedCat = select.value;
  
  if(confirm(`Reset all questions in ${selectedCat} to default?`)) {
    window.adminQuestionsByCategory[selectedCat] = [...baseQuestionsByCategory[selectedCat]];
    saveQuestionsForCategory(selectedCat);
    showToast(`${selectedCat} reset to default questions!`, "success");
    loadQuestionsForAdmin();
  }
}

function toggleDark() { 
  document.body.classList.toggle("dark"); 
  localStorage.setItem("darkMode", document.body.classList.contains("dark")); 
  renderSidebar(); 
  showToast(document.body.classList.contains("dark") ? "Dark mode enabled" : "Light mode enabled"); 
}

loadData();
if(localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
renderSidebar();
navigateTo("home");
