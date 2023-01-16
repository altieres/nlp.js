/*
 * Copyright (c) AXA Group Operations Spain S.A.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const { Connector } = require('@nlpjs/connector');
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');

class TelegramConnector extends Connector {
  registerDefault() {
    this.container.registerConfiguration(
      'telegram',
      { log: true, channelId: 'telegram' },
      false
    );
  }

  log(level, msg) {
    if (this.settings.log) {
      this.container.get('logger')[level](msg);
    }
  }

  initialize() {
    this.context = {};

    this.telegraf = new Telegraf(process.env.TELEGRAM_TOKEN || '');
    this.telegraf.hears(message, (ctx) => {
      this.hear(ctx);
    });
    this.telegraf.catch((err, ctx) => {
      this.log(
        'error',
        `Ooops, Telegraf encountered an error for ${ctx.updateType}`
      );
    });
    this.telegraf.launch().then(() => {
      this.log('info', 'Telegram initialized.');
    });
  }

  async hear(telegramContext) {
    const line = telegramContext.update.message.text;

    const nlp = this.container.get('nlp');
    if (nlp) {
      const result = await nlp.process(
        {
          message: line,
          channel: 'telegram',
          app: this.container.name,
        },
        undefined,
        this.context
      );
      this.say(result, telegramContext);
    } else {
      this.log('error', 'There is no nlp configured');
    }
  }

  say(activity, telegramContext) {
    telegramContext.reply(activity.answer);
  }

  close() {
    this.telegraf.stop();
  }

  exit() {
    process.exit();
  }
}

module.exports = TelegramConnector;
