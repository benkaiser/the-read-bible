import React from 'react';
import { createRoot } from 'react-dom/client';
import { books, bookFiles, chapters } from "../data/books.js";

const App = () => {
  const [book, setBook] = React.useState('john');
  const [chapter, setChapter] = React.useState(3);
  const refBook = React.useRef(null);
  const refChapter = React.useRef(null);
  let numChapters = chapters[book];
  const goToRead = function() {
    window.location.href = `./readchapter?book=${book}&chapter=${chapter}`;
  };
  const onSelectBook = function() {
    setBook(refBook.current.value);
    setChapter(1);
  }
  const onSelectChapter = function() {
    setChapter(refChapter.current.value);
  }
  const pickRandom = function() {
    const bookIndex = Math.floor(Math.random() * books.length);
    const randomBook = bookFiles[bookIndex];
    setBook(randomBook);
    const randomChapter = Math.ceil(chapters[randomBook] * Math.random());
    setChapter(randomChapter);
  }

  return <div className='lead'>
    <div className='row'>
      <div className='col-md-5 mb-3'>
        <span>Book:</span>
        <select ref={refBook} value={book} onChange={onSelectBook} className='form-control'>
          {books.map((book, index) => {
            return <option key={book} value={bookFiles[index]}>{book}</option>;
          })}
        </select>
      </div>
      <div className='col-md-5 mb-3'>
        <span>Chapter:</span>
        <select ref={refChapter} onChange={onSelectChapter} value={chapter} className='form-control'>
          {Array.from(Array(numChapters).keys()).map((_, index) => {
            return <option key={index} value={index + 1}>{index + 1}</option>;
          })}
        </select>
      </div>
      <div className='col-md-2 mb-3 d-grid'>
        <button className='btn btn-secondary btn-block align-self-end' onClick={pickRandom}>
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

const container = document.getElementById('reactRoot');
const root = createRoot(container!);
root.render(<App />);