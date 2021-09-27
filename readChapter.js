import { React, ReactDOM, html } from "./deps.js";
import { books, bookFiles, chapters } from "./data/books.js";

const searchParams = new URLSearchParams(window.location.search);
const bookSelected = searchParams.get('book');
const chapterSelected = parseInt(searchParams.get('chapter'));
const bookIndex = bookFiles.findIndex(book => book === bookSelected);

function filterToChapter(fullBook, chapterNumber) {
  let generatedChapter = [];
  let inChapter = false;
  for (let i = 0; i < fullBook.length; i++) {
    if (inChapter === false && fullBook[i].chapterNumber === chapterNumber) {
      inChapter = true;
      if (fullBook[i - 1] && fullBook[i - 1].type === 'paragraph start') {
        generatedChapter.push(fullBook[i - 1]);
      }
      generatedChapter.push(fullBook[i]);
    } else if (inChapter && fullBook[i].chapterNumber !== chapterNumber + 1) {
      generatedChapter.push(fullBook[i]);
    } else if (fullBook[i].chapterNumber === chapterNumber + 1) {
      inChapter = false;
      generatedChapter.pop();
      break;
    }
  }
  return generatedChapter;
}

function renderContent(content) {
  let finalString = [];
  let verseCounter = 0;
  content.forEach(contentPiece => {
    if (contentPiece.type == 'paragraph start') {
      finalString.push('<p>');
    }
    if (contentPiece.verseNumber > verseCounter) {
      finalString.push(`<span class='verse'>${contentPiece.verseNumber}</span>`);
      verseCounter = contentPiece.verseNumber;
    }
    let wjClass = '';
    if (contentPiece.wj) {
      wjClass = 'wj';
    }
    contentPiece.value && finalString.push(`<span class='${wjClass}'>${contentPiece.value}</span>`);
    if (contentPiece.type == 'paragraph end') {
      finalString.push('</p>');
    }
  });
  return finalString.join('');
}

const Reader = (props) => {
  return html`
  <div className='scripture' dangerouslySetInnerHTML=${ { __html: renderContent(props.content) }}>
  </div>
  `;
}

const App = (props) => {
  const [content, setContent] = React.useState(undefined);
  React.useEffect(() => {
    fetch(`./data/books/${bookSelected}.json`)
    .then(response => response.json())
    .then(responseJSON => {
      setContent(filterToChapter(responseJSON, chapterSelected));
    });
  }, []);
  return html`
  <div className='readChapterContainer mx-auto'>
    ${ content ? html`<${Reader} content=${content} />` : 'Loading' }
  </div>
  `;
}

ReactDOM.render(
  html`<${App} />`,
  document.getElementById('root')
);