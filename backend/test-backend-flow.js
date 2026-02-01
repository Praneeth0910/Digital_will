import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simulate what the backend does
const getPythonExecutable = () => {
  const isWindows = process.platform === 'win32';
  const venvPath = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');
  const backendVenvPath = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
  
  if (fs.existsSync(venvPath)) {
    console.log('[OK] Using parent venv Python');
    return venvPath;
  }
  if (fs.existsSync(backendVenvPath)) {
    console.log('[OK] Using backend venv Python');
    return backendVenvPath;
  }
  
  console.log('[WARN] Using system Python');
  return isWindows ? 'python.exe' : 'python';
};

// Create test file in uploads_temp like the backend would
const uploadsDir = path.join(__dirname, 'uploads_temp');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const testFile = path.join(uploadsDir, '123-testfile.txt');
fs.writeFileSync(testFile, 'Test content for encryption');

console.log('🧪 Testing Backend Upload Flow...\n');
console.log(`Test file: ${testFile}\n`);

const pythonExecutable = getPythonExecutable();
const pythonScript = path.join(__dirname, 'glue_algorithm.py');
const userId = 'user-123';

const command = `"${pythonExecutable}" "${pythonScript}" "${testFile}" "${userId}"`;

console.log(`Running: ${command}\n`);
console.log('---PYTHON OUTPUT---\n');

exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
  console.log(stdout);
  
  if (stderr) {
    console.error('\n---STDERR---');
    console.error(stderr);
  }
  
  if (error) {
    console.error('\n[ERROR] Command failed:', error.message);
    process.exit(1);
  }
  
  console.log('\n---PARSING RESULT---\n');
  
  // Simulate what the backend does
  const lines = stdout.split('\n');
  let result = null;
  
  console.log(`Total output lines: ${lines.length}`);
  
  // Search from the end backwards to find the JSON
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.length > 0) {
      console.log(`Checking line ${i}: "${line.substring(0, 80)}${line.length > 80 ? '...' : ''}"`);
    }
    if (line.startsWith('{')) {
      try {
        result = JSON.parse(line);
        console.log(`[OK] Found valid JSON at line ${i}`);
        break;
      } catch (e) {
        console.log(`[WARN] Line ${i} looks like JSON but parse failed: ${e.message}`);
        continue;
      }
    }
  }

  if (!result) {
    console.error('[ERROR] Could not parse JSON from output');
    process.exit(1);
  }
  
  if (result.status !== 'success') {
    console.error(`[ERROR] Status is not success: ${result.message}`);
    process.exit(1);
  }
  
  console.log('\n✅ SUCCESS! Parsing worked!\n');
  console.log('Final Result:');
  console.log(JSON.stringify(result, null, 2));
  
  // Cleanup
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
});
