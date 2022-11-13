import React from 'react';

function secondsToMinuteSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = Math.floor(seconds % 60);
  return `${minutes}:${secondsLeft.toString().padStart(2, '0')}`;
}

let currentTimeInterval: number;

interface IPlaybackTimeProps {
  audio: HTMLAudioElement;
}

export default function PlaybackTime(props: IPlaybackTimeProps): JSX.Element {
  const [ duration, setDuration ] = React.useState(props.audio.duration || 0);
  // only used to force a state update
  const [ _, setCurrentTime ] = React.useState(0);
  const currentTime = props.audio.currentTime;
  props.audio.addEventListener('loadedmetadata', () => {
    setDuration(props.audio.duration);
  });
  React.useEffect(() => {
    currentTimeInterval = setInterval(() => {
      setCurrentTime(props.audio.currentTime);
    }, 100);
    return () => {
      currentTimeInterval && clearInterval(currentTimeInterval);
    };
  }, []);
  return <span className='playbackTime'>{ secondsToMinuteSeconds(currentTime) } / { secondsToMinuteSeconds(duration) }</span>;
}