import { HttpError } from '../errors/httpError';
import { toProductDto } from '../mappers/product';
import type { ProductUpdate } from '../schemas/productUpdate';

export async function listProductClassifications() {
  const { prisma } = await import('../prismaClient');
  const [categories, departments] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
  ]);
  return { categories, departments };
}

export async function saveProductUpdate(
  productID: string,
  input: ProductUpdate,
  imageUrls?: string[],
) {
  const { prisma } = await import('../prismaClient');
  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.product.updateMany({
      where: { productID, deletedAt: null },
      data: {
        name: input.name,
        description: input.description,
        quantity: input.quantity,
        weight: input.weight,
        visible: input.visible,
        draft: input.draft,
      },
    });
    if (updated.count === 0) throw new HttpError(404, 'Product not found');
    const categories = await transaction.category.count({
      where: { categoryID: { in: input.categoryIDs } },
    });
    if (categories !== input.categoryIDs.length) {
      throw new HttpError(400, 'A selected category is no longer available.');
    }
    await transaction.productCategories.deleteMany({ where: { productID } });
    if (input.categoryIDs.length) {
      await transaction.productCategories.createMany({
        data: input.categoryIDs.map((categoryID) => ({ productID, categoryID })),
      });
    }
    const currentPrice = await transaction.productPrices.findFirst({
      where: { productID },
      orderBy: [{ createdAt: 'desc' }, { priceID: 'desc' }],
    });
    if (currentPrice?.price.toFixed(2) !== input.price) {
      await transaction.productPrices.create({
        data: {
          productID,
          price: input.price,
          createdAt: new Date(Math.max(Date.now(), (currentPrice?.createdAt.getTime() ?? 0) + 1)),
        },
      });
    }
    if (input.images !== undefined) {
      const retainedIDs = input.images.flatMap((image) =>
        'imageID' in image ? [image.imageID] : [],
      );
      const retainedCount = await transaction.productImage.count({
        where: { productID, imageID: { in: retainedIDs } },
      });
      if (retainedCount !== retainedIDs.length) {
        throw new HttpError(
          400,
          'An image is no longer available for this product. Reload and try again.',
        );
      }
      await transaction.productImage.deleteMany({
        where: { productID, imageID: { notIn: retainedIDs } },
      });
      let uploadIndex = 0;
      for (const [imageOrder, image] of input.images.entries()) {
        if ('imageID' in image) {
          await transaction.productImage.update({
            where: { imageID: image.imageID, productID },
            data: { imageOrder },
          });
        } else {
          const imageUrl = imageUrls?.[uploadIndex++];
          if (!imageUrl) throw new Error('An uploaded product image could not be resolved.');
          await transaction.productImage.create({ data: { productID, imageUrl, imageOrder } });
        }
      }
    }
    const product = await transaction.product.findUniqueOrThrow({
      where: { productID },
      include: {
        productImages: true,
        productCategories: { include: { category: { include: { department: true } } } },
      },
    });
    return { product: toProductDto(product), currentPrice: input.price };
  });
}
