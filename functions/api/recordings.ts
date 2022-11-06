import { PrismaClient } from '@prisma/client/edge';

export async function onRequestGet(context): Promise<Response> {
  try {
    const env = context.env;
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL
        }
      }
    });
    return prisma.recordings.findMany().then((recordings) => {
      return new Response(JSON.stringify(recordings));
    });
  } catch (exception) {
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}