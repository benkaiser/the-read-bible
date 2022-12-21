import { Recordings } from '@prisma/client';
import { PrismaClient } from '@prisma/client/edge';
interface Env {
  MY_BUCKET: R2Bucket
  DATABASE_URL: string
}

export async function onRequestGet(context: EventContext<Env, any, any>): Promise<Response> {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: context.env.DATABASE_URL
        }
      }
    });
    const { searchParams } = new URL(context.request.url);
    let key = searchParams.get('key')

    const recording: Recordings = await prisma.recordings.findFirst({ where: { id: (context.params.id as string), approvalKey: key } });
    if (recording) {
      await prisma.recordings.update({ where: { id: recording.id }, data: { approved: true } });
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
