# Pomodoro Focus Zone

A comprehensive Pomodoro study web application that combines traditional time management with real-time attention span tracking, ambient music, and detailed PDF reporting.

## Features

### 🎯 Core Functionality
- **Fully Customizable Pomodoro Sessions**: Set your own focus and break durations
- **Real-time Attention Tracking**: Uses webcam and MediaPipe to monitor focus levels
- **Live Statistics**: See attention percentage, break count, and current streak
- **Session Management**: Start, pause, resume, and skip sessions

### 🎵 Audio Features
- **Ambient Music Integration**: Multiple music sources (Lo-Fi, Nature, Classical, Ambient)
- **Automatic Looping**: Seamless playback throughout extended sessions
- **Volume Controls**: Mute/unmute and volume adjustment
- **Multiple Sources**: Choose from different ambient music styles

### 📊 Reporting & Analytics
- **Comprehensive Session Reports**: Detailed analysis of focus patterns
- **Attention Break Tracking**: Log every distraction with timestamps
- **Performance Insights**: Personalized recommendations based on your data
- **PDF Export**: Download detailed reports for each session

### 🎨 User Interface
- **Studious Design**: Clean, calming interface optimized for focus
- **Real-time Feedback**: Visual indicators for attention status
- **Responsive Layout**: Works on desktop and tablet devices
- **Focus Mode**: Immersive environment during sessions

## Quick Start

### Prerequisites
- Python 3.8 or higher
- Webcam for attention tracking
- Modern web browser with JavaScript enabled

### Installation

1. **Clone and Navigate to Project**
   ```bash
   cd pomodoro-webapp
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the Application**
   ```bash
   python app.py
   ```

4. **Open in Browser**
   Navigate to `http://localhost:5000`

### First Time Setup

1. **Test Camera**: Click "Test Camera" to verify webcam access
2. **Configure Session**: Set focus duration, break time, and number of sessions
3. **Choose Music**: Select your preferred ambient music style
4. **Start Session**: Click "Start Focus Session" to begin

## Usage Guide

### Session Configuration
- **Focus Duration**: 1-180 minutes (default: 25)
- **Break Duration**: 1-30 minutes (default: 5)
- **Number of Sessions**: 1-10 sessions (default: 4)
- **Background Music**: Choose from Lo-Fi, Nature, Classical, Ambient, or None

### During Sessions
- **Real-time Monitoring**: See your attention status live
- **Session Controls**: Pause, skip, or end sessions anytime
- **Audio Controls**: Adjust volume or mute music
- **Live Statistics**: Track focus percentage and break count

### After Sessions
- **Session Summary**: View comprehensive statistics
- **Download Report**: Get detailed PDF analysis
- **Start New Session**: Begin another focus session

## Attention Tracking

The application uses advanced computer vision to track your attention:

### How It Works
1. **Webcam Capture**: Your camera feed is processed locally
2. **Face Detection**: MediaPipe identifies facial landmarks
3. **Head Pose Analysis**: Determines if you're looking at the screen
4. **Real-time Feedback**: Updates attention status instantly

### Privacy & Security
- **Local Processing**: All video processing happens on your computer
- **No Cloud Storage**: Video never leaves your device
- **Session Data Only**: Only attention metrics are stored temporarily

### Attention States
- **🟢 FOCUSED**: Looking at the screen, maintaining attention
- **🔴 DISTRACTED**: Looking away from the screen
- **🟡 NO FACE**: Face not detected by camera

## Report Features

### Session Overview
- Start and end times
- Total duration and attention percentage
- Focus vs. break time analysis

### Detailed Analytics
- Focus zone analysis with durations
- Attention break patterns
- Timeline of all focus/distraction events

### Performance Insights
- Personalized recommendations
- Attention level assessment
- Improvement suggestions

## Technical Architecture

### Backend
- **Flask**: Web framework for the application server
- **Flask-SocketIO**: Real-time WebSocket communication
- **MediaPipe**: Face detection and attention analysis
- **OpenCV**: Camera capture and image processing

### Frontend
- **HTML5/CSS3**: Modern, responsive interface
- **JavaScript**: Session management and real-time updates
- **WebSocket Client**: Live attention status updates

### Data Flow
1. Camera feed → MediaPipe → Attention analysis
2. WebSocket → Real-time status updates
3. Session data → Report generation

## Troubleshooting

### Camera Issues
- **Permission Denied**: Grant camera permissions in your browser
- **Camera Not Found**: Check if webcam is connected and not in use
- **Poor Detection**: Ensure good lighting and face is visible

### Audio Issues
- **No Sound**: Check browser audio permissions and volume
- **Loading Issues**: Try refreshing or selecting a different music source
- **Playback Errors**: Network issues may affect streaming

### Performance Issues
- **High CPU Usage**: Close other applications using camera
- **Laggy Interface**: Restart browser or clear cache
- **Memory Issues**: Reduce session length or break frequency

## Browser Compatibility

### Recommended Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- WebRTC (for camera access)
- WebSocket support
- JavaScript ES6+

## Configuration Options

### Environment Variables
```bash
# Set server port (default: 5000)
export PORT=5000

# Enable debug mode
export FLASK_DEBUG=1
```

### Customization
- **Attention Sensitivity**: Adjust in `gaze_detector.py`
- **UI Colors**: Modify CSS variables in `style.css`
- **Report Format**: Edit `report.js` templates

## Contributing

### Development Setup
1. Install dependencies
2. Run development server: `python app.py`
3. Open browser to `http://localhost:5000`

### Code Structure
- `app.py`: Flask server and WebSocket handling
- `gaze_detector.py`: Attention detection logic
- `static/css/`: Stylesheets and UI
- `static/js/`: Frontend JavaScript
- `templates/`: HTML templates

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or feature requests:
1. Check the troubleshooting section
2. Review browser requirements
3. Verify camera and audio permissions
4. Test with different configurations

---

**Stay focused, stay productive 🎯**
