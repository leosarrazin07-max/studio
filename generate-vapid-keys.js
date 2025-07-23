
// This script generates a new set of VAPID keys for web push notifications.
// Run this script once and add the generated keys to your project's
// environment variables/secrets.

const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Keys Generated Successfully:\n');
console.log('-----------------------------------');
console.log('Public Key:');
console.log(vapidKeys.publicKey);
console.log('\nPrivate Key:');
console.log(vapidKeys.privateKey);
console.log('-----------------------------------\n');
console.log('Save these keys securely.');
console.log('Add them to your project environment secrets:');
console.log('1. NEXT_PUBLIC_VAPID_PUBLIC_KEY = <Your Public Key>');
console.log('2. VAPID_PRIVATE_KEY = <Your Private Key>');
