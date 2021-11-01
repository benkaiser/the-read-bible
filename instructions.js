import { React, ReactDOM, html } from "./deps.js";
import { books, bookFiles, chapters } from "./data/books.js";

// const Selector = (props) => {
//   const [book, setBook] = React.useState('john');
//   const [chapter, setChapter] = React.useState(3);
//   const refBook = React.useRef(null);
//   const refChapter = React.useRef(null);
//   let numChapters = chapters[book];
//   const onSelectBook = function() {
//     setBook(refBook.current.value);
//     setChapter(1);
//   }
//   const onSelectChapter = function() {
//     setChapter(refChapter.current.value);
//   }

//   return html`<div className='lead'>
//     <div className='row'>
//       <div className='col-md-5 mb-3'>
//         <span>Book:</span>
//         <select defaultValue='john' ref=${refBook} value=${book} onChange=${onSelectBook} className='form-control'>
//           ${books.map((book, index) => {
//             return html`<option value="${bookFiles[index]}">${book}</option>`;
//           })}
//         </select>
//       </div>
//       <div className='col-md-5 mb-3'>
//         <span>Chapter:</span>
//         <select ref=${refChapter} onChange=${onSelectChapter} defaultValue='3' value=${chapter} className='form-control'>
//           ${Array.from(Array(numChapters).keys()).map((_, index) => {
//             return html`<option value="${index + 1}">${index + 1}</option>`;
//           })}
//         </select>
//       </div>
//       <div className='col-md-2 mb-3 d-grid'>
//         <button className='btn btn-secondary btn-block align-self-end' onClick=${pickRandom}>
//           <i className="bi bi-dice-3"></i>
//         </button>
//       </div>
//     </div>
//   </div>
//   `;
// }

const DesktopInstructions = () => {
  return html`
    <div className='mt-4'>
      <p>
        <ol>
          <li>Download and install <a href='https://obsproject.com/'>OBS Studio</a></li>
          <li>Upon launching you should be shown the profile create wizard, select "Optimize for recording"</li>
          <li>Select to use the resolution of your display</li>
          <li>Select 30fps, since the content does not need a high refresh rate</li>
          <li>In the sources section, add "Display capture" for your screen and "Audio input capture" for your microphone</li>
          <li>(Optional) Add "Video Capture Device" to add your webcam to the scene, resize it so it sits in the bottom right corner</li>
          <li>Test the sound levels to make sure your spoken words are reaching the yellow section of the bar in the meter shown</li>
          <li>You are now ready to record using the "Start recording" button on the right-hand side.</li>
        </ol>
      </p>
    </div>
  `;
}

const iOSInstructions = () => {
  return html`
    <div className='mt-4'>
      <p>
        Follow the instructions <a href="https://support.apple.com/en-au/HT207935" target="_blank">provided by Apple</a>. Unfortunately capturing your webcam while recording isn't natively supported on iOS. Make sure to include your microphone audio in the recording.
      </p>
    </div>
  `;
}

const AndroidInstructions = () => {
  return html`
    <div className='mt-4'>
      <p>
        Install an application to perform the screen recording, preferably without a watermark. <a href="https://play.google.com/store/apps/details?id=com.littlea.ezscreencorder" target="_blank">Ez Screen Recorder</a> is a free option that let's you do everything you need, even including your selfie camera if you would like.
        <ol>
          <li>Install the app</li>
          <li>Open the app and access the settings menu</li>
          <li>Select custom resolution and set it to the highest value</li>
          <li>Enable "Audio Record"</li>
          <li>Select "Hide Bubble Menu" to keep the screen clear when recording</li>
          <li>(Optionally) Click the camera bubble and the avatar icon to add your selfie camera to the screen and position it in the bottom corner</li>
          <li>Select the camera icon and then press the red dot to begin recording</li>
        </ol>
        The app also comes with an editor that let's you trim the ends of your recording once you are done.
      </p>
    </div>
  `;
}

const Information = () => {
  const [platform, setPlatform] = React.useState();
  return html`
  <div>
    <h2>Setting up the Recording App</h2>
    <p>Which device are you recording on?</p>
    <div className="btn-group" role="group">
      <input type="radio" className="btn-check" name="btnradio" id="btncheck1" onClick=${() => setPlatform('desktop')} />
      <label className="btn btn-primary" htmlFor="btncheck1">Desktop</label>
      <input type="radio" className="btn-check" name="btnradio" id="btncheck2" onClick=${() => setPlatform('ios')} />
      <label className="btn btn-primary" htmlFor="btncheck2">iOS</label>
      <input type="radio" className="btn-check" name="btnradio" id="btncheck3" onClick=${() => setPlatform('android')} />
      <label className="btn btn-primary" htmlFor="btncheck3">Android</label>
    </div>
    ${ platform === 'desktop' && html`<${DesktopInstructions} />` }
    ${ platform === 'ios' && html`<${iOSInstructions} />` }
    ${ platform === 'android' && html`<${AndroidInstructions} />` }
    ${ platform === undefined && html`<p className='text-muted'>Select a platform to show instructions</p>` }
    <h2>Creating the Recording</h2>
    <p>
      Once you have an app set up to record, navigate back to <a href='read'>the read page</a>, select a chapter and click "Read".
    </p>
    <p>
      Once you have the chapter visible, enter full-screen mode in your web browser and begin the recording.
      From here you can <b>use the arrow keys on desktop, or touch on mobile to move the focus between verses</b>.
      The verses will scroll as you tap/arrow between them. Read through the whole chapter and then stop the recording.
    </p>
    <p>
      On your device you can trim the recording to before you start reading and after you finish. If you don't have a way to do this, you can proceed to the next step and use Youtube's video trimming tool.
    </p>
    <h2>Uploading the Recording</h2>
    <p>
      The process is straightforward for uploading the video to Youtube. Go to <a href="https://youtube.com/upload" target="_blank">youtube.com/upload</a>. From here you can select your recording file and fill in the details of the video.
      <ul>
        <li>For the title, use the following format "${"<"}Book Name${">"} Chapter ${"<"}X${">"} - WEBBE - The Read Bible", e.g. "John Chapter 3 - WEBBE - The Read Bible"</li>
        <li>For the description, you can use something like the following, feel free to copy in the full chapter contents too:
          <textarea className="w-100" style=${{ height: "100px"}}>
            Created for The Read Bible - The crowd-sourced audio bible

https://thereadbible.com/listen
          </textarea>
        </li>
      </ul>
    </p>
    <h2>Submitting the Recording</h2>
    <p>
      Visit the <a href="listen#/submit" target="_blank">submit page</a>. From there you can select which Chapter you are submitting a reading for, link to the youtube video of the recording, and enter your email to fetch your gravatar. If you don't have a gravatar set up, you can <a href="https://gravatar.com/" target="_blank">create one</a>.
    </p>
    <p>
      All done! Once you submit it'll take a minute to process, then you'll redirect to the book page which contains your chapter reading.
    </p>
  </div>
  `;
}

const App = (props) => {
  return html`
  <${React.Fragment}>
    <div className="instructions-container d-flex w-100 h-100 p-3 mx-auto flex-column">
    <header className="mb-auto">
      <div>
        <h3 className="float-md-start mb-0">The Read Bible</h3>
        <nav className="nav nav-masthead justify-content-center float-md-end">
          <a className="nav-link" href="./">Home</a>
          <a className="nav-link" href="#">Read</a>
          <a className="nav-link" href="listen">Listen</a>
          <a className="nav-link" href="listen#/submit">Submit</a>
        </nav>
      </div>
    </header>

    <main className="py-4">
      <h1>Recording Insturctions</h1>
      <${Information} />
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