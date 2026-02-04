const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const WEB_BASE_URL = process.env.WEB_BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

const USER_PHONE = process.env.E2E_USER_PHONE || '+966000000000';
const USER_PASSWORD = process.env.E2E_USER_PASSWORD || 'Demo@123456';

const now = () => Date.now();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const apiJson = async ({ method, path, token, body }) => {
  const t0 = now();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const retryAfterHeader = res.headers.get('retry-after');
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : null;

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  const ms = now() - t0;
  return {
    method,
    path,
    ms,
    ok: res.ok,
    status: res.status,
    retryAfterSeconds: Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : null,
    data,
    error: res.ok ? null : (data && data.error ? data.error : `HTTP ${res.status}`)
  };
};

const retry = async ({ tries, delayMs, fn, shouldRetry }) => {
  let lastErr = null;
  for (let i = 0; i < tries; i += 1) {
    try {
      return await fn(i);
    } catch (e) {
      lastErr = e;
      const retryable = shouldRetry ? shouldRetry(e) : false;
      if (!retryable || i === tries - 1) throw e;
      const wait = typeof delayMs === 'function' ? delayMs(i) : delayMs;
      if (wait) await sleep(wait);
    }
  }
  throw lastErr || new Error('retry failed');
};

const step = async (report, name, fn) => {
  const t0 = now();
  const out = { name, ok: false, ms: 0, error: null };
  try {
    const r = await fn();
    out.ok = true;
    out.result = r;
  } catch (e) {
    out.ok = false;
    out.error = e && e.message ? e.message : String(e);
  }
  out.ms = now() - t0;
  report.steps.push(out);
  return out;
};

const uniqueSaudiPhone = () => {
  const r = Math.floor(100000 + Math.random() * 899999);
  return `+96650${r}`;
};

