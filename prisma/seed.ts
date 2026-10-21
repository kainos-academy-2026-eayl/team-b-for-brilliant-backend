import { prisma } from '../src/prismaClient';

async function main() {
  await prisma.$transaction(async (transaction) => {
    const products = [
      {
        productID: 'product-1',
        name: 'Example product',
        description: null,
        quantity: 5,
        draft: false,
        visible: true,
        weight: 1.5,
        deletedAt: null,
      },
      {
        productID: 'product-2',
        name: 'Product without images',
        description: 'No images yet',
        quantity: 0,
        draft: true,
        visible: false,
        weight: 2,
        deletedAt: null,
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
        productID === 'product-1' ? ['19.99', '24.99', '22.49'] : ['9.99', '12.99', '11.49'];
      for (const [index, price] of prices.entries()) {
        const priceID = `${productID}-price-${index + 1}`;
        const data = {
          productID,
          price,
          createdAt: new Date(Date.UTC(2026, 9, index + 1)),
        };
        await transaction.productPrices.upsert({
          where: { priceID },
          create: { priceID, ...data },
          update: data,
        });
      }
    }

    const image = {
      imageID: 'image-1',
      productID: 'product-1',
      imageUrl: '/images/product-1.svg',
    };

    await transaction.productImage.upsert({
      where: { imageID: image.imageID },
      create: image,
      update: { productID: image.productID, imageUrl: image.imageUrl },
    });
  });

  console.log('Seeded two product fixtures, one product image and six price records.');
}

try {
  await main();
} catch (error) {
  console.error('Product seed failed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
