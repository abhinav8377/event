import QRCode from 'qrcode';

export const generateQR = (value: string): Promise<string> => QRCode.toDataURL(String(value));
