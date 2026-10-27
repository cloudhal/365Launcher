/*
 * Copyright © 2026 Cloudrun Ltd
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// Modal helpers shared by popup.html, options.html and the custom tile form.

const UI = (() => {
  function createModalController(modalId) {
    const modal = document.getElementById(modalId);
    let lastFocusedElement = null;

    const getFocusableElements = () => {
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ];

      return [...modal.querySelectorAll(selectors.join(','))]
        .filter(element => element.offsetParent !== null || element === document.activeElement);
    };

    const closeModal = () => {
      modal.dataset.open = 'false';
      modal.setAttribute('aria-hidden', 'true');

      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    };

    const openModal = (triggerElement = document.activeElement) => {
      lastFocusedElement = triggerElement;
      modal.dataset.open = 'true';
      modal.setAttribute('aria-hidden', 'false');

      const [firstFocusable] = getFocusableElements();
      if (firstFocusable) {
        firstFocusable.focus();
      }
    };

    modal.querySelectorAll('[data-close-modal]').forEach(button => {
      button.addEventListener('click', closeModal);
    });

    modal.addEventListener('click', event => {
      if (event.target === modal) {
        closeModal();
      }
    });

    modal.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || modal.dataset.open !== 'true') {
        return;
      }

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    });

    modal.__closeModal = closeModal;

    return { openModal, closeModal };
  }

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') {
      return;
    }

    const openModals = [...document.querySelectorAll('.modal-shell[data-open="true"]')];
    const activeModal = openModals[openModals.length - 1];

    if (!activeModal) {
      return;
    }

    event.preventDefault();
    if (typeof activeModal.__closeModal === 'function') {
      activeModal.__closeModal();
    }
  });

  return { createModalController };
})();
