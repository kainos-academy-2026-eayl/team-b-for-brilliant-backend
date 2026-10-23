import type { ProductDto } from '../dtos/product';
import type { ProductWithRelations } from '../repositories/products';

export function toProductDto(product: ProductWithRelations): ProductDto {
  const categories = product.productCategories.map(({ category }) => category);
  const departments = new Map(
    categories.map(({ department }) => [department.departmentID, department]),
  );

  return {
    productID: product.productID,
    name: product.name,
    description: product.description,
    quantity: product.quantity,
    draft: product.draft,
    visible: product.visible,
    weight: product.weight,
    salesNo: product.salesNo,
    deletedAt: product.deletedAt?.toISOString() ?? null,
    productImages: product.productImages.map((image) => ({
      imageID: image.imageID,
      productID: image.productID,
      imageUrl: image.imageUrl,
      imageOrder: image.imageOrder,
    })),
    categories: categories.map((category) => ({
      categoryID: category.categoryID,
      name: category.name,
      description: category.description,
      departmentID: category.departmentID,
    })),
    departments: Array.from(departments.values()).map((department) => ({
      departmentID: department.departmentID,
      name: department.name,
      description: department.description,
    })),
  };
}
