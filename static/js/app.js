/**
 * Pomodoro Focus Zone - Main Application JavaScript
 * Handles session management, timer, and real-time attention tracking
 */

class PomodoroApp {
    constructor() {
        this.socket = null;
        this.sessionData = {
            isActive: false,
            isPaused: false,
            currentTime: 0,
            totalTime: 0,
            sessionType: 'focus', // 'focus' or 'break'
            currentSession: 1,
            totalSessions: 4,
            focusDuration: 25,
            breakDuration: 5,
            attentionBreaks: 0,
            focusPercentage: 0,
            currentStreak: 0
        };
        
        this.timerInterval = null;
        this.cameraStream = null;
        this.audioController = null;
        
        this.initializeElements();
        this.bindEvents();
        this.initializeWebSocket();
    }
    
    initializeElements() {
        // Panel elements
        this.setupPanel = document.getElementById('setup-panel');
        this.sessionPanel = document.getElementById('session-panel');
        this.completePanel = document.getElementById('complete-panel');
        
        // Setup elements
        this.focusTimeInput = document.getElementById('focus-time');
        this.breakTimeInput = document.getElementById('break-time');
        this.sessionsInput = document.getElementById('sessions');
        this.audioSourceSelect = document.getElementById('audio-source');
        this.startSessionBtn = document.getElementById('start-session');
        this.testBackendBtn = document.getElementById('test-backend');
        this.backendCameraStatus = document.getElementById('backend-camera-status');
        this.backendCameraMessage = document.getElementById('backend-camera-message');
        
        // Session elements
        this.sessionTypeText = document.getElementById('session-type');
        this.currentSessionText = document.getElementById('current-session');
        this.sessionTimeText = document.getElementById('session-time');
        this.timerDisplay = document.getElementById('timer');
        this.realTimeAttention = document.getElementById('real-time-attention');
        this.focusPercentageText = document.getElementById('focus-percentage');
        this.totalBreaksText = document.getElementById('total-breaks');
        this.currentStreakText = document.getElementById('current-streak');
        
        // Control buttons
        this.pauseBtn = document.getElementById('pause-session');
        this.skipBtn = document.getElementById('skip-session');
        this.endSessionBtn = document.getElementById('end-session');
        this.downloadReportBtn = document.getElementById('download-report');
        this.startNewBtn = document.getElementById('start-new');
        
        // Progress ring
        this.progressRing = document.querySelector('.progress-ring-progress');
        this.progressRingRadius = 90;
        this.progressRingCircumference = 2 * Math.PI * this.progressRingRadius;
        this.progressRing.style.strokeDasharray = `${this.progressRingCircumference} ${this.progressRingCircumference}`;
        this.progressRing.style.strokeDashoffset = this.progressRingCircumference;
    }
    
    bindEvents() {
        // Setup events
        this.startSessionBtn.addEventListener('click', () => this.startSession());
        this.testBackendBtn.addEventListener('click', () => this.testBackendCamera());
        
        // Session control events
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.skipBtn.addEventListener('click', () => this.skipSession());
        this.endSessionBtn.addEventListener('click', () => this.endSession());
        
        // Completion events
        this.downloadReportBtn.addEventListener('click', () => this.downloadReport());
        this.startNewBtn.addEventListener('click', () => this.resetToSetup());
        
        // Input validation
        [this.focusTimeInput, this.breakTimeInput, this.sessionsInput].forEach(input => {
            input.addEventListener('input', () => this.validateInputs());
        });
    }
    
    initializeWebSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateAttentionStatus('connected', 'Connected');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateAttentionStatus('disconnected', 'Disconnected');
        });
        
        this.socket.on('attention_update', (data) => {
            this.updateAttentionStatus(data);
        });
        
        this.socket.on('session_paused', () => {
            this.sessionData.isPaused = true;
            this.pauseBtn.textContent = 'Resume';
        });
        
        this.socket.on('session_resumed', () => {
            this.sessionData.isPaused = false;
            this.pauseBtn.textContent = 'Pause';
        });
    }
    
    async testBackendCamera() {
        try {
            this.backendCameraStatus.textContent = 'TESTING...';
            this.backendCameraStatus.className = 'status-badge waiting';
            this.backendCameraMessage.textContent = 'Testing backend camera access...';
            
            const response = await fetch('/api/test-camera');
            const data = await response.json();
            
            if (data.success) {
                this.backendCameraStatus.textContent = 'BACKEND READY';
                this.backendCameraStatus.className = 'status-badge attentive';
                this.backendCameraMessage.textContent = data.message;
                this.testBackendBtn.textContent = 'Backend Ready';
                this.testBackendBtn.classList.add('btn-success');
                this.showNotification('Backend camera access successful!', 'success');
            } else {
                this.backendCameraStatus.textContent = 'BACKEND ERROR';
                this.backendCameraStatus.className = 'status-badge distracted';
                this.backendCameraMessage.textContent = data.message;
                this.testBackendBtn.textContent = 'Camera Error';
                this.testBackendBtn.classList.add('btn-danger');
                this.showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Backend camera test error:', error);
            this.backendCameraStatus.textContent = 'BACKEND ERROR';
            this.backendCameraStatus.className = 'status-badge distracted';
            this.backendCameraMessage.textContent = 'Failed to connect to backend';
            this.testBackendBtn.textContent = 'Connection Error';
            this.testBackendBtn.classList.add('btn-danger');
            this.showNotification('Failed to connect to backend camera', 'error');
        }
    }
    
    async startCameraPreview() {
        try {
            // Request camera permissions with better constraints
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                } 
            });
            
            this.webcamVideo.srcObject = this.cameraStream;
            this.webcamPlaceholder.style.display = 'none';
            this.webcamVideo.style.display = 'block';
            
            // Update button state
            this.testCameraBtn.textContent = 'Camera Ready';
            this.testCameraBtn.classList.add('btn-success');
            
            this.showNotification('Camera access granted successfully!', 'success');
            
        } catch (error) {
            console.error('Camera preview error:', error);
            
            // Handle specific permission errors
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                this.showNotification('Camera permission denied. Please allow camera access to use attention tracking.', 'error');
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                this.showNotification('No camera found. Please connect a camera and refresh.', 'error');
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                this.showNotification('Camera is already in use by another application.', 'error');
            } else {
                this.showNotification('Unable to access camera. Please check permissions and try again.', 'error');
            }
            
            // Update button state
            this.testCameraBtn.textContent = 'Camera Error';
            this.testCameraBtn.classList.add('btn-danger');
        }
    }
    
    stopCameraPreview() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
    }
    
    validateInputs() {
        const focusTime = parseInt(this.focusTimeInput.value);
        const breakTime = parseInt(this.breakTimeInput.value);
        const sessions = parseInt(this.sessionsInput.value);
        
        const isValid = focusTime > 0 && focusTime <= 180 && 
                       breakTime > 0 && breakTime <= 30 && 
                       sessions > 0 && sessions <= 10;
        
        this.startSessionBtn.disabled = !isValid;
        return isValid;
    }
    
    async startSession() {
        if (!this.validateInputs()) {
            this.showNotification('Please enter valid session parameters', 'error');
            return;
        }
        
        // Get session configuration
        this.sessionData.focusDuration = parseInt(this.focusTimeInput.value);
        this.sessionData.breakDuration = parseInt(this.breakTimeInput.value);
        this.sessionData.totalSessions = parseInt(this.sessionsInput.value);
        this.sessionData.currentSession = 1;
        this.sessionData.sessionType = 'focus';
        this.sessionData.totalTime = this.sessionData.focusDuration * 60;
        this.sessionData.currentTime = this.sessionData.totalTime;
        
        try {
            const response = await fetch('/api/start-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    focus_duration: this.sessionData.focusDuration,
                    break_duration: this.sessionData.breakDuration,
                    sessions: this.sessionData.totalSessions
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.sessionData.isActive = true;
                this.switchToSessionPanel();
                this.startTimer();
                this.initializeAudio();
                
                // Update backend status
                this.backendCameraStatus.textContent = 'TRACKING';
                this.backendCameraStatus.className = 'status-badge attentive';
                this.backendCameraMessage.textContent = 'Attention tracking active';
                
                // Add focus mode class
                document.body.classList.add('focus-mode');
            } else {
                this.showNotification('Failed to start session', 'error');
            }
        } catch (error) {
            console.error('Start session error:', error);
            this.showNotification('Failed to start session', 'error');
        }
    }
    
    switchToSessionPanel() {
        this.setupPanel.classList.remove('active');
        this.sessionPanel.classList.add('active');
        this.updateSessionDisplay();
    }
    
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (!this.sessionData.isPaused && this.sessionData.currentTime > 0) {
                this.sessionData.currentTime--;
                this.updateTimerDisplay();
                this.updateProgressRing();
                
                // Check for session completion
                if (this.sessionData.currentTime === 0) {
                    this.completeCurrentSession();
                }
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.sessionData.currentTime / 60);
        const seconds = this.sessionData.currentTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.timerDisplay.textContent = timeString;
        this.sessionTimeText.textContent = timeString;
    }
    
    updateProgressRing() {
        const progress = this.sessionData.currentTime / this.sessionData.totalTime;
        const offset = this.progressRingCircumference - (progress * this.progressRingCircumference);
        this.progressRing.style.strokeDashoffset = offset;
    }
    
    updateSessionDisplay() {
        const sessionTypeText = this.sessionData.sessionType === 'focus' ? 'Focus Time' : 'Break Time';
        this.sessionTypeText.textContent = sessionTypeText;
        this.currentSessionText.textContent = `Session ${this.sessionData.currentSession} of ${this.sessionData.totalSessions}`;
        
        // Update session type styling
        if (this.sessionData.sessionType === 'break') {
            this.sessionPanel.classList.add('break-mode');
        } else {
            this.sessionPanel.classList.remove('break-mode');
        }
    }
    
    updateAttentionStatus(data) {
        let statusClass = 'waiting';
        let statusText = 'WAITING';
        
        if (data.face_detected) {
            if (data.looking_at_screen) {
                statusClass = 'attentive';
                statusText = 'FOCUSED';
            } else {
                statusClass = 'distracted';
                statusText = 'DISTRACTED';
            }
        } else {
            statusClass = 'waiting';
            statusText = 'NO FACE';
        }
        
        // Update attention badge
        this.realTimeAttention.className = `attention-badge ${statusClass}`;
        this.realTimeAttention.textContent = statusText;
        
        // Update stats
        this.focusPercentageText.textContent = `${Math.round(data.focus_percentage || 0)}%`;
        this.totalBreaksText.textContent = data.total_breaks || 0;
        this.currentStreakText.textContent = `${Math.round(data.current_streak || 0)}s`;
        
        // Update header attention status
        const headerStatus = document.getElementById('attention-status');
        headerStatus.className = `status-badge ${statusClass}`;
        headerStatus.textContent = statusText;
        
        document.getElementById('attention-count').textContent = `Breaks: ${data.total_breaks || 0}`;
    }
    
    completeCurrentSession() {
        // Play completion sound
        this.playCompletionSound();
        
        if (this.sessionData.sessionType === 'focus') {
            // Switch to break
            this.sessionData.sessionType = 'break';
            this.sessionData.totalTime = this.sessionData.breakDuration * 60;
            this.showNotification('Focus session complete! Time for a break.', 'success');
        } else {
            // Switch to next focus session or complete
            this.sessionData.currentSession++;
            if (this.sessionData.currentSession > this.sessionData.totalSessions) {
                this.completeAllSessions();
                return;
            } else {
                this.sessionData.sessionType = 'focus';
                this.sessionData.totalTime = this.sessionData.focusDuration * 60;
                this.showNotification('Break complete! Ready for next focus session.', 'success');
            }
        }
        
        this.sessionData.currentTime = this.sessionData.totalTime;
        this.updateSessionDisplay();
        this.updateTimerDisplay();
        this.updateProgressRing();
    }
    
    togglePause() {
        if (this.sessionData.isPaused) {
            this.socket.emit('resume_session');
        } else {
            this.socket.emit('pause_session');
        }
    }
    
    skipSession() {
        this.sessionData.currentTime = 0;
        this.completeCurrentSession();
    }
    
    async endSession() {
        try {
            const response = await fetch('/api/end-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.completeAllSessions(data.session_data);
                this.showNotification('Session ended successfully!', 'success');
            } else {
                this.showNotification('Failed to end session: ' + (data.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('End session error:', error);
            this.showNotification('Failed to end session. Please try again.', 'error');
        }
    }
    
    async completeAllSessions(sessionData = null) {
        // Stop timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        // Remove focus mode
        document.body.classList.remove('focus-mode');
        
        // Update backend status
        this.backendCameraStatus.textContent = 'BACKEND OFFLINE';
        this.backendCameraStatus.className = 'status-badge waiting';
        this.backendCameraMessage.textContent = 'Attention tracking stopped';
        
        // Get final session data
        let finalData = sessionData;
        if (!finalData) {
            try {
                const response = await fetch('/api/end-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                finalData = data.session_data;
            } catch (error) {
                console.error('Error getting session data:', error);
            }
        }
        
        if (finalData) {
            this.displayCompletionSummary(finalData);
        }
        
        // Switch to completion panel
        this.sessionPanel.classList.remove('active');
        this.completePanel.classList.add('active');
    }
    
    displayCompletionSummary(sessionData) {
        // Update summary statistics
        document.getElementById('total-focus-time').textContent = this.formatTime(sessionData.total_focus_time);
        document.getElementById('attention-rate').textContent = `${Math.round(sessionData.focus_percentage || 0)}%`;
        document.getElementById('distraction-count').textContent = sessionData.attention_breaks.length;
        
        // Store session data for report generation
        this.sessionData.reportData = sessionData;
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    }
    
    async downloadReport() {
        if (!this.sessionData.reportData) {
            this.showNotification('No session data available for report', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.sessionData.reportData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Generate PDF using client-side library
                this.generatePDFReport(this.sessionData.reportData);
            } else {
                this.showNotification('Failed to generate report', 'error');
            }
        } catch (error) {
            console.error('Report generation error:', error);
            this.showNotification('Failed to generate report', 'error');
        }
    }
    
    generatePDFReport(sessionData) {
        // This will be implemented with jsPDF or similar library
        // For now, create a text report
        const reportContent = this.createTextReport(sessionData);
        this.downloadTextReport(reportContent);
    }
    
    createTextReport(sessionData) {
        const breaks = sessionData.attention_breaks || [];
        const totalBreaks = breaks.length;
        const totalBreakTime = breaks.reduce((sum, break_) => sum + break_.duration_seconds, 0);
        const avgBreakDuration = totalBreaks > 0 ? totalBreakTime / totalBreaks : 0;
        
        let report = `================================================================================
COMPREHENSIVE ATTENTION ANALYSIS REPORT
================================================================================

SESSION OVERVIEW
--------------------------------------------------
Session Start: ${sessionData.start_time}
Session End: ${sessionData.end_time}
Total Duration: ${this.formatTime((sessionData.total_focus_time || 0) + (sessionData.total_break_time || 0))}
Attention Percentage: ${Math.round(sessionData.focus_percentage || 0)}%
Total Focus Time: ${this.formatTime(sessionData.total_focus_time || 0)}
Total Break Time: ${this.formatTime(sessionData.total_break_time || 0)}

FOCUS ANALYSIS
--------------------------------------------------
Number of Focus Zones: ${totalBreaks + 1}
Average Focus Duration: ${avgBreakDuration.toFixed(1)} seconds
Longest Focus Period: ${Math.max(...breaks.map(b => b.duration_seconds), 0).toFixed(1)} seconds
Shortest Focus Period: ${Math.min(...breaks.map(b => b.duration_seconds), 0).toFixed(1)} seconds

ATTENTION BREAK ANALYSIS
--------------------------------------------------
Number of Attention Breaks: ${totalBreaks}
Average Break Duration: ${avgBreakDuration.toFixed(1)} seconds
Longest Break: ${Math.max(...breaks.map(b => b.duration_seconds), 0).toFixed(1)} seconds
Shortest Break: ${Math.min(...breaks.map(b => b.duration_seconds), 0).toFixed(1)} seconds

DETAILED ATTENTION BREAKS
--------------------------------------------------
#   Start Time           End Time             Duration (s)
--------------------------------------------------------------------------------`;

        breaks.forEach((break_, index) => {
            const startTime = new Date(break_.start_time).toLocaleTimeString();
            const endTime = new Date(break_.end_time).toLocaleTimeString();
            report += `\n${index + 1}   ${startTime}             ${endTime}             ${break_.duration_seconds.toFixed(1)}`;
        });

        report += `\n\nPERFORMANCE INSIGHTS
--------------------------------------------------`;
        
        if (sessionData.focus_percentage >= 80) {
            report += `\n✅ Excellent attention level - great focus maintained!`;
        } else if (sessionData.focus_percentage >= 60) {
            report += `\n👍 Good attention level - room for improvement`;
        } else {
            report += `\n❌ Low attention level - significant distractions detected`;
        }
        
        if (totalBreaks > 20) {
            report += `\n🔄 High frequency of focus changes - may indicate difficulty maintaining concentration`;
        }
        
        report += `\n================================================================================`;

        return report;
    }
    
    downloadTextReport(content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attention_analysis_report_${new Date().toISOString().replace(/[:.]/g, '')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
    
    resetToSetup() {
        // Reset session data
        this.sessionData = {
            isActive: false,
            isPaused: false,
            currentTime: 0,
            totalTime: 0,
            sessionType: 'focus',
            currentSession: 1,
            totalSessions: 4,
            focusDuration: 25,
            breakDuration: 5,
            attentionBreaks: 0,
            focusPercentage: 0,
            currentStreak: 0,
            reportData: null
        };
        
        // Reset UI
        this.completePanel.classList.remove('active');
        this.setupPanel.classList.add('active');
        
        // Reset timer display
        this.timerDisplay.textContent = '25:00';
        this.updateProgressRing();
        
        // Reset backend status
        this.backendCameraStatus.textContent = 'BACKEND OFFLINE';
        this.backendCameraStatus.className = 'status-badge waiting';
        this.backendCameraMessage.textContent = 'Backend camera ready for testing';
        
        // Reset buttons
        this.testBackendBtn.textContent = 'Test Backend Camera';
        this.testBackendBtn.classList.remove('btn-success', 'btn-danger');
        this.pauseBtn.textContent = 'Pause';
        
        // Reset attention status
        this.updateAttentionStatus({
            face_detected: false,
            looking_at_screen: false,
            total_breaks: 0,
            focus_percentage: 0,
            current_streak: 0
        });
    }
    
    initializeAudio() {
        // Audio controller will be initialized in audio.js
        if (window.audioController) {
            window.audioController.initialize(this.audioSourceSelect.value);
        }
    }
    
    playCompletionSound() {
        // Play a subtle notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Could not play completion sound'));
    }
    
    showNotification(message, type = 'info') {
        // Create a simple notification (could be enhanced with a toast library)
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pomodoroApp = new PomodoroApp();
});
