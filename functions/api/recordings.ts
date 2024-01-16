import { getDB } from '../db';

function exclude(recording: any, keys: string[]) {
  for (let key of keys) {
    delete recording[key]
  }
  return recording
}

export async function onRequestGet(context): Promise<Response> {
  try {
    const collection = await getDB(context);
    return collection.find({ approved: true }).then((recordings) => {
      return new Response(JSON.stringify(recordings.map(recording => exclude(recording, ['submitterIp', 'approved', 'approvalKey']))));
    });
  } catch (exception) {
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}