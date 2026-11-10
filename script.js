const form = document.getElementById('registrationForm');
const status = document.getElementById('formStatus');
const storageKey = 'vinra-homeground-registrations';

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.submittedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const registrations = JSON.parse(localStorage.getItem(storageKey) || '[]');
  registrations.push(data);
  localStorage.setItem(storageKey, JSON.stringify(registrations));

  form.reset();
  status.textContent = 'Thank you. Your session is reserved. Our property advisor will call you within 24 hours.';
  status.classList.add('is-visible');
  status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
