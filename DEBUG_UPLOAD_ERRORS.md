# Debugging Upload Errors - Step by Step Guide

## When You See "Failed to process engine response"

### Step 1: Check Browser Console

1. Open DevTools: `F12` or `Ctrl+Shift+I`
2. Go to **Console** tab
3. Try uploading a file
4. Look for error messages that say "Backend Response:"
5. **Copy the full response object**

**Example:**
```
Backend Response: {
  success: false,
  message: "...",
  error: "...",
  debug: "..."
}
```

### Step 2: Check Backend Logs

If you're running the backend server:

1. Look at the terminal where backend is running
2. Find the section with `[DEBUG]` messages
3. Look for any `[ERROR]` messages
4. Look for `--- Python Output ---` section

**Example of good output:**
```
[DEBUG] Total lines in output: 22
[DEBUG] Found potential JSON at line 20: {"status": "success"...
[DEBUG] Successfully parsed JSON at line 20
✅ Encryption successful for user user-123
```

**Example of bad output:**
```
[DEBUG] Total lines in output: 5
[DEBUG] Found potential JSON at line 0: /usr/bin/env: python: No such file...
```

### Step 3: Run the Diagnostic

```bash
cd backend
node diagnostic.js
```

This will check:
- ✅ Python is installed and accessible
- ✅ All required files exist (split.exe, merge.exe, mechanic.dll)
- ✅ Directories have correct permissions
- ✅ Python modules can be imported
- ✅ Test encryption works end-to-end

**If diagnostic passes but uploads still fail**, the issue is likely with:
1. Database connection (MongoDB)
2. Authentication token
3. File size limits

### Step 4: Check Common Issues

#### Issue 1: "Cannot find split.exe"
```
❌ Encryption Engine Failed
error: "split.exe not found at ..."
```

**Solution:**
```bash
cd backend
ls split.exe
# If not found, recompile or copy from build folder
```

#### Issue 2: "Cannot load mechanic.dll"
```
❌ Encryption Engine Failed
error: "Could not load mechanic.dll"
```

**Solution:**
```bash
cd backend
ls mechanic.dll
# Windows: Visual C++ Redistributable may be needed
# Check if you have VC++ runtime installed
```

#### Issue 3: "No shards created"
```
❌ Encryption Engine Failed
error: "No shards created"
```

**Solution:**
- Run `node diagnostic.js` to test encryption independently
- Check if split.exe is working properly
- Check file permissions in backend directory

#### Issue 4: "Failed to process engine response" (No detail)
```
❌ Upload Failed: Failed to process engine response
```

This means:
1. Python executed but didn't return valid JSON
2. MongoDB save failed
3. Path resolution failed

**Debug Steps:**
1. Check browser console for full error response
2. Run test-backend-flow.js to simulate the upload
3. Check backend logs for `[DEBUG]` messages

#### Issue 5: "Authentication token not found"
```
❌ Upload Failed: Authentication token not found
```

**Solution:**
- Log out and log back in
- Clear localStorage: `localStorage.clear()` in console
- Try uploading again

### Step 5: Run Backend Flow Test

Simulates exactly what happens during an upload:

```bash
cd backend
node test-backend-flow.js
```

This will:
1. Create a test file in uploads_temp/
2. Run glue_algorithm.py exactly like the backend does
3. Parse the response using the same logic
4. Show you exactly what's happening

**Expected output:**
```
✅ SUCCESS! Parsing worked!

Final Result:
{
  "status": "success",
  "message": "File encrypted and secured",
  "map_file": "...",
  "fragment_count": 1,
  "user_id": "user-123",
  "encryption_key_hash": "0x82"
}
```

### Step 6: Check MongoDB Connection

If encryption works but you still get "Failed to process engine response":

```bash
# Check if MongoDB is running (depends on your setup)
# Common errors:
# - "ECONNREFUSED" - MongoDB isn't running
# - "Authentication failed" - Wrong credentials
# - "Database not found" - Database doesn't exist

# Backend should show connection errors in logs
```

## Collecting Information for Support

If you still can't resolve it, collect this information:

1. **Browser Console Error:**
   - Paste the full "Backend Response" object

2. **Backend Logs:**
   - Paste the `[DEBUG]` section from backend terminal
   - Paste any `[ERROR]` messages

3. **Diagnostic Results:**
   - Run `node diagnostic.js` and paste the output

4. **Test Result:**
   - Run `node test-backend-flow.js` and paste the result

5. **File Details:**
   - What size file are you uploading?
   - What format (PDF, TXT, ZIP, etc)?

## Quick Fixes

### Most Common Issues:

1. **Reset Everything:**
   ```bash
   # Clear temp and storage
   rm -rf backend/uploads_temp/*
   rm -rf backend/secure_storage/*
   
   # Reload backend
   npm run dev
   
   # Try uploading again
   ```

2. **Python Issues:**
   ```bash
   # Verify Python works
   A:\PROJECTS\DigitalWill\Digital_will_clone_gitrepo\.venv\Scripts\python.exe --version
   ```

3. **Database Issues:**
   ```bash
   # Check MongoDB connection in backend logs
   # Look for "mongoose" or "MongoDB" messages
   ```

4. **File Permissions:**
   ```bash
   # Make sure backend folder is writable
   # Windows: Check folder properties > Security
   ```

## Still Having Issues?

1. Run `diagnostic.js` - captures all system info
2. Run `test-backend-flow.js` - tests encryption directly
3. Check browser console - shows actual API response
4. Check backend terminal - shows Python output
5. Share all outputs - helps identify root cause

---

**Remember:** The error "Failed to process engine response" is generic. The actual error is in:
- Browser Console → "Backend Response" object
- Backend Terminal → `[DEBUG]` and `[ERROR]` messages
- test-backend-flow.js → Shows what should happen

Check these locations to find the real issue!
