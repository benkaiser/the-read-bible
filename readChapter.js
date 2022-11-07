import { React, ReactDOM, html } from "./deps.js";
import { books, bookFiles } from "./data/books.js";

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

function insertVerses(nodeWithTextChildren, lastIdAsNumber) {
  let storedContents = [];
  const newChildren = [];
  let lastId = 'V' + lastIdAsNumber;
  for (let x = 0; x < nodeWithTextChildren.childNodes.length; x++) {
    let currentNode = nodeWithTextChildren.childNodes[x];
    if (currentNode.nodeType === 1 && currentNode.className === 'verse') {
      if (storedContents.length > 0) {
        newChildren.push(newVerseElement(storedContents, lastId));
      }
      storedContents = [];
      lastId = currentNode.id;
      newChildren.push(currentNode.cloneNode(true));
      continue;
    }
    if (currentNode.nodeType === 3 && currentNode.textContent.trim().length === 0) {
      continue;
    } else if (currentNode.nodeType === 3) {
      storedContents.push(currentNode.textContent.trim());
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

function addFooter(html) {
  return html + "<p class='copyright'>World English Bible (WEBBE) - Public Domain</p>";
}

function htmlToElement(html) {
  var template = document.createElement('template');
  html = html.trim(); // Never return a text node of whitespace as the result
  template.innerHTML = html;
  return template.content.firstChild;
}

const worker = new Worker('worker.js');
let recorder;
let mp3Blob;
let mp3BlobUrl;

const RecordingControls = (props) => {
  const [ currentlyRecording, setCurrentlyRecording] = React.useState(false);
  const [ recordingCreated, setRecordingCreated ] = React.useState(!!mp3Blob);
  const audioRef = React.useRef(null);

  React.useEffect(() => {
    if (mp3BlobUrl && audioRef.current) {
      audioRef.current.src = mp3BlobUrl;
    }
  }, []);
  const startRecording = () => {
    setCurrentlyRecording(true);
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
      .then(
        (stream) => {
          const mediaStream = stream;
          recorder = new window.mp3MediaRecorder.Mp3MediaRecorder(stream, { worker });
          let blobs = [];
          recorder.start();

          recorder.onstart = (e) => {
            console.log('onstart', e);
            blobs = [];
          };

          recorder.ondataavailable = (e) => {
            console.log('ondataavailable', e);
            blobs.push(e.data);
          };

          recorder.onstop = (e) => {
            console.log('onstop', e);
            mediaStream.getTracks().forEach((track) => track.stop());

            mp3Blob = new Blob(blobs, { type: 'audio/mpeg' });
            mp3BlobUrl = URL.createObjectURL(mp3Blob);
            audioRef.current.src = mp3BlobUrl;
          };

          recorder.onpause = (e) => {
            console.log('onpause', e);
          };

          recorder.onresume = (e) => {
            console.log('onresume', e);
          };

          recorder.onerror = (e) => {
            console.error('onerror', e);
          };
        },
        (reason) => {
          console.warn('Could not get microphone access.\nError:', reason.message);
        }
      );
  };
  const stopRecording = () => {
    setCurrentlyRecording(false);
    setRecordingCreated(true);
    recorder.stop();
  }
  const playRecording = () => {
    audioRef.current.play();
  }
  return html`
    <div className="recordingControls">
      ${ !currentlyRecording && recordingCreated ? html`<button className="playButton btn btn-primary me-2" onClick=${playRecording}>Play</button>` : ''}
      ${ !currentlyRecording ? html`<button className="recordButton btn btn-primary me-2" onClick=${startRecording}>${ recordingCreated ? `New Recording` : `Record` }</button>` : ''}
      ${ currentlyRecording ? html`<button className="stopButton btn btn-primary" onClick=${stopRecording}>Finish</button>` : ''}
      <button onClick=${props.onSwitch} className="btn btn-secondary float-end">Back to Listen Mode</button>
      <audio src="" ref=${audioRef}></audio>
    </div>
  `;
}

const ListenControls = (props) => {
  return html`
    <div className='listenControls'><div>Select a speaker or </div><button onClick=${props.onSwitch} className='btn btn-secondary float-end'>Record Your Own</button></div>
  `;
}

const App = (props) => {
  const [content, setContent] = React.useState(undefined);
  const [verseCount, setVerseCount] = React.useState(1);
  const [verseIndex, setFocusedVerse] = React.useState(1);
  const [isMobile, setIsMobile] = React.useState(false);
  const [inListenMode, setInListenMode] = React.useState(true);

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

  const onSwitchMode = () => {
    setInListenMode(!inListenMode);
  }

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
    <div className='controlsHeader clearfix position-sticky border rounded p-2 bg-white'>
      ${ inListenMode ?
        html`<${ListenControls}  onSwitch=${onSwitchMode} />` :
        html`<${RecordingControls} onSwitch=${onSwitchMode} />`}
    </div>
    ${ content ? html`<div className='scripture my-2' onTouchStart=${() => setIsMobile(true)} onClick=${onTouch} dangerouslySetInnerHTML=${ { __html: content }}></div>
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