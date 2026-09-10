import { StandardEvents } from '@shopify/events';
import { formatMoney } from '@theme/money-formatting';

class FreeShippingProgress extends HTMLElement {
  #handleCartUpdate = (event) => {
    event.promise?.then(({ cart, detail }) => {
      const total = this.#getCartTotal(detail?.cart ?? cart);

      if (total !== null) this.#render(total);
    });
  };

  connectedCallback() {
    this.#render(Number(this.dataset.total));
    document.addEventListener(StandardEvents.cartLinesUpdate, this.#handleCartUpdate);
  }

  disconnectedCallback() {
    document.removeEventListener(StandardEvents.cartLinesUpdate, this.#handleCartUpdate);
  }

  #getCartTotal(cart) {
    if (Number.isFinite(cart?.total_price)) return cart.total_price;

    const amount = Number(cart?.cost?.totalAmount?.amount);
    if (Number.isFinite(amount)) return Math.round(amount * 100);

    return null;
  }

  #render(total) {
    const threshold = Number(this.dataset.threshold);
    if (!Number.isFinite(threshold) || threshold <= 0 || !Number.isFinite(total)) return;

    const remaining = Math.max(threshold - total, 0);
    const progress = Math.min((total / threshold) * 100, 100);
    const unlocked = remaining === 0;
    const message = this.querySelector('[data-free-shipping-message]');
    const fill = this.querySelector('[data-free-shipping-fill]');
    const track = this.querySelector('[data-free-shipping-track]');

    this.dataset.total = total.toString();
    this.dataset.unlocked = unlocked.toString();

    if (fill) fill.style.width = `${progress}%`;
    if (track) track.setAttribute('aria-valuenow', Math.min(total, threshold).toString());

    if (message) {
      message.textContent = unlocked
        ? 'Free shipping unlocked'
        : `Add ${this.#formatMoney(remaining)} more for free shipping`;
    }
  }

  #formatMoney(amount) {
    return formatMoney(amount, this.dataset.moneyFormat || 'Rs. {{amount}}', this.dataset.currency || 'INR');
  }
}

if (!customElements.get('free-shipping-progress')) {
  customElements.define('free-shipping-progress', FreeShippingProgress);
}
