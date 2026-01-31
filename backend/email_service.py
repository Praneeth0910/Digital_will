import smtplib
from email.message import EmailMessage
import os

# CONFIG (Use Environment Variables in production)
SENDER_EMAIL = "your_email@gmail.com"
SENDER_PASS = "your_app_password" 

def send_nominee_alert(nominee_email, download_link, file_list):
    """
    Sends the 'Digital Will' notification to the nominee.
    """
    print(f"\n📧 SIMULATION: Sending Email to {nominee_email}...")
    print(f"   Subject: [URGENT] Digital Asset Retrieval Access")
    print(f"   Body: The user has been inactive. Click here to claim assets: {download_link}")
    print(f"   Files Ready: {file_list}")
    print("📧 SIMULATION: Email Sent Successfully.\n")

    # UNCOMMENT THIS TO ACTUALLY SEND EMAIL
    # msg = EmailMessage()
    # msg['Subject'] = "Digital Asset Retrieval Access"
    # msg['From'] = SENDER_EMAIL
    # msg['To'] = nominee_email
    # msg.set_content(f"Click here to retrieve files: {download_link}")
    # 
    # with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
    #     smtp.login(SENDER_EMAIL, SENDER_PASS)
    #     smtp.send_message(msg)