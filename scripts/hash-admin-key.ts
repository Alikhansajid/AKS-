import bcrypt from 'bcrypt';

const adminKey = 'alikhan';

bcrypt.hash(adminKey, 10).then((hash) => {
  console.log('Paste this in your .env:');
  console.log(`ADMIN_KEY_HASH=${hash}`);
});
