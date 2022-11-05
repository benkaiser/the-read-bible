// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://mongo:<password>@thereadbible.iyfjpov.mongodb.net/?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });
import { PrismaClient } from '@prisma/client/edge';

export async function onRequestGet(context): Promise<Response> {
  // Contents of context object
  const {
    request, // same as existing Worker API
    env, // same as existing Worker API
    params, // if filename includes [id] or [[path]]
    waitUntil, // same as ctx.waitUntil in existing Worker API
    passThroughOnException, // same as ctx.passThroughOnException in existing Worker API
    next, // used for middleware or to fetch assets
    data, // arbitrary space for passing data between middlewares
  } = context;
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
}