from fastapi import FastAPI
from dead_mans_switch import update_heartbeat, check_inactivity_and_trigger

app = FastAPI()

@app.post("/user/ping")
def ping():
    """Frontend calls this periodically while user is active"""
    update_heartbeat()
    return {"status": "alive"}

@app.get("/system/status")
def get_system_status():
    """Check if the switch has been flipped"""
    return check_inactivity_and_trigger()