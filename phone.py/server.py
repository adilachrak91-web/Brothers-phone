#!/usr/bin/env python3
"""
بسيط HTTP Server لتشغيل تطبيق Brothers-Phone
Simple HTTP Server to run Brothers-Phone Application
"""

import http.server
import socketserver
import os
import webbrowser
import sys
from pathlib import Path

PORT = 8000
DIRECTORY = str(Path(__file__).parent)

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def log_message(self, format, *args):
        """تنسيق رسائل السجل"""
        print(f"[{self.log_date_time_string()}] {format % args}")

def start_server():
    """بدء خادم HTTP"""
    os.chdir(DIRECTORY)
    
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print("🚀 Brothers-Phone Web Server")
        print("=" * 60)
        print(f"📍 الخادم يعمل على: http://localhost:{PORT}")
        print(f"📁 المجلد: {DIRECTORY}")
        print("=" * 60)
        print("⌨️  اضغط Ctrl+C لإيقاف الخادم")
        print("=" * 60)
        
        # فتح المتصفح تلقائياً
        try:
            webbrowser.open(f'http://localhost:{PORT}')
            print("🌐 تم فتح المتصفح...")
        except:
            print(f"⚠️  لم يتمكن من فتح المتصفح تلقائياً، افتح يدوياً: http://localhost:{PORT}")
        
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 تم إيقاف الخادم")
            print("=" * 60)

if __name__ == "__main__":
    start_server()
