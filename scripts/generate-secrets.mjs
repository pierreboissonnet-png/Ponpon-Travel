// Generates every secret the app needs. Run: npm run secrets
import crypto from 'node:crypto';
import webpush from 'web-push';
const rnd = (n = 32) => crypto.randomBytes(n).toString('base64url');
const v = webpush.generateVAPIDKeys();
console.log(`AUTH_SECRET=${rnd()}
CRON_SECRET=${rnd(24)}
SETUP_KEY=${rnd(9)}
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${v.publicKey}
VAPID_PRIVATE_KEY=${v.privateKey}`);
