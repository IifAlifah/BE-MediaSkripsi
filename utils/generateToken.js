import crypto from 'crypto';

export default function generateToken() {
  return crypto.randomBytes(4).toString('base64url');
}
