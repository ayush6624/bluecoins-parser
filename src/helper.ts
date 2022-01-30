import { IAccountInfo } from 'transaction-sms-parser/build/main/lib/interface';
import {
  ACCOUNTS_TABLE_AMZN,
  ACCOUNTS_TABLE_BANK_ACCOUNT,
  ACCOUNTS_TABLE_CC_ACCOUNT,
  ACCOUNTS_TABLE_LAZYPAY,
  ACCOUNTS_TABLE_PAYTM,
  ACCOUNTS_TABLE_SIMPL,
  ACCOUNTS_TABLE_SLICE,
} from './constants';
import { sendMessage } from './telegram';

export const bluecoinsDateFormat = (date: Date): string =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .replace('T', ' ')
    .split('.')[0];

export const getAccountId = (account: IAccountInfo): number => {
  switch (account.type) {
    case 'ACCOUNT':
      return ACCOUNTS_TABLE_BANK_ACCOUNT;
    case 'CARD':
      if (account.number.includes('9006')) return ACCOUNTS_TABLE_CC_ACCOUNT;
      if (account.name.includes('slice_card')) return ACCOUNTS_TABLE_SLICE;
    case 'WALLET':
      switch (account.name) {
        case 'PAYTM':
          return ACCOUNTS_TABLE_PAYTM;
        case 'LazyPay':
          return ACCOUNTS_TABLE_LAZYPAY;
        case 'Simpl':
          return ACCOUNTS_TABLE_SIMPL;
        case 'Amazon':
          return ACCOUNTS_TABLE_AMZN;
        case 'Slice':
          return ACCOUNTS_TABLE_SLICE;
      }
    default:
      sendMessage({ text: 'NO ACCOUNT ID FOUND FOR: ' + account.name });
      return 0;
  }
};

export const getItemName = (text: string) => {
  const knownItemMap: Record<string, string> = {
    zomato: 'food',
    swiggy: 'food',
    upi: 'UPI',
    INREM: 'Pabio stipend',
    spotify: 'Spotify premium',
    youtube: 'YouTube premium',
    amazon: "Amazon"
  };
  let knownId;

  Object.entries(knownItemMap).forEach(([key, value]) => {
    if (text.toLowerCase().includes(key)) {
      knownId = value;
      return;
    }
  });

  if (knownId) return knownId;
  // await sendMessage({ text: 'NO ITEM NAME FOUND FOR: ' + text });
  console.warn({ text: 'NO ITEM NAME FOUND FOR: ' + text });

  return text;
};

export const getAccountReferenceId = async (
  account: IAccountInfo
): Promise<number> => {
  const accountId = getAccountId(account);
  if (
    accountId === ACCOUNTS_TABLE_LAZYPAY ||
    accountId === ACCOUNTS_TABLE_SIMPL
  )
    return 3;
  return 1;
};

export const getUniqueId = <T>(data: T[], identifier: string): number => {
  return (
    data
      .map((item) => Number(item[identifier]))
      .sort((a, b) => a - b)
      .pop() + 1
  );
};
