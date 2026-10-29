import { createApp } from './src/app';
import { prisma } from './src/prismaClient';
import { createSession } from './src/services/sessions';
const server = createApp().listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
const cust = 'e2e-Z1', P = 'e2e-ZP1'; const token = createSession(cust);
const call = async (m, p, b) => { const r = await fetch(base + p, { method: m, headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: b ? JSON.stringify(b) : undefined }); const t = await r.text(); return { s: r.status, b: t ? JSON.parse(t) : null }; };
const cleanup = async () => { await prisma.basketItem.deleteMany({ where: { customerID: cust } }); await prisma.productPrices.deleteMany({ where: { productID: P } }); await prisma.product.deleteMany({ where: { productID: P } }); await prisma.customer.deleteMany({ where: { customerID: cust } }); };
let ok = true; const chk = (n, c, x) => { console.log(c ? 'PASS' : 'FAIL', n, c ? '' : JSON.stringify(x)); ok &&= c; };
try {
  await cleanup();
  await prisma.customer.create({ data: { customerID: cust, email: 'z1@e2e.test', firstname: 'T', surname: 'T', addressLine1: 'x', postcode: 'x', passwordHash: 'x' } });
  await prisma.product.create({ data: { productID: P, name: P, quantity: 5, weight: 1, draft: false, visible: true, productPrices: { create: [{ price: 5 }] } } });
  await call('POST', '/basket/items', { productID: P, quantity: 2 });
  let r = await call('PATCH', `/basket/items/${P}`, { quantity: 0 });
  chk('PATCH quantity 0 -> 200, item null', r.s === 200 && r.b.item === null, r);
  r = await call('GET', '/basket');
  chk('item is gone from basket', r.b.items.length === 0, r);
  r = await call('PATCH', `/basket/items/${P}`, { quantity: 0 });
  chk('PATCH 0 again (not in basket) -> 404', r.s === 404, r);
  r = await call('POST', '/basket/items', { productID: P, quantity: 0 });
  chk('POST quantity 0 still rejected -> 400', r.s === 400, r);
  await call('POST', '/basket/items', { productID: P, quantity: 2 });
  r = await call('PATCH', `/basket/items/${P}`, { quantity: -1 });
  chk('PATCH -1 -> 400, item untouched', r.s === 400 && (await call('GET', '/basket')).b.items[0].quantityInBasket === 2, r);
} catch (e) { console.log('SCRIPT ERROR', e); ok = false; }
finally { await cleanup(); server.close(); await prisma.$disconnect(); process.exit(ok ? 0 : 1); }
