import React from 'react';

interface IListenControlProps {
  onSwitch: () => void;
}

export default function ListenControls(props: IListenControlProps): JSX.Element {
  return <div className='listenControls'><div>Select a speaker or </div><button onClick={props.onSwitch} className='btn btn-secondary float-end'>Record Your Own</button></div>;
}