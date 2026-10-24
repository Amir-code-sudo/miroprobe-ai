/**
 * MiroProbe AI — Human Biometrics & Behavioral Physics Engine
 * Generates realistic human mouse dynamics (Cubic Bézier Curves + Fitts's Law),
 * human typing cadence (Log-Normal delays + typo corrections), and inertial scrolling.
 */
import { Page, Locator } from '@playwright/test';

interface Point {
  x: number;
  y: number;
}

// Global mouse tracker for the page session
let currentMousePos: Point = { x: 100, y: 100 };

/**
 * Calculates a point along a Cubic Bézier curve at parameter t (0 <= t <= 1)
 * B(t) = (1-t)^3 * P0 + 3(1-t)^2 * t * P1 + 3(1-t) * t^2 * P2 + t^3 * P3
 */
function cubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

/**
 * Generates randomized human-like control points with curvature and slight drift
 */
function generateControlPoints(start: Point, target: Point): { p1: Point; p2: Point } {
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const dist = Math.hypot(dx, dy);

  // Perpendicular deviation (arch curvature)
  const curvature = (Math.random() - 0.5) * Math.min(dist * 0.45, 120);

  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);

  const p1: Point = {
    x: start.x + dx * 0.28 + nx * curvature + (Math.random() - 0.5) * 15,
    y: start.y + dy * 0.28 + ny * curvature + (Math.random() - 0.5) * 15,
  };

  const p2: Point = {
    x: start.x + dx * 0.72 + nx * (curvature * 0.6) + (Math.random() - 0.5) * 10,
    y: start.y + dy * 0.72 + ny * (curvature * 0.6) + (Math.random() - 0.5) * 10,
  };

  return { p1, p2 };
}

/**
 * Moves mouse to target coordinates using smooth physical trajectory
 */
export async function humanMove(
  page: Page,
  targetX: number,
  targetY: number,
  options: { steps?: number; overshoot?: boolean } = {}
): Promise<void> {
  const start = { ...currentMousePos };
  const target = { x: targetX, y: targetY };
  const dist = Math.hypot(target.x - start.x, target.y - start.y);

  // Steps proportional to distance
  const steps = options.steps || Math.max(12, Math.min(45, Math.round(dist / 22)));
  const { p1, p2 } = generateControlPoints(start, target);

  for (let i = 1; i <= steps; i++) {
    // S-curve ease-in / ease-out (Fitts's Law approximation)
    const rawT = i / steps;
    const easedT = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2;

    const pt = cubicBezier(start, p1, p2, target, easedT);

    // Subtle micro-tremor (human hand jitter)
    const jitterX = (Math.random() - 0.5) * 1.2;
    const jitterY = (Math.random() - 0.5) * 1.2;

    await page.mouse.move(pt.x + jitterX, pt.y + jitterY);
    // Micro-delay between steps (7ms - 18ms)
    await page.waitForTimeout(Math.floor(7 + Math.random() * 11));
  }

  currentMousePos = target;
}

/**
 * Human-like Click: moves via Bézier curve, hesitates, presses down, holds, releases
 */
export async function humanClick(
  page: Page,
  locatorOrSelector: Locator | string,
  options: { timeout?: number } = {}
): Promise<boolean> {
  try {
    const loc = typeof locatorOrSelector === 'string' ? page.locator(locatorOrSelector).first() : locatorOrSelector;

    if (!(await loc.isVisible({ timeout: options.timeout || 4000 }).catch(() => false))) {
      return false;
    }

    const box = await loc.boundingBox();
    if (!box) return false;

    // Target a natural point inside the element (not exact geometric center)
    const targetX = box.x + box.width * (0.35 + Math.random() * 0.3);
    const targetY = box.y + box.height * (0.35 + Math.random() * 0.3);

    // 1. Move mouse naturally
    await humanMove(page, targetX, targetY);

    // 2. Pre-click hesitation (80ms - 220ms)
    await page.waitForTimeout(Math.floor(80 + Math.random() * 140));

    // 3. Mouse Down + Click Hold (40ms - 95ms)
    await page.mouse.down();
    await page.waitForTimeout(Math.floor(40 + Math.random() * 55));
    await page.mouse.up();

    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Human-like Typing: variable delays, pauses on spaces/punctuation, optional simulated typos
 */
export async function humanType(
  page: Page,
  locatorOrSelector: Locator | string,
  text: string,
  options: { allowTypos?: boolean; baseDelayMs?: number } = {}
): Promise<boolean> {
  try {
    const loc = typeof locatorOrSelector === 'string' ? page.locator(locatorOrSelector).first() : locatorOrSelector;

    if (!(await loc.isVisible({ timeout: 4000 }).catch(() => false))) {
      return false;
    }

    await humanClick(page, loc);
    await page.waitForTimeout(150);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // Occasional simulated typo (5% probability if enabled)
      if (options.allowTypos && Math.random() < 0.05 && /[a-zA-Z]/.test(char)) {
        const typoChar = String.fromCharCode(char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
        await page.keyboard.press(typoChar);
        await page.waitForTimeout(140 + Math.random() * 100);
        await page.keyboard.press('Backspace');
        await page.waitForTimeout(90 + Math.random() * 60);
      }

      await page.keyboard.type(char);

      // Typing interval follows a variable human distribution (70ms - 160ms)
      let delay = (options.baseDelayMs || 95) + (Math.random() - 0.5) * 55;

      // Humans pause longer on punctuation and word boundaries
      if (char === ' ' || char === '.' || char === '@') {
        delay += 120 + Math.random() * 100;
      }

      await page.waitForTimeout(Math.max(35, Math.floor(delay)));
    }

    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Human-like Smooth Scrolling (inertial mouse wheel)
 */
export async function humanScroll(
  page: Page,
  deltaY: number,
  options: { increments?: number } = {}
): Promise<void> {
  const steps = options.increments || 6;
  const stepAmount = deltaY / steps;

  for (let i = 0; i < steps; i++) {
    // Slight jitter per scroll increment
    const jitter = (Math.random() - 0.5) * (stepAmount * 0.2);
    await page.mouse.wheel(0, stepAmount + jitter);
    await page.waitForTimeout(Math.floor(45 + Math.random() * 60));
  }
}

/**
 * Rage Click Simulator: Impatient rapid clicking to test race conditions & idempotency
 */
export async function rageClick(
  page: Page,
  locatorOrSelector: Locator | string,
  clickCount = 4
): Promise<void> {
  const loc = typeof locatorOrSelector === 'string' ? page.locator(locatorOrSelector).first() : locatorOrSelector;
  const box = await loc.boundingBox().catch(() => null);
  if (!box) return;

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await humanMove(page, x, y);

  for (let i = 0; i < clickCount; i++) {
    await page.mouse.down();
    await page.waitForTimeout(30 + Math.random() * 25);
    await page.mouse.up();
    await page.waitForTimeout(40 + Math.random() * 30);
  }
}
