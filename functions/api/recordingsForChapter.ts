import { getDB } from '../db';

function exclude(recording: any, keys: string[]) {
  for (let key of keys) {
    delete recording[key]
  }
  return recording
}

export async function onRequestGet(context): Promise<Response> {
  try {
    const { searchParams } = new URL(context.request.url)
    let book = searchParams.get('book');
    let chapter = parseInt(searchParams.get('chapter'));
    const collection = await getDB(context);
    return collection.find({ book: book, chapter: chapter, approved: true }).then((recordings) => {
      console.log(recordings);
      return new Response(JSON.stringify(recordings.map(recording => exclude(recording, ['submitterIp', 'approved', 'approvalKey']))));
    }).catch(exception => {
      console.error(exception);
      console.error(exception.stack);
      throw exception;
    });
  } catch (exception) {
    console.error(new Error().stack);
    console.error(exception);
    console.error(exception.stack);
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}