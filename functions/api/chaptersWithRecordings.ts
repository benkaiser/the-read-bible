import { Prisma, PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

export async function onRequestGet(context): Promise<Response> {
  try {
    const env = context.env;
    const prisma = new PrismaClient({
      datasourceUrl: env.DATABASE_URL
    }).$extends(withAccelerate());
    return prisma.recordings.aggregateRaw({ pipeline: [
      { $match: { approved: true } },
      {$group: {_id: "$book", chapters: { $addToSet: "$chapter" }}}
    ]})
    .then((responses) => {
      const bookLookup = {};
      (responses as unknown as Array<Prisma.JsonObject>).forEach(response => {
        bookLookup[response._id as string] = (response.chapters as number[]).sort((a, b) => a - b);
      });
      return new Response(JSON.stringify(bookLookup));
    });
  } catch (exception) {
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}