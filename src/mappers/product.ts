import type { ProductDto } from '../dtos/product';
import type { ProductWithImages } from '../repositories/products';

export function toProductDto(product: ProductWithImages): ProductDto {
  return {
    productID: product.productID,
    name: product.name,
    description: product.description,
    quantity: product.quantity,
    draft: product.draft,
    visible: product.visible,
    weight: product.weight,
    deletedAt: product.deletedAt?.toISOString() ?? null,
    productImages: product.productImages.map((image) => ({
      imageID: image.imageID,
      productID: image.productID,
      imageUrl: image.imageUrl,
      imageOrder: image.imageOrder,
    })),
  };
}
