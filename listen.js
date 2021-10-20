import { React, ReactDOM, importUMD, html, PropTypes } from "./deps.js";
import { books, bookFiles, chapters } from "./data/books.js";

const _objMap = {};
const define = (moduleName, value) => {
  _objMap[moduleName] = value;
};
window.require = (module) => {
  return _objMap[module];
}
define('react', React);
const history = await importUMD('https://unpkg.com/history@5.0.1/umd/history.production.min.js');
define('history', history);
const ReactRouter = await importUMD('https://unpkg.com/react-router-dom@5.3.0/umd/react-router-dom.min.js');
const { HashRouter, Switch, Route, Link, useParams } = ReactRouter;

const recordingForBook = (book, recordings) => {
  return recordings
    .filter(recording => recording.book === book)
    .sort((a, b) => a.chapter - b.chapter);
};

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
            html`<${Link} className="btn btn-success" to='${`/submit`}'>Submit Reading</${Link}>`
          }
        </div>
      </div>
    </div>
  `;
}

const BookView = (props) => {
  const params = useParams();
  const bookIndex = bookFiles.findIndex(item => item === params.bookname);
  const recordings = recordingForBook(params.bookname, props.data);
  return html`
    <div>
      <div>
      <${Link} className="btn btn-primary float-end" to="/">Back to All Books</${Link}>
      <h1>${books[bookIndex]}</h1>
      </div>
      ${ recordings.map(recording => {
        return html`
        <div key=${recording.videoId}>
          <h2>Chapter ${recording.chapter}</h2>
          <p><img className='user-image' src='https://s.gravatar.com/avatar/${recording.gravatarHash}?s=50' /> Spoken by ${recording.speaker}</p>
          <iframe className='youtube-video' width="560" height="315" src="https://www.youtube.com/embed/${recording.videoId}" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen>
          </iframe>
        </div>
        `;
      })}
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
    fetch('data/recordings.json')
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