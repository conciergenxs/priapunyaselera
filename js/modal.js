// White modal on a native <dialog>: focus is trapped and restored by the
// browser, Escape and backdrop clicks close it unless `canDismiss()` says no
// (e.g. while a redemption is being saved). Neither ever confirms anything.

/**
 * Open a modal. `html` is the inner markup; give the title id="<labelledBy>".
 * Returns the dialog; `onClose(dialog)` runs after it closes and is removed.
 */
export const openModal = (html, { labelledBy, size = "", canDismiss = () => true, onClose } = {}) => {
  const dialog = document.createElement("dialog");
  dialog.className = `modal${size ? ` modal--${size}` : ""}`;
  dialog.setAttribute("aria-labelledby", labelledBy);
  dialog.innerHTML = html;
  document.body.append(dialog);

  dialog.addEventListener("cancel", (event) => {
    if (!canDismiss()) event.preventDefault();
  });

  // A click whose target is the dialog itself landed on the backdrop.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && canDismiss()) dialog.close();
    if (event.target.closest("[data-modal-close]") && canDismiss()) dialog.close();
  });

  dialog.addEventListener("close", () => {
    dialog.remove();
    onClose?.(dialog);
  });

  dialog.showModal();
  return dialog;
};

export const closeIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
export const checkIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17l9-10"/></svg>';
