import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a test file
const testFile = path.join(__dirname, 'test_file.txt');
fs.writeFileSync(testFile, 'This is a test file for encryption testing!');

console.log('🧪 Testing Encryption Engine...\n');

// Get Python executable
const getPythonExecutable = () => {
  const isWindows = process.platform === 'win32';
  const venvPath = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');
  const backendVenvPath = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
  
  if (fs.existsSync(venvPath)) {
    console.log('✅ Found parent venv Python');
    return venvPath;
  }
  if (fs.existsSync(backendVenvPath)) {
    console.log('✅ Found backend venv Python');
    return backendVenvPath;
  }
  
  console.log('⚠️  Using system Python');
  return isWindows ? 'python.exe' : 'python';
};

const pythonExecutable = getPythonExecutable();
const pythonScript = path.join(__dirname, 'glue_algorithm.py');
const userId = 'test-user-123';

const command = `"${pythonExecutable}" "${pythonScript}" "${testFile}" "${userId}"`;

console.log(`Running: ${command}\n`);
console.log('---OUTPUT---\n');

exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
  console.log(stdout);
  
  if (stderr) {
    console.error('\n---STDERR---');
    console.error(stderr);
  }
  
  if (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } else {
    console.log('\n✅ Encryption test completed successfully!');
    
    // Try to parse the JSON output
    try {
      const jsonMatch = stdout.match(/\{.*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log('\n📊 Result:');
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (e) {
      console.log('\n⚠️  Could not parse JSON output');
    }
  }
  
  // Cleanup
  if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
});
