import React from 'react';
import { Mp3MediaRecorder } from 'mp3-mediarecorder';
import { Pause, Play, Recording } from './icons.js';
import PlaybackTime from './PlaybackTime.js';
import TimeCounter from './TimeCounter.js';
import SubmitView, { ISubmitDetails } from './SubmitView.js';

export interface IVerseTiming {
  verse: number;
  time: number;
}

let worker;
let recorder: Mp3MediaRecorder;
let mp3Blob: Blob;
let mp3BlobUrl: string;
let recordStartMark: number;
let verseTimings: IVerseTiming[] = [];
let verseTimingPlaybackIndex: number = 0;

function markVerseSwitch(verseNumber: number, timeOverride?: number): void {
  verseTimings.push({ verse: verseNumber, time: timeOverride ?? Math.round(performance.now() - recordStartMark)});
}

interface IRecordingControlProps extends React.ComponentProps<any> {
  onSwitch: () => void;
  changeVerse: (verse: number) => void;
  focusAll: () => void;
  book: string;
  chapter: number;
}

interface IRecordingControlHandles {
  changeVerse: (verseNumber: number) => void;
}

const RecordingStatus: React.FunctionComponent = (): JSX.Element => {
  return <div className='recordingStatus'>
    <Recording />
    <TimeCounter />
  </div>;
}

const RecordingControls: React.ForwardRefRenderFunction<IRecordingControlHandles, IRecordingControlProps> = (props: IRecordingControlProps, ref): JSX.Element => {
  const [ currentlyRecording, setCurrentlyRecording] = React.useState(false);
  const [ recordingCreated, setRecordingCreated ] = React.useState(!!mp3Blob);
  const [ isPlaying, setIsPlaying ] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    props.changeVerse(1);
    return () => {
      props.focusAll();
    };
  }, [])

  React.useImperativeHandle(ref, () => ({
    changeVerse: (verseNumber: number) => {
      if (currentlyRecording) {
        markVerseSwitch(verseNumber);
      }
    }
  }));

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
          if (!worker) {
            worker = new Worker('./dist/worker.js');
          }
          recorder = new Mp3MediaRecorder(stream, { worker });
          let blobs: Blob[] = [];
          props.changeVerse(1);
          recorder.start();

          recorder.onstart = (e) => {
            blobs = [];
            recordStartMark = performance.now();
            verseTimings = [];
            markVerseSwitch(1, 0);
          };

          recorder.ondataavailable = (e) => {
            blobs.push(e.data);
          };

          recorder.onstop = (e) => {
            mediaStream.getTracks().forEach((track) => track.stop());

            mp3Blob = new Blob(blobs, { type: 'audio/mpeg' });
            mp3BlobUrl = URL.createObjectURL(mp3Blob);
            if (audioRef.current) {
              audioRef.current.src = mp3BlobUrl;
            }
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
  const queueNextVerse = () => {
    if (verseTimingPlaybackIndex >= verseTimings.length || !audioRef.current) {
      return;
    }
    const currentPlaybackTime = audioRef.current.currentTime * 1000;
    setTimeout(() => {
      if (audioRef.current?.paused) {
        return;
      }
      props.changeVerse(verseTimings[verseTimingPlaybackIndex].verse);
      verseTimingPlaybackIndex++;
      queueNextVerse();
    }, verseTimings[verseTimingPlaybackIndex].time - currentPlaybackTime);
  }
  const playRecording = () => {
    audioRef.current?.play();
    setIsPlaying(true);
    verseTimingPlaybackIndex = 0;
    queueNextVerse();
  }
  const pauseRecording = () => {
    setIsPlaying(false);
    audioRef.current?.pause();
  }
  const onPause = () => {
    setIsPlaying(false);
  }
  const onSubmit = (submitDetails: ISubmitDetails): Promise<boolean> => {
    const headers = new Headers();
    headers.set('book', props.book);
    headers.set('chapter', props.chapter.toString());
    headers.set('audiotimestamps', JSON.stringify(verseTimings));
    headers.set('speaker', submitDetails.speakerName);
    headers.set('gravatarhash', submitDetails.gravatarHash);
    return fetch("/api/recording", {
      method: 'POST',
      headers: headers,
      body: mp3Blob
    }).then((response) => {
      if (response.status === 200 || response.status === 204) {
        return true;
      } else {
        response.text().then(text => console.error(text));
        return false;
      }
    }).catch((error: Error) => {
      console.error(error);
      return false;
    });
  }
  return <div className="recordingControls">
      <div className="recordingControlsTop">
        <div className="leftControls">
          { !currentlyRecording && recordingCreated ? <button className="playButton btn btn-primary" onClick={isPlaying ? pauseRecording : playRecording}>{ isPlaying ? <Pause /> : <Play /> }</button> : ''}
          { !currentlyRecording ? <button className={`recordButton btn btn-${recordingCreated ? 'secondary' : 'primary'}`} onClick={startRecording}>{ recordingCreated ? `New Recording` : `Record` }</button> : ''}
          { currentlyRecording ? <button className="stopButton btn btn-primary" onClick={stopRecording}>Finish</button> : ''}
          <span className='stats'>
            { currentlyRecording ? <RecordingStatus /> : recordingCreated ? (audioRef.current && <PlaybackTime audio={audioRef.current} />) : '' }
          </span>
        </div>
        <div className='rightControls'>
          <button onClick={props.onSwitch} className="btn btn-secondary float-end">Back to Listen Mode</button>
        </div>
        <audio onPause={onPause} src="" ref={audioRef}></audio>
      </div>
      <SubmitView onSubmit={onSubmit} visible={recordingCreated && !currentlyRecording} />
    </div>;
}

export default React.forwardRef(RecordingControls);