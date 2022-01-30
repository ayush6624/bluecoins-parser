import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(Telegraf.log());

bot.hears('Hi', (ctx) => ctx.reply('Hey!'));

bot.on('callback_query', async (ctx) => {
  // @ts-expect-error data is present!
  const chosenChoice = (ctx.callbackQuery.data as string).includes('✅');
  await ctx.editMessageText(
    `${chosenChoice ? '✅ Marked\n' : '❌ Ignored\n'} ${
      // @ts-expect-error text is present!
      ctx.callbackQuery.message.text
    }`
  );
  await ctx.answerCbQuery('Done');
});

bot.launch();

export const sendMessage = async ({
  text,
  askConfirmation,
}: {
  text: string;
  askConfirmation?: boolean;
}) => {
  await bot.telegram.sendMessage(
    process.env.CHAT_ID,
    text,
    askConfirmation && {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✅',
              callback_data: '✅',
            },
            {
              text: '❌',
              callback_data: '❌',
            },
          ],
        ],
      },
    }
  );
};

export const notify = async ({ text }: { text: string }) => {
  await bot.telegram.sendMessage(process.env.CHAT_ID, text);
};

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Inline reply docs: {
//   ...Markup.inlineKeyboard([
//     Markup.button.callback('✅', '✅'),
//     Markup.button.callback('❌', '❌'),
//   ]),