(async () => {
  const report = {
    startedAt: new Date().toISOString(),
    webBaseUrl: WEB_BASE_URL,
    apiBaseUrl: API_BASE_URL,
    seed: {},
    steps: [],
    cleanup: []
  };

  let userToken = null;
  let workerToken = null;

  let userId = null;

  let workerId = null;
  let workerPhone = null;
  let customerId = null;
  let stitchingId = null;
  let receiptNumber = null;

  // --- API seed (creates data we will verify in UI) ---
  await step(report, 'API: health', async () => {
    const r = await apiJson({ method: 'GET', path: '/health' });
    if (!r.ok) throw new Error(r.error || 'health failed');
    return r;
  });

  await step(report, 'API: login user (non-demo)', async () => {
    const r = await apiJson({
      method: 'POST',
      path: '/auth/login',
      body: { identifier: USER_PHONE, password: USER_PASSWORD }
    });
    if (!r.ok) throw new Error(r.error || 'login failed');
    userToken = r.data?.token;
    userId = r.data?.user?.id || r.data?.user?._id || null;
    if (!userToken) throw new Error('missing token');
    report.seed.userPhone = USER_PHONE;
    report.seed.userId = userId;
    return { status: r.status, ms: r.ms };
  });

  await step(report, 'API: create worker', async () => {
    workerPhone = uniqueSaudiPhone();
    const r = await apiJson({
      method: 'POST',
      path: '/worker',
      token: userToken,
      body: {
        name: 'E2E Worker',
        phone: workerPhone,
        password: 'Worker@123456',
        paymentType: 'per_stitching',
        paymentAmount: 10
      }
    });
    if (!r.ok) throw new Error(r.error || 'create worker failed');
    workerId = r.data?.worker?.id || r.data?.worker?._id;
    if (!workerId) throw new Error('missing workerId');
    report.seed.workerPhone = workerPhone;
    report.seed.workerId = workerId;
    return { workerId, ms: r.ms };
  });

  await step(report, 'API: create customer', async () => {
    const localPhone = '05' + String(10000000 + Math.floor(Math.random() * 89999999));
    const r = await apiJson({
      method: 'POST',
      path: '/customers',
      token: userToken,
      body: {
        name: 'E2E Customer',
        phone: localPhone,
        measurements: { length: 10, chest: 10, shoulderWidth: 10, sleeveLength: 10 }
      }
    });
    if (!r.ok) throw new Error(r.error || 'create customer failed');
    customerId = r.data?.customer?._id || r.data?.customer?.id || r.data?._id;
    if (!customerId) throw new Error('missing customerId');
    report.seed.customerId = customerId;
    return { customerId, ms: r.ms };
  });

  await step(report, 'API: create stitching', async () => {
    const due = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const r = await apiJson({
      method: 'POST',
      path: '/stitchings',
      token: userToken,
      body: {
        customerId,
        quantity: 1,
        price: 100,
        paidAmount: 0,
        description: 'E2E order',
        dueDate: due,
        thawbType: 'saudi',
        measurements: { length: 10, chest: 10, shoulderWidth: 10, sleeveLength: 10 },
        styleOptions: { collar: 'classic' }
      }
    });
    if (!r.ok) throw new Error(r.error || 'create stitching failed');
    stitchingId = r.data?.stitching?._id || r.data?.stitching?.id;
    receiptNumber = r.data?.stitching?.receiptNumber;
    if (!stitchingId) throw new Error('missing stitchingId');
    report.seed.stitchingId = stitchingId;
    report.seed.receiptNumber = receiptNumber;
    return { stitchingId, receiptNumber, ms: r.ms };
  });

  await step(report, 'API: assign stitching to worker', async () => {
    const r = await apiJson({
      method: 'PUT',
      path: `/stitchings/${stitchingId}/assign`,
      token: userToken,
      body: { workerId }
    });
    if (!r.ok) throw new Error(r.error || 'assign failed');
    return { ms: r.ms };
  });

  await step(report, 'API: login worker', async () => {
    const r = await apiJson({
      method: 'POST',
      path: '/auth/login',
      body: { identifier: workerPhone, password: 'Worker@123456' }
    });
    if (!r.ok) throw new Error(r.error || 'worker login failed');
    workerToken = r.data?.token;
    if (!workerToken) throw new Error('missing worker token');
    return { status: r.status, ms: r.ms };
  });

  // --- UI E2E (Playwright) ---
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  const tutorialAutoOpenKey = userId ? `khayyat_tutorial_auto_opened_v1:${userId}` : null;
  if (tutorialAutoOpenKey) {
    await context.addInitScript((k) => {
      try {
        window.localStorage.setItem(k, '1');
      } catch (e) {
        // ignore
      }
    }, tutorialAutoOpenKey);
  }

  const page = await context.newPage();

  const artifactsDir = path.join(__dirname, '..', 'playwright-artifacts');
  try {
    fs.mkdirSync(artifactsDir, { recursive: true });
  } catch (_) {
    // ignore
  }

  const uiShot = async (label) => {
    const safe = label.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    const p = path.join(artifactsDir, `${Date.now()}_${safe}.png`);
    await page.screenshot({ path: p, fullPage: true });
    return p;
  };

  const uiStep = async (name, fn) => {
    return step(report, `UI: ${name}`, async () => {
      try {
        return await fn();
      } catch (e) {
        try {
          const shot = await uiShot(name);
          report.uiLastScreenshot = shot;
        } catch (_) {
          // ignore
        }
        throw e;
      }
    });
  };

  await uiStep('open login page', async () => {
    const t0 = now();
    await page.goto(`${WEB_BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    return { ms: now() - t0, url: page.url() };
  });

  await uiStep('login as user', async () => {
    const t0 = now();
    await page.fill('input[type="text"]', USER_PHONE);
    await page.fill('input[type="password"]', USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/user/dashboard', { timeout: 30000, waitUntil: 'commit' });
    await page.waitForSelector('[data-tutorial="page-dashboard"]', { timeout: 30000 });

    // Defensive: if any modal overlay is open, close it by clicking its backdrop.
    const modalBackdrop = page.locator('div.fixed.inset-0.bg-black\\/50');
    if (await modalBackdrop.count()) {
      await modalBackdrop.first().click({ force: true });
      await sleep(250);
    }

    return { ms: now() - t0, url: page.url() };
  });

  await uiStep('navigate sidebar: customers', async () => {
    const t0 = now();
    await page.click('a[data-tutorial="nav-customers"]');
    await page.waitForURL('**/user/customers', { timeout: 20000 });
    await page.waitForSelector('[data-tutorial="customers-create-button"]', { timeout: 20000 });
    return { ms: now() - t0 };
  });

  await uiStep('navigate sidebar: workers', async () => {
    const t0 = now();
    await page.click('a[data-tutorial="nav-workers"]');
    await page.waitForURL('**/user/workers', { timeout: 20000 });
    await page.waitForSelector('[data-tutorial="workers-create-button"]', { timeout: 20000 });
    return { ms: now() - t0 };
  });

  await uiStep('navigate sidebar: stitchings', async () => {
    const t0 = now();
    await page.click('a[data-tutorial="nav-stitchings"]');
    await page.waitForURL('**/user/stitchings', { timeout: 20000 });
    await page.waitForSelector('[data-tutorial="stitchings-create-button"]', { timeout: 20000 });

    if (receiptNumber) {
      await page.waitForSelector(`text=${receiptNumber}`, { timeout: 20000 });
    }

    return { ms: now() - t0, receiptNumber };
  });

  await uiStep('switch to worker login', async () => {
    const t0 = now();
    await page.evaluate(() => {
      try { localStorage.removeItem('token'); } catch (e) {}
    });
    await page.goto(`${WEB_BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    return { ms: now() - t0 };
  });

  await uiStep('login as worker', async () => {
    const t0 = now();
    await page.fill('input[type="text"]', workerPhone);
    await page.fill('input[type="password"]', 'Worker@123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/worker/dashboard', { timeout: 30000, waitUntil: 'commit' });
    return { ms: now() - t0, url: page.url() };
  });

  await uiStep('open worker stitchings page', async () => {
    const t0 = now();
    await page.goto(`${WEB_BASE_URL}/worker/stitchings`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/worker/stitchings', { timeout: 20000, waitUntil: 'commit' });
    if (receiptNumber) {
      await page.waitForSelector(`text=${receiptNumber}`, { timeout: 20000 });
    }
    return { ms: now() - t0 };
  });

  await uiStep('open stitching detail modal and verify measurements + style options', async () => {
    const t0 = now();
    if (receiptNumber) {
      const card = page.locator('div.cursor-pointer').filter({ hasText: receiptNumber }).first();
      await card.locator(`text=${receiptNumber}`).first().click({ timeout: 20000 });
    } else {
      await page.click('div.cursor-pointer');
    }

    if (receiptNumber) {
      await page.getByRole('heading', { name: receiptNumber }).waitFor({ state: 'visible', timeout: 20000 });
    } else {
      await page.locator('div.fixed.inset-0.z-\\[100\\]').first().waitFor({ state: 'visible', timeout: 20000 });
    }

    // Verify new enriched sections
    await page.getByText(/style options/i).first().waitFor({ state: 'visible', timeout: 20000 });
    await page.getByText(/measurements/i).first().waitFor({ state: 'visible', timeout: 20000 });
    // Verify at least one measurement label appears
    await page.getByText(/length|chest|shoulder/i).first().waitFor({ state: 'visible', timeout: 20000 });

    return { ms: now() - t0 };
  });

  await browser.close();

  // --- Cleanup (best effort) ---
  const cleanupStep = async (name, fn) => {
    const t0 = now();
    const r = { name, ok: false, ms: 0, error: null };
    try {
      await fn();
      r.ok = true;
    } catch (e) {
      r.ok = false;
      r.error = e && e.message ? e.message : String(e);
    }
    r.ms = now() - t0;
    report.cleanup.push(r);
  };

  await cleanupStep('delete stitching', async () => {
    if (!stitchingId) return;
    const r = await retry({
      tries: 8,
      delayMs: (i) => Math.min(60_000, 1000 * Math.pow(2, i)),
      shouldRetry: (e) => String(e?.message || e).toLowerCase().includes('too many requests'),
      fn: async () => {
        const resp = await apiJson({ method: 'DELETE', path: `/stitchings/${stitchingId}`, token: userToken });
        if (!resp.ok) throw new Error(resp.error || `delete stitching failed (HTTP ${resp.status})`);
        return resp;
      }
    });
    return { status: r.status, retryAfterSeconds: r.retryAfterSeconds };
  });

  await cleanupStep('delete customer', async () => {
    if (!customerId) return;
    const r = await retry({
      tries: 8,
      delayMs: (i) => Math.min(60_000, 1000 * Math.pow(2, i)),
      shouldRetry: (e) => String(e?.message || e).toLowerCase().includes('too many requests'),
      fn: async () => {
        const resp = await apiJson({ method: 'DELETE', path: `/customers/${customerId}`, token: userToken });
        if (!resp.ok) throw new Error(resp.error || `delete customer failed (HTTP ${resp.status})`);
        return resp;
      }
    });
    return { status: r.status, retryAfterSeconds: r.retryAfterSeconds };
  });

  await cleanupStep('delete worker', async () => {
    if (!workerId) return;
    const r = await retry({
      tries: 8,
      delayMs: (i) => Math.min(60_000, 1000 * Math.pow(2, i)),
      shouldRetry: (e) => String(e?.message || e).toLowerCase().includes('too many requests'),
      fn: async () => {
        const resp = await apiJson({ method: 'DELETE', path: `/worker/${workerId}`, token: userToken });
        if (!resp.ok) throw new Error(resp.error || `delete worker failed (HTTP ${resp.status})`);
        return resp;
      }
    });
    return { status: r.status, retryAfterSeconds: r.retryAfterSeconds };
  });

  report.finishedAt = new Date().toISOString();
  report.pass = report.steps.every((s) => s.ok);
  report.totalMs = report.steps.reduce((sum, s) => sum + (s.ms || 0), 0);

  console.log(JSON.stringify(report, null, 2));

  // Give terminal a breath on Windows
  await sleep(20);
})();
