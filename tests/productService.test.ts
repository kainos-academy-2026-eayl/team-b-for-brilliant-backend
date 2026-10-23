import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toProductDto } from '../src/mappers/product';
import type { ProductWithRelations } from '../src/repositories/products';
import { getProduct, getProducts } from '../src/services/products';

const product: ProductWithRelations = {
  productID: 'product-1',
  name: 'Example',
  description: null,
  quantity: 5,
  draft: false,
  visible: true,
  weight: 1.5,
  deletedAt: new Date('2026-10-01T12:00:00.000Z'),
  productImages: [
    { imageID: 'image-1', productID: 'product-1', imageUrl: '/image.jpg', imageOrder: 0 },
    { imageID: 'image-2', productID: 'product-1', imageUrl: '/other.jpg', imageOrder: 2 },
  ],
  productCategories: [
    {
      productID: 'product-1',
      categoryID: 'category-1',
      category: {
        categoryID: 'category-1',
        name: 'Accessories',
        description: 'Product accessories',
        departmentID: 'department-1',
        department: {
          departmentID: 'department-1',
          name: 'Lifestyle',
          description: 'Lifestyle products',
        },
      },
    },
    {
      productID: 'product-1',
      categoryID: 'category-2',
      category: {
        categoryID: 'category-2',
        name: 'Travel',
        description: null,
        departmentID: 'department-1',
        department: {
          departmentID: 'department-1',
          name: 'Lifestyle',
          description: 'Lifestyle products',
        },
      },
    },
  ],
};

test('product mapper preserves the response fields and serializes dates', () => {
  const dto = toProductDto(product);
  assert.deepEqual(dto, {
    productID: product.productID,
    name: product.name,
    description: product.description,
    quantity: product.quantity,
    draft: product.draft,
    visible: product.visible,
    weight: product.weight,
    deletedAt: '2026-10-01T12:00:00.000Z',
    productImages: product.productImages,
    categories: product.productCategories.map(({ category }) => ({
      categoryID: category.categoryID,
      name: category.name,
      description: category.description,
      departmentID: category.departmentID,
    })),
    departments: [
      {
        departmentID: 'department-1',
        name: 'Lifestyle',
        description: 'Lifestyle products',
      },
    ],
  });
  assert.notEqual(dto.productImages, product.productImages);
  assert.notEqual(dto.productImages[0], product.productImages[0]);
  assert.ok(product.deletedAt instanceof Date);
});

test('product mapper handles null dates and products without images', () => {
  const value = { ...product, deletedAt: null, productImages: [], productCategories: [] };
  assert.deepEqual(toProductDto(value), {
    productID: value.productID,
    name: value.name,
    description: value.description,
    quantity: value.quantity,
    draft: value.draft,
    visible: value.visible,
    weight: value.weight,
    deletedAt: null,
    productImages: [],
    categories: [],
    departments: [],
  });
});

test('product service fetches from the repository and maps the results', async () => {
  let calls = 0;
  const products = await getProducts(async () => {
    calls += 1;
    return [product];
  });

  assert.equal(calls, 1);
  assert.deepEqual(products, [toProductDto(product)]);
});

test('product service returns an empty list for an empty repository', async () => {
  assert.deepEqual(await getProducts(async () => []), []);
});

test('product service propagates repository errors', async () => {
  const error = new Error('Database unavailable');
  await assert.rejects(
    getProducts(async () => {
      throw error;
    }),
    (actual) => actual === error,
  );
});

test('single product service queries the requested ID and maps the result', async () => {
  const result = await getProduct('product-1', async (id) => {
    assert.equal(id, 'product-1');
    return product;
  });
  assert.deepEqual(result, toProductDto(product));
});

test('single product service returns null for a missing product', async () => {
  assert.equal(await getProduct('missing', async () => null), null);
});

test('single product service propagates repository errors', async () => {
  await assert.rejects(
    getProduct('product-1', async () => {
      throw new Error('Database unavailable');
    }),
    /Database unavailable/,
  );
});
