import { prisma } from '../src/prismaClient';
import { hashPassword } from '../src/services/password';

async function main() {
  await prisma.$transaction(async (transaction) => {
    const products = [
      {
        productID: 'product-1',
        name: 'Hyaluronic Acid Serum',
        description:
          'Deep hydrating serum with hyaluronic acid, plumps skin for a glowing complexion',
        quantity: 30,
        draft: false,
        visible: true,
        weight: 0.15,
        deletedAt: null,
        salesNo: 287,
      },
      {
        productID: 'product-2',
        name: 'Full Coverage Foundation',
        description: 'Professional-grade full coverage foundation, matte finish, 24-hour wear',
        quantity: 45,
        draft: false,
        visible: true,
        weight: 0.2,
        deletedAt: null,
        salesNo: 412,
      },
      {
        productID: 'product-3',
        name: 'Volumizing Mascara',
        description: 'Volumizing mascara with conditioning formula, dramatic lashes in one coat',
        quantity: 22,
        draft: false,
        visible: true,
        weight: 0.08,
        deletedAt: null,
        salesNo: 156,
      },
      {
        productID: 'product-4',
        name: 'Retinol Night Cream',
        description: 'Anti-aging retinol night cream, reduces fine lines and wrinkles',
        quantity: 18,
        draft: false,
        visible: true,
        weight: 0.3,
        deletedAt: null,
        salesNo: 198,
      },
      {
        productID: 'product-5',
        name: 'Liquid Lipstick Set',
        description:
          'Set of 12 liquid lipsticks in various shades, waterproof long-lasting formula',
        quantity: 35,
        draft: false,
        visible: true,
        weight: 0.25,
        deletedAt: null,
        salesNo: 324,
      },
      {
        productID: 'product-6',
        name: 'Korean Sheet Mask Pack',
        description: '10-pack of hydrating sheet masks with essence, brightening formula',
        quantity: 60,
        draft: false,
        visible: true,
        weight: 0.5,
        deletedAt: null,
        salesNo: 501,
      },
      {
        productID: 'product-7',
        name: 'Luxury Makeup Brush Set',
        description: '24-piece synthetic makeup brush set, includes face and eye brushes',
        quantity: 12,
        draft: false,
        visible: true,
        weight: 0.4,
        deletedAt: null,
        salesNo: 89,
      },
      {
        productID: 'product-8',
        name: 'Hydrating Lip Balm',
        description: 'Nourishing lip balm with vitamin E, prevents chapping',
        quantity: 55,
        draft: false,
        visible: true,
        weight: 0.05,
        deletedAt: null,
        salesNo: 743,
      },
      {
        productID: 'product-9',
        name: 'Bone Smashing Hammer',
        description:
          'Professional-grade titanium bone smashing hammer for looksmaxxing, ergonomic design',
        quantity: 5,
        draft: false,
        visible: true,
        weight: 2.2,
        deletedAt: null,
        salesNo: 12,
      },
      {
        productID: 'product-10',
        name: 'Limited Edition Eyeshadow Palette',
        description: 'This palette is out of stock and discontinued',
        quantity: 0,
        draft: false,
        visible: false,
        weight: 0.35,
        deletedAt: null,
        salesNo: 0,
      },
    ];

    for (const product of products) {
      const { productID, ...data } = product;
      await transaction.product.upsert({
        where: { productID },
        create: product,
        update: data,
      });

      const prices =
        productID === 'product-1'
          ? ['34.99', '39.99', '37.99']
          : productID === 'product-2'
            ? ['44.99', '49.99', '47.99']
            : productID === 'product-3'
              ? ['24.99', '29.99', '27.99']
              : productID === 'product-4'
                ? ['59.99', '69.99', '64.99']
                : productID === 'product-5'
                  ? ['29.99', '34.99', '32.99']
                  : productID === 'product-6'
                    ? ['19.99', '24.99', '22.99']
                    : productID === 'product-7'
                      ? ['49.99', '59.99', '54.99']
                      : productID === 'product-8'
                        ? ['12.99', '14.99', '13.99']
                        : productID === 'product-9'
                          ? ['299.99', '349.99', '324.99']
                          : ['79.99', '89.99', '84.99'];

      for (const [index, price] of prices.entries()) {
        const priceID = `${productID}-price-${index + 1}`;
        const priceData = {
          productID,
          price,
          createdAt: new Date(Date.UTC(2026, 9, index + 1)),
        };
        await transaction.productPrices.upsert({
          where: { priceID },
          create: { priceID, ...priceData },
          update: priceData,
        });
      }
    }

    // Add product images for all products
    const images = [
      {
        imageID: 'image-1',
        productID: 'product-1',
        imageUrl: '/images/product-1.svg',
        imageOrder: 0,
      },
      {
        imageID: 'image-2',
        productID: 'product-2',
        imageUrl: '/images/product-2.svg',
        imageOrder: 0,
      },
      {
        imageID: 'image-3',
        productID: 'product-3',
        imageUrl: '/images/product-3.svg',
        imageOrder: 0,
      },
      {
        imageID: 'image-4',
        productID: 'product-4',
        imageUrl: '/images/product-4.svg',
        imageOrder: 0,
      },
      {
        imageID: 'image-5',
        productID: 'product-5',
        imageUrl: '/images/product-5.svg',
        imageOrder: 0,
      },
      {
        imageID: 'image-6',
        productID: 'product-6',
        imageUrl: '/images/product-6.svg',
        imageOrder: 0,
      },
      {
        imageID: 'image-7',
        productID: 'product-7',
        imageUrl: '/images/product-7.svg',
        imageOrder: 0,
      },
      {
        imageID: 'image-8',
        productID: 'product-8',
        imageUrl: '/images/product-8.svg',
        imageOrder: 0,
      },
      {
        imageID: 'image-9',
        productID: 'product-9',
        imageUrl: '/images/product-9.svg',
        imageOrder: 0,
      },
      {
        imageID: 'image-10',
        productID: 'product-10',
        imageUrl: '/images/product-10.svg',
        imageOrder: 0,
      },
    ];

    for (const image of images) {
      await transaction.productImage.upsert({
        where: { imageID: image.imageID },
        create: image,
        update: {
          productID: image.productID,
          imageUrl: image.imageUrl,
          imageOrder: image.imageOrder,
        },
      });
    }

    // Test-only customer; the password is "password".
    const customer = {
      userID: 'C03859',
      email: 'customer@gmail.com',
      firstname: 'Customer',
      surname: 'One',
      addressLine1: '4-6 Upper Crescent',
      addressLine2: 'Belfast',
      postcode: 'BT7 1NT',
      passwordHash: await hashPassword('password'),
    };
    const { userID, ...customerData } = customer;

    await transaction.user.upsert({
      where: { userID },
      create: customer,
      update: customerData,
    });
  });

  console.log('Seeded 10 beauty products with pricing, 10 product images and one test customer.');
}

try {
  await main();
} catch (error) {
  console.error('Product seed failed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
