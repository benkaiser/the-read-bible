import { PrismaClient } from '@prisma/client/edge';
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
      datasources: {
        db: {
          url: env.DATABASE_URL
        }
      }
    });
    return prisma.recordings.findMany({ where: { book: book, chapter: chapter }}).then((recordings) => {
      return new Response(JSON.stringify(recordings.map(recording => exclude(recording, ['submitterIp']))));
    });
  } catch (exception) {
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}