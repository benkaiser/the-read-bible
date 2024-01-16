import { getDB } from '../db';

export async function onRequestGet(context): Promise<Response> {
  try {
    const collection = await getDB(context);
    return collection.aggregate([
      { $match: { approved: true } },
      {$group: {_id: "$book", chapters: { $addToSet: "$chapter" }}}
    ])
    .then((responses) => {
      const bookLookup = {};
      (responses as unknown as Array<{ _id: string; chapters: number[] }>).forEach(response => {
        bookLookup[response._id as string] = response.chapters.sort((a, b) => a - b);
      });
      return new Response(JSON.stringify(bookLookup));
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