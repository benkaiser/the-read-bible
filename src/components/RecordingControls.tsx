import React from 'react';
import { Mp3MediaRecorder } from 'mp3-mediarecorder';
import { Pause, Play, Recording } from './icons.js';
import PlaybackTime from './PlaybackTime.js';

const worker = new Worker('./dist/worker.js');
let recorder: Mp3MediaRecorder;
let mp3Blob: Blob;
let mp3BlobUrl: string;

interface IRecordingControlProps {
  onSwitch: () => void;
}

export default function RecordingControls(props: IRecordingControlProps): JSX.Element {
  const [ currentlyRecording, setCurrentlyRecording] = React.useState(false);
  const [ recordingCreated, setRecordingCreated ] = React.useState(!!mp3Blob);
  const [ isPlaying, setIsPlaying ] = React.useState(false);
  const audioRef = React.useRef(null);

  React.useEffect(() => {
    if (mp3BlobUrl && audioRef.current) {
      audioRef.current.src = mp3BlobUrl;
    }
  }, []);
  const startRecording = () => {
    setCurrentlyRecording(true);
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then(
        (stream) => {
          const mediaStream = stream;
          recorder = new Mp3MediaRecorder(stream, { worker });
          let blobs = [];
          recorder.start();

          recorder.onstart = (e) => {
            blobs = [];
          };

          recorder.ondataavailable = (e) => {
            blobs.push(e.data);
          };

          recorder.onstop = (e) => {
            mediaStream.getTracks().forEach((track) => track.stop());

            mp3Blob = new Blob(blobs, { type: 'audio/mpeg' });
            mp3BlobUrl = URL.createObjectURL(mp3Blob);
            audioRef.current.src = mp3BlobUrl;
          };

          recorder.onpause = (e) => {
            // no-op
          };

          recorder.onresume = (e) => {
            // no-op
          };

          recorder.onerror = (e) => {
            // todo: handle error
            console.error('onerror', e);
          };
        },
        (reason) => {
          console.warn('Could not get microphone access.\nError:', reason.message);
        }
      );
  };
  const stopRecording = () => {
    recorder.stop();
    setCurrentlyRecording(false);
    setRecordingCreated(true);
  }
  const playRecording = () => {
    audioRef.current.play();
    setIsPlaying(true);
  }
  const pauseRecording = () => {
    setIsPlaying(false);
    audioRef.current.pause();
  }
  const onPause = () => {
    setIsPlaying(false);
  }
  return <div className="recordingControls">
      <div className="leftControls">
        { !currentlyRecording && recordingCreated ? <button className="playButton btn btn-primary" onClick={isPlaying ? pauseRecording : playRecording}>{ isPlaying ? <Pause /> : <Play /> }</button> : ''}
        { !currentlyRecording ? <button className="recordButton btn btn-primary" onClick={startRecording}>{ recordingCreated ? `New Recording` : `Record` }</button> : ''}
        { currentlyRecording ? <button className="stopButton btn btn-primary" onClick={stopRecording}>Finish</button> : ''}
        <span className='stats'>
          { currentlyRecording ? <Recording /> : recordingCreated ? <PlaybackTime audio={audioRef.current} /> : '' }
        </span>
      </div>
      <div className='rightControls'>
        <button onClick={props.onSwitch} className="btn btn-secondary float-end">Back to Listen Mode</button>
      </div>
      <audio onPause={onPause} src="" ref={audioRef}></audio>
    </div>;
}