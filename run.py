"""
Gunicorn entry point for Pomodoro Focus Zone
Usage: gunicorn run:app
"""
from app import app, socketio

# For Gunicorn
application = app

# For SocketIO with Gunicorn, we need to use the socketio.run method
# But for standard Gunicorn deployment, expose the app as 'application'
if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5000)
