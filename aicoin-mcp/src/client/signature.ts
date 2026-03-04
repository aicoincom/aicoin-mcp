/**
 * AiCoin API signature generation
 * HmacSHA1 + hex + Base64
 */
import { createHmac, randomBytes } from 'node:crypto';

export interface AuthParams {
  AccessKeyId: string;
  SignatureNonce: string;
  Timestamp: string;
  Signature: string;
}

export function generateSignature(
  accessKeyId: string,
  accessSecret: string
): AuthParams {
  const nonce = randomBytes(4).toString('hex');
  const ts = Math.floor(Date.now() / 1000).toString();

  const str =
    `AccessKeyId=${accessKeyId}` +
    `&SignatureNonce=${nonce}` +
    `&Timestamp=${ts}`;

  const hex = createHmac('sha1', accessSecret)
    .update(str)
    .digest('hex');

  const signature = Buffer.from(hex, 'binary').toString(
    'base64'
  );

  return {
    AccessKeyId: accessKeyId,
    SignatureNonce: nonce,
    Timestamp: ts,
    Signature: signature,
  };
}
