import bankGothicBase64 from '../../utils/customFont';

const BANK_GOTHIC_FONT_NAME = 'BankGothicLtBT';
const BANK_GOTHIC_FILE_NAME = `${BANK_GOTHIC_FONT_NAME}.ttf`;
const SAFE_BASE64 = bankGothicBase64.replace(/[^A-Za-z0-9+/=]/g, '');

export const registerBankGothic = (doc) => {
  if (!doc || typeof doc.getFontList !== 'function') {
    return BANK_GOTHIC_FONT_NAME;
  }

  const fonts = doc.getFontList();
  if (!fonts?.[BANK_GOTHIC_FONT_NAME]) {
    doc.addFileToVFS(BANK_GOTHIC_FILE_NAME, SAFE_BASE64);
    doc.addFont(BANK_GOTHIC_FILE_NAME, BANK_GOTHIC_FONT_NAME, 'normal');
  }

  return BANK_GOTHIC_FONT_NAME;
};
