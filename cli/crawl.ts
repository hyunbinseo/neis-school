import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env } from 'node:process';

const { NEIS_API_KEY } = env;
if (!NEIS_API_KEY) throw new Error();

const url = new URL('https://open.neis.go.kr/hub/schoolInfo');

url.search = new URLSearchParams({
	Type: 'json',
	KEY: NEIS_API_KEY,
	pSize: '1000',
}).toString();

let index = 0;
const schools: Array<unknown> = [];

while (true) {
	url.searchParams.set('pIndex', (index + 1).toString());
	const response = await fetch(url); // NOTE status is always 200
	const body = (await response.json()) as ResponseBody;
	if (body.RESULT) break;
	if (body.schoolInfo[0].head[1].RESULT.CODE !== 'INFO-000') break;
	schools.push(...body.schoolInfo[1].row);
	const total = body.schoolInfo[0].head[0].list_total_count;
	console.log(`${schools.length.toString().padStart(total.toString().length, ' ')} / ${total}`);
	if (schools.length >= total) break;
	index += 1;
}

writeFileSync(
	join(import.meta.dirname, 'crawled.json'),
	JSON.stringify(schools, null, '\t') + '\n',
);

type Result = {
	RESULT: {
		CODE:
			| `ERROR-${'300' | '290' | '310' | '333' | '336' | '337' | '500' | '600' | '601'}`
			| `INFO-${'000' | '100' | '300' | '200'}`;
		MESSAGE: string;
	};
};

type ResponseBody =
	| (Result & { schoolInfo?: never })
	| {
			RESULT?: never;
			schoolInfo: [
				{ head: [{ list_total_count: number }, Result] }, //
				{ row: Array<unknown> },
			];
	  };
