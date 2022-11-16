import React from 'react';
import { md5 } from '../utils';

export interface ISubmitDetails {
  speakerName: string;
  gravatarHash: string;
}

export interface ISubmitViewProps {
  visible: boolean;
  onSubmit: (data: ISubmitDetails) => Promise<boolean>;
}

export default function SubmitView(props: ISubmitViewProps): JSX.Element | null {
  const [gravatarHash, setGravatarHash] = React.useState('d41d8cd98f00b204e9800998ecf8427e');
  const [reader, setReader] = React.useState('John Smith');
  const [status, setStatus] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const refEmail = React.useRef<HTMLInputElement>(null);
  const refName = React.useRef<HTMLInputElement>(null);

  const onChangeEmail = React.useCallback(() => {
    setGravatarHash(md5(refEmail.current?.value));
  }, []);
  const onChangeName = React.useCallback(() => {
    setReader(refName.current?.value ?? '');
  }, []);
  const onSubmit = React.useCallback(() => {
    setLoading(true);
    setStatus('Saving...');
    props.onSubmit({
      speakerName: reader,
      gravatarHash: gravatarHash
    }).then((result: boolean) => {
      setLoading(false);
      setStatus(result ? 'Recording submitted, please reload to see your recording' : 'Unable to save your recording, see console for errors')
    });
  }, [props.onSubmit]);

  if (!props.visible) {
    return null;
  }

  return <div>
    <h2 className='submitRecordingHeader'>Submit Recording</h2>
    <div className='row'>
      <div className='col-lg-12'>
        <div className="mb-3">
          <label htmlFor="readerName">Reader Name</label>
          <input type="text" ref={refName} className="form-control" id="readerName" onKeyUp={onChangeName} placeholder="John Smith" />
        </div>
        <div className="mb-3">
          <label htmlFor="readerEmail">Author Gravatar Email</label>
          <div className="text-muted mb-1">Only used for gravatar lookup, email is not stored</div>
          <div className="input-group">
            <input type="text" ref={refEmail} className="form-control" id="readerEmail" placeholder="myemail@someplace.com" onKeyUp={onChangeEmail} />
            <span className="input-group-text">
              <img className='user-image' src={`https://s.gravatar.com/avatar/${gravatarHash}?s=30`} />
            </span>
          </div>
        </div>
      </div>
      <div className='col-lg-12'>
        <button className='btn btn-success btn-lg btn-block' onClick={onSubmit}>Submit</button>
        {status ?
          <div className="alert alert-info mt-3 mb-0" role="alert">
            {status}
          </div>
          : ''}
        {loading ? <div key="spinner" className="lds-facebook"><div></div><div></div><div></div></div> : ''}
      </div>
    </div>
  </div>
}