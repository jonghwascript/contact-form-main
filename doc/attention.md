#--------------------------------------
You register the family as Work Sans while loading Karla-VariableFont_wght.ttf, so your CSS uses a misleading font name and the rendered typography can differ from the intended design. Rename the family to match the font files, or load the actual Work Sans files.

font-family: 'Work Sans';
src/scss/_fonts.scss:5

#--------------------------------------
Your .success-notification has a minimum width of 20.438rem, which is wider than a 320px viewport and can create horizontal overflow on narrow phones. Use a fluid constraint such as width: min(28.125rem, calc(100% - 2rem)) so the notification always fits.

.success-notification {
  display: none;
  position: fixed;
  z-index: 1;
  top: 1.5rem;
src/scss/style.scss:195
#--------------------------------------
Your .contact-submit defines only its resting appearance, so hovering over the submit control provides no visual feedback required by the challenge. Add a .contact-submit:hover rule with a clear color or border change.

.contact-submit {
  padding-inline: 2.5rem;
  padding-block: 1rem;
  background-color: $Green-600;
  border: 0.0625rem solid #0B0B43;
src/scss/style.scss:183
#-------------------------------------
Your validation messages are hidden elements referenced by aria-describedby, so revealing them may not be announced immediately when validation fails. Add role="alert" or aria-live="polite" to the error messages and ensure your script sets aria-invalid="true" on the related controls.

  aria-describedby="first-error" required>
<span id="first-error" class="error-message" hidden>This field is required</span>
src/pages/index.html:24