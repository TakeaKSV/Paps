import bankGothicBase64 from './customFont';

const BANK_GOTHIC_FONT_NAME = 'BankGothicLtBT';
const BANK_GOTHIC_FILE_NAME = `${BANK_GOTHIC_FONT_NAME}.ttf`;

export const registerBankGothic = (doc) => {
  if (!doc || typeof doc.getFontList !== 'function') {
    return BANK_GOTHIC_FONT_NAME;
  }

  const fonts = doc.getFontList();
  if (!fonts?.[BANK_GOTHIC_FONT_NAME]) {
    doc.addFileToVFS(BANK_GOTHIC_FILE_NAME, bankGothicBase64);
    doc.addFont(BANK_GOTHIC_FILE_NAME, BANK_GOTHIC_FONT_NAME, 'normal');
  }

  return BANK_GOTHIC_FONT_NAME;
};
