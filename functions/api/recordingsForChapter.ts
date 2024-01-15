import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate'

interface Env {
  DATABASE_URL: string
}

function exclude(recording: any, keys: string[]) {
  for (let key of keys) {
    delete recording[key]
  }
  return recording
}

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  try {
    const { searchParams } = new URL(context.request.url)
    let book = searchParams.get('book');
    let chapter = parseInt(searchParams.get('chapter'));
    const env = context.env;
    const prisma = new PrismaClient({
      datasourceUrl: env.DATABASE_URL
    }).$extends(withAccelerate());
    return prisma.recordings.findMany({ where: { book: book, chapter: chapter, approved: true }}).then((recordings) => {
      return new Response(JSON.stringify(recordings.map(recording => exclude(recording, ['submitterIp', 'approved', 'approvalKey']))));
    });
  } catch (exception) {
    console.trace();
    console.error(exception);
    console.error(exception.stack);
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}