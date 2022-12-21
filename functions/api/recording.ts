import { Recordings } from '@prisma/client';
import { PrismaClient } from '@prisma/client/edge';
interface Env {
  MY_BUCKET: R2Bucket
  DATABASE_URL: string
}

function randomString(len) {
  var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return [...Array(len)].reduce(a => a + p[~~(Math.random() * p.length)], '');
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
    const approvalKey = randomString(32);
    return prisma.recordings.create({
      data: {
        book: book,
        chapter: parseInt(chapter),
        speaker: context.request.headers.get('speaker') as string,
        gravatarHash: context.request.headers.get('gravatarhash') as string,
        audioFilename: fileNameForAudio,
        submitterIp: context.request.headers.get('cf-connecting-ip'),
        audioTimestamps: JSON.parse(context.request.headers.get('audiotimestamps') as string),
        approved: false,
        approvalKey
      }
    }).then((record: Recordings) => sendEmail(record))
    .then(() => {
      return new Response(JSON.stringify({ success: true }));
    }).catch((exception) => {
      console.error(exception.stack);
      return new Response(JSON.stringify({ success: true, exception, message: exception.message }), { status: 200 });
    })
  } catch (exception) {
    console.error(exception.stack);
    return new Response(JSON.stringify(exception) + JSON.stringify(exception.message), { status: 500 });
  }
}

function sendEmail(record: Recordings): Promise<void> {
  const R2_URL = 'https://r2.thereadbible.com';
  const audioUrl = `${R2_URL}/${record.audioFilename}`;
  const emailBody = `
  <html>
  <head>
  </head>
  <body>
    <p>New recording created for ${record.book} ${record.chapter}</p>
    <p>Recording recorded by ${record.speaker}</p>
    <p>Here is a link to the recording file: <a href="${audioUrl}">${audioUrl}</a></p>
    <p>To approve, click this link: <a href="https://thereadbible.com/api/approve/${record.id}?key=${record.approvalKey}">Approve</a></p>
  </body>
  </html>
  `;
  const toAddress = 'thereadbible_user@kaiser.lol';
  const request = new Request('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: toAddress, name: 'The Read Bible Approver' }],
        },
      ],
      from: {
        email: 'thereadbible_sender@kaiser.lol',
        name: 'The Read Bible - Approvals',
      },
      subject: 'New Chapter Recording Created - Please review',
      content: [
        {
          type: 'text/html',
          value: emailBody,
        },
      ],
    }),
  });
  return fetch(request).then(response => response.text()).then(text => console.log(text));
}