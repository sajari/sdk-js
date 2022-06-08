import fs from 'fs';

const content = Object.entries(process.env)
  .filter(([key]) => key.startsWith('APP_'))
  .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
  .join('\n');

if (content) {
  fs.writeFileSync('./.env', content);
}
