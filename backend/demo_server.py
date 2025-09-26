#!/usr/bin/env python3
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse as urlparse

class SimpleAPIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        if self.path == '/api/health':
            response = {'status': 'OK', 'message': 'OET Backend API is running', 'version': '1.0.0'}
        elif self.path == '/api/scenarios':
            response = {
                'data': [
                    {
                        'id': '1', 
                        'title': 'Patient Consultation', 
                        'description': 'Practice general patient consultation skills',
                        'duration': 15,
                        'difficulty': 'intermediate'
                    },
                    {
                        'id': '2', 
                        'title': 'Medical History', 
                        'description': 'Taking comprehensive medical history',
                        'duration': 20,
                        'difficulty': 'beginner'
                    },
                    {
                        'id': '3', 
                        'title': 'Emergency Response', 
                        'description': 'Handle emergency medical situations',
                        'duration': 25,
                        'difficulty': 'advanced'
                    }
                ]
            }
        elif self.path == '/api/auth/status':
            response = {'authenticated': True, 'user': {'id': 'demo-user', 'email': 'demo@oet.com'}}
        else:
            response = {'error': 'Endpoint not found', 'available_endpoints': ['/api/health', '/api/scenarios', '/api/auth/status']}
        
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length']) if 'Content-Length' in self.headers else 0
        post_data = self.rfile.read(content_length) if content_length > 0 else b''
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        # Handle registration endpoint
        if self.path == '/v1/auth/register':
            try:
                user_data = json.loads(post_data.decode()) if post_data else {}
                response = {
                    'success': True,
                    'message': 'User registered successfully',
                    'user': {
                        'id': 'demo-user-123',
                        'email': user_data.get('email', 'demo@oet.com'),
                        'name': user_data.get('name', 'Demo User'),
                        'role': user_data.get('role', 'doctor'),
                        'profession': user_data.get('profession', 'doctor'),
                        'created_at': '2025-09-26T17:00:00Z'
                    },
                    'token': 'demo-jwt-token-12345',
                    'refreshToken': 'demo-refresh-token-67890'
                }
            except json.JSONDecodeError:
                response = {'error': 'Invalid JSON data'}
        # Handle login endpoint
        elif self.path == '/v1/auth/login':
            try:
                user_data = json.loads(post_data.decode()) if post_data else {}
                response = {
                    'success': True,
                    'message': 'Login successful',
                    'user': {
                        'id': 'demo-user-123',
                        'email': user_data.get('email', 'demo@oet.com'),
                        'name': 'Demo User',
                        'role': 'doctor',
                        'profession': 'doctor'
                    },
                    'token': 'demo-jwt-token-12345',
                    'refreshToken': 'demo-refresh-token-67890'
                }
            except json.JSONDecodeError:
                response = {'error': 'Invalid JSON data'}
        else:
            response = {
                'message': 'Request processed successfully', 
                'received_data_size': len(post_data),
                'endpoint': self.path,
                'method': 'POST'
            }
        
        self.wfile.write(json.dumps(response, indent=2).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def log_message(self, format, *args):
        print(f"[API] {format % args}")

if __name__ == "__main__":
    server = HTTPServer(('0.0.0.0', 8000), SimpleAPIHandler)
    print("=" * 50)
    print("OET Demo Backend API Server")
    print("=" * 50)
    print(f"Server running on: http://0.0.0.0:8000")
    print(f"Health check: http://localhost:8000/api/health")
    print(f"Scenarios: http://localhost:8000/api/scenarios")
    print(f"Auth status: http://localhost:8000/api/auth/status")
    print("=" * 50)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.shutdown()