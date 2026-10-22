export interface ProductImageDto {
  imageID: string;
  productID: string;
  imageUrl: string;
  imageOrder: number;
}

export interface CategoryDto {
  categoryID: string;
  name: string;
  description: string | null;
  departmentID: string;
}

export interface DepartmentDto {
  departmentID: string;
  name: string;
  description: string | null;
}

export interface ProductDto {
  productID: string;
  name: string;
  description: string | null;
  quantity: number;
  draft: boolean;
  visible: boolean;
  weight: number;
  deletedAt: string | null;
  productImages: ProductImageDto[];
  categories: CategoryDto[];
  departments: DepartmentDto[];
}

export interface ProductsResponseDto {
  products: ProductDto[];
}

export interface ProductResponseDto {
  product: ProductDto;
}
