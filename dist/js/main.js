(() => {
  const form = document.querySelector('.contact-form');
  const notification = document.querySelector('.success-notification');

  if (!form || !notification) return;

  const fields = [
    ['first-name', 'first-error'],
    ['last-name', 'last-error'],
    ['email-address', 'email-error'],
    ['query-type', 'query-type-error'],
    ['message', 'message-error'],
    ['consent', 'consent-error'],
  ].map(([name, errorId]) => ({
    controls: [...form.querySelectorAll(`[name="${name}"]`)],
    error: document.getElementById(errorId),
  }));
  let submitted = false;

  function showError(field, invalid) {
    field.error.hidden = !invalid;
    field.controls.forEach((control) => {
      control.setAttribute('aria-invalid', String(invalid));
      if (invalid) {
        control.setAttribute('aria-describedby', field.error.id);
      } else {
        control.removeAttribute('aria-describedby');
      }
    });
  }

  function validate(field) {
    const control = field.controls[0];
    let valid;

    if (control.type === 'radio') {
      valid = field.controls.some((radio) => radio.checked);
    } else if (control.type === 'checkbox') {
      valid = control.checked;
    } else {
      valid = control.value.trim() !== '' && control.validity.valid;
    }

    showError(field, !valid);
    return valid;
  }

  // Keep native validation available when JavaScript is unavailable.
  form.noValidate = true;
  fields.forEach((field) => showError(field, false));

  fields.forEach((field) => {
    field.controls.forEach((control) => {
      const eventName = ['radio', 'checkbox'].includes(control.type)
        ? 'change'
        : 'input';
      control.addEventListener(eventName, () => {
        notification.classList.remove('is-open');
        if (submitted) validate(field);
      });
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    notification.classList.remove('is-open');
    submitted = true;

    const invalidFields = fields.filter((field) => !validate(field));
    if (invalidFields.length > 0) {
      invalidFields[0].controls[0].focus();
      return;
    }

    // This static demo has no server endpoint; show success after validation.
    form.reset();
    submitted = false;
    fields.forEach((field) => showError(field, false));
    notification.classList.add('is-open');
    notification.focus();
  });
})();
