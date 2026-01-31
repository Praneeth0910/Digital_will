import time
import os
import json
from datetime import datetime, timedelta
from glue_algorithm import secure_retrieve
from email_service import send_nominee_alert

# CONFIGURATION
LAST_SEEN_FILE = "last_seen.txt"
FLAG_FILE = "retrieval_done.flag"
MAP_FILE = "master_map.json"
NOMINEE_EMAIL = "nominee@example.com"
GRACE_PERIOD_DAYS = 14 
# FOR DEMO: Set this to 0.001 days (approx 1 min) to show judges!
DEMO_GRACE_PERIOD_SECONDS = 30 

def update_heartbeat():
    """Call this when User Logs in"""
    with open(LAST_SEEN_FILE, "w") as f:
        f.write(datetime.now().isoformat())
    print("💓 Heartbeat Updated: User is Alive.")

def check_inactivity_and_trigger():
    # 1. Check if we already ran the protocol (Prevent Double-Send)
    if os.path.exists(FLAG_FILE):
        return {"status": "ALREADY_EXECUTED", "message": "Protocol already ran."}

    # 2. Read Last Seen
    if not os.path.exists(LAST_SEEN_FILE):
        return {"status": "NO_DATA", "message": "User hasn't logged in yet."}

    with open(LAST_SEEN_FILE, "r") as f:
        last_seen_str = f.read().strip()
    
    last_seen = datetime.fromisoformat(last_seen_str)
    time_diff = datetime.now() - last_seen
    
    # 3. Check Threshold (Using 30 seconds for Hackathon Demo)
    if time_diff.total_seconds() > DEMO_GRACE_PERIOD_SECONDS:
        print(f"💀 INACTIVITY DETECTED! ({time_diff.total_seconds()}s > {DEMO_GRACE_PERIOD_SECONDS}s)")
        return execute_protocol()
    else:
        remaining = DEMO_GRACE_PERIOD_SECONDS - time_diff.total_seconds()
        return {"status": "SAFE", "message": f"User is active. {remaining:.1f}s remaining."}

def execute_protocol():
    """
    The 'Trigger': Merges files and emails Nominee.
    """
    print("\n⚠️ STARTING RETRIEVAL PROTOCOL...")
    
    # 1. Load the Map of hidden files
    if not os.path.exists(MAP_FILE):
        return {"status": "ERROR", "message": "No files found to retrieve."}
        
    with open(MAP_FILE, "r") as f:
        fragment_map = json.load(f)

    # 2. TRIGGER THE MERGE (Using your existing glue_algorithm logic)
    # We retrieve it to a temporary location to verify it works
    restored_filename = "FINAL_ASSET_PACKAGE.zip" # Or .txt for demo
    
    try:
        # Calls C++ Merge.exe and C Decryptor internally
        secure_retrieve(fragment_map, restored_filename, user_key=0xAA)
        
        # 3. Send Email
        # In a real app, generate a secure link to this file
        download_link = f"http://localhost:8000/download/{restored_filename}"
        send_nominee_alert(NOMINEE_EMAIL, download_link, list(fragment_map.keys()))
        
        # 4. Set Flag (So we don't spam email)
        with open(FLAG_FILE, "w") as f:
            f.write(f"EXECUTED_AT_{datetime.now().isoformat()}")
            
        return {"status": "EXECUTED", "message": "Files merged & Nominee alerted."}
        
    except Exception as e:
        print(f"❌ Protocol Failed: {e}")
        return {"status": "ERROR", "message": str(e)}

# --- TEST DRIVER FOR DEMO ---
if __name__ == "__main__":
    # Simulate a check loop
    print("🕵️ Starting Dead Man's Switch Monitor...")
    while True:
        result = check_inactivity_and_trigger()
        print(f"Status: {result['status']} | {result['message']}")
        
        if result['status'] == "EXECUTED":
            break
            
        time.sleep(5) # Check every 5 seconds