import React, { ChangeEvent } from 'react';
import { IVerseTiming } from './RecordingControls';
import { Pause, Play } from './icons.js';

interface IListenControlProps {
  onSwitch: () => void;
  changeVerse: (verse: number) => void;
  focusAll: () => void;
  book: string;
  chapter: number;
}

// TODO: move to esbuild build script with environment variables
const R2_URL = window.location.hostname === 'localhost' ? 'http://127.0.0.1:10500' : 'https://r2.thereadbible.com';

function r2URLFromFilename(filename: string): string {
  return `${R2_URL}/${filename}`;
}

interface IRecording {
  id: string;
  book: string;
  chapter: number;
  speaker: string;
  gravatarHash?: string;
  videoId?: string;
  audioFilename: string;
  audioTimestamps: IVerseTiming[];
  createdAt: string;
}
let verseTimingPlaybackIndex: number = 0;
let verseTimeout: number;

export default function ListenControls(props: IListenControlProps): JSX.Element {
  const [ loaded, setLoaded ] = React.useState(false);
  const [ recordings, setRecordings ] = React.useState<IRecording[]>([]);
  const [ selectedRecording, setSelectedRecording ] = React.useState<IRecording | null>(null);
  const [ isPlaying, setIsPlaying ] = React.useState(false);
  const [ playingSrc, setPlayingSrc ] = React.useState<string>('');
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [ isVerseTimingsPresent, setIsVerseTimingsPresent ] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/recordingsForChapter?book=${props.book}&chapter=${props.chapter}`)
    .then(response => response.json<IRecording[]>())
    .then((recordings: IRecording[]) => {
      recordings = recordings.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      setLoaded(true);
      setRecordings(recordings);
      setSelectedRecording(recordings[0]);
    })
  }, []);
  React.useEffect(() => {
    if (!selectedRecording) {
      return;
    }
    const shouldFocusVerse = !!selectedRecording?.audioTimestamps && isPlaying;
    setIsVerseTimingsPresent(shouldFocusVerse);
    if (shouldFocusVerse) {
      props.changeVerse(selectedRecording.audioTimestamps[Math.max(verseTimingPlaybackIndex - 1, 0)].verse);
    } else {
      props.focusAll();
    }
  }, [ selectedRecording, isPlaying ]);
  const playRecording = React.useCallback(() => {
    if (playingSrc === '') {
      setPlayingSrc(r2URLFromFilename(selectedRecording!.audioFilename));
    } else {
      audioRef.current!.play();
      if (selectedRecording) {
        props.changeVerse(selectedRecording.audioTimestamps[Math.max(verseTimingPlaybackIndex - 1, 0)].verse);
      }
    }
    setIsPlaying(true);
  }, [selectedRecording, playingSrc]);
  const queueNextVerse = React.useCallback(() => {
    if (!selectedRecording) {
      return;
    }
    if (verseTimingPlaybackIndex >= selectedRecording.audioTimestamps.length || !audioRef.current) {
      return;
    }
    const currentPlaybackTime = audioRef.current.currentTime * 1000;
    verseTimeout = setTimeout(() => {
      if (audioRef.current?.paused) {
        return;
      }
      props.changeVerse(selectedRecording.audioTimestamps[verseTimingPlaybackIndex].verse);
      verseTimingPlaybackIndex++;
      queueNextVerse();
    }, selectedRecording.audioTimestamps[verseTimingPlaybackIndex].time - currentPlaybackTime);
  }, [selectedRecording]);
  const pauseRecording = () => {
    setIsPlaying(false);
    audioRef.current?.pause();
    verseTimeout && clearTimeout(verseTimeout);
  }
  const onPause = () => {
    setIsPlaying(false);
  }
  const onEnded = () => {
    setIsPlaying(false);
    verseTimingPlaybackIndex = 0;
    audioRef.current!.currentTime = 0;
  }
  const onChangeSpeaker = (event: ChangeEvent<HTMLSelectElement>) => {
    verseTimingPlaybackIndex = 0;
    setPlayingSrc('');
    setSelectedRecording(recordings.find(r => r.id === event.target.value) || null);
    setIsPlaying(false);
  }
  return <div className='listenControls'>
      { !loaded && <div>Loading recordings... </div> }
      { loaded && <div className='listenControlsStart'>
        <span>
          Reading
        </span>
        <select className="form-select" onChange={onChangeSpeaker}>
          { recordings.map((recording: IRecording) => {
            return <option key={recording.id} value={recording.id}>{recording.speaker}</option>
          })}
        </select>
        <div className='listenActions'>
          { selectedRecording ? <button className="playButton btn btn-primary" onClick={isPlaying ? pauseRecording : playRecording}>{ isPlaying ? <Pause /> : <Play /> }</button> : ''}
        </div>
      </div> }
      <button onClick={props.onSwitch} className='btn btn-secondary float-end'>Record Your Own</button>
      <audio onPause={onPause} onPlay={queueNextVerse} onEnded={onEnded} src={playingSrc} autoPlay={true} ref={audioRef}></audio>
    </div>;
}