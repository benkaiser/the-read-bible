import { bookFiles } from "../data/books.js";
const fs = require('fs');
let books = {};
bookFiles.forEach(fileName => {
  const bookFile = fs.readFileSync('../data/books/' + fileName + '.json');
  const jsonFile = JSON.parse(bookFile);
  let biggestChapter = 1;
  jsonFile.forEach(section => {
    if (section.chapterNumber > biggestChapter) {
      biggestChapter = section.chapterNumber;
    }
  });
  books[fileName] = biggestChapter;
});
fs.writeFileSync('../data/chapters.json', JSON.stringify(books));
