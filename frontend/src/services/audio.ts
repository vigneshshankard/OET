// Audio service for managing audio recording and playback

export class AudioService {
  private mediaRecorder: MediaRecorder | null = null
  private audioStream: MediaStream | null = null

  async getAudioStream(): Promise<MediaStream> {
    // Mock implementation for testing
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      return this.audioStream
    }
    
    // Fallback mock stream
    const mockStream = new MediaStream()
    this.audioStream = mockStream
    return mockStream
  }

  async startRecording(): Promise<void> {
    if (!this.audioStream) {
      this.audioStream = await this.getAudioStream()
    }

    if (typeof MediaRecorder !== 'undefined') {
      this.mediaRecorder = new MediaRecorder(this.audioStream)
      this.mediaRecorder.start()
    }
  }

  async stopRecording(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop()
    }
  }

  async pauseRecording(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
    }
  }

  async resumeRecording(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
    }
  }

  cleanup(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder = null
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = null
    }
  }
}

export const audioService = new AudioService()