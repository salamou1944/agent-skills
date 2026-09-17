function submitAccess(event) {
  event.preventDefault();
  const email = document.getElementById('email');
  const status = document.getElementById('form-status');
  if (!email || !status) return false;
  status.textContent = 'Request captured locally for this demo. No email has been sent.';
  email.value = '';
  return false;
}
