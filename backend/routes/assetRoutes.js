import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { authenticateUser } from '../middleware/auth.js';
import DigitalAsset from '../models/DigitalAsset.js'; 

const router = express.Router();

// Get Python executable path (use venv if available)
const getPythonExecutable = () => {
  const isWindows = process.platform === 'win32';
  const venvPath = path.join(process.cwd(), '..', '.venv', 'Scripts', 'python.exe');
  const backendVenvPath = path.join(process.cwd(), '.venv', 'Scripts', 'python.exe');
  
  if (fs.existsSync(venvPath)) {
    console.log('✅ Using parent venv Python');
    return venvPath;
  }
  if (fs.existsSync(backendVenvPath)) {
    console.log('✅ Using backend venv Python');
    return backendVenvPath;
  }
  
  console.log('⚠️  Using system Python');
  return isWindows ? 'python.exe' : 'python';
};

const pythonExecutable = getPythonExecutable();

// 1. Configure Temporary Storage (Before Python encrypts it)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads_temp/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename to prevent issues
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    console.log(`[MULTER] File filter - fieldname: ${file.fieldname}, originalname: ${file.originalname}`);
    cb(null, true);
  }
});

// 2. THE BRIDGE ENDPOINT - File Upload Handler
router.post('/upload-asset', authenticateUser, upload.single('file'), async (req, res) => {
  try {
    // FIRST: Log everything at the very start
    console.log('\n' + '='.repeat(50));
    console.log('START OF UPLOAD ENDPOINT');
    console.log('='.repeat(50));
    console.log('req.user exists:', !!req.user);
    console.log('req.userId exists:', !!req.userId);
    console.log('req.file exists:', !!req.file);
    console.log('req.body exists:', !!req.body);
    
    // ============================================
    // DEBUG: Log incoming data
    // ============================================
    console.log('\n═══════════════════════════════════════');
    console.log('📥 UPLOAD REQUEST RECEIVED');
    console.log('═══════════════════════════════════════');
    
    // Log file details
    if (req.file) {
      console.log('FILE INFO:');
      console.log(`  fieldname: ${req.file.fieldname}`);
      console.log(`  originalname: ${req.file.originalname}`);
      console.log(`  encoding: ${req.file.encoding}`);
      console.log(`  mimetype: ${req.file.mimetype}`);
      console.log(`  size: ${req.file.size} bytes`);
      console.log(`  path: ${req.file.path}`);
    } else {
      console.log('FILE INFO: req.file is UNDEFINED');
    }
    
    // Log FormData fields from req.body
    console.log('FORMDATA FIELDS (req.body):');
    console.log(`  title: ${req.body.title}`);
    console.log(`  description: ${req.body.description}`);
    console.log(`  category: ${req.body.category}`);
    console.log(`  (all keys: ${Object.keys(req.body).join(', ')})`);
    
    // Log authentication
    console.log('AUTHENTICATION:');
    console.log(`  req.userId: ${req.userId}`);
    console.log(`  req.user._id: ${req.user?._id}`);
    console.log('═══════════════════════════════════════\n');

    // ============================================
    // STEP 1: Validate file was received
    // ============================================
    if (!req.file) {
      console.error('❌ FILE NOT RECEIVED - req.file is undefined');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Ensure "file" field is present in FormData.',
        debug: 'req.file is undefined. Check frontend FormData key is "file"'
      });
    }

    console.log(`✅ File received: ${req.file.originalname} (${req.file.size} bytes)`);

    // ============================================
    // STEP 2: Validate authentication & CAPTURE userId
    // ============================================
    const userId = req.userId;
    const capturedUserId = userId ? userId.toString() : null; // Capture as string for callback
    
    if (!userId) {
      console.error('❌ AUTHENTICATION FAILED - userId is missing');
      console.error(`   req.userId: ${req.userId}`);
      console.error(`   req.user: ${req.user}`);
      console.error(`   req.user._id: ${req.user?._id}`);
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
        error: 'No userId in request'
      });
    }

    console.log(`✅ User authenticated`);
    console.log(`   Original userId: ${userId}`);
    console.log(`   userId type: ${typeof userId}`);
    console.log(`   Captured as string: ${capturedUserId}`);
    console.log(`   Is valid ObjectId: ${mongoose.Types.ObjectId.isValid(capturedUserId)}`);

    // ============================================
    // STEP 3: Validate Python script exists
    // ============================================
    const pythonScript = path.join(process.cwd(), 'glue_algorithm.py');
    const filePath = req.file.path;

    if (!fs.existsSync(pythonScript)) {
      console.error(`❌ ENCRYPTION ENGINE NOT FOUND at: ${pythonScript}`);
      return res.status(500).json({
        success: false,
        message: 'Encryption engine not found',
        error: `Script path: ${pythonScript}`
      });
    }

    console.log(`✅ Encryption engine found at: ${pythonScript}`);
    console.log(`   File to encrypt: ${filePath}`);

    // ============================================
    // STEP 4: Execute Python encryption
    // ============================================
    const command = `"${pythonExecutable}" "${pythonScript}" "${filePath}" "${capturedUserId}"`;
    console.log(`⚙️  Executing: ${command}`);
    console.log(`[CAPTURE] capturedUserId before exec: ${capturedUserId} (type: ${typeof capturedUserId})\n`);

    exec(command, { cwd: process.cwd() }, async (error, stdout, stderr) => {
      // Log userId at the start of the callback to ensure it's captured
      console.log(`[CALLBACK START] capturedUserId in callback: ${capturedUserId} (type: ${typeof capturedUserId})`);
      // Always cleanup temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Cleaned up temp file`);
      }

      // ========================================
      // Check for execution errors
      // ========================================
      if (error) {
        console.error(`❌ PYTHON EXECUTION FAILED`);
        console.error(`   Error: ${error.message}`);
        console.error(`   stderr: ${stderr}`);
        console.error(`   stdout: ${stdout}`);
        return res.status(500).json({
          success: false,
          message: 'Encryption engine failed',
          error: stderr || error.message,
          stdout: stdout.substring(0, 1000)
        });
      }

      console.log(`✅ Python execution completed`);
      console.log(`   Output length: ${stdout.length} chars\n`);

      try {
        // ========================================
        // STEP 5: Parse Python JSON response
        // ========================================
        const lines = stdout.split('\n');
        let result = null;

        console.log(`📊 Parsing output (${lines.length} lines)...`);

        // Search from end backwards for JSON
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line.length > 0 && line.startsWith('{')) {
            try {
              result = JSON.parse(line);
              console.log(`✅ JSON found at line ${i}`);
              break;
            } catch (e) {
              continue;
            }
          }
        }

        if (!result) {
          console.error(`❌ NO JSON FOUND IN PYTHON OUTPUT`);
          console.error(`Full output:\n${stdout}`);
          throw new Error('No valid JSON found in encryption response');
        }

        if (result.status !== 'success') {
          console.error(`❌ PYTHON RETURNED ERROR: ${result.message}`);
          throw new Error(result.message || 'Unknown encryption error');
        }

        console.log(`✅ Encryption successful`);
        console.log(`   Map file: ${result.map_file}`);
        console.log(`   Fragment count: ${result.fragment_count}`);

        // ========================================
        // STEP 6: Prepare data for MongoDB
        // ========================================
        const mapFileRelativePath = path.relative(process.cwd(), result.map_file);

        // Convert capturedUserId string back to ObjectId
        console.log(`\n🔍 DEBUGGING USER_ID CONVERSION:`);
        console.log(`   capturedUserId: ${capturedUserId}`);
        console.log(`   type: ${typeof capturedUserId}`);
        
        if (!capturedUserId) {
          throw new Error('CRITICAL: capturedUserId is null/undefined!');
        }

        if (!mongoose.Types.ObjectId.isValid(capturedUserId)) {
          throw new Error(`Invalid ObjectId format: ${capturedUserId}`);
        }

        const validUserId = new mongoose.Types.ObjectId(capturedUserId);
        
        console.log(`   Converted to ObjectId: ${validUserId}`);
        console.log(`   ObjectId instanceof check: ${validUserId instanceof mongoose.Types.ObjectId}`);
        console.log(`   Valid check: ${validUserId ? 'YES' : 'NO'}\n`);

        console.log(`📝 Preparing DigitalAsset record...`);
        console.log(`   user_id: ${validUserId} (type: ${typeof validUserId})`);
        console.log(`   asset_name: ${req.body.title || req.file.originalname}`);
        console.log(`   asset_type: ${req.body.category || 'Other'}`);
        console.log(`   file_path: ${mapFileRelativePath}`);

        // ========================================
        // STEP 7: Save to MongoDB
        // ========================================
        const newAsset = new DigitalAsset({
          user_id: validUserId,
          asset_name: req.body.title || req.file.originalname,
          asset_type: req.body.category || 'Other',
          description: req.body.description || '',
          status: 'LOCKED',
          file_path: mapFileRelativePath,
          encrypted: true,
          encryption_key_id: result.encryption_key_hash,
          version_count: 1,
          last_modified: new Date()
        });

        console.log(`✅ DigitalAsset object created`);
        console.log(`   user_id in object: ${newAsset.user_id} (type: ${typeof newAsset.user_id})`);

        try {
          await newAsset.save();
          console.log(`✅ Asset saved to MongoDB: ${newAsset._id}\n`);
        } catch (saveError) {
          console.error(`\n❌ MONGODB SAVE FAILED`);
          console.error(`   Error: ${saveError.message}`);
          console.error(`   Errors object:`, saveError.errors);
          console.error(`   At newAsset.user_id: ${newAsset.user_id}`);
          throw saveError;
        }

        // ========================================
        // SUCCESS RESPONSE
        // ========================================
        res.json({
          success: true,
          message: 'Asset encrypted & secured successfully',
          data: newAsset
        });

      } catch (parseError) {
        console.error(`❌ PROCESSING ERROR: ${parseError.message}`);
        console.error(`Full stdout:\n${stdout}`);
        res.status(500).json({
          success: false,
          message: `Failed to process encryption response: ${parseError.message}`,
          debug: stdout.substring(0, 500)
        });
      }
    });

  } catch (error) {
    console.error(`❌ SERVER ERROR: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default router;