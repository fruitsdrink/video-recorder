import { useEffect, useRef, useState } from 'react'

function App(): JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  const [myStream, setMyStream] = useState<MediaStream | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [isRecording, setIsRecording] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        setMyStream(stream)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9'
        })
        mediaRecorder.ondataavailable = (e): void => {
          if (e.data.size > 0) {
            setRecordedChunks((prev) => [...prev, e.data])
          }
        }
        mediaRecorder.onstop = (): void => {
          setIsRecording(false)
        }
        setMediaRecorder(mediaRecorder)
      })
      .catch((err) => console.error('getUserMedia Error: ', err))
  }, [])

  const handleStartClick = (): void => {
    setIsRecording(true)
    setRecordedChunks([])
    if (myStream) {
      mediaRecorder?.start()
    }
  }

  const handleStopClick = (): void => {
    // setIsRecording(false)
    mediaRecorder?.stop()
  }

  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, {
        type: 'video/webm; codecs=vp9'
      })
      blob.arrayBuffer().then((buffer) => {
        window.electron.ipcRenderer.send('file:writeFile', Buffer.from(buffer))
      })
    }
  }, [isRecording, recordedChunks])

  return (
    <>
      <h1>Video Recorder</h1>
      <div>
        <video ref={videoRef} autoPlay muted></video>
      </div>
      <div>
        <button onClick={handleStartClick} disabled={isRecording && myStream ? true : false}>
          {!isRecording ? 'Start' : 'Recording'}
        </button>
        <button onClick={handleStopClick} disabled={isRecording ? false : true}>
          Stop
        </button>
      </div>
    </>
  )
}

export default App
