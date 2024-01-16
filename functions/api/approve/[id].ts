import { Recordings, getDB } from "../../db";

interface Env {
  MY_BUCKET: R2Bucket
  DATABASE_URL: string
}

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  try {
    const collection = await getDB(context);
    const { searchParams } = new URL(context.request.url);
    let key = searchParams.get('key')

    const recording: Recordings = await collection.findOne({ where: { _id: (context.params.id as string), approvalKey: key } });
    if (recording) {
      await collection.updateOne({ _id: recording._id }, { approved: true });
      return new Response(`<html><body><h1>Recording Approved</h1><p><a href="/readchapter?book=${recording.book}&chapter=${recording.chapter}">Go to chapter</a></p></body></html>`, {
        headers: {
          'content-type': 'text/html'
        }
      });
    } else {
      return new Response(`<html><body><h1>Recording not found</h1></body></html>`, {
        headers: {
          'content-type': 'text/html'
        }
      });
    }
  } catch (exception) {
    console.error(exception.stack);
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}
