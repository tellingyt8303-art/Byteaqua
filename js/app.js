// ===================== SAMPLE DATA (fallback if backend not connected) =====================
const FALLBACK_PRODUCTS = [
  { id: 'p1', name: 'Purified Water', size: '1L Bottle', price: 20, stockQty: 120 },
  { id: 'p2', name: 'Purified Water', size: '5L Can', price: 70, stockQty: 45 },
  { id: 'p3', name: 'Mineral Water', size: '20L Jar', price: 90, stockQty: 8 },
  { id: 'p4', name: 'Alkaline Water', size: '1L Bottle', price: 30, stockQty: 60 },
  { id: 'p5', name: 'Purified Water', size: '2L Bottle', price: 35, stockQty: 3 },
  { id: 'p6', name: 'Mineral Water', size: '5L Can', price: 80, stockQty: 25 },
];

const PLANS = [
  { id: 'daily', freq: 'Daily', desc: '1 unit every day', save: 'Best for families' },
  { id: 'weekly', freq: 'Weekly', desc: 'Delivered every week', save: 'Save 5%' },
  { id: 'monthly', freq: 'Monthly', desc: 'One bulk drop a month', save: 'Save 12%' },
];

// ===================== STATE =====================
const State = {
  products: [],
  cart: JSON.parse(localStorage.getItem('aq_cart') || '{}'), // { productId: qty }
  user: JSON.parse(localStorage.getItem('aq_user') || 'null'),
  selectedPlanProduct: null,
};

function saveCart() { localStorage.setItem('aq_cart', JSON.stringify(State.cart)); }
function money(n) { return `₹${Number(n).toFixed(0)}`; }

// ===================== TOAST =====================
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

