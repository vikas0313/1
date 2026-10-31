import bcrypt from 'bcryptjs';
import readline from 'node:readline';

async function main() {
  const argPassword = process.argv[2];

  if (argPassword) {
    const hash = await bcrypt.hash(argPassword, 10);
    console.log('\n--- Ritsu Food Corner Owner Password Hash ---');
    console.log(`Password: ${argPassword}`);
    console.log(`Hash:     ${hash}`);
    console.log('\nAdd this to your .env file:');
    console.log(`OWNER_PASSWORD_HASH="${hash}"\n`);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter desired owner dashboard password: ', async (password) => {
    rl.close();
    if (!password.trim()) {
      console.error('Password cannot be empty');
      process.exit(1);
    }

    const hash = await bcrypt.hash(password.trim(), 10);
    console.log('\n--- Ritsu Food Corner Owner Password Hash ---');
    console.log(`Password: ${password.trim()}`);
    console.log(`Hash:     ${hash}`);
    console.log('\nAdd this to your .env file:');
    console.log(`OWNER_PASSWORD_HASH="${hash}"\n`);
  });
}

main();
