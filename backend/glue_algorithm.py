import ctypes
import os
import json
import subprocess
import glob
import random
import string
import sys

# --- CONFIGURATION ---
SPLIT_EXE = "split.exe"
MERGE_EXE = "merge.exe"
LIB_NAME = "mechanic.dll" if os.name == 'nt' else "libmechanic.so"

# --- 1. LOAD RANDHIR'S C LIBRARY ---
lib_path = os.path.abspath(LIB_NAME)
print(f"[INIT] Loading library from: {lib_path}")
print(f"[INIT] Library exists: {os.path.exists(lib_path)}")

try:
    mechanic = ctypes.CDLL(lib_path)
    # Define C function signatures
    mechanic.encrypt_file.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_ubyte]
    mechanic.encrypt_file.restype = None
    mechanic.decrypt_file.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_ubyte]
    mechanic.decrypt_file.restype = None
    print(f"[OK] Loaded Security Library: {LIB_NAME}")
except OSError as e:
    print(f"[ERROR] Could not load {LIB_NAME}. Did you compile the C library?")
    print(f"[ERROR] Details: {e}")
    exit()

# --- 2. HELPER FUNCTIONS ---

def generate_random_filename():
    """Generates a boring system filename"""
    chars = string.ascii_letters + string.digits
    random_str = ''.join(random.choice(chars) for _ in range(8))
    return f"sys_{random_str}.dat"

def run_aditya_split(input_file, depth=1):
    """Calls Aditya's C++ Splitter"""
    base_name = os.path.basename(input_file).replace(".", "_")
    output_prefix = f"temp_{base_name}"
    
    print(f"[SPLIT] Calling C++ Splitter on {input_file}...")
    print(f"[SPLIT] Output prefix: {output_prefix}")
    print(f"[SPLIT] Current working directory: {os.getcwd()}")
    
    # Find the EXE in the same directory as this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    split_exe_path = os.path.join(script_dir, SPLIT_EXE)
    
    if not os.path.exists(split_exe_path):
        raise FileNotFoundError(f"split.exe not found at {split_exe_path}")
    
    print(f"[SPLIT] Using split.exe from: {split_exe_path}")
    
    try:
        subprocess.run([split_exe_path, input_file, str(depth), output_prefix], check=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"split.exe failed: {e}")
    except FileNotFoundError as e:
        raise RuntimeError(f"split.exe not found: {e}")
    
    # Find the files Aditya created
    # Pattern must match Aditya's code: prefix + "_shard_"
    shards = glob.glob(f"{output_prefix}_shard_*.bin")
    print(f"[SPLIT] Found {len(shards)} shards")
    if not shards:
        raise RuntimeError(f"No shards created by split.exe. Files matching {output_prefix}_shard_*.bin not found")
    return shards

def run_aditya_merge(shard_list, output_file):
    """Calls Aditya's C++ Merger"""
    if not shard_list:
        print("[ERROR] No shards to merge!")
        return

    # THE FIX: Aditya's C++ code needs the "Base Prefix", not the full filename.
    # We take the first file (e.g., "temp_confidential_txt_shard_000000.bin")
    # And strip everything after "_shard_" to get "temp_confidential_txt"
    first_shard = shard_list[0]
    
    if "_shard_" in first_shard:
        base_prefix = first_shard.split("_shard_")[0]
    else:
        print(f"[WARN] Filename format unexpected: {first_shard}")
        base_prefix = first_shard

    print(f"[MERGE] Calling C++ Merger with prefix: {base_prefix}")
    
    # Find the EXE in the same directory as this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    merge_exe_path = os.path.join(script_dir, MERGE_EXE)
    
    if not os.path.exists(merge_exe_path):
        raise FileNotFoundError(f"merge.exe not found at {merge_exe_path}")
    
    print(f"[MERGE] Using merge.exe from: {merge_exe_path}")
    
    try:
        subprocess.run([merge_exe_path, base_prefix, output_file], check=True)
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"merge.exe failed: {e}")
    except FileNotFoundError as e:
        raise RuntimeError(f"merge.exe not found: {e}")

# --- 3. CORE ALGORITHMS ---

