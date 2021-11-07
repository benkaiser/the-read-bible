import { React, ReactDOM, importUMD, html, PropTypes } from "./deps.js";
import { books, bookFiles, chapters } from "./data/books.js";

const _objMap = {};
const define = (moduleName, value) => {
  _objMap[moduleName] = value;
};
window.require = (module) => {
  return _objMap[module];
}

imports();

let HashRouter, Switch, Route, Link, useParams, withRouter;

async function imports() {
  define('react', React);
  const history = await importUMD('https://unpkg.com/history@5.0.1/umd/history.production.min.js');
  define('history', history);
  const ReactRouter = await importUMD('https://unpkg.com/react-router-dom@5.3.0/umd/react-router-dom.min.js');
  HashRouter = ReactRouter.HashRouter;
  Switch = ReactRouter.Switch;
  Route = ReactRouter.Route;
  Link = ReactRouter.Link;
  useParams = ReactRouter.useParams;
  withRouter = ReactRouter.withRouter;
  main();
}

function main() {
  const recordingForBook = (book, recordings) => {
    return recordings
      .filter(recording => recording.book === book)
      .sort((a, b) => a.chapter - b.chapter);
  };

  let youtubeIdRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const extractVideoId = (url) => {
    let match = url.match(youtubeIdRegex);
    return (match && match[2].length == 11) ? match[2] : false;
  }

  const SubmitView = (props) => {
    const [book, setBook] = React.useState(props.location?.state?.bookname || 'genesis');
    const [chapter, setChapter] = React.useState(1);
    const [gravatarHash, setGravatarHash] = React.useState('d41d8cd98f00b204e9800998ecf8427e');
    const [reader, setReader] = React.useState('John Smith');
    const [video, setVideo] = React.useState();
    const [status, setStatus] = React.useState();
    const [loading, setLoading] = React.useState(false);
    const refBook = React.useRef(null);
    const refChapter = React.useRef(null);
    const refEmail = React.useRef(null);
    const refName = React.useRef(null);
    const refVideo = React.useRef(null);

    let numChapters = chapters[book];
    const onSelectBook = function() {
      setBook(refBook.current.value);
      setChapter(1);
    }
    const onSelectChapter = function() {
      setChapter(refChapter.current.value);
    }
    const onChangeEmail = React.useCallback(() => {
      setGravatarHash(md5(refEmail.current.value));
    });
    const onChangeName = React.useCallback(() => {
      setReader(refName.current.value);
    });
    const onChangeVideo = React.useCallback(() => {
      setVideo(extractVideoId(refVideo.current.value));
    });
    const waitForUpload = React.useCallback((videoId, bookName) => {
      setInterval(() => {
        fetch('./data/recordings.json?cachebust=' + Math.random())
        .then(response => response.json())
        .then((response) => {
          if (response.findIndex(item => item.videoId === videoId) !== -1) {
            window.location.href = `listen#/book/${bookName}`;
            window.location.reload();
          }
        });
      }, 5000);
    });
    const onSubmit = React.useCallback(() => {
      const book = refBook.current.value;
      const chapter = refChapter.current.value;
      const speaker = refName.current.value;
      if (!speaker) {
        setStatus('Please add the name for the speaker of this video');
        return;
      }
      if (!video) {
        setStatus('Please provide a video');
        return;
      }
      setStatus('Adding recording');
      setLoading(true);
      fetch("https://publicactiontrigger.azurewebsites.net/api/dispatches/benkaiser/the-read-bible", {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ event_type: 'Create Paste', client_payload: { data: JSON.stringify({
          book: escape(book),
          chapter: escape(chapter),
          speaker: escape(speaker),
          gravatarHash: gravatarHash,
          videoId: escape(video)
        })}})
      }).then((response) => {
        if (response.status === 200 || response.status === 204) {
          setStatus('Processing. Will redirect when available (can take up to 1 minute)');
          setLoading(true);
          waitForUpload(video, book);
        } else {
          setStatus('Submit failed');
          setLoading(false);
        }
      }).catch(() => {
        setStatus('Submit failed');
        setLoading(false);
      });
    });
    return html`
      <div>
        <h1 className='mb-4'>Submit Reading</h1>
        <div className='row'>
          <div className='col-lg-6 col-md-12'>
            <div className="mb-3">
              <label htmlFor="book">Chapter</label>
              <select id="book" ref=${refBook} value=${book} onChange=${onSelectBook} className='form-control'>
                ${books.map((book, index) => {
                  return html`<option key="${bookFiles[index]}" value="${bookFiles[index]}">${book}</option>`;
                })}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="chapter">Chapter</label>
              <select id='chapter' ref=${refChapter} onChange=${onSelectChapter} value=${chapter} className='form-control'>
                ${Array.from(Array(numChapters).keys()).map((_, index) => {
                  return html`<option key="${index}" value="${index + 1}">${index + 1}</option>`;
                })}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="youtubeVideo">Youtube Video Link</label>
              <input type="text" ref=${refVideo} className="form-control" id="youtubeVideo" onKeyUp=${onChangeVideo} placeholder="https://www.youtube.com/watch?v=abc" />
            </div>
            <div className="mb-3">
              <label htmlFor="readerName">Reader Name</label>
              <input type="text" ref=${refName} className="form-control" id="readerName" onKeyUp=${onChangeName} placeholder="John Smith" />
            </div>
            <div className="mb-3">
              <label htmlFor="readerEmail">Author Gravatar Email</label>
              <div className="text-muted mb-1">Only used for gravatar lookup, email is not stored</div>
              <input type="text" ref=${refEmail} className="form-control" id="readerEmail" placeholder="myemail@someplace.com" onKeyUp=${onChangeEmail} />
            </div>
          </div>
          <div className='col-lg-6 col-md-12'>
            <h2>Preview</h2>
            <h3>${books[bookFiles.indexOf(book)]} - Chapter ${chapter}</h3>
            <div className='my-2'>
              <${RecordingCard} gravatarHash=${gravatarHash} videoId=${video} speaker=${reader} />
            </div>
            <button className='btn btn-success btn-lg btn-block mt-2 mb-3' onClick=${onSubmit}>Submit</button>
            ${ status ? html`
              <div className="alert alert-primary" role="alert">
                ${status}
              </div>
            ` : ''}
            ${ loading ? html`<div key="spinner" className="lds-facebook"><div></div><div></div><div></div></div>` : ''}
          </div>
        </div>
      </div>
    `;
  }
  const SubmitViewWithRouter = withRouter(SubmitView);

  const Book = (props) => {
    return html`
      <div className='col-md-3 col-sm-6 col-xs-12 mb-4'>
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">${props.bookName}</h5>
            <p className="card-text">
              ${ props.recordings.length > 0 ?
                html`${props.recordings.length} ${props.recordings.length === 1 ? 'reading' : 'readings'} available` :
                html`No readings available`
              }
            </p>
            ${ props.recordings.length > 0 ?
              html`<${Link} className="btn btn-primary" to='${`/book/${props.filename}`}'>View Readings</${Link}>` :
              html`<${Link} className="btn btn-success" to='${{ pathname: `/submit`, state: { bookname: props.filename}}}'>Submit Reading</${Link}>`
            }
          </div>
        </div>
      </div>
    `;
  }

  const RecordingCard = (props) => {
    const { gravatarHash, videoId, speaker } = props;
    return html`
      <div className="card">
        ${ videoId ? html`<iframe className='card-img-top' width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>` : undefined }
        <div className="card-body">
          <p className="card-text">
            <img className='user-image' src='https://s.gravatar.com/avatar/${gravatarHash}?s=50' /> Spoken by ${speaker}
          </p>
        </div>
      </div>
    `;
  }

  const BookView = (props) => {
    const params = useParams();
    const bookIndex = bookFiles.findIndex(item => item === params.bookname);
    const recordings = recordingForBook(params.bookname, props.data);
    let lastChapter = 0;
    return html`
      <div>
        <div>
        <${Link} className="btn btn-primary float-end" to="/">Back to All Books</${Link}>
        <h1>${books[bookIndex]}</h1>
        </div>
        <div className='row'>
          ${ recordings.map(recording => {
            const isNewChapter = lastChapter !== recording.chapter;
            lastChapter = recording.chapter;
            return html`
            <${React.Fragment} key=${recording.videoId}>
              ${ isNewChapter ? html`<h2>Chapter ${recording.chapter}</h2>` : undefined }
              <div className="col-lg-6 col-xl-4 mb-4">
                <${RecordingCard} gravatarHash=${recording.gravatarHash} videoId=${recording.videoId} speaker=${recording.speaker} />
              </div>
            </${React.Fragment}>
            `;
          })}
        </div>
      </div>
    `;
  }

  const Contents = (props) => {
    const [showEmpty, setShowEmpty] = React.useState(false);
    const onToggle = React.useCallback(() => {
      setShowEmpty(oldValue => !oldValue);
    }, []);
    return html`
      <div>
        <div className="form-check form-switch">
          <input className="form-check-input" checked=${showEmpty} type="checkbox" id="flexSwitchCheckDefault" onChange=${onToggle} />
          <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Show books without readings</label>
        </div>
        <div className='row mt-4'>
        ${ books.map((book, index) => {
          const recordings = recordingForBook(bookFiles[index], props.data);
          if (recordings.length === 0 && !showEmpty) {
            return '';
          }
          return html`<${Book} recordings=${recordings} key=${book} bookName=${book} filename=${bookFiles[index]} />`
        })}
        </div>
      </div>
    `;
  };

  const App = (props) => {
    const [data, setData] = React.useState();

    React.useEffect(() => {
      fetch('data/recordings.json?cachebust=' + Math.random())
      .then(response => response.json())
      .then(responseJson => {
        setData(responseJson);
      });
    }, []);

    if (!data) {
      return 'Loading';
    }

    return html`
    <div className='listen-container'>
      <${HashRouter}>
        <${Switch}>
          <${Route} path="/submit" children=${html`<${SubmitViewWithRouter} />`} />
          <${Route} path="/book/:bookname" children=${html`<${BookView} data=${data} />`} />
          <${Route}>
            <${Contents} data=${data} />
          </${Route}>
        </${Switch}>
      </${HashRouter}>
    </div>
    `;
  }

  ReactDOM.render(
    html`<${App} />`,
    document.getElementById('root')
  );

  function md5(inputString) {
    var hc="0123456789abcdef";
    function rh(n) {var j,s="";for(j=0;j<=3;j++) s+=hc.charAt((n>>(j*8+4))&0x0F)+hc.charAt((n>>(j*8))&0x0F);return s;}
    function ad(x,y) {var l=(x&0xFFFF)+(y&0xFFFF);var m=(x>>16)+(y>>16)+(l>>16);return (m<<16)|(l&0xFFFF);}
    function rl(n,c)            {return (n<<c)|(n>>>(32-c));}
    function cm(q,a,b,x,s,t)    {return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
    function ff(a,b,c,d,x,s,t)  {return cm((b&c)|((~b)&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t)  {return cm((b&d)|(c&(~d)),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t)  {return cm(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t)  {return cm(c^(b|(~d)),a,b,x,s,t);}
    function sb(x) {
        var i;var nblk=((x.length+8)>>6)+1;var blks=new Array(nblk*16);for(i=0;i<nblk*16;i++) blks[i]=0;
        for(i=0;i<x.length;i++) blks[i>>2]|=x.charCodeAt(i)<<((i%4)*8);
        blks[i>>2]|=0x80<<((i%4)*8);blks[nblk*16-2]=x.length*8;return blks;
    }
    var i,x=sb(inputString),a=1732584193,b=-271733879,c=-1732584194,d=271733878,olda,oldb,oldc,oldd;
    for(i=0;i<x.length;i+=16) {olda=a;oldb=b;oldc=c;oldd=d;
        a=ff(a,b,c,d,x[i+ 0], 7, -680876936);d=ff(d,a,b,c,x[i+ 1],12, -389564586);c=ff(c,d,a,b,x[i+ 2],17,  606105819);
        b=ff(b,c,d,a,x[i+ 3],22,-1044525330);a=ff(a,b,c,d,x[i+ 4], 7, -176418897);d=ff(d,a,b,c,x[i+ 5],12, 1200080426);
        c=ff(c,d,a,b,x[i+ 6],17,-1473231341);b=ff(b,c,d,a,x[i+ 7],22,  -45705983);a=ff(a,b,c,d,x[i+ 8], 7, 1770035416);
        d=ff(d,a,b,c,x[i+ 9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,     -42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
        a=ff(a,b,c,d,x[i+12], 7, 1804603682);d=ff(d,a,b,c,x[i+13],12,  -40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);
        b=ff(b,c,d,a,x[i+15],22, 1236535329);a=gg(a,b,c,d,x[i+ 1], 5, -165796510);d=gg(d,a,b,c,x[i+ 6], 9,-1069501632);
        c=gg(c,d,a,b,x[i+11],14,  643717713);b=gg(b,c,d,a,x[i+ 0],20, -373897302);a=gg(a,b,c,d,x[i+ 5], 5, -701558691);
        d=gg(d,a,b,c,x[i+10], 9,   38016083);c=gg(c,d,a,b,x[i+15],14, -660478335);b=gg(b,c,d,a,x[i+ 4],20, -405537848);
        a=gg(a,b,c,d,x[i+ 9], 5,  568446438);d=gg(d,a,b,c,x[i+14], 9,-1019803690);c=gg(c,d,a,b,x[i+ 3],14, -187363961);
        b=gg(b,c,d,a,x[i+ 8],20, 1163531501);a=gg(a,b,c,d,x[i+13], 5,-1444681467);d=gg(d,a,b,c,x[i+ 2], 9,  -51403784);
        c=gg(c,d,a,b,x[i+ 7],14, 1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);a=hh(a,b,c,d,x[i+ 5], 4,    -378558);
        d=hh(d,a,b,c,x[i+ 8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16, 1839030562);b=hh(b,c,d,a,x[i+14],23,  -35309556);
        a=hh(a,b,c,d,x[i+ 1], 4,-1530992060);d=hh(d,a,b,c,x[i+ 4],11, 1272893353);c=hh(c,d,a,b,x[i+ 7],16, -155497632);
        b=hh(b,c,d,a,x[i+10],23,-1094730640);a=hh(a,b,c,d,x[i+13], 4,  681279174);d=hh(d,a,b,c,x[i+ 0],11, -358537222);
        c=hh(c,d,a,b,x[i+ 3],16, -722521979);b=hh(b,c,d,a,x[i+ 6],23,   76029189);a=hh(a,b,c,d,x[i+ 9], 4, -640364487);
        d=hh(d,a,b,c,x[i+12],11, -421815835);c=hh(c,d,a,b,x[i+15],16,  530742520);b=hh(b,c,d,a,x[i+ 2],23, -995338651);
        a=ii(a,b,c,d,x[i+ 0], 6, -198630844);d=ii(d,a,b,c,x[i+ 7],10, 1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);
        b=ii(b,c,d,a,x[i+ 5],21,  -57434055);a=ii(a,b,c,d,x[i+12], 6, 1700485571);d=ii(d,a,b,c,x[i+ 3],10,-1894986606);
        c=ii(c,d,a,b,x[i+10],15,   -1051523);b=ii(b,c,d,a,x[i+ 1],21,-2054922799);a=ii(a,b,c,d,x[i+ 8], 6, 1873313359);
        d=ii(d,a,b,c,x[i+15],10,  -30611744);c=ii(c,d,a,b,x[i+ 6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21, 1309151649);
        a=ii(a,b,c,d,x[i+ 4], 6, -145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+ 2],15,  718787259);
        b=ii(b,c,d,a,x[i+ 9],21, -343485551);a=ad(a,olda);b=ad(b,oldb);c=ad(c,oldc);d=ad(d,oldd);
    }
    return rh(a)+rh(b)+rh(c)+rh(d);
  }
}
