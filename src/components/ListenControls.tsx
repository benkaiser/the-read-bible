import React, { ChangeEvent } from 'react';
import { IVerseTiming } from '../interfaces.js';
import { expectedVerse, getVerseTimingIndex } from '../utils.js';
import { Check, Cross, Pause, Play } from './icons.js';

interface IListenControlProps {
  onSwitch: () => void;
  changeVerse: (verse: number) => void;
  setFocusFollowsVerse: (focusFollowsVerse: boolean) => void;
  focusAll: () => void;
  book: string;
  chapter: number;
  verseCount: number;
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
let totalScrollHeight: number = document.body.scrollHeight;

interface IListenControlHandles {
  changeVerse: (verseNumber: number) => void;
}

const ListenControls: React.ForwardRefRenderFunction<IListenControlHandles, IListenControlProps> = (props: IListenControlProps, ref): JSX.Element => {
  const [ loaded, setLoaded ] = React.useState(false);
  const [ recordings, setRecordings ] = React.useState<IRecording[]>([]);
  const [ selectedRecording, setSelectedRecording ] = React.useState<IRecording | null>(null);
  const [ isPlaying, setIsPlaying ] = React.useState(false);
  const [ playingSrc, setPlayingSrc ] = React.useState<string>('');
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [ isVerseTimingsPresent, setIsVerseTimingsPresent ] = React.useState(true);
  const [ gravatarHidden, setGravatarHidden] = React.useState(false);
  const [ isFollowing, setIsFollowing ] = React.useState(true);
  const isFollowingRef = React.useRef<boolean>(isFollowing);

  React.useImperativeHandle(ref, () => ({
    changeVerse: (verseNumber: number) => {
      if (isPlaying && isVerseTimingsPresent && selectedRecording && selectedRecording.audioTimestamps && audioRef.current && expectedVerse(selectedRecording.audioTimestamps, audioRef.current) !== verseNumber) {
        const index = getVerseTimingIndex(verseNumber, selectedRecording.audioTimestamps);
        audioRef.current.currentTime = selectedRecording.audioTimestamps[index].time / 1000;
        verseTimingPlaybackIndex = index;
        verseTimeout && clearTimeout(verseTimeout);
        requestAnimationFrame(() => queueNextVerse());
        return;
      }
    }
  }));
  React.useEffect(() => {
    fetch(`/api/recordingsForChapter?book=${props.book}&chapter=${props.chapter}`)
    .then(response => response.json())
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
      if (selectedRecording && selectedRecording.audioTimestamps) {
        props.changeVerse(selectedRecording.audioTimestamps[Math.max(verseTimingPlaybackIndex - 1, 0)].verse);
      }
    }
    setIsPlaying(true);
  }, [selectedRecording, playingSrc]);
  const scrollV1Recording = React.useCallback(() => {
    if (!audioRef.current || audioRef.current?.paused) {
      return;
    }
    const progressThroughTrack = audioRef.current.currentTime / audioRef.current.duration;
    window.scrollTo({ top: progressThroughTrack * totalScrollHeight, left: 0, behavior: 'smooth' });
    const timeBetweenVersesApproximate: number = audioRef.current.duration / props.verseCount * 1000;
    setTimeout(scrollV1Recording, timeBetweenVersesApproximate);
  }, [props.verseCount]);
  const queueNextVerse = React.useCallback(() => {
    if (!selectedRecording) {
      return;
    }
    if (!selectedRecording.audioTimestamps) {
      totalScrollHeight = document.body.scrollHeight;
      requestAnimationFrame(scrollV1Recording);
      return;
    }
    if (verseTimingPlaybackIndex >= selectedRecording.audioTimestamps.length || !audioRef.current) {
      return;
    }
    const currentPlaybackTime = audioRef.current.currentTime * 1000;
    if (verseTimeout) {
      clearTimeout(verseTimeout);
    }
    verseTimeout = setTimeout(() => {
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
    setGravatarHidden(false);
  }
  const changeIsFollowing = React.useCallback(() => {
    isFollowingRef.current = !isFollowing;
    setIsFollowing(isFollowingState => !isFollowingState);
    props.setFocusFollowsVerse(!isFollowing);
    requestAnimationFrame(() => queueNextVerse());
  }, [isFollowing]);
  return <div className='listenControls'>
      { !loaded && <div>Loading recordings... </div> }
      { loaded && recordings.length > 0 && <div className='listenControlsStart'>
        <select className="form-select speakerSelector" onChange={onChangeSpeaker}>
          { recordings.map((recording: IRecording) => {
            return <option key={recording.id} value={recording.id}>{recording.speaker}</option>
          })}
        </select>
        { selectedRecording && !gravatarHidden && <img className="user-image" onError={() => setGravatarHidden(true)} src={`https://s.gravatar.com/avatar/${selectedRecording.gravatarHash}?s=38&d=404`} /> }
        <div className='listenActions'>
          { selectedRecording ? <button className="playButton btn btn-primary" onClick={isPlaying ? pauseRecording : playRecording}>{ isPlaying ? <Pause /> : <Play /> }</button> : ''}
          <button className={`followButton btn text-nowrap ${ isFollowing ? 'btn-success' : 'btn-secondary'}`} onClick={ changeIsFollowing }>{ isFollowing ? <Check /> : <Cross /> } Auto Scroll</button>
        </div>
      </div> }
      { loaded && recordings.length === 0 && <div>No recordings found for this chapter.</div> }
      <button onClick={props.onSwitch} className='btn btn-secondary float-end'>Record Your Own</button>
      <audio onPause={onPause} onPlay={queueNextVerse} onEnded={onEnded} src={playingSrc} autoPlay={true} ref={audioRef}></audio>
    </div>;
}

export default React.forwardRef(ListenControls);