import React from 'react';
import { createRoot } from 'react-dom/client';
import { books, bookFiles, chapters } from "../data/books.js";
import ListenControls from './components/ListenControls.js';
import RecordingControls from './components/RecordingControls.js';

const searchParams = new URLSearchParams(window.location.search);
const bookSelected = searchParams.get('book');
const chapterSelected = parseInt(searchParams.get('chapter')!);
const bookIndex = bookFiles.findIndex(book => book === bookSelected);
const bookNiceName = books[bookIndex];

function newVerseElement(contents, lastId: string): HTMLSpanElement {
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

function insertVerses(nodeWithTextChildren: Element, lastIdAsNumber) {
  let storedContents: Array<string|Node> = [];
  const newChildren: Array<Node> = [];
  let lastId = 'V' + lastIdAsNumber;
  for (let x = 0; x < nodeWithTextChildren.childNodes.length; x++) {
    let currentNode: ChildNode = nodeWithTextChildren.childNodes[x];
    if (currentNode.nodeType === 1 && (currentNode as HTMLElement).className === 'verse') {
      if (storedContents.length > 0) {
        newChildren.push(newVerseElement(storedContents, lastId));
      }
      storedContents = [];
      lastId = (currentNode as HTMLElement).id;
      newChildren.push(currentNode.cloneNode(true));
      continue;
    }
    if (currentNode.nodeType === 3 && (currentNode as Text).textContent?.trim().length === 0) {
      continue;
    } else if (currentNode.nodeType === 3) {
      storedContents.push((currentNode as Text).textContent!.trim());
    } else {
      storedContents.push(currentNode.cloneNode(true));
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

function processContent(contents: string): { contents: string, verseCount: number} {
  const element = htmlToElement(contents);
  element.querySelector('.chapterlabel');
  const chapterLabel: string = element.querySelector<HTMLElement>('.chapterlabel')?.innerText ?? '';
  // replace only numbers with a book name
  if (/^[0-9]*$/.test(chapterLabel.trim())) {
    element.querySelector<HTMLElement>('.chapterlabel')!.innerText = bookNiceName + ' ' + chapterLabel;
  }
  // remove notemarks
  const notemarks = element.getElementsByClassName("notemark");
  while (notemarks[0]) {
      notemarks[0].parentNode?.removeChild(notemarks[0]);
  }
  // create verse text containers
  const paragraphs = element.querySelectorAll(".p, .q, .q2, .m, .pi, .pi2, .pi3, .pmr, .pr, .pmo, .pmc, .psi, .pc, .nb");
  let highestId = 1;
  for (let x = 0; x < paragraphs.length; x++) {
    highestId = insertVerses(paragraphs[x], highestId);
  }

  return {
    contents: element.outerHTML,
    verseCount: highestId
  };
}

function addFooter(html: string): string {
  return html + "<p class='copyright'>World English Bible (WEBBE) - Public Domain</p>";
}

function htmlToElement(html: string): HTMLElement {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild as HTMLElement;
}

const App = () => {
  const [content, setContent] = React.useState<string>('');
  const [verseCount, setVerseCount] = React.useState(1);
  const [verseIndex, setFocusedVerse] = React.useState<number | null>(null);
  const [inListenMode, setInListenMode] = React.useState(true);
  type RecordingControlsHandle = React.ElementRef<typeof RecordingControls>;
  const recordingControlsRef = React.useRef<RecordingControlsHandle>(null);

  React.useEffect(() => {
    fetch(`./data/chapters/${bookSelected}${chapterSelected}.html`)
    .then(response => response.text())
    .then(responseHTML => {
      const {
        contents,
        verseCount: actualVerseCount
      } = processContent(responseHTML);
      setContent(addFooter(contents));
      setVerseCount(actualVerseCount);
    });
  }, []);
  React.useEffect(() => {
    recordingControlsRef.current?.changeVerse(verseIndex ?? 1);
  }, [verseIndex]);
  const handleUserKeyPress = React.useCallback(event => {
    const { key, keyCode, code } = event;
    if(key === 'ArrowDown' || key === 'ArrowRight'){
      setFocusedVerse(currentFocussedVerse => {
        if (currentFocussedVerse === null) {
          return null;
        }
        if (currentFocussedVerse < verseCount) {
          return currentFocussedVerse + 1;
        } else {
          return currentFocussedVerse;
        }
      });
    } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
      setFocusedVerse(currentFocussedVerse => {
        if (currentFocussedVerse === null) {
          return null;
        }
        if (currentFocussedVerse - 1 > 0) {
          return currentFocussedVerse - 1;
        } else {
          return currentFocussedVerse;
        }
      });
    }
  }, [verseCount]);

  React.useEffect(() => {
    if (verseIndex !== null) {
      const verseContents = document.getElementById('V' + verseIndex + 'C');
      if (verseContents) {
        verseContents.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
    }
  }, [verseIndex]);

  React.useEffect(() => {
    window.addEventListener("keyup", handleUserKeyPress);
    return () => {
      window.removeEventListener("keyup", handleUserKeyPress);
    };
  }, [handleUserKeyPress]);

  const onSwitchMode = () => {
    setInListenMode(!inListenMode);
  }

  const onTouch = React.useCallback((event) => {
    if (event.target && verseIndex !== null) {
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
  }, [verseIndex]);

  const focusAll = React.useCallback(() => {
    setFocusedVerse(null);
  }, []);

  return <div className='readChapterContainer mx-auto'>
    <div className='controlsHeader clearfix position-sticky border rounded p-2 bg-white'>
      { inListenMode ?
        <ListenControls book={bookSelected!} chapter={chapterSelected} onSwitch={onSwitchMode} verseCount={verseCount} changeVerse={setFocusedVerse} focusAll={focusAll} /> :
        <RecordingControls book={bookSelected} chapter={chapterSelected} onSwitch={onSwitchMode} changeVerse={setFocusedVerse} focusAll={focusAll} ref={recordingControlsRef} />}
    </div>
    { content ? <div id="tour-stop-scripture" className='scripture my-2' onClick={onTouch} dangerouslySetInnerHTML={ { __html: content }}></div> : 'Loading' }
    <style dangerouslySetInnerHTML={ { __html: verseIndex === null ? `:root { --verse-color: black; --words-of-jesus-color: #d82e2e }` : `
      #V${verseIndex}, #V${verseIndex}C {
        color: black;
      }
      #V${verseIndex}C .wj {
        color: #d82e2e;
      }
    ` }}></style>
  </div>;
}

const Nav = () => {
  const lastChapter = bookSelected === 'revelation' && chapterSelected === 22;
  const firstChapter = bookSelected === 'genesis' && chapterSelected === 1;
  let nextChapter, previousChapter;
  let nextBook = bookSelected;
  let previousBook = bookSelected;
  if (chapters[bookSelected] > chapterSelected + 1) {
    nextChapter = chapterSelected + 1;
  } else {
    nextChapter = 1;
    nextBook = bookFiles[bookFiles.indexOf(bookSelected) + 1];
  }
  if (chapterSelected - 1 > 0) {
    previousChapter = chapterSelected - 1;
  } else {
    previousBook = bookFiles[bookFiles.indexOf(bookSelected) - 1];
    previousChapter = chapters[previousBook];
  }
  return <>
      <a className="nav-link" href="./">Home</a>
      { !firstChapter && <a className="nav-link" href={`?book=${previousBook}&chapter=${previousChapter}`}>Previous</a> }
      { !lastChapter && <a className="nav-link" href={`?book=${nextBook}&chapter=${nextChapter}`}>Next</a> }
  </>;
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);

const nav = document.getElementById('nav');
const navRoot = createRoot(nav!);
navRoot.render(<Nav />);