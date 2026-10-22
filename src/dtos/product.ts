export interface ProductImageDto {
  imageID: string;
  productID: string;
  imageUrl: string;
  imageOrder: number;
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
}

export interface ProductsResponseDto {
  products: ProductDto[];
}

export interface ProductResponseDto {
  product: ProductDto;
}