// ===================== ROUTER =====================
const Router = {
  go(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${pageId}`);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-item[data-page]').forEach(n => {
      n.classList.toggle('active', n.dataset.page === pageId);
    });
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    if (pageId === 'account') Account.render();
    if (pageId === 'plans') Plans.render();
    if (pageId === 'checkout') Checkout.render();
  },
};

// ===================== PRODUCTS =====================
const Products = {
  stockClass(qty) {
    if (qty <= 10) return 'low';
    if (qty <= 40) return 'med';
    return '';
  },
  stockRatio(qty) {
    // visual fill 0-1 for droplet
    return Math.max(0.12, Math.min(1, qty / 100));
  },
  dropletSvg(qty) {
    const ratio = this.stockRatio(qty);
    const cls = this.stockClass(qty);
    const fillY = 24 - (24 * ratio);
    return `<div class="stock-droplet ${cls}" title="${qty} in stock">
      <svg viewBox="0 0 20 24">
        <defs><clipPath id="clip-${qty}-${Math.random().toString(36).slice(2,7)}"><path d="M10 0C10 0 0 12 0 17a10 10 0 0020 0C20 12 10 0 10 0Z"/></clipPath></defs>
        <path class="fill-bg" d="M10 0C10 0 0 12 0 17a10 10 0 0020 0C20 12 10 0 10 0Z"/>
        <g clip-path="url(#clip-${qty}-${Math.random().toString(36).slice(2,7)})">
          <rect class="fill-level" x="0" y="${fillY}" width="20" height="24"/>
        </g>
      </svg>
    </div>`;
  },
  async load() {
    try {
      const data = await Api.getProducts();
      State.products = data.products && data.products.length ? data.products : FALLBACK_PRODUCTS;
    } catch (e) {
      State.products = FALLBACK_PRODUCTS;
    }
    this.renderGrid();
  },
  renderGrid() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = State.products.map(p => {
      const qty = State.cart[p.id] || 0;
      return `
      <div class="product-card">
        <div class="product-top">
          <div class="product-icon">
            <svg viewBox="0 0 24 28" fill="none"><path d="M12 1C12 1 2 14 2 19.5C2 24 6.5 27 12 27C17.5 27 22 24 22 19.5C22 14 12 1 12 1Z" fill="#0077B6"/></svg>
          </div>
          ${this.dropletSvg(p.stockQty)}
        </div>
        <div>
          <div class="product-name">${p.name}</div>
          <div class="product-size">${p.size}</div>
        </div>
        <div class="product-bottom">
          <span class="product-price">${money(p.price)}</span>
          ${qty > 0
            ? `<div class="stepper">
                <button onclick="Cart.dec('${p.id}')">−</button>
                <span>${qty}</span>
                <button onclick="Cart.inc('${p.id}')">+</button>
              </div>`
            : `<button class="add-btn" onclick="Cart.inc('${p.id}')" aria-label="Add">+</button>`
          }
        </div>
      </div>`;
    }).join('');
  },
};

// ===================== CART =====================
const Cart = {
  open() {
    this.render();
    document.getElementById('drawerOverlay').classList.add('open');
    document.getElementById('cartDrawer').classList.add('open');
  },
  close() {
    document.getElementById('drawerOverlay').classList.remove('open');
    document.getElementById('cartDrawer').classList.remove('open');
  },
  inc(id) {
    State.cart[id] = (State.cart[id] || 0) + 1;
    saveCart(); Products.renderGrid(); this.updateBadge(); this.render();
  },
  dec(id) {
    if (!State.cart[id]) return;
    State.cart[id] -= 1;
    if (State.cart[id] <= 0) delete State.cart[id];
    saveCart(); Products.renderGrid(); this.updateBadge(); this.render();
  },
  totalQty() { return Object.values(State.cart).reduce((a, b) => a + b, 0); },
  totalAmount() {
    return Object.entries(State.cart).reduce((sum, [id, qty]) => {
      const p = State.products.find(p => p.id === id);
      return sum + (p ? p.price * qty : 0);
    }, 0);
  },
  updateBadge() {
    const badge = document.getElementById('cartBadge');
    const n = this.totalQty();
    badge.textContent = n;
    badge.style.display = n > 0 ? 'grid' : 'none';
  },
  render() {
    const wrap = document.getElementById('cartItems');
    const foot = document.getElementById('cartFoot');
    const entries = Object.entries(State.cart);

    if (!entries.length) {
      wrap.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
        <h3>Your cart is empty</h3>
        <p>Add some water bottles to get started.</p>
      </div>`;
      foot.innerHTML = '';
      return;
    }

    wrap.innerHTML = entries.map(([id, qty]) => {
      const p = State.products.find(p => p.id === id);
      if (!p) return '';
      return `<div class="cart-row">
        <div class="product-icon" style="width:40px;height:40px;flex-shrink:0">
          <svg viewBox="0 0 24 28" fill="none" width="18"><path d="M12 1C12 1 2 14 2 19.5C2 24 6.5 27 12 27C17.5 27 22 24 22 19.5C22 14 12 1 12 1Z" fill="#0077B6"/></svg>
        </div>
        <div class="info">
          <div class="name">${p.name}</div>
          <div class="meta">${p.size} · ${money(p.price)}</div>
        </div>
        <div class="stepper">
          <button onclick="Cart.dec('${id}')">−</button>
          <span>${qty}</span>
          <button onclick="Cart.inc('${id}')">+</button>
        </div>
      </div>`;
    }).join('');

    const total = this.totalAmount();
    foot.innerHTML = `
      <div class="summary-row"><span>Subtotal</span><span class="mono">${money(total)}</span></div>
      <div class="summary-row"><span>Delivery</span><span class="mono">Free</span></div>
      <div class="summary-row total"><span>Total</span><span class="mono">${money(total)}</span></div>
      <div style="height:12px"></div>
      <button class="btn btn-primary btn-block" onclick="Cart.close(); Router.go('checkout')">Proceed to checkout</button>
    `;
  },
};

// ===================== AUTH =====================
const AuthUI = {
  showTab(tab) {
    document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
    document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('signupForm').style.display = tab === 'signup' ? 'block' : 'none';
  },
};

