import React from 'react';

function secondsToMinuteSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = Math.floor(seconds % 60);
  return `${minutes}:${secondsLeft.toString().padStart(2, '0')}`;
}

let currentTimeInterval: number;

export default function TimeCounter(): JSX.Element {
  const [ initialTimestamp ] = React.useState(performance.now());
  // only used to force a state update
  const [ _, setCurrentTime ] = React.useState(0);
  React.useEffect(() => {
    currentTimeInterval = setInterval(() => {
      setCurrentTime((currentTime) => currentTime + 1);
    }, 100);
    return () => {
      currentTimeInterval && clearInterval(currentTimeInterval);
    };
  }, []);
  const currentTime: number = (performance.now() - initialTimestamp) / 1000;
  return <div className='playbackTime'>{ secondsToMinuteSeconds(currentTime) }</div>;
}