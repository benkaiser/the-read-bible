import { React, ReactDOM, html } from "./deps.js";
import { books, bookFiles, chapters } from "./data/books.js";

const recordingForBook = (book, recordings) => {
  return recordings
    .filter(recording => recording.book === book)
    .sort((a, b) => a.chapter - b.chapter);
};

const Book = (props) => {
  return html`
    <div>
      <h2 className='bookName'>${props.bookName}</h2>
      ${ props.recordings.map(recording => {
        return html`
        <iframe key=${recording.videoId} width="560" height="315" src="https://www.youtube.com/embed/${recording.videoId}" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen>
        </iframe>
        `;
      })}
    </div>
  `;
}

const Contents = (props) => {
  const [showEmpty, setShowEmpty] = React.useState(true);
  const onToggle = React.useCallback(() => {
    setShowEmpty(oldValue => !oldValue);
  }, []);
  return html`
    <div>
      <div className="form-check form-switch">
        <input className="form-check-input" type="checkbox" id="flexSwitchCheckDefault" onClick=${onToggle} />
        <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Only Show Books with Recordings</label>
      </div>
      ${ books.map((book, index) => {
        const recordings = recordingForBook(bookFiles[index], props.data);
        if (recordings.length === 0 && !showEmpty) {
          return '';
        }
        return html`<${Book} recordings=${recordings} key=${book} bookName=${book} filename=${bookFiles[index]} />`
      })}
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

  return html`
  <div className='listen-container'>
    <h1>Listen to Others</h1>
    ${ data ? html`<${Contents} data=${data} />` : html`Loading...` }
  </div>
  `;
}

ReactDOM.render(
  html`<${App} />`,
  document.getElementById('root')
);