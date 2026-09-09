// Nav toggle (mobile hamburger)
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// Demo request form -- posts directly to Web3Forms, no backend of our own.
// Setup: go to https://web3forms.com/, enter the inbox that should receive
// demo requests, and paste the emailed access key below.
const demoForm = document.getElementById('demo-form');
const demoStatus = document.getElementById('demo-form-status');

if (demoForm) {
  demoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = demoForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    demoStatus.textContent = 'Sending…';
    demoStatus.className = '';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(demoForm),
      });
      const result = await res.json();
      if (result.success) {
        demoForm.style.display = 'none';
        demoStatus.textContent = "Thanks — we'll reply within one business day.";
        demoStatus.className = 'success';
      } else {
        demoStatus.textContent = 'Something went wrong. Please email us directly instead.';
        demoStatus.className = 'error';
        submitBtn.disabled = false;
      }
    } catch (err) {
      demoStatus.textContent = 'Network error. Please email us directly instead.';
      demoStatus.className = 'error';
      submitBtn.disabled = false;
    }
  });
}
