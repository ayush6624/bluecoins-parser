import { ITransactionInfo } from 'transaction-sms-parser/build/main/lib/interface';

export interface Message {
  protocol: string;
  address: string;
  date: string;
  type: string;
  subject: string;
  body: string;
  toa: string;
  sc_toa: string;
  service_center: string;
  read: string;
  status: string;
  locked: string;
  date_sent: string;
  sub_id: string;
  readable_date: string;
  contact_name: string;
}

export interface ParsedMessage {
  originalText: string;
  time: Date;
  readableDate: string;
  from: string;
  parsed: ITransactionInfo;
}