const Auth = {
  async login(e) {
    e.preventDefault();
    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;
    try {
      const data = await Api.login({ phone, password });
      this.setSession(data.token, data.user);
      toast('Welcome back!');
      Router.go('account');
    } catch (err) {
      toast(err.message || 'Login failed');
    }
    return false;
  },
  async signup(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('suName').value,
      phone: document.getElementById('suPhone').value,
      email: document.getElementById('suEmail').value,
      password: document.getElementById('suPassword').value,
      address: document.getElementById('suAddress').value,
      city: document.getElementById('suCity').value,
      pincode: document.getElementById('suPincode').value,
    };
    try {
      const data = await Api.signup(payload);
      this.setSession(data.token, data.user);
      toast('Account created!');
      Router.go('account');
    } catch (err) {
      toast(err.message || 'Signup failed');
    }
    return false;
  },
  async forgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('fpEmail').value;
    try {
      await Api.forgotPassword(email);
      toast('Reset link sent to your email');
      Router.go('auth');
    } catch (err) {
      toast(err.message || 'Could not send reset link');
    }
    return false;
  },
  async changePassword(e) {
    e.preventDefault();
    const oldPassword = document.getElementById('cpOld').value;
    const newPassword = document.getElementById('cpNew').value;
    try {
      await Api.changePassword({ oldPassword, newPassword });
      toast('Password updated');
      Router.go('account');
    } catch (err) {
      toast(err.message || 'Could not update password');
    }
    return false;
  },
  setSession(token, user) {
    localStorage.setItem('aq_token', token);
    localStorage.setItem('aq_user', JSON.stringify(user));
    State.user = user;
    updateLocationPill();
  },
  logout() {
    localStorage.removeItem('aq_token');
    localStorage.removeItem('aq_user');
    State.user = null;
    updateLocationPill();
    Account.render();
    toast('Logged out');
  },
};

// ===================== ACCOUNT PAGE =====================
const Account = {
  async render() {
    const loggedOut = document.getElementById('accountLoggedOut');
    const loggedIn = document.getElementById('accountLoggedIn');
    if (!State.user) {
      loggedOut.style.display = 'block';
      loggedIn.style.display = 'none';
      return;
    }
    loggedOut.style.display = 'none';
    loggedIn.style.display = 'block';
    document.getElementById('accountName').textContent = State.user.name || State.user.phone;

    // Orders
    const ordersList = document.getElementById('ordersList');
    try {
      const { orders } = await Api.myOrders();
      ordersList.innerHTML = orders && orders.length
        ? orders.map(o => this.orderCard(o)).join('')
        : `<p style="color:var(--ink-soft);font-size:13.5px">No orders yet.</p>`;
    } catch {
      ordersList.innerHTML = `<p style="color:var(--ink-soft);font-size:13.5px">Could not load orders.</p>`;
    }

    // Subscriptions
    const subsList = document.getElementById('subsList');
    try {
      const { subscriptions } = await Api.mySubscriptions();
      subsList.innerHTML = subscriptions && subscriptions.length
        ? subscriptions.map(s => `<div class="order-card">
            <div class="order-top">
              <span class="order-id">${s.frequency.toUpperCase()} PLAN</span>
              <span class="order-status ${s.status === 'active' ? '' : 'cancelled'}">${s.status}</span>
            </div>
            <div class="order-items">Qty ${s.quantityPerDelivery} per delivery</div>
          </div>`).join('')
        : `<p style="color:var(--ink-soft);font-size:13.5px">No active subscriptions.</p>`;
    } catch {
      subsList.innerHTML = `<p style="color:var(--ink-soft);font-size:13.5px">Could not load subscriptions.</p>`;
    }
  },
  orderCard(o) {
    const itemsText = (o.items || []).map(i => `${i.name} ×${i.qty}`).join(', ');
    const partner = o.deliveryPartner;
    const showPartner = partner && (o.status === 'dispatched' || o.status === 'confirmed' || o.status === 'delivered');
    const partnerBlock = showPartner ? `
      <div class="delivery-partner-block">
        <div class="dp-avatar">${(partner.name || 'D')[0].toUpperCase()}</div>
        <div class="dp-info">
          <div class="dp-label">${o.status === 'delivered' ? 'Delivered by' : 'Delivery partner'}</div>
          <div class="dp-name">${partner.name}</div>
        </div>
        ${o.status !== 'delivered' ? `<a href="tel:${partner.phone}" class="dp-call">Call</a>` : ''}
      </div>` : '';
    return `<div class="order-card">
      <div class="order-top">
        <span class="order-id">#${(o.id || '').slice(0, 8)}</span>
        <span class="order-status ${o.status}">${o.status}</span>
      </div>
      <div class="order-items">${itemsText}</div>
      <div class="order-total">${money(o.totalAmount)}</div>
      ${partnerBlock}
    </div>`;
  },
};

function updateLocationPill() {
  const label = document.getElementById('locationLabel');
  if (State.user) {
    label.innerHTML = `<strong>${State.user.name ? State.user.name.split(' ')[0] : 'Account'}</strong>`;
  } else {
    label.textContent = 'Set delivery location';
  }
}

