import { React, ReactDOM, html } from "./deps.js";
import { books, bookFiles, chapters } from "./data/books.js";

const searchParams = new URLSearchParams(window.location.search);
const bookSelected = searchParams.get('book');
const chapterSelected = parseInt(searchParams.get('chapter'));
const bookIndex = bookFiles.findIndex(book => book === bookSelected);
const bookNiceName = books[bookIndex];

function newVerseElement(contents, lastId) {
  const span = document.createElement('span');
  span.classList.add('verseContents');
  span.id = lastId + 'C';
  contents.forEach(content => {
    if (typeof content === 'string') {
      const verseFragment = document.createElement('span');
      verseFragment.classList.add('verseFragment');
      verseFragment.textContent = content;
      span.appendChild(verseFragment);
    } else {
      span.appendChild(content);
    }
  });
  return span;
}

function insertVerses(nodeWithTextChildren) {
  let storedContents = [];
  let lastId = '';
  const newChildren = [];
  for (let x = 0; x < nodeWithTextChildren.childNodes.length; x++) {
    let currentNode = nodeWithTextChildren.childNodes[x];
    if (currentNode.nodeType === 1 && currentNode.className === 'verse') {
      if (storedContents.length > 0) {
        newChildren.push(newVerseElement(storedContents, lastId));
      }
      storedContents = [];
      lastId = currentNode.id;
      newChildren.push(currentNode);
      continue;
    }
    if (currentNode.nodeType === 3 && currentNode.textContent.trim().length === 0) {
      continue;
    } else if (currentNode.nodeType === 3) {
      storedContents.push(currentNode.textContent.trim());
    } else {
      storedContents.push(currentNode);
    }
  }
  if (storedContents.length > 0) {
    newChildren.push(newVerseElement(storedContents, lastId));
  }
  nodeWithTextChildren.innerHTML = '';
  newChildren.forEach(child => {
    nodeWithTextChildren.appendChild(child);
  });
  if (lastId) {
    return parseInt(lastId.replace('V', ''));
  } else {
    return 1;
  }
}

function processContent(contents) {
  const element = htmlToElement(contents);
  element.querySelector('.chapterlabel');
  const chapterLabel = element.querySelector('.chapterlabel').innerText;
  // replace only numbers with a book name
  if (/^[0-9]*$/.test(chapterLabel.trim())) {
    element.querySelector('.chapterlabel').innerText = bookNiceName + ' ' + chapterLabel;
  }
  // remove notemarks
  const notemarks = element.getElementsByClassName("notemark");
  while (notemarks[0]) {
      notemarks[0].parentNode.removeChild(notemarks[0]);
  }
  // create verse text containers
  const paragraphs = element.getElementsByClassName("p");
  let highestId = 0;
  for (let x = 0; x < paragraphs.length; x++) {
    highestId = insertVerses(paragraphs[x]);
  }

  return {
    contents: element.outerHTML,
    verseCount: highestId
  };
}

function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

const App = (props) => {
  const [content, setContent] = React.useState(undefined);
  const [verseCount, setVerseCount] = React.useState(1);
  const [verseIndex, setFocusedVerse] = React.useState(1);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    fetch(`./data/chapters/${bookSelected}${chapterSelected}.html`)
    .then(response => response.text())
    .then(responseHTML => {
      const {
        contents,
        verseCount: actualVerseCount
      } = processContent(responseHTML);
      setContent(contents);
      setVerseCount(actualVerseCount);
    });
  }, []);
  const handleUserKeyPress = React.useCallback(event => {
    const { key, keyCode, code } = event;
    if(key === 'ArrowDown' || key === 'ArrowRight'){
      setFocusedVerse(currentFocussedVerse => {
        if (currentFocussedVerse < verseCount) {
          return currentFocussedVerse + 1;
        } else {
          return currentFocussedVerse;
        }
      });
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      setFocusedVerse(currentFocussedVerse => {
        if (currentFocussedVerse - 1 > 0) {
          return currentFocussedVerse - 1;
        } else {
          return currentFocussedVerse;
        }
      });
    }
  }, [verseCount]);

  React.useEffect(() => {
    const verseContents = document.getElementById('V' + verseIndex + 'C');
    if (verseContents) {
      verseContents.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, [verseIndex]);

  React.useEffect(() => {
    window.addEventListener("keydown", handleUserKeyPress);
    return () => {
      window.removeEventListener("keydown", handleUserKeyPress);
    };
  }, [handleUserKeyPress]);

  const onTouch = React.useCallback((event) => {
    if (isMobile && event.target) {
      try {
        const verseContents = event.target.closest('.verseContents');
        const verseNumber = event.target.closest('.verse');
        if (verseContents || verseNumber) {
          const id = parseInt((verseContents || verseNumber).id.match(/\d+/)[0])
          setFocusedVerse(id);
        }
      } catch {
        /* no-op */
      }
    }
  }, [isMobile]);

  return html`
  <div className='readChapterContainer mx-auto'>
    ${ content ? html`<div className='scripture' onTouchStart=${() => setIsMobile(true)} onClick=${onTouch} dangerouslySetInnerHTML=${ { __html: content }}></div>
    ` : 'Loading' }
    <style dangerouslySetInnerHTML=${ { __html: `
      #V${verseIndex}, #V${verseIndex}C {
        color: black;
      }
      #V${verseIndex}C .wj {
        color: #d82e2e;
      }
    ` }}></style>
  </div>
  `;
}

ReactDOM.render(
  html`<${App} />`,
  document.getElementById('root')
);