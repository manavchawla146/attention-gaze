/**
 * Pomodoro Focus Zone - Audio Controller
 * Handles ambient music playback with looping and volume control
 */

class AudioController {
    constructor() {
        this.audio = null;
        this.currentSource = 'lofi';
        this.volume = 0.5;
        this.isPlaying = false;
        this.isMuted = false;
        
        // Music playlists for different sources
        this.playlists = {
            lofi: [
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
            ],
            nature: [
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
            ],
            classical: [
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
            ],
            ambient: [
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
            ]
        };
        
        this.currentTrackIndex = 0;
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.muteToggleBtn = document.getElementById('mute-toggle');
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeDisplay = document.getElementById('volume-display');
        this.audioSourceSelect = document.getElementById('audio-source');
    }
    
    bindEvents() {
        this.muteToggleBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));
        this.audioSourceSelect.addEventListener('change', (e) => this.changeSource(e.target.value));
    }
    
    initialize(source = 'lofi') {
        this.currentSource = source;
        
        if (source === 'none') {
            this.stop();
            return;
        }
        
        this.loadTrack();
    }
    
    loadTrack() {
        const playlist = this.playlists[this.currentSource];
        if (!playlist || playlist.length === 0) {
            console.warn('No tracks available for source:', this.currentSource);
            return;
        }
        
        const trackUrl = playlist[this.currentTrackIndex];
        
        if (this.audio) {
            this.audio.pause();
            this.audio.removeEventListener('ended', this.handleTrackEnd);
        }
        
        this.audio = new Audio(trackUrl);
        this.audio.loop = false; // We'll handle looping manually to enable track switching
        this.audio.volume = this.isMuted ? 0 : this.volume;
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('error', (e) => this.handleAudioError(e));
        
        // Auto-play if session is active
        if (window.pomodoroApp && window.pomodoroApp.sessionData.isActive) {
            this.play();
        }
    }
    
    play() {
        if (this.audio && this.currentSource !== 'none') {
            this.audio.play()
                .then(() => {
                    this.isPlaying = true;
                    this.updateMuteButton();
                })
                .catch(error => {
                    console.error('Audio play failed:', error);
                    this.showNotification('Unable to play audio. Please check your browser settings.', 'warning');
                });
        }
    }
    
    pause() {
        if (this.audio) {
            this.audio.pause();
            this.isPlaying = false;
        }
    }
    
    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isPlaying = false;
        }
    }
    
    handleTrackEnd = () => {
        // Automatically move to next track for continuous playback
        this.nextTrack();
        this.play();
    }
    
    nextTrack() {
        const playlist = this.playlists[this.currentSource];
        if (!playlist || playlist.length === 0) return;
        
        this.currentTrackIndex = (this.currentTrackIndex + 1) % playlist.length;
        this.loadTrack();
    }
    
    previousTrack() {
        const playlist = this.playlists[this.currentSource];
        if (!playlist || playlist.length === 0) return;
        
        this.currentTrackIndex = this.currentTrackIndex === 0 
            ? playlist.length - 1 
            : this.currentTrackIndex - 1;
        this.loadTrack();
    }
    
    changeSource(source) {
        this.currentSource = source;
        this.currentTrackIndex = 0;
        
        if (source === 'none') {
            this.stop();
        } else {
            this.loadTrack();
        }
    }
    
    updateVolume(value) {
        this.volume = value / 100;
        this.volumeDisplay.textContent = `${value}%`;
        
        if (this.audio && !this.isMuted) {
            this.audio.volume = this.volume;
        }
    }
    
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.audio) {
            this.audio.volume = this.isMuted ? 0 : this.volume;
        }
        
        this.updateMuteButton();
    }
    
    updateMuteButton() {
        if (this.isMuted) {
            this.muteToggleBtn.textContent = '🔇';
            this.muteToggleBtn.classList.add('muted');
        } else {
            this.muteToggleBtn.textContent = '🔊';
            this.muteToggleBtn.classList.remove('muted');
        }
    }
    
    handleAudioError(error) {
        console.error('Audio error:', error);
        
        // Try to load next track
        this.nextTrack();
        
        // Show notification to user
        this.showNotification('Audio track unavailable. Switching to next track...', 'warning');
    }
    
    showNotification(message, type = 'info') {
        // Use the main app's notification system if available
        if (window.pomodoroApp && window.pomodoroApp.showNotification) {
            window.pomodoroApp.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    // Get current playback status
    getStatus() {
        return {
            isPlaying: this.isPlaying,
            currentSource: this.currentSource,
            currentTrackIndex: this.currentTrackIndex,
            volume: this.volume,
            isMuted: this.isMuted
        };
    }
    
    // Set volume without updating UI (for programmatic control)
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.volumeSlider.value = this.volume * 100;
        this.volumeDisplay.textContent = `${Math.round(this.volume * 100)}%`;
        
        if (this.audio && !this.isMuted) {
            this.audio.volume = this.volume;
        }
    }
    
    // Fade in audio
    fadeIn(duration = 2000) {
        if (!this.audio || this.currentSource === 'none') return;
        
        const targetVolume = this.volume;
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = targetVolume / steps;
        
        this.audio.volume = 0;
        this.play();
        
        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            this.audio.volume = Math.min(volumeStep * currentStep, targetVolume);
            
            if (currentStep >= steps) {
                clearInterval(fadeInterval);
            }
        }, stepDuration);
    }
    
    // Fade out audio
    fadeOut(duration = 2000) {
        if (!this.audio) return;
        
        const initialVolume = this.audio.volume;
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = initialVolume / steps;
        
        let currentStep = 0;
        const fadeInterval = setInterval(() => {
            currentStep++;
            this.audio.volume = Math.max(initialVolume - (volumeStep * currentStep), 0);
            
            if (currentStep >= steps || this.audio.volume <= 0) {
                clearInterval(fadeInterval);
                this.pause();
            }
        }, stepDuration);
    }
}

// Add CSS styles for audio controls
const audioStyles = document.createElement('style');
audioStyles.textContent = `
    .audio-controls {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .btn-icon.muted {
        background: var(--danger-color) !important;
    }
    
    #volume-slider {
        background: transparent;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.3);
    }
    
    #volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    #volume-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: white;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    
    .focus-mode .audio-controls {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
    }
`;
document.head.appendChild(audioStyles);

// Initialize audio controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.audioController = new AudioController();
});
