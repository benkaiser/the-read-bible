import React from 'react';
import { createRoot } from 'react-dom/client';
import { Mp3MediaRecorder } from 'mp3-mediarecorder';
import { books, bookFiles } from "../data/books.js";

const searchParams = new URLSearchParams(window.location.search);
const bookSelected = searchParams.get('book');
const chapterSelected = parseInt(searchParams.get('chapter')!);
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

function secondsToMinuteSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secondsLeft = Math.floor(seconds % 60);
  return `${minutes}:${secondsLeft.toString().padStart(2, '0')}`;
}

let currentTimeInterval;

const CurrentTime = (props) => {
  const [ duration, setDuration ] = React.useState(props.audio.duration || 0);
  // only used to force a state update
  const [ _, setCurrentTime ] = React.useState(0);
  const currentTime = props.audio.currentTime;
  props.audio.addEventListener('loadedmetadata', () => {
    setDuration(props.audio.duration);
  });
  React.useEffect(() => {
    currentTimeInterval = setInterval(() => {
      setCurrentTime(props.audio.currentTime);
    }, 100);
    return () => {
      currentTimeInterval && clearInterval(currentTimeInterval);
    };
  }, []);
  return <span className='currentTime'>{ secondsToMinuteSeconds(currentTime) } / { secondsToMinuteSeconds(duration) }</span>;
}

const Pause = () => {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#fff" className="bi bi-pause" viewBox="0 0 16 16">
    <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
  </svg>;
}

const Play = () => {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#fff" className="bi bi-play" viewBox="0 0 16 16">
    <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/>
  </svg>;
}

const Recording = () => {
  return <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="#f00" className="bi bi-record2" viewBox="0 0 16 16">
    <path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0 1A5 5 0 1 0 8 3a5 5 0 0 0 0 10z"/>
    <path d="M10 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
  </svg>;
}

const worker = new Worker('./dist/worker.js');
let recorder;
let mp3Blob;
let mp3BlobUrl;

const RecordingControls = (props) => {
  const [ currentlyRecording, setCurrentlyRecording] = React.useState(false);
  const [ recordingCreated, setRecordingCreated ] = React.useState(!!mp3Blob);
  const [ isPlaying, setIsPlaying ] = React.useState(false);
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
          recorder = new Mp3MediaRecorder(stream, { worker });
          let blobs = [];
          recorder.start();

          recorder.onstart = (e) => {
            blobs = [];
          };

          recorder.ondataavailable = (e) => {
            blobs.push(e.data);
          };

          recorder.onstop = (e) => {
            mediaStream.getTracks().forEach((track) => track.stop());

            mp3Blob = new Blob(blobs, { type: 'audio/mpeg' });
            mp3BlobUrl = URL.createObjectURL(mp3Blob);
            audioRef.current.src = mp3BlobUrl;
          };

          recorder.onpause = (e) => {
            // no-op
          };

          recorder.onresume = (e) => {
            // no-op
          };

          recorder.onerror = (e) => {
            // todo: handle error
            console.error('onerror', e);
          };
        },
        (reason) => {
          console.warn('Could not get microphone access.\nError:', reason.message);
        }
      );
  };
  const stopRecording = () => {
    recorder.stop();
    setCurrentlyRecording(false);
    setRecordingCreated(true);
  }
  const playRecording = () => {
    audioRef.current.play();
    setIsPlaying(true);
  }
  const pauseRecording = () => {
    setIsPlaying(false);
    audioRef.current.pause();
  }
  const onPause = () => {
    setIsPlaying(false);
  }
  return <div className="recordingControls">
      <div className="leftControls">
        { !currentlyRecording && recordingCreated ? <button className="playButton btn btn-primary" onClick={isPlaying ? pauseRecording : playRecording}>{ isPlaying ? <Pause /> : <Play /> }</button> : ''}
        { !currentlyRecording ? <button className="recordButton btn btn-primary" onClick={startRecording}>{ recordingCreated ? `New Recording` : `Record` }</button> : ''}
        { currentlyRecording ? <button className="stopButton btn btn-primary" onClick={stopRecording}>Finish</button> : ''}
        <span className='stats'>
          { currentlyRecording ? <Recording /> : recordingCreated ? <CurrentTime audio={audioRef.current} /> : '' }
        </span>
      </div>
      <div className='rightControls'>
        <button onClick={props.onSwitch} className="btn btn-secondary float-end">Back to Listen Mode</button>
      </div>
      <audio onPause={onPause} src="" ref={audioRef}></audio>
    </div>;
}

const ListenControls = (props) => {
  return <div className='listenControls'><div>Select a speaker or </div><button onClick={props.onSwitch} className='btn btn-secondary float-end'>Record Your Own</button></div>;
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

  return <div className='readChapterContainer mx-auto'>
    <div className='controlsHeader clearfix position-sticky border rounded p-2 bg-white'>
      { inListenMode ?
        <ListenControls  onSwitch={onSwitchMode} /> :
        <RecordingControls onSwitch={onSwitchMode} />}
    </div>
    { content ? <div className='scripture my-2' onTouchStart={() => setIsMobile(true)} onClick={onTouch} dangerouslySetInnerHTML={ { __html: content }}></div> : 'Loading' }
    <style dangerouslySetInnerHTML={ { __html: `
      #V${verseIndex}, #V${verseIndex}C {
        color: black;
      }
      #V${verseIndex}C .wj {
        color: #d82e2e;
      }
    ` }}></style>
  </div>;
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);