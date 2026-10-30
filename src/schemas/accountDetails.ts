import { z } from 'zod';

export const accountDetailsSchema = z
  .strictObject({
    firstname: z.string().trim().max(100).default(''),
    surname: z.string().trim().max(100).default(''),
    addressLine1: z.string().trim().max(255).default(''),
    addressLine2: z.string().trim().max(255).default(''),
    postcode: z.string().trim().max(20).default(''),
    securityQuestionID: z.string().trim().max(100).optional(),
    securityAnswer: z.string().trim().max(1024).optional(),
  })
  .superRefine((details, context) => {
    if (details.securityAnswer && !details.securityQuestionID) {
      context.addIssue({
        code: 'custom',
        path: ['securityQuestionID'],
        message: 'Select a security question when providing an answer.',
      });
    }
  });

export type AccountDetails = z.infer<typeof accountDetailsSchema>;
