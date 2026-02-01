#!/usr/bin/env node

/**
 * Diagnostic script to check if all encryption components are working
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 DIGITAL WILL ENCRYPTION DIAGNOSTIC\n');
console.log('=' .repeat(60) + '\n');

// Check 1: Python executable
console.log('✓ Check 1: Python Executable');
const getPythonExecutable = () => {
  const isWindows = process.platform === 'win32';
  const venvPath = path.join(__dirname, '..', '.venv', 'Scripts', 'python.exe');
  const backendVenvPath = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
  
  if (fs.existsSync(venvPath)) {
    console.log(`  ✅ Found parent venv: ${venvPath}`);
    return venvPath;
  }
  if (fs.existsSync(backendVenvPath)) {
    console.log(`  ✅ Found backend venv: ${backendVenvPath}`);
    return backendVenvPath;
  }
  
  console.log(`  ⚠️  Using system Python`);
  return isWindows ? 'python.exe' : 'python';
};

const pythonExecutable = getPythonExecutable();

// Check 2: Required files
console.log('\n✓ Check 2: Required Files');
const requiredFiles = [
  'glue_algorithm.py',
  'split.exe',
  'merge.exe',
  'mechanic.dll'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
  }
});

// Check 3: Directory permissions
console.log('\n✓ Check 3: Directory Permissions');
const dirs = ['uploads_temp', 'secure_storage'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`  ✅ ${dir} - Created`);
    } else {
      console.log(`  ✅ ${dir} - Exists`);
    }
  } catch (e) {
    console.log(`  ❌ ${dir} - ${e.message}`);
  }
});

// Check 4: Python can import required modules
console.log('\n✓ Check 4: Python Modules');
const pythonModules = ['ctypes', 'os', 'json', 'subprocess', 'glob', 'sys'];
const moduleCheckScript = `import sys; print('\\n'.join([m for m in ['${pythonModules.join("', '")}'] if __import__(m)]))`;

exec(`"${pythonExecutable}" -c "${moduleCheckScript}"`, (error, stdout, stderr) => {
  if (error) {
    console.log(`  ❌ Module check failed: ${error.message}`);
  } else {
    const modules = stdout.trim().split('\n').length;
    console.log(`  ✅ All ${modules} required Python modules available`);
  }
  
  // Check 5: Test encryption
  console.log('\n✓ Check 5: Test Encryption');
  
  const testFile = path.join(__dirname, 'diagnostic_test.txt');
  fs.writeFileSync(testFile, 'Diagnostic test content');
  
  const pythonScript = path.join(__dirname, 'glue_algorithm.py');
  const command = `"${pythonExecutable}" "${pythonScript}" "${testFile}" "diagnostic-test"`;
  
  console.log(`  Running: ${command}\n`);
  
  exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.log(`  ❌ Encryption failed:`);
      console.log(`     Error: ${error.message}`);
      if (stderr) {
        console.log(`     Stderr: ${stderr.substring(0, 200)}`);
      }
    } else {
      // Check if JSON result is present
      const lines = stdout.split('\n');
      let hasJsonResult = false;
      
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].trim().startsWith('{')) {
          try {
            const result = JSON.parse(lines[i].trim());
            if (result.status === 'success') {
              console.log(`  ✅ Encryption successful`);
              console.log(`     Fragments: ${result.fragment_count}`);
              console.log(`     Map file: ${path.basename(result.map_file)}`);
              hasJsonResult = true;
              break;
            }
          } catch (e) {
            // Continue searching
          }
        }
      }
      
      if (!hasJsonResult) {
        console.log(`  ❌ No valid JSON result in output`);
        console.log(`     Output: ${stdout.substring(0, 300)}`);
      }
    }
    
    // Cleanup
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('\n📋 DIAGNOSTIC COMPLETE\n');
    console.log('If all checks passed:');
    console.log('  1. Try uploading a file from User Dashboard');
    console.log('  2. Check backend logs for detailed error info');
    console.log('  3. Verify secure_storage/ has the encrypted fragments\n');
  });
});
