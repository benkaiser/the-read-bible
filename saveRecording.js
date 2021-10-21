const fs = require('fs');
const path = require('path');
const { books, chapters } = require('./data/books');

const BOOK = unescape(process.env.BOOK);
const CHAPTER = parseInt(unescape(process.env.CHAPTER));
const SPEAKER = unescape(process.env.SPEAKER);
const GRAVATAR_HASH = unescape(process.env.GRAVATAR_HASH);
const VIDEOID = unescape(process.env.VIDEOID);

function validId(id) {
  return '/^[a-zA-Z0-9_-]{11}$/'.match(id);
}
if (!isValid(validId)) {
  console.error("Video ID is invalid");
  process.exit(1);
}

if (SPEAKER.length < 1) {
  console.error("Speaker must be specified");
  process.exit(1);
}

if (!books.includes(BOOK)) {
  console.error("Book is not a valid book");
  process.exit(1);
}
const numberOfChapters = chapters[BOOK];

if (CHAPTER < 1 || CHAPTER > numberOfChapters) {
  console.error("Chapter out of range for book specified");
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

fs.writeFileSync('./data/recordings.json', JSON.stringify(recordingsJson));

