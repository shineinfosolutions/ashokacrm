/**
 * Sound utility for playing notification sounds
 */

class SoundManager {
  constructor() {
    this.enabled = true;
    this.audio = null;
    this.init();
  }

  // Initialize audio element
  init() {
    try {
      this.audio = new Audio('/buzzer.mp3');
      this.audio.preload = 'auto';
      this.audio.volume = 0.5;
    } catch (error) {
      console.warn('Error loading buzzer sound:', error);
    }
  }

  // Play notification sound for new KOT
  playNewKOTSound() {
    if (!this.enabled || !this.audio) return;
    
    try {
      this.audio.currentTime = 0;
      this.audio.play().catch(error => {
        console.warn('Error playing buzzer sound:', error);
      });
    } catch (error) {
      console.warn('Error playing buzzer sound:', error);
    }
  }

  // Enable/disable sounds
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Check if sounds are enabled
  isEnabled() {
    return this.enabled;
  }
}

// Create singleton instance
const soundManager = new SoundManager();

export default soundManager;
