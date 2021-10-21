import fs from 'fs';
import { bookFiles, chapters } from './data/books.js';

const BOOK = unescape(process.env.BOOK);
const CHAPTER = parseInt(unescape(process.env.CHAPTER));
const SPEAKER = process.env.SPEAKER !== undefined ? unescape(process.env.SPEAKER) : undefined;
const GRAVATAR_HASH = process.env.GRAVATAR_HASH !== undefined ? unescape(process.env.GRAVATAR_HASH) : undefined;
const VIDEOID = unescape(process.env.VIDEOID);

function validId(id) {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}
if (!validId(VIDEOID)) {
  console.error("Video ID is invalid");
  process.exit(1);
}
if (!SPEAKER) {
  console.error("Speaker must be specified");
  process.exit(1);
}

if (!bookFiles.includes(BOOK)) {
  console.error("Book is not a valid book");
  process.exit(1);
}
const numberOfChapters = chapters[BOOK];

if (isNaN(CHAPTER) || CHAPTER < 1 || CHAPTER > numberOfChapters) {
  console.error("Chapter out of range for book specified");
  process.exit(1);
}

if (!GRAVATAR_HASH) {
  console.error("Gravatar hash must be provided");
  process.exit(1);

}

function escapeOutput(toOutput){
  return toOutput.replace(/\&/g, '&amp;')
      .replace(/\</g, '&lt;')
      .replace(/\>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/\'/g, '&#x27')
      .replace(/\//g, '&#x2F');
}

const recordings = fs.readFileSync('./data/recordings.json');
let recordingsJson = JSON.parse(recordings);
if (recordingsJson.findIndex(item => item.videoId === VIDEOID) !== -1) {
  console.error("Video already submitted");
  process.exit(1);
}
recordingsJson.push({
  book: BOOK,
  chapter: CHAPTER,
  speaker: escapeOutput(SPEAKER),
  gravatarHash: GRAVATAR_HASH,
  videoId: VIDEOID
});

fs.writeFileSync('./data/recordings.json', JSON.stringify(recordingsJson, null, 2));

