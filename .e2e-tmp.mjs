import { createApp } from './src/app';
import { prisma } from './src/prismaClient';
import { createSession } from './src/services/sessions';

const server = createApp().listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
const customerID = 'e2e-Z1';
const productID = 'e2e-ZP1';
const token = createSession(customerID);
const call = async (method, path, body) => {
  const response = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { s: response.status, b: text ? JSON.parse(text) : null };
};
const cleanup = async () => {
  await prisma.basketItem.deleteMany({ where: { customerID } });
  await prisma.productPrices.deleteMany({ where: { productID } });
  await prisma.product.deleteMany({ where: { productID } });
  await prisma.customer.deleteMany({ where: { customerID } });
};
let allPassed = true;
const check = (name, condition, details) => {
  console.log(condition ? 'PASS' : 'FAIL', name, condition ? '' : JSON.stringify(details));
  allPassed &&= condition;
};
try {
  await cleanup();
  await prisma.customer.create({
    data: {
      customerID,
      email: 'z1@e2e.test',
      firstname: 'T',
      surname: 'T',
      addressLine1: 'x',
      postcode: 'x',
      passwordHash: 'x',
    },
  });
  await prisma.product.create({
    data: {
      productID,
      name: productID,
      quantity: 5,
      weight: 1,
      draft: false,
      visible: true,
      productPrices: { create: [{ price: 5 }] },
    },
  });
  await call('POST', '/basket/items', { productID, quantity: 2 });
  let result = await call('PATCH', `/basket/items/${productID}`, { quantity: 0 });
  check('PATCH quantity 0 -> 200, item null', result.s === 200 && result.b.item === null, result);
  result = await call('GET', '/basket');
  check('item is gone from basket', result.b.items.length === 0, result);
  result = await call('PATCH', `/basket/items/${productID}`, { quantity: 0 });
  check('PATCH 0 again (not in basket) -> 404', result.s === 404, result);
  result = await call('POST', '/basket/items', { productID, quantity: 0 });
  check('POST quantity 0 still rejected -> 400', result.s === 400, result);
  await call('POST', '/basket/items', { productID, quantity: 2 });
  result = await call('PATCH', `/basket/items/${productID}`, { quantity: -1 });
  check(
    'PATCH -1 -> 400, item untouched',
    result.s === 400 && (await call('GET', '/basket')).b.items[0].quantityInBasket === 2,
    result,
  );
} catch (error) {
  console.log('SCRIPT ERROR', error);
  allPassed = false;
} finally {
  await cleanup();
  server.close();
  await prisma.$disconnect();
  process.exit(allPassed ? 0 : 1);
}
