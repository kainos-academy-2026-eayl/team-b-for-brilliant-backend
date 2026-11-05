import type { CategoryDto } from './product';

export interface CategoryChoiceDto extends CategoryDto {
  departmentName: string;
}
