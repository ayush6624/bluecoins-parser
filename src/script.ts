import { readFile, writeFile } from 'fs/promises';
import { xml2js } from 'xml-js';
import { Message, ParsedMessage } from './types/message';
import { getTransactionInfo } from 'transaction-sms-parser';
import { sendMessage } from './telegram';
import { PrismaClient } from '@prisma/client';
import { AMOUNT_MULTIPLIER } from './constants';
import {
  bluecoinsDateFormat,
  getAccountId,
  getAccountReferenceId,
  getItemName,
  getUniqueId,
} from './helper';

export const prisma = new PrismaClient();

const preProcessing = async (): Promise<Message[]> => {
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

export const processMessage = async (
  message: Partial<Message>
): Promise<void> => {
  const parsedMessage: ParsedMessage = {
    originalText: message.body,
    from: message.address,
    time: new Date(parseInt(message.date)),
    readableDate: new Date(parseInt(message.date)).toLocaleString(),
    parsed: getTransactionInfo(message.body),
  };

  if (
    parsedMessage.parsed.transactionType === '' ||
    parsedMessage.parsed.transactionAmount === '' ||
    parsedMessage.parsed.account.name === 'slice_card'
  ) {
    return sendMessage({
      text: message.body + JSON.stringify(parsedMessage.parsed, null, 2),
      askConfirmation: true,
    });
  } else {
    await sendMessage({
      text: '✅' + message.body + JSON.stringify(parsedMessage.parsed, null, 2),
    });
    return addTransactionToBluecoins(parsedMessage);
  }
};

const addTransactionToBluecoins = async (message: ParsedMessage) => {
  console.log('Getting items from the database');
  const items = await prisma.item.findMany();

  console.log('Creating a new item');
  const newItemTableId = getUniqueId(items, 'itemTableID');

  const item = await prisma.item.create({
    data: {
      itemTableID: newItemTableId,
      itemName: 'TEST ITEM #1',
      itemAutoFillVisibility: 0,
    },
  });

  console.log('Getting or creating item');

  const transactions = await prisma.transactions.findMany();
  const transactionId = getUniqueId(transactions, 'transactionsTableID');

  const previousSimilarTransaction = await prisma.transactions.findFirst({
    where: {
      itemID: item.itemTableID,
      deletedTransaction: 6,
    },
  });
  const categoryID = previousSimilarTransaction?.categoryID || 0;

  const { parsed: transaction } = message;

  console.log('Adding transaction to the database');
  const createData = {
    transactionsTableID: transactionId,
    itemID: item.itemTableID,
    amount:
      parseFloat(transaction.transactionAmount) *
      AMOUNT_MULTIPLIER *
      (transaction.transactionType === 'credit' ? 1 : -1),
    transactionCurrency: 'INR',
    conversionRateNew: 1,
    date: bluecoinsDateFormat(message.time),
    transactionTypeID: transaction.transactionType === 'debit' ? 3 : 4,
    categoryID,
    accountID: getAccountId(transaction.account),
    notes: `${message.from}: ${message.originalText} `,
    status: 0,
    accountReference: getAccountReferenceId(transaction.account),
    accountPairID: getAccountId(transaction.account),
    uidPairID: transactionId,
    deletedTransaction: 6,
    newSplitTransactionID: 0,
    transferGroupID: 0,
  };
  const columns = Object.keys(createData).sort();
  const values = columns.map((column) => createData[column]);
  await new Promise<void>((resolve, reject) => {
    prisma.$queryRawUnsafe(
      `
        INSERT INTO TRANSACTIONSTABLE (
          ${columns.join(',')}
        ) VALUES (
          ${Array(values.length).fill('?').join(',')}
        )
      `,
      values,
      (err) => {
        if (err) {
          console.error(err);
          reject(err);
        } else resolve();
      }
    );
  });
};

const main = async () => {
  const sms = await preProcessing();
  let result: ParsedMessage[] = [];
  const reviewPile: ParsedMessage[] = [];

  let str = '';
  sms.forEach((msg) => {
    const transactionInfo = getTransactionInfo(msg.body);
    if (
      !msg.body.includes('OTP') &&
      (msg.readable_date.includes('2020') ||
        msg.readable_date.includes('2021') ||
        msg.readable_date.includes('2022')) &&
      (transactionInfo.account.name !== undefined ||
        transactionInfo.account.type !== undefined ||
        transactionInfo.account.number !== undefined)
    ) {
      const parsedMessage = {
        originalText: msg.body,
        time: new Date(parseInt(msg.date)),
        readableDate: msg.readable_date,
        from: msg.address,
        parsed: transactionInfo,
      };
      const f = getItemName(msg.body);
      str += `${f}\n`;

      if (
        msg.body.includes('credit limit') ||
        msg.body.includes('To cancel this debit or your Standing') ||
        parsedMessage.parsed.account.name === 'slice_card'
      )
        reviewPile.push(parsedMessage);
      else if (transactionInfo.transactionType !== '')
        result.push(parsedMessage);
    }
  });

  await writeFile('str.txt', str);

  await sendMessage({ text: 'yoo' });
  console.log(`${result.length} results have been parsed`);
  console.log(`${reviewPile.length} results have been marked for review`);
  await writeFile('parsed.json', JSON.stringify(result, null, 2));
  await writeFile('review.json', JSON.stringify(reviewPile, null, 2));
};

main().then(() => {
  console.log('done');
});
