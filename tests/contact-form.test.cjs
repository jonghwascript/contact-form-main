const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const root = resolve(__dirname, '..');
const html = readFileSync(resolve(root, 'src/pages/index.html'), 'utf8');
const script = readFileSync(resolve(root, 'src/js/main.js'), 'utf8');

// A small DOM fixture exercises event behavior without a browser dependency.
// Native email validity is supplied explicitly; browser rendering is not tested.
function setup() {
  let focused;
  const controls = [...html.matchAll(/<(input|textarea)\b([^>]*)>/g)]
    .map(([, tag, source]) => {
      const attrs = Object.fromEntries(
        [...source.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]),
      );
      return {
        ...attrs,
        type: attrs.type || (tag === 'textarea' ? 'textarea' : 'text'),
        value: '',
        checked: false,
        validity: { valid: true },
        listeners: {},
        setAttribute(key, value) { attrs[key] = value; },
        removeAttribute(key) { delete attrs[key]; },
        getAttribute(key) { return attrs[key]; },
        addEventListener(event, listener) { this.listeners[event] = listener; },
        focus() { focused = this; },
      };
    }).filter((control) => control.name);
  const errors = Object.fromEntries(
    [...html.matchAll(/<span id="([^"]+)" class="error-message" hidden>/g)]
      .map(([, id]) => [id, { id, hidden: true }]),
  );
  const classes = new Set();
  const notification = {
    classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) },
    focus() { focused = notification; },
  };
  const form = {
    listeners: {},
    querySelectorAll(selector) {
      const name = selector.match(/\[name="([^"]+)"\]/)[1];
      return controls.filter((control) => control.name === name);
    },
    addEventListener(event, listener) { this.listeners[event] = listener; },
    reset() { controls.forEach((control) => { control.value = ''; control.checked = false; }); },
  };
  runInNewContext(script, {
    document: {
      querySelector: (selector) => selector === '.contact-form' ? form : notification,
      getElementById: (id) => errors[id],
    },
  });
  return {
    controls, errors, form, notification,
    field: (name) => controls.find((control) => control.name === name),
    focused: () => focused,
    success: () => classes.has('is-open'),
    submit() {
      let prevented = false;
      form.listeners.submit({ preventDefault() { prevented = true; } });
      assert.ok(prevented, 'Submission must not navigate or send data');
    },
    fillValid() {
      controls.forEach((control) => {
        control.value = control.type === 'email' ? 'test@example.com' : 'Test';
        control.checked = control.type === 'checkbox';
      });
      controls.find((control) => control.type === 'radio').checked = true;
    },
  };
}

test('initial state is neutral; empty submit shows six errors and focuses first name', () => {
  const page = setup();
  assert.equal(page.form.noValidate, true);
  assert.ok(Object.values(page.errors).every((error) => error.hidden));
  assert.ok(page.controls.every((control) => !control.getAttribute('aria-describedby')));
  page.submit();
  assert.equal(Object.values(page.errors).filter((error) => !error.hidden).length, 6);
  assert.equal(page.focused(), page.field('first-name'));
  assert.equal(page.success(), false);
  assert.ok(page.controls.every((control) => control.getAttribute('aria-invalid') === 'true'));
});

test('whitespace, email errors, missing query, and missing consent block success', () => {
  for (const name of ['first-name', 'last-name', 'message', 'email-address', 'query-type', 'consent']) {
    const page = setup();
    page.fillValid();
    const control = page.field(name);
    if (name === 'email-address') {
      control.value = 'invalid-email';
      control.validity.valid = false;
    } else if (name === 'query-type' || name === 'consent') {
      control.checked = false;
    } else {
      control.value = ' \t\n ';
    }
    page.submit();
    assert.equal(page.success(), false, name);
    assert.equal(page.focused(), control, name);
    assert.equal(Object.values(page.errors).filter((error) => !error.hidden).length, 1, name);
    assert.ok(control.getAttribute('aria-describedby'), name);
  }
});

test('correction clears group errors; success resets form and later edits dismiss it', () => {
  const page = setup();
  page.submit();
  page.fillValid();
  page.controls.forEach((control) => {
    const event = control.type === 'radio' || control.type === 'checkbox' ? 'change' : 'input';
    control.listeners[event]();
  });
  assert.ok(Object.values(page.errors).every((error) => error.hidden));
  assert.ok(page.controls.every((control) => control.getAttribute('aria-invalid') === 'false'));
  page.submit();
  assert.equal(page.success(), true);
  assert.equal(page.focused(), page.notification);
  assert.ok(page.controls.every((control) => control.value === '' && !control.checked));
  page.field('first-name').listeners.input();
  assert.equal(page.success(), false);
  assert.ok(Object.values(page.errors).every((error) => error.hidden));
  page.submit();
  assert.equal(Object.values(page.errors).filter((error) => !error.hidden).length, 6);
});
