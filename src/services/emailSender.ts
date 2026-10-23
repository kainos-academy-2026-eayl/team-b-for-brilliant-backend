export type EmailSender = (to: string, verifyLink: string) => Promise<void>;

// Development only: prints the link instead of emailing it
export const consoleEmailSender: EmailSender = async (to, verifyLink) => {
  console.log(`[dev email] Verification link for ${to}: ${verifyLink}`);
};