// ===================== PLANS PAGE =====================
const Plans = {
  render() {
    const row = document.getElementById('planRow');
    row.innerHTML = PLANS.map(pl => `
      <div class="plan-card" id="planCard-${pl.id}" onclick="Plans.select('${pl.id}')">
        <div class="freq">${pl.freq}</div>
        <div class="desc">${pl.desc}</div>
        <span class="save">${pl.save}</span>
      </div>`).join('');
    this.renderDetail();
  },
  select(planId) {
    State.selectedPlanId = planId;
    this.renderDetail();
  },
  async renderDetail() {
    const detail = document.getElementById('planDetail');
    const planId = State.selectedPlanId || 'weekly';
    document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('active'));
    const activeCard = document.getElementById(`planCard-${planId}`);
    if (activeCard) activeCard.classList.add('active');

    if (!State.products.length) await Products.load();

    detail.innerHTML = `
      <div class="section-head" style="margin-top:20px"><h2 style="font-size:15px">Choose a product</h2></div>
      <div class="product-grid">
        ${State.products.map(p => `
          <div class="product-card" style="cursor:pointer" onclick="Plans.subscribe('${p.id}', '${planId}')">
            <div class="product-icon">
              <svg viewBox="0 0 24 28" fill="none"><path d="M12 1C12 1 2 14 2 19.5C2 24 6.5 27 12 27C17.5 27 22 24 22 19.5C22 14 12 1 12 1Z" fill="#0077B6"/></svg>
            </div>
            <div class="product-name">${p.name}</div>
            <div class="product-size">${p.size}</div>
            <div class="product-price">${money(p.price)} / unit</div>
          </div>`).join('')}
      </div>
    `;
  },
  async subscribe(productId, planId) {
    if (!State.user) { toast('Please log in first'); Router.go('auth'); return; }
    try {
      await Api.createSubscription({ productId, frequency: planId, quantityPerDelivery: 1 });
      toast('Subscription created!');
      Router.go('account');
    } catch (err) {
      toast(err.message || 'Could not create subscription');
    }
  },
};

// ===================== CHECKOUT =====================
const Checkout = {
  render() {
    if (!State.user) { toast('Please log in to checkout'); Router.go('auth'); return; }
    const summary = document.getElementById('checkoutSummary');
    const entries = Object.entries(State.cart);
    if (!entries.length) {
      summary.innerHTML = `<p style="color:var(--ink-soft);font-size:13.5px">Your cart is empty.</p>`;
      return;
    }
    summary.innerHTML = entries.map(([id, qty]) => {
      const p = State.products.find(p => p.id === id);
      if (!p) return '';
      return `<div class="summary-row"><span>${p.name} (${p.size}) ×${qty}</span><span class="mono">${money(p.price * qty)}</span></div>`;
    }).join('') + `<div class="summary-row total"><span>Total</span><span class="mono">${money(Cart.totalAmount())}</span></div>`;

    document.querySelectorAll('input[name="payment"]').forEach(r => {
      r.onchange = () => {
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        r.closest('.payment-option').classList.add('selected');
      };
    });
  },
  async placeOrder() {
    const address = document.getElementById('checkoutAddress').value;
    const pincode = document.getElementById('checkoutPincode').value;
    const paymentType = document.querySelector('input[name="payment"]:checked').value;

    if (!address || !pincode) { toast('Please fill in your delivery address'); return; }
    if (!Object.keys(State.cart).length) { toast('Your cart is empty'); return; }

    const items = Object.entries(State.cart).map(([productId, qty]) => ({ productId, qty }));

    try {
      const data = await Api.createOrder({ items, paymentType, address, pincode });
      if (paymentType === 'online' && data.razorpayOrder) {
        toast('Redirecting to payment…');
        // Integrate Razorpay Checkout.js here using data.razorpayOrder.id
      } else {
        toast('Order placed! Pay on delivery.');
      }
      State.cart = {};
      saveCart();
      Cart.updateBadge();
      Router.go('account');
    } catch (err) {
      toast(err.message || 'Could not place order');
    }
  },
};

// ===================== INIT =====================
(async function init() {
  updateLocationPill();
  Cart.updateBadge();
  await Products.load();

  if (State.user && Api.token()) {
    try { await Api.me(); } catch { Auth.logout(); }
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
