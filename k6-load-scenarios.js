/**
 * MiroProbe AI — Generated Grafana k6 Multi-Persona Behavioral Load Engine
 * Dynamically configurable via Environment Variables:
 *   VPM: Visitors Per Minute (e.g. 50, 180, 500, 1500)
 *   TARGET_URL: Target website base URL
 *   DURATION: Test duration string (e.g. '1m', '3m', '5m')
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE_URL = (__ENV.TARGET_URL || 'https://demo-store.graduation-project.edu').replace(/\/$/, '');
const VPM = Number(__ENV.VPM || 180);
const DURATION = __ENV.DURATION || '2m';

// Little's Law: Concurrent VUs = (VPM / 60) * avg_session_duration (~10.5 seconds)
const totalVUs = Math.max(4, Math.round((VPM / 60) * 11));

const vuHesitant = Math.max(1, Math.round(totalVUs * 0.35));
const vuFlash = Math.max(1, Math.round(totalVUs * 0.30));
const vuBreaker = Math.max(1, Math.round(totalVUs * 0.20));
const vuMobile = Math.max(1, Math.round(totalVUs * 0.15));

export const options = {
  scenarios: {
    hesitant_shopper: {
      executor: 'ramping-vus',
      exec: 'scenario_1_hesitant_shopper',
      startVUs: 1,
      stages: [
        { duration: '20s', target: vuHesitant },
        { duration: DURATION, target: vuHesitant },
        { duration: '20s', target: 0 },
      ],
    },
    flash_buyer: {
      executor: 'ramping-vus',
      exec: 'scenario_2_flash_buyer',
      startVUs: 1,
      stages: [
        { duration: '20s', target: vuFlash },
        { duration: DURATION, target: vuFlash },
        { duration: '20s', target: 0 },
      ],
    },
    form_breaker: {
      executor: 'ramping-vus',
      exec: 'scenario_3_form_breaker',
      startVUs: 1,
      stages: [
        { duration: '20s', target: vuBreaker },
        { duration: DURATION, target: vuBreaker },
        { duration: '20s', target: 0 },
      ],
    },
    mobile_commuter: {
      executor: 'ramping-vus',
      exec: 'scenario_4_mobile_commuter',
      startVUs: 1,
      stages: [
        { duration: '20s', target: vuMobile },
        { duration: DURATION, target: vuMobile },
        { duration: '20s', target: 0 },
      ],
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<1200', 'p(99)<2500'],
    http_req_failed: ['rate<0.05'],
  },
};

export function scenario_1_hesitant_shopper() {
  let res;
  group('The Hesitant Comparison Shopper (المشتري المتردد (المقارن))', function () {
    // فتح الصفحة الرئيسية للمتجر (Open Store Homepage)
    res = http.get(`${BASE_URL}/`);
    check(res, { 'Open Store Homepage status 200': (r) => r.status === 200 });
    sleep(2.5);

    // كتابة كلمة بحث في شريط المنتجات (Search Product Catalog)
    res = http.get(`${BASE_URL}/api/search?q=laptop`);
    check(res, { 'Search Product Catalog status 200': (r) => r.status === 200 });
    sleep(1.8);

    // فتح صفحة تفاصيل المنتج والتقييمات (View Product Details & Reviews)
    res = http.get(`${BASE_URL}/products/pro-laptop-15`);
    check(res, { 'View Product Details & Reviews status 200': (r) => r.status === 200 });
    sleep(4.2);

    // إضافة المنتج إلى سلة التسوق (Add Item to Cart)
    res = http.get(`${BASE_URL}/cart`);
    check(res, { 'Add Item to Cart status 200': (r) => r.status === 200 });
    sleep(2.0);
  });
}

export function scenario_2_flash_buyer() {
  let res;
  group('The Impulse Flash Buyer (مشتري العروض السريعة (Flash Sale))', function () {
    // الدخول المباشر لصفحة العرض الحصري (Direct Entry to Flash Deal Page)
    res = http.get(`${BASE_URL}/products/flash-deal-bundle`);
    check(res, { 'Direct Entry to Flash Deal Page status 200': (r) => r.status === 200 });
    sleep(1.2);

    // الضغط على الشراء الفوري (Click Instant Checkout)
    res = http.get(`${BASE_URL}/checkout`);
    check(res, { 'Click Instant Checkout status 200': (r) => r.status === 200 });
    sleep(1.5);

    // إرسال نموذج الدفع وتأكيد الطلب (Submit Checkout & Payment Form)
    res = http.post(`${BASE_URL}/checkout/submit`, JSON.stringify({ simulatedPersona: 'The Impulse Flash Buyer' }), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'Submit Checkout & Payment Form status 2xx/3xx': (r) => r.status >= 200 && r.status < 400 });
    sleep(2.2);
  });
}

export function scenario_3_form_breaker() {
  let res;
  group('The Form & Filter Stress Explorer (مختبر الحالات الحرجة والفورم (Edge-Case Explorer))', function () {
    // فتح صفحة التصنيفات المتقدمة (Open Advanced Category Filter)
    res = http.get(`${BASE_URL}/products?category=electronics&sort=price_asc`);
    check(res, { 'Open Advanced Category Filter status 200': (r) => r.status === 200 });
    sleep(1.6);

    // تجربة كود خصم غير صالح في السلة (Apply Invalid Coupon Code)
    res = http.get(`${BASE_URL}/api/cart/coupon`);
    check(res, { 'Apply Invalid Coupon Code status 200': (r) => r.status === 200 });
    sleep(1.4);

    // إرسال طلب التحقق من الرصيد والخصم (Validate Cart Totals)
    res = http.post(`${BASE_URL}/checkout/submit`, JSON.stringify({ simulatedPersona: 'The Form & Filter Stress Explorer' }), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(res, { 'Validate Cart Totals status 2xx/3xx': (r) => r.status >= 200 && r.status < 400 });
    sleep(1.9);
  });
}

export function scenario_4_mobile_commuter() {
  let res;
  group('The Low-Bandwidth Mobile Visitor (متصفح الشبكة الضعيفة (Slow 3G Browser))', function () {
    // فتح الصفحة الرئيسية عبر شبكة الموبايل (Load Homepage on Mobile)
    res = http.get(`${BASE_URL}/`);
    check(res, { 'Load Homepage on Mobile status 200': (r) => r.status === 200 });
    sleep(3.1);

    // التمرير اللانهائي لتحميل المزيد من المنتجات (Infinite Scroll Product Feed)
    res = http.get(`${BASE_URL}/products?category=electronics`);
    check(res, { 'Infinite Scroll Product Feed status 200': (r) => r.status === 200 });
    sleep(2.8);
  });
}
