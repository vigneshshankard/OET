"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type RecordingState = 'inactive' | 'listening' | 'processing' | 'ai-speaking'

interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void
  onStateChange?: (state: RecordingState) => void
}

export default function AudioRecorder({ onRecordingComplete, onStateChange }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('inactive')
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout>()

  // Initialize audio permissions and setup
  useEffect(() => {
    requestMicrophonePermission()
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Update parent component when state changes
  useEffect(() => {
    onStateChange?.(recordingState)
  }, [recordingState, onStateChange])

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsPermissionGranted(true)
      stream.getTracks().forEach(track => track.stop()) // Clean up test stream
    } catch (error) {
      console.error('Microphone permission denied:', error)
      setIsPermissionGranted(false)
    }
  }

  const setupAudioAnalysis = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext()
    const source = audioContextRef.current.createMediaStreamSource(stream)
    analyserRef.current = audioContextRef.current.createAnalyser()
    
    analyserRef.current.fftSize = 256
    const bufferLength = analyserRef.current.frequencyBinCount
    dataArrayRef.current = new Uint8Array(bufferLength)
    
    source.connect(analyserRef.current)
    
    const updateAudioLevel = () => {
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)
        const average = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length
        setAudioLevel(average / 255) // Normalize to 0-1
      }
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
    }
    
    updateAudioLevel()
  }

  const startRecording = async () => {
    if (!isPermissionGranted) {
      await requestMicrophonePermission()
      if (!isPermissionGranted) return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      setupAudioAnalysis(stream)

      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' })
        setAudioChunks(chunks)
        onRecordingComplete?.(audioBlob)
        
        // Simulate AI processing
        setRecordingState('processing')
        setTimeout(() => {
          setRecordingState('ai-speaking')
          // Simulate AI response time
          setTimeout(() => {
            setRecordingState('inactive')
            setTimer(0)
          }, 3000)
        }, 1500)
        
        // Clean up
        stream.getTracks().forEach(track => track.stop())
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }
      }

      setMediaRecorder(recorder)
      recorder.start(100)
      setRecordingState('listening')
      
      // Start timer
      let seconds = 0
      timerRef.current = setInterval(() => {
        seconds++
        setTimer(seconds)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && recordingState === 'listening') {
      mediaRecorder.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStateDisplay = () => {
    switch (recordingState) {
      case 'listening':
        return { text: "Your turn", subtext: "Speak naturally..." }
      case 'processing':
        return { text: "Thinking...", subtext: "Processing your response" }
      case 'ai-speaking':
        return { text: "AI Responding", subtext: "Listen carefully" }
      default:
        return { text: "Ready to start", subtext: "Click to begin speaking" }
    }
  }

  const stateDisplay = getStateDisplay()

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Recording Visualizer */}
      <div className="relative">
        <div 
          className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            recordingState === 'listening' ? 'animate-pulse' : ''
          }`}
          style={{
            backgroundColor: recordingState === 'listening' 
              ? `rgba(0, 128, 128, ${0.1 + audioLevel * 0.3})` 
              : recordingState === 'processing'
              ? '#FFF3E0'
              : recordingState === 'ai-speaking'
              ? '#F0FDF4'
              : '#F8F8F8',
            border: `3px solid ${
              recordingState === 'listening' 
                ? '#008080'
                : recordingState === 'processing'
                ? '#FF8C00'
                : recordingState === 'ai-speaking'
                ? '#22C55E'
                : '#E5E7EB'
            }`
          }}
        >
          {recordingState === 'listening' && (
            <div className="text-3xl">🎤</div>
          )}
          {recordingState === 'processing' && (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          )}
          {recordingState === 'ai-speaking' && (
            <div className="text-3xl">🤖</div>
          )}
          {recordingState === 'inactive' && (
            <div className="text-3xl">▶️</div>
          )}
        </div>
        
        {/* Audio level indicator */}
        {recordingState === 'listening' && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-teal-500 rounded-full transition-all duration-150"
                  style={{
                    height: `${4 + (audioLevel * 20) * (i + 1) / 5}px`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* State Display */}
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-1" style={{ color: '#36454F' }}>
          {stateDisplay.text}
        </h3>
        <p className="text-sm opacity-70" style={{ color: '#36454F' }}>
          {stateDisplay.subtext}
        </p>
        
        {/* Timer */}
        {timer > 0 && (
          <div className="mt-2">
            <span className="text-lg font-mono" style={{ color: '#008080' }}>
              {formatTime(timer)}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex space-x-4">
        {recordingState === 'inactive' && (
          <Button
            onClick={startRecording}
            disabled={!isPermissionGranted}
            size="lg"
            style={{ backgroundColor: '#008080', color: 'white' }}
          >
            Start Recording
          </Button>
        )}
        
        {recordingState === 'listening' && (
          <Button
            onClick={stopRecording}
            size="lg"
            variant="outline"
            style={{ borderColor: '#EF4444', color: '#EF4444' }}
          >
            Stop Recording
          </Button>
        )}
        
        {(recordingState === 'processing' || recordingState === 'ai-speaking') && (
          <Button disabled size="lg" variant="outline">
            {recordingState === 'processing' ? 'Processing...' : 'AI Speaking...'}
          </Button>
        )}
      </div>

      {/* Permission Warning */}
      {!isPermissionGranted && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-medium text-orange-800">Microphone Access Required</p>
                <p className="text-sm text-orange-700">
                  Please allow microphone access to start your practice session.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}