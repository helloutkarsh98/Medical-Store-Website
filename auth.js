// =============================================
// MedQuick — Auth (auth.js)
// =============================================

function getCurrentSession() {
  try {
    return JSON.parse(localStorage.getItem('mq_session'));
  } catch { return null; }
}

function registerUser(e) {
  e.preventDefault();
  const fname    = document.getElementById('reg-fname').value.trim();
  const lname    = document.getElementById('reg-lname').value.trim();
  const email    = document.getElementById('reg-email').value.trim().toLowerCase();
  const phone    = document.getElementById('reg-phone').value.trim();
  const dob      = document.getElementById('reg-dob').value;
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm-password').value;

  // Validate
  const emailErr = document.getElementById('reg-email-error');
  const pwErr    = document.getElementById('reg-password-error');
  emailErr.classList.remove('show');
  pwErr.classList.remove('show');

  if (password !== confirm) { pwErr.classList.add('show'); return; }

  const users = getUsers();
  if (users.find(u => u.email === email)) { emailErr.classList.add('show'); return; }

  const newUser = {
    id: 'u_' + Date.now(),
    firstName: fname,
    lastName: lname,
    email,
    phone,
    dob,
    password,
    role: 'customer',
    addresses: [],
    prescriptions: [],
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  localStorage.setItem('mq_session', JSON.stringify(newUser));
  closeModal('register-modal');
  updateAuthUI();
  showToast(`Welcome to MedQuick, ${fname}! 🎉`, 'success');

  // Clear form
  ['reg-fname','reg-lname','reg-email','reg-phone','reg-dob','reg-password','reg-confirm-password'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function loginUser(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    showToast('Invalid email or password', 'error');
    return;
  }

  localStorage.setItem('mq_session', JSON.stringify(user));
  closeModal('login-modal');
  updateAuthUI();
  showToast(`Welcome back, ${user.firstName || user.name || 'there'}! 👋`, 'success');

  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

function loginAsDemo() {
  const users = getUsers();
  const demo = users.find(u => u.email === DEMO_USER.email);
  if (!demo) {
    showToast('Demo account not found. Please refresh.', 'error');
    return;
  }
  localStorage.setItem('mq_session', JSON.stringify(demo));
  closeModal('login-modal');
  updateAuthUI();
  showToast('Logged in as Demo User 🧪', 'info');
}

function logoutUser() {
  localStorage.removeItem('mq_session');
  updateAuthUI();
  showPage('home');
  showToast('Signed out successfully', 'info');
}
