import { HttpError } from './httpError';

export class CategorySelectionError extends HttpError {
  constructor() {
    super(400, 'One or more selected categories are no longer available. Choose categories from the list.');
  }
}
