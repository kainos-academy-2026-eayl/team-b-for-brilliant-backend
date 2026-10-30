import { HttpError } from '../errors/httpError';
import { saveAccountDetails } from '../repositories/accountDetails';
import { findSecurityQuestion } from '../repositories/securityQuestions';
import type { AccountDetails } from '../schemas/accountDetails';
import { hashPassword } from './password';

export async function saveCustomerDetails(
  customerID: string,
  details: AccountDetails,
  save = saveAccountDetails,
  findQuestion = findSecurityQuestion,
) {
  const { securityQuestionID, securityAnswer, ...profile } = details;
  const answer = securityAnswer?.trim();
  if (!answer) return save(customerID, profile);

  const questionID = securityQuestionID?.trim();
  if (!questionID || !(await findQuestion(questionID))) {
    throw new HttpError(400, 'Select a valid security question.');
  }
  return save(customerID, {
    ...profile,
    securityQuestionID: questionID,
    securityAnswer: await hashPassword(answer),
  });
}
