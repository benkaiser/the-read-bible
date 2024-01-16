import * as Realm from 'realm-web';
import type { Services } from 'realm';

interface AudioTimestamp {
  verse: number;
  time: number;
}

export interface Recordings extends Services.MongoDB.Document {
  book: string;
  chapter: number;
  speaker: string;
  gravatarHash: string;
  videoId?: string;
  audioFilename?: string;
  audioTimestamps?: AudioTimestamp[];
  submitterIp?: string;
  createdAt: Date;
  approved: boolean;
  approvalKey?: string;
}

export async function getDB(context): Promise<Services.MongoDB.MongoDBCollection<Recordings>> {
  const App: Realm.App = new Realm.App(context.env.MONGODB_REALM_APPID);
  const credentials = Realm.Credentials.apiKey(context.env.MONGODB_REALM_API_KEY);
  var user = await App.logIn(credentials);
  return user.mongoClient('mongodb-atlas').db(context.env.DATABASE_NAME || 'mongo').collection<Recordings>('recordings') as unknown as Services.MongoDB.MongoDBCollection<Recordings>;
}