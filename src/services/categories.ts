import type { CategoryChoiceDto } from '../dtos/category';
import { findCategories } from '../repositories/categories';

export async function getCategories(
  fetchCategories: typeof findCategories = findCategories,
): Promise<CategoryChoiceDto[]> {
  const categories = await fetchCategories();
  return categories.map((category) => ({
    categoryID: category.categoryID,
    name: category.name,
    description: category.description,
    departmentID: category.departmentID,
    departmentName: category.department.name,
  }));
}
