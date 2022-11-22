import { PrismaClient } from '@prisma/client/edge';
interface Env {
  MY_BUCKET: R2Bucket
  DATABASE_URL: string
}

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: context.env.DATABASE_URL
        }
      }
    });
    const book = context.request.headers.get('book') as string;
    const chapter = context.request.headers.get('chapter') as string;
    const fileNameForAudio = `${+new Date()}_${book}_${chapter}.mp3`;
    await context.env.MY_BUCKET.put(fileNameForAudio, context.request.body, {
      httpMetadata: {
        contentType: 'audio/mpeg',
      }
    });
    return prisma.recordings.create({
      data: {
        book: book,
        chapter: parseInt(chapter),
        speaker: context.request.headers.get('speaker') as string,
        gravatarHash: context.request.headers.get('gravatarhash') as string,
        audioFilename: fileNameForAudio,
        submitterIp: context.request.headers.get('cf-connecting-ip'),
        audioTimestamps: JSON.parse(context.request.headers.get('audiotimestamps') as string),
      }
    }).then(() => {
      return new Response(JSON.stringify({ success: true }));
    });
  } catch (exception) {
    console.error(exception.stack);
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}