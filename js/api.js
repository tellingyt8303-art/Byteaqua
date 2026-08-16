// ===== API client =====
// Point this at your deployed backend from the water-delivery-backend project.
const API_BASE = window.API_BASE_URL || 'http://localhost:5000/api';

const Api = {
  token() {
    return localStorage.getItem('aq_token');
  },

  async request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth && this.token()) headers['Authorization'] = `Bearer ${this.token()}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  },

  // Auth
  signup(payload) { return this.request('/auth/signup', { method: 'POST', body: payload }); },
  login(payload) { return this.request('/auth/login', { method: 'POST', body: payload }); },
  forgotPassword(email) { return this.request('/auth/forgot-password', { method: 'POST', body: { email } }); },
  changePassword(payload) { return this.request('/auth/change-password', { method: 'POST', body: payload, auth: true }); },
  me() { return this.request('/auth/me', { auth: true }); },

  // Products
  getProducts() { return this.request('/products'); },

  // Orders
  createOrder(payload) { return this.request('/orders', { method: 'POST', body: payload, auth: true }); },
  myOrders() { return this.request('/orders/my-orders', { auth: true }); },

  // Subscriptions
  createSubscription(payload) { return this.request('/subscriptions', { method: 'POST', body: payload, auth: true }); },
  mySubscriptions() { return this.request('/subscriptions/my-subscriptions', { auth: true }); },
};