def secure_store(input_file_path, user_key):
    """
    1. SPLIT (C++) -> 2. ENCRYPT (C) -> 3. HIDE (Python)
    """
    # Step 1: Split the file
    plain_shards = run_aditya_split(input_file_path, depth=1) # Depth 1 = 3 shards
    
    fragment_map = {}
    storage_dir = "secure_storage"
    os.makedirs(storage_dir, exist_ok=True)

    print(f"\n[ENCRYPT] Encrypting {len(plain_shards)} shards...")

    for shard in plain_shards:
        # Generate secret location
        fake_name = generate_random_filename()
        encrypted_path = os.path.join(storage_dir, fake_name)
        
        # Step 2: Encrypt (Using Randhir's DLL)
        mechanic.encrypt_file(
            shard.encode('utf-8'), 
            encrypted_path.encode('utf-8'), 
            user_key
        )
        
        # Add to Map: { "Real Name of Shard": "Hidden Location" }
        fragment_map[os.path.basename(shard)] = encrypted_path
        
        # Step 3: Cleanup Evidence (Delete the plain shard)
        os.remove(shard)
        print(f"   [SECURE] Secured: {shard} -> {fake_name}")

    return fragment_map

def secure_retrieve(fragment_map, output_filename, user_key):
    """
    1. DECRYPT (C) -> 2. MERGE (C++)
    """
    print(f"\n[RETRIEVE] Retrieving file...")
    temp_shards = []
    
    # Step 1: Decrypt all pieces
    for original_name, hidden_path in fragment_map.items():
        # We restore them to their original shard names so Aditya's code recognizes them
        restored_path = original_name 
        
        mechanic.decrypt_file(
            hidden_path.encode('utf-8'), 
            restored_path.encode('utf-8'), 
            user_key
        )
        temp_shards.append(restored_path)
    
    # Step 2: Merge (Using Aditya's EXE)
    # We pass the prefix of the first shard because Aditya's code discovers by prefix
    first_shard = temp_shards[0]
    if "_shard_" in first_shard:
        base_prefix = first_shard.split("_shard_")[0]
    else:
        base_prefix = first_shard
    
    print("[MERGE] Calling C++ Merger...")
    subprocess.run([MERGE_EXE, base_prefix, output_filename], check=True)
    
    # Cleanup: Delete the temp shards
    for s in temp_shards:
        if os.path.exists(s):
            os.remove(s)
            
    print(f"[OK] Success! File restored to: {output_filename}")

# --- 4. BACKEND HANDLER ---
if __name__ == "__main__":
    try:
        # Called from Node.js backend as: python glue_algorithm.py [input_file] [user_id]
        if len(sys.argv) < 3:
            print(json.dumps({"status": "error", "message": "Missing arguments: input_file and user_id required"}))
            sys.exit(1)
        
        input_file = sys.argv[1]
        user_id = sys.argv[2]
        
        # Convert to absolute paths to handle working directory issues
        input_file = os.path.abspath(input_file)
        backend_dir = os.path.dirname(input_file)  # uploads_temp/ directory
        
        # Validate input file exists
        if not os.path.exists(input_file):
            print(json.dumps({"status": "error", "message": f"Input file not found: {input_file}"}))
            sys.exit(1)
        
        print(f"[INPUT] Processing file: {input_file} for user: {user_id}")
        print(f"[WORKDIR] Backend directory: {backend_dir}")
        
        # Generate user-specific encryption key from user_id
        # This ensures each user's files are encrypted differently
        user_key = sum(ord(c) for c in str(user_id)) % 256
        if user_key == 0:
            user_key = 0xAA  # Fallback if hash results in 0
        
        print(f"[KEY] Using encryption key: 0x{user_key:02X}")
        
        # 1. STORE: Split -> Encrypt -> Hide
        print("[START] Starting encryption process...")
        fragment_map = secure_store(input_file, user_key=user_key)
        
        # 2. Save Fragment Map (metadata for retrieval)
        # Store in backend/secure_storage/ directory
        secure_storage_dir = os.path.join(backend_dir, "..", "secure_storage")
        secure_storage_dir = os.path.abspath(secure_storage_dir)
        
        map_filename = f"map_{user_id}_{int(os.path.getmtime(input_file))}.json"
        map_filepath = os.path.join(secure_storage_dir, map_filename)
        
        os.makedirs(secure_storage_dir, exist_ok=True)
        with open(map_filepath, "w") as f:
            json.dump(fragment_map, f, indent=4)
        
        print(f"[OK] Fragment map saved to: {map_filepath}")
        
        # 3. Output result as JSON (this is what Node.js backend expects)
        result = {
            "status": "success",
            "message": "File encrypted and secured",
            "map_file": map_filepath,
            "fragment_count": len(fragment_map),
            "user_id": user_id,
            "encryption_key_hash": f"0x{user_key:02X}"
        }
        
        # Print JSON on final line for parsing
        print(json.dumps(result))
        
    except Exception as e:
        import traceback
        error_result = {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result))
        sys.exit(1)