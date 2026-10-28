export type EmailSender = (sendTo: string, verifyLink: string) => Promise<void>;

// Development only: prints the link instead of emailing it
export const consoleEmailSender: EmailSender = async (sendTo, verifyLink) => {
  console.log(`[dev email] Verification link for ${sendTo}: ${verifyLink}`);
};
