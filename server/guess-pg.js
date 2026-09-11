const { Client } = require('pg');

async function testConnection(password) {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: password,
    port: 5432,
  });

  try {
    await client.connect();
    console.log(`✅ Success! The password is: "${password}"`);
    await client.end();
    return true;
  } catch (err) {
    // console.log(`Failed with password: "${password}"`);
    return false;
  }
}

async function main() {
  const commonPasswords = [
    '', 'postgres', 'admin', 'root', 'password', '1234', '12345', '123456', 
    'password123', 'admin123', 'ProjectHub2024'
  ];

  for (const pwd of commonPasswords) {
    const success = await testConnection(pwd);
    if (success) process.exit(0);
  }

  console.log('❌ Could not guess the password.');
  process.exit(1);
}

main();
