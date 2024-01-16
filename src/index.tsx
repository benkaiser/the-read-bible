import React from 'react';
import { createRoot } from 'react-dom/client';
import { books, bookFiles, bookNameToFileName, chapters } from "../data/books.js";
import { IChaptersAvailable } from '../interfaces/IChaptersAvailable.js';

const App = () => {
  const [book, setBook] = React.useState('john');
  const [chapter, setChapter] = React.useState(3);
  const [available, setAvailable] = React.useState<IChaptersAvailable | undefined>();
  const refBook = React.useRef(null);
  const refChapter = React.useRef(null);
  let numChapters = chapters[book];
  const goToRead = function() {
    window.location.href = `./readchapter?book=${book}&chapter=${chapter}`;
  };
  const onSelectBook = function() {
    setBook(refBook.current.value);
    if (available && available[refBook.current.value]) {
      setChapter(available[refBook.current.value][0]);
    } else {
      setChapter(1);
    }
  }
  const onSelectChapter = function() {
    setChapter(refChapter.current.value);
  }
  const pickRandom = function() {
    if (available) {
      const availableBooks = Object.keys(available);
      const bookIndex = Math.floor(Math.random() * availableBooks.length);
      const randomBook = availableBooks[bookIndex];
      setBook(randomBook);
      const randomChapterIndex = Math.floor(available[randomBook].length * Math.random());
      setChapter(available[randomBook][randomChapterIndex]);
      return;
    }
    const bookIndex = Math.floor(Math.random() * books.length);
    const randomBook = bookFiles[bookIndex];
    setBook(randomBook);
    const randomChapter = Math.ceil(chapters[randomBook] * Math.random());
    setChapter(randomChapter);
  }

  const toggleOnlyReadings = () => {
    if (available) {
      setAvailable(undefined);
      setBook('john');
      setChapter(3);
      return;
    }
    getAvailableData().then((availableChapters: IChaptersAvailable) => {
      setAvailable(availableChapters);
      setBook('john');
      setChapter(3);
    });
  };

  return <div className='lead'>
    <div className='row'>
      <div className='col-md-3 col-sm-6 mb-3'>
        <span>Book:</span>
        <select ref={refBook} value={book} onChange={onSelectBook} className='form-control'>
          {books.filter(book => {
            if (available) {
              return available[bookNameToFileName(book)];
            }
            return true;
          }).map((book) => {
            return <option key={book} value={bookNameToFileName(book)}>{book}</option>;
          })}
        </select>
      </div>
      <div className='col-md-2 col-sm-6 mb-3'>
        <span>Chapter:</span>
        <select ref={refChapter} onChange={onSelectChapter} value={chapter} className='form-control'>
          {(available && available[book] ? available[book] : Array.from(Array(numChapters).keys()).map((_, index) => index + 1))
          .map(chapter => {
            return <option key={chapter} value={chapter}>{chapter}</option>;
          })}
        </select>
      </div>
      <div className='col-md-5 col-sm-6 col-6 mb-3 d-grid'>
        <button className={'btn btn-outline-secondary btn-block align-self-end filter-button' + (available ? ' active' : '')} data-bs-toggle="button"  onClick={toggleOnlyReadings}>
        { !available ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel me-2" viewBox="0 0 16 16">
            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2zm1 .5v1.308l4.372 4.858A.5.5 0 0 1 7 8.5v5.306l2-.666V8.5a.5.5 0 0 1 .128-.334L13.5 3.308V2h-11z"/>
          </svg>
        : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-funnel-fill me-2" viewBox="0 0 16 16">
            <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.692V13.5a.5.5 0 0 1-.342.474l-3 1A.5.5 0 0 1 6 14.5V8.692L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z"/>
          </svg>
        }
        Filter with readings
        </button>
      </div>
      <div className='col-md-2 col-sm-6 col-6 mb-3 d-grid'>
        <button className='btn btn-secondary btn-block align-self-end random-button' onClick={pickRandom}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-dice-3" viewBox="0 0 16 16">
            <path d="M13 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h10zM3 0a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V3a3 3 0 0 0-3-3H3z"/>
            <path d="M5.5 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm8 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-4-4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
          </svg>
        </button>
      </div>
    </div>
    <div className='d-grid'>
      <button className='btn btn-primary btn-lg btn-block' onClick={goToRead}>Read</button>
    </div>
  </div>;
}

let availableDataCache: Promise<IChaptersAvailable> | undefined;
function getAvailableData(): Promise<IChaptersAvailable> {
  if (availableDataCache) {
    return Promise.resolve(availableDataCache);
  }
  availableDataCache = fetch(`/api/chaptersWithRecordings`)
  .then(response => response.json())
  .then((availableChapters: IChaptersAvailable) => {
    return availableChapters;
  }).catch((error) => {
    console.error('Failed to fetch filtered chapters');
    console.error(error);
    availableDataCache = undefined;
    throw error;
  });
  return availableDataCache;
}

const container = document.getElementById('reactRoot');
const root = createRoot(container!);
root.render(<App />);