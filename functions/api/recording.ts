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
    const formData = await context.request.formData();
    const book = formData.get('book') as string;
    const chapter = formData.get('chapter') as string;
    const fileNameForAudio = `${+new Date()}_${book}_${chapter}.mp3`;
    await context.env.MY_BUCKET.put(fileNameForAudio, formData.get('audioFile'), {
      httpMetadata: {
        contentType: 'audio/mpeg',
      }
    });
    return prisma.recordings.create({
      data: {
        book: book,
        chapter: parseInt(chapter),
        speaker: formData.get('speaker') as string,
        gravatarHash: formData.get('gravatarHash') as string,
        audioFilename: fileNameForAudio,
        audioTimestamps: JSON.parse(formData.get('audioTimestamps') as string),
      }
    }).then(() => {
      return new Response(JSON.stringify({ success: true }));
    });
  } catch (exception) {
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}