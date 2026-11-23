const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
let state = [], cursor = 0, effects = [], failWrite = false;
const stored = new Map();
const storage = { getItem: async key => stored.get(key) ?? null, setItem: async (key, value) => { if (failWrite) throw new Error('disk full'); stored.set(key, value); } };
const react = {
  createContext: () => ({ Provider: 'Provider' }),
  useContext: () => null,
  useState: initial => { const index = cursor++; if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
  useRef: initial => { const index = cursor++; if (!(index in state)) state[index] = { current: initial }; return state[index]; },
  useMemo: fn => fn(),
  useEffect: fn => { const index = cursor++; if (!(index in state)) { state[index] = true; effects.push(fn); } },
};
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const req = name => {
    if (name === 'react') return react;
    if (name === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }) };
    if (name === '@react-native-async-storage/async-storage') return storage;
    if (name.endsWith('/demoDay')) return { firstDeliveryDate: () => '2026-11-23' };
    if (name.startsWith('.')) { const base = path.resolve(path.dirname(file), name); return load(['.ts', '.tsx'].map(ext => base + ext).find(fs.existsSync)); }
    return require(name);
  };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(req, module, module.exports);
  return module.exports;
}
const checkout = load(path.join(root, 'src/features/checkout/model/checkout.ts'));
const orders = load(path.join(root, 'src/entities/order/model/localOrder.ts'));
const { SessionProvider } = load(path.join(root, 'src/widgets/app-shell/model/Session.tsx'));
const draft = { ...checkout.emptyDelivery, city: ' Москва ', street: ' Ленина ', house: ' 22 ', apartment: ' 3 ', slot: '12:00', comment: ' Без звонка ' };
const meal = { id: '1', menuItemId: 101, name: 'Обед', price: 180, weight: '250 г' };
const render = () => { cursor = 0; return SessionProvider({ children: null, resetAllData: async () => {} }).props.value; };
async function hydrate() { render(); effects.splice(0).forEach(fn => fn()); await new Promise(resolve => setImmediate(resolve)); return render(); }
(async () => {
  assert.equal(Object.keys(checkout.deliveryErrors(checkout.emptyDelivery)).length, 4);
  assert.equal(Object.keys(checkout.deliveryErrors(draft)).length, 0);
  assert.ok(checkout.deliveryErrors({ ...draft, city: ' '.repeat(4) }).city);
  assert.ok(checkout.deliveryErrors({ ...draft, slot: '03:00' }).slot);
  assert.ok(checkout.deliveryErrors({ ...draft, street: 'a'.repeat(201) }).street);
  assert.throws(() => checkout.orderRequest('2026-11-23', draft, []));
  assert.throws(() => checkout.orderRequest('2026-11-23', draft, [{ meal, quantity: 0 }]));
  assert.throws(() => checkout.orderRequest('2026-11-23', draft, [{ meal, quantity: 1 }, { meal, quantity: 2 }]));
  const request = checkout.orderRequest('2026-11-23', draft, [{ meal, quantity: 2 }]);
  assert.equal(request.delivery_time, '12:00:00');
  assert.equal(request.comment, 'Без звонка');
  assert.equal(checkout.addressText(draft), 'Москва, ул. Ленина, д. 22, кв. 3');
  assert.throws(() => orders.readLocalOrders('{bad'));
  assert.throws(() => orders.readLocalOrders('[{}]'));
  let session = await hydrate();
  session.cart.add(meal); session.cart.add(meal); session = render();
  assert.equal(session.cart.total, 360);
  const saving = session.placeOrder(request, checkout.addressText(draft));
  await assert.rejects(session.placeOrder(request, checkout.addressText(draft)));
  const order = await saving; session = render();
  assert.equal(order.total, 360); assert.equal(session.cart.count, 0); assert.equal(session.orders.length, 1);
  assert.equal(orders.readLocalOrders(stored.get(orders.ordersStorageKey)).length, 1);
  // Restart restores the receipt instead of presenting an empty order history.
  state = []; effects = []; session = await hydrate(); assert.equal(session.orders[0].id, order.id);
  session.cart.add(meal); session = render(); failWrite = true;
  const next = checkout.orderRequest('2026-11-23', draft, session.cart.items);
  await assert.rejects(session.placeOrder(next, checkout.addressText(draft)));
  session = render(); assert.equal(session.cart.count, 1); assert.equal(session.orders.length, 1);
  failWrite = false;
  await assert.rejects(session.placeOrder({ ...next, items: [{ menu_item_id: 101, quantity: 8 }] }, checkout.addressText(draft)));
  await session.placeOrder(next, checkout.addressText(draft)); session = render(); assert.equal(session.orders.length, 2); assert.equal(session.cart.count, 0);
  console.log('PASS: validation, request mapping, totals, duplicate-submit guard, persistence, restart, storage failure/retry, changed-cart rejection');
})().catch(error => { console.error(error); process.exitCode = 1; });
