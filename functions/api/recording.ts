import { PrismaClient } from '@prisma/client/edge';

export async function onRequestPost(context): Promise<Response> {
  const requestBody = await context.request.json();
  try {
    const {
      request,
      env
    } = context;
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL
        }
      }
    });
    return prisma.recordings.create({
      data: {
        book: requestBody.book,
        chapter: parseInt(requestBody.chapter),
        speaker: requestBody.speaker,
        gravatarHash: requestBody.gravatarHash,
        videoId: requestBody.videoId
      }
    }).then(() => {
      return new Response(JSON.stringify({ success: true }));
    });
  } catch (exception) {
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}