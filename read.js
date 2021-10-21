import { React, ReactDOM, html } from "./deps.js";
import { books, bookFiles, chapters } from "./data/books.js";

const Selector = (props) => {
  const [book, setBook] = React.useState('john');
  const [chapter, setChapter] = React.useState(3);
  const refBook = React.useRef(null);
  const refChapter = React.useRef(null);
  let numChapters = chapters[book];
  console.log(numChapters);
  const goToRead = function() {
    console.log(book + ' - ' + refChapter.current.value);
    window.location.href = `./readchapter.html?book=${book}&chapter=${chapter}`;
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

  return html`<div className='lead'>
    <div className='row'>
      <div className='col-md-5 mb-3'>
        <span>Book:</span>
        <select defaultValue='john' ref=${refBook} value=${book} onChange=${onSelectBook} className='form-control'>
          ${books.map((book, index) => {
            return html`<option value="${bookFiles[index]}">${book}</option>`;
          })}
        </select>
      </div>
      <div className='col-md-5 mb-3'>
        <span>Chapter:</span>
        <select ref=${refChapter} onChange=${onSelectChapter} defaultValue='3' value=${chapter} className='form-control'>
          ${Array.from(Array(numChapters).keys()).map((_, index) => {
            return html`<option value="${index + 1}">${index + 1}</option>`;
          })}
        </select>
      </div>
      <div className='col-md-2 mb-3 d-grid'>
        <button className='btn btn-secondary btn-block align-self-end' onClick=${pickRandom}>
          <i className="bi bi-dice-3"></i>
        </button>
      </div>
    </div>
    <div className='d-grid'>
      <button className='btn btn-primary btn-lg btn-block' onClick=${goToRead}>Read</button>
    </div>
  </div>
  `;
}

const App = (props) => {
  return html`
  <${React.Fragment}>
    <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
    <header className="mb-auto">
      <div>
        <h3 className="float-md-start mb-0">The Read Bible</h3>
        <nav className="nav nav-masthead justify-content-center float-md-end">
          <a className="nav-link" aria-current="page" href="./">Home</a>
          <a className="nav-link active" href="#">Read</a>
          <a className="nav-link" href="listen.html">Listen</a>
          <a className="nav-link" href="listen.html#/submit">Submit</a>
        </nav>
      </div>
    </header>

    <main className="px-3">
      <h1>Read the Bible</h1>
      <p className="lead">Record yourself reading the Bible to share with others.</p>
      <${Selector} />
    </main>

    <footer className="mt-auto">
      <p>Created with ❤️ by <a href="https://benkaiser.dev/about">Benjamin Kaiser</a>.</p>
    </footer>
  </${React.Fragment}>
  `;
}

ReactDOM.render(
  html`<${App} />`,
  document.getElementById('root')
);