"""
Pomodoro Focus Zone Backend
Flask server with WebSocket support for real-time attention tracking
"""

import os
import sys
import json
import asyncio
import threading
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import cv2
import numpy as np
from gaze_detector import GazeDetector, GazeState

# Add MediaPipe model path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'face_landmarker.task')

app = Flask(__name__)
app.config['SECRET_KEY'] = 'pomodoro-focus-zone-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables
detector = None
camera = None
attention_thread = None
is_running = False
session_data = {
    'start_time': None,
    'attention_breaks': [],
    'current_break_start': None,
    'total_focus_time': 0,
    'total_break_time': 0,
    'consecutive_away_frames': 0,
    'session_active': False
}

class AttentionTracker:
    def __init__(self):
        self.detector = None
        self.camera = None
        self.is_running = False
        
    def initialize(self):
        """Initialize the attention detector and camera"""
        try:
            self.detector = GazeDetector(
                look_away_threshold=0.25,
                yaw_threshold_deg=25.0,
                pitch_threshold_deg=25.0,
                smoothing_frames=5,
            )
            self.camera = cv2.VideoCapture(0)
            if not self.camera.isOpened():
                print("Error: Could not open webcam")
                return False
            return True
        except Exception as e:
            print(f"Error initializing attention tracker: {e}")
            return False
    
    def start_tracking(self):
        """Start the attention tracking thread"""
        # Initialize if not already done
        if not self.detector or not self.camera:
            if not self.initialize():
                return False
        
        self.is_running = True
        thread = threading.Thread(target=self._track_attention)
        thread.daemon = True
        thread.start()
        return True
    
    def stop_tracking(self):
        """Stop attention tracking"""
        self.is_running = False
        if self.camera:
            self.camera.release()
            self.camera = None
    
    def _track_attention(self):
        """Main attention tracking loop"""
        global session_data
        
        while self.is_running and self.camera:
            try:
                success, frame = self.camera.read()
                if not success:
                    break
                
                # Process frame for attention detection
                gaze = self.detector.process_frame(frame)
                is_looking_away = gaze.face_detected and not gaze.looking_at_screen
                
                # Update session data
                if session_data.get('session_active', False):
                    self._update_session_data(is_looking_away, gaze)
                
                # Emit attention status to frontend
                attention_data = {
                    'face_detected': gaze.face_detected,
                    'looking_at_screen': gaze.looking_at_screen,
                    'looking_away': is_looking_away,
                    'total_breaks': len(session_data.get('attention_breaks', [])),
                    'current_streak': self._get_current_streak(),
                    'focus_percentage': self._calculate_focus_percentage()
                }
                
                socketio.emit('attention_update', attention_data)
                
                # Small delay to prevent overwhelming client
                threading.Event().wait(0.1)
                
            except Exception as e:
                print(f"Error in attention tracking: {e}")
                break
    
    def _update_session_data(self, is_looking_away, gaze):
        """Update session data based on attention state"""
        global session_data
        
        current_time = datetime.now()
        
        if is_looking_away:
            if session_data.get('current_break_start') is None:
                session_data['current_break_start'] = current_time
            session_data['consecutive_away_frames'] += 1
            session_data['total_break_time'] = session_data.get('total_break_time', 0) + 0.1  # Approximate
        else:
            if session_data.get('current_break_start') is not None:
                # End current attention break
                end_time = current_time
                duration = (end_time - session_data['current_break_start']).total_seconds()
                
                attention_break = {
                    'start_time': session_data['current_break_start'].isoformat(),
                    'end_time': end_time.isoformat(),
                    'duration_seconds': duration
                }
                session_data.setdefault('attention_breaks', []).append(attention_break)
                session_data['current_break_start'] = None
            
            session_data['consecutive_away_frames'] = 0
            session_data['total_focus_time'] = session_data.get('total_focus_time', 0) + 0.1  # Approximate
    
    def _get_current_streak(self):
        """Get current attention streak in seconds"""
        if session_data.get('current_break_start'):
            return (datetime.now() - session_data['current_break_start']).total_seconds()
        return 0
    
    def _calculate_focus_percentage(self):
        """Calculate focus percentage"""
        total_time = session_data.get('total_focus_time', 0) + session_data.get('total_break_time', 0)
        if total_time > 0:
            return (session_data.get('total_focus_time', 0) / total_time) * 100
        return 0

# Initialize attention tracker
attention_tracker = AttentionTracker()

@app.route('/')
def index():
    """Main application page"""
    return render_template('index.html')

@app.route('/api/test-camera')
def test_camera():
    """Test camera initialization in backend"""
    try:
        # Initialize camera in backend
        temp_detector = GazeDetector(
            look_away_threshold=0.25,
            yaw_threshold_deg=25.0,
            pitch_threshold_deg=25.0,
            smoothing_frames=5,
        )
        temp_camera = cv2.VideoCapture(0)
        
        if temp_camera.isOpened():
            # Test if we can read a frame
            success, frame = temp_camera.read()
            temp_camera.release()
            
            if success:
                return jsonify({'success': True, 'message': 'Backend camera initialized successfully'})
            else:
                return jsonify({'success': False, 'message': 'Cannot read from camera'})
        else:
            return jsonify({'success': False, 'message': 'Camera not found or already in use'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Camera initialization failed: {str(e)}'})

@app.route('/api/start-session', methods=['POST'])
def start_session():
    """Start a new focus session"""
    global session_data
    
    data = request.get_json()
    
    # Reset session data
    session_data = {
        'start_time': datetime.now().isoformat(),
        'attention_breaks': [],
        'current_break_start': None,
        'total_focus_time': 0,
        'total_break_time': 0,
        'consecutive_away_frames': 0,
        'session_active': True,
        'focus_duration': data.get('focus_duration', 25),
        'break_duration': data.get('break_duration', 5),
        'sessions': data.get('sessions', 4)
    }
    
    # Start attention tracking
    success = attention_tracker.start_tracking()
    
    return jsonify({
        'success': success,
        'session_data': session_data
    })

@app.route('/api/end-session', methods=['POST'])
def end_session():
    """End current session and generate report"""
    global session_data
    
    try:
        # Stop tracking
        attention_tracker.stop_tracking()
        
        # Handle any ongoing break
        current_break = session_data.get('current_break_start')
        if current_break:
            end_time = datetime.now()
            
            # Parse the start time if it's a string
            if isinstance(current_break, str):
                try:
                    start_time = datetime.fromisoformat(current_break)
                except ValueError:
                    start_time = datetime.now()
            else:
                start_time = current_break
                
            duration = (end_time - start_time).total_seconds()
            
            attention_break = {
                'start_time': start_time.isoformat() if isinstance(start_time, datetime) else str(start_time),
                'end_time': end_time.isoformat(),
                'duration_seconds': max(0, duration)  # Ensure non-negative
            }
            session_data.setdefault('attention_breaks', []).append(attention_break)
            session_data['current_break_start'] = None
        
        session_data['session_active'] = False
        session_data['end_time'] = datetime.now().isoformat()
        
        # Calculate final statistics
        total_time = session_data.get('total_focus_time', 0) + session_data.get('total_break_time', 0)
        if total_time > 0:
            session_data['focus_percentage'] = (session_data.get('total_focus_time', 0) / total_time) * 100
        else:
            session_data['focus_percentage'] = 0
        
        return jsonify({
            'success': True,
            'session_data': session_data
        })
    except Exception as e:
        print(f"Error ending session: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error ending session: {str(e)}',
            'session_data': session_data
        })

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    """Generate PDF report for completed session"""
    data = request.get_json()
    
    # This will be implemented with a PDF generation library
    # For now, return the session data that can be used to generate a report
    return jsonify({
        'success': True,
        'report_data': data
    })

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print('Client connected')
    emit('status', {'message': 'Connected to Pomodoro Focus Zone'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print('Client disconnected')
    attention_tracker.stop_tracking()

@socketio.on('pause_session')
def handle_pause_session():
    """Handle session pause"""
    session_data['session_active'] = False
    emit('session_paused', {'success': True})

@socketio.on('resume_session')
def handle_resume_session():
    """Handle session resume"""
    session_data['session_active'] = True
    emit('session_resumed', {'success': True})

if __name__ == '__main__':
    print("Starting Pomodoro Focus Zone server...")
    print("Open http://localhost:5000 in your browser")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
