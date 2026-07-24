import fs from 'fs';
import path from 'path';

const imagePath = path.resolve('../frontend/src/assets/images/login_logo.jpeg');
const targetPath = path.resolve('../frontend/src/utils/logoBase64.js');

const b64 = fs.readFileSync(imagePath).toString('base64');
const content = `export const EMBLEM_BASE64 = "data:image/jpeg;base64,${b64}";\n`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully created logoBase64.js file!');
