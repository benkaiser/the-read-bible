import { PrismaClient } from '@prisma/client/edge';

function exclude(recording: any, keys: string[]) {
  for (let key of keys) {
    delete recording[key]
  }
  return recording
}

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
    return prisma.recordings.findMany({ where: { approved: true } }).then((recordings) => {
      return new Response(JSON.stringify(recordings.map(recording => exclude(recording, ['submitterIp', 'approved', 'approvalKey']))));
    });
  } catch (exception) {
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}