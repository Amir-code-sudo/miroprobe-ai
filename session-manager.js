/**
 * MiroProbe AI — Session & Cookie Persistence Engine
 * Enables recording and injecting authenticated user sessions (Instagram, Meta, Web Apps).
 * Saves Playwright storageState (Cookies, LocalStorage, SessionTokens) to simulate
 * logged-in, verified users rather than anonymous guests.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

async function recordSession(targetUrl, sessionName = 'active-session') {
  console.log('============================================================================');
  console.log('  MiroProbe AI — Authenticated Session Recorder');
  console.log('============================================================================');
  console.log(`  Target Platform : ${targetUrl}`);
  console.log(`  Session Output  : sessions/${sessionName}.json`);
  console.log('\n[*] Launching Real Chrome Window for Authentication...');
  console.log('    1. A browser window will open now on your screen.');
  console.log('    2. Log in with your account or accept permissions as a normal user.');
  console.log('    3. Once you are logged in, return to this terminal and press [ENTER].\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'en-US'
  });

  const page = await context.newPage();
  await page.goto(targetUrl).catch(() => {});

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await new Promise((resolve) => {
    rl.question('👉 Press [ENTER] here AFTER you finish logging in to save the session: ', () => {
      rl.close();
      resolve();
    });
  });

  const sessionPath = path.join(SESSIONS_DIR, `${sessionName}.json`);
  await context.storageState({ path: sessionPath });
  console.log(`\n✅ [نجاح]: تم حفظ جلسة الدخول والكوكيز بنجاح في: sessions/${sessionName}.json`);
  console.log('   جميع المتصفحات القادمة ستفتح الآن كـ "مستخدم مسجل ومعتمد" (Authenticated User)!');

  await browser.close();
}

function getSessionPath(sessionName = 'active-session') {
  const specificPath = path.join(SESSIONS_DIR, `${sessionName}.json`);
  if (fs.existsSync(specificPath)) return specificPath;

  const defaultPath = path.join(SESSIONS_DIR, 'active-session.json');
  if (fs.existsSync(defaultPath)) return defaultPath;

  const instaPath = path.join(SESSIONS_DIR, 'instagram.json');
  if (fs.existsSync(instaPath)) return instaPath;

  return null;
}

if (require.main === module) {
  const target = process.argv[2] || 'https://www.instagram.com/';
  const name = process.argv[3] || (target.includes('instagram') ? 'instagram' : 'active-session');
  recordSession(target, name).catch(console.error);
}

module.exports = {
  recordSession,
  getSessionPath
};
