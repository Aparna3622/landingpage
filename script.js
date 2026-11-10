const form = document.getElementById('registrationForm');
const status = document.getElementById('formStatus');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  status.classList.remove('is-visible');

  try {
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form).entries()))
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);

    form.reset();
    status.textContent = 'Thank you. Your session is reserved. Our property advisor will call you within 24 hours.';
    status.classList.add('is-visible');
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    status.textContent = error.message || 'We could not save your enquiry. Please try again.';
    status.classList.add('is-visible');
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
  }
});
