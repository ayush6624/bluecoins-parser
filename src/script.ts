import { readFile, writeFile } from 'fs/promises';
import { xml2js } from 'xml-js';
import { Message, ParsedMessage } from './types/message';
import { getTransactionInfo } from 'transaction-sms-parser';

const preProcessing = async () => {
  const file = await readFile('sms.xml', 'utf-8');
  const allMessages = xml2js(file, {
    ignoreComment: true,
    alwaysChildren: true,
  });

  const sms: Message[] = allMessages.elements[0].elements
    .filter((msg) => msg.name === 'sms')
    .map((msg) => msg.attributes);

  await writeFile('sms.json', JSON.stringify(sms, null, 2));
  return sms;
};

const main = async () => {
  const sms = await preProcessing();
  let result: ParsedMessage[] = [];
  const reviewPile: ParsedMessage[] = [];

  sms.forEach((msg) => {
    const transactionInfo = getTransactionInfo(msg.body);
    if (
      transactionInfo.account.name !== undefined ||
      transactionInfo.account.type !== undefined ||
      transactionInfo.account.number !== undefined
    ) {
      const parsedMessage = {
        originalText: msg.body,
        time: new Date(parseInt(msg.date)),
        readableDate: msg.readable_date,
        from: msg.address,
        parsed: transactionInfo,
      };

      if (transactionInfo.transactionType !== '') result.push(parsedMessage);
      else if (!msg.body.includes('OTP')) reviewPile.push(parsedMessage);
    }
  });

  console.log(`${result.length} results have been parsed`);
  console.log(`${reviewPile.length} results have been marked for review`);
  await writeFile('parsed.json', JSON.stringify(result, null, 2));
  await writeFile('review.json', JSON.stringify(reviewPile, null, 2));
};

main().then(() => console.log('Done'));
