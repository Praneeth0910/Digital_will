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
try:
    mechanic = ctypes.CDLL(lib_path)
    # Define C function signatures
    mechanic.encrypt_file.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_ubyte]
    mechanic.encrypt_file.restype = None
    mechanic.decrypt_file.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_ubyte]
    mechanic.decrypt_file.restype = None
    print(f"[OK] Loaded Security Library: {LIB_NAME}")
except OSError:
    print(f"[ERROR] Could not find {LIB_NAME}. Did you run the gcc command?")
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
    
    print(f"🔨 Calling C++ Splitter on {input_file}...")
    subprocess.run([SPLIT_EXE, input_file, str(depth), output_prefix], check=True)
    
    # Find the files Aditya created
    # Pattern must match Aditya's code: prefix + "_shard_"
    shards = glob.glob(f"{output_prefix}_shard_*.bin")
    return shards

def run_aditya_merge(shard_list, output_file):
    """Calls Aditya's C++ Merger"""
    if not shard_list:
        print("❌ Error: No shards to merge!")
        return

    # THE FIX: Aditya's C++ code needs the "Base Prefix", not the full filename.
    # We take the first file (e.g., "temp_confidential_txt_shard_000000.bin")
    # And strip everything after "_shard_" to get "temp_confidential_txt"
    first_shard = shard_list[0]
    
    if "_shard_" in first_shard:
        base_prefix = first_shard.split("_shard_")[0]
    else:
        print(f"⚠️ Warning: Filename format unexpected: {first_shard}")
        base_prefix = first_shard

    print(f"🔨 Calling C++ Merger with prefix: {base_prefix}")
    subprocess.run([MERGE_EXE, base_prefix, output_file], check=True)

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

    print(f"\n🚀 Encrypting {len(plain_shards)} shards...")

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
        print(f"   🔒 Secured: {shard} -> {fake_name}")

    return fragment_map

def secure_retrieve(fragment_map, output_filename, user_key):
    """
    1. DECRYPT (C) -> 2. MERGE (C++)
    """
    print(f"\n🔓 Retrieving file...")
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
    
    print("🔨 Calling C++ Merger...")
    subprocess.run([MERGE_EXE, base_prefix, output_filename], check=True)
    
    # Cleanup: Delete the temp shards
    for s in temp_shards:
        if os.path.exists(s):
            os.remove(s)
            
    print(f"✅ Success! File restored to: {output_filename}")

# --- 4. TEST DRIVER ---
if __name__ == "__main__":
    # Create a dummy PDF or Text file
    test_file = "confidential.txt"
    with open(test_file, "w") as f:
        f.write("This is the Digital Will secret content! " * 50)

    # 1. STORE
    my_map = secure_store(test_file, user_key=0xAA)
    
    # Save Map
    with open("master_map.json", "w") as f:
        json.dump(my_map, f, indent=4)
        
    # 2. RETRIEVE
    secure_retrieve(my_map, "restored_confidential.txt", user_key=0xAA)