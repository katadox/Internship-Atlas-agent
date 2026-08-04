import { telegramNotifier } from '../notifications/TelegramNotifier.js';
import { env } from '../config/env.js';

async function main() {
  console.log('\n==================================================');
  console.log('📱 TELEGRAM NOTIFIER DIAGNOSTIC TOOL');
  console.log('==================================================\n');

  console.log(`Current TELEGRAM_BOT_TOKEN: ${env.TELEGRAM_BOT_TOKEN}`);
  console.log(`Current TELEGRAM_CHAT_ID:   ${env.TELEGRAM_CHAT_ID}`);

  if (env.TELEGRAM_BOT_TOKEN === 'mock-bot-token') {
    console.log('\n⚠️  Mock Bot Token Detected!');
    console.log('   To receive real Telegram alerts on your phone:');
    console.log('   1. Open Telegram and search for @BotFather');
    console.log('   2. Send /newbot to create your bot and copy your API Token.');
    console.log('   3. Search for @userinfobot or send a message to your bot and get your Chat ID.');
    console.log('   4. Update TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your .env file.\n');
    return;
  }

  console.log('\n🚀 Sending test notification to Telegram...');
  const success = await telegramNotifier.sendInternshipAlert({
    id: 'test-id',
    title: 'Senior AI Engineer Intern',
    companyName: 'Atlas Intelligence',
    description: 'Developing autonomous AI agents and vector pipelines.',
    location: 'Remote',
    country: 'India',
    isRemote: true,
    stipendMin: 40000,
    stipendMax: 50000,
    stipendCurrency: 'INR',
    applyUrl: 'https://github.com',
    canonicalUrl: 'https://github.com/test',
    contentHash: 'hash123',
    deadline: null,
    skills: ['AI/ML', 'Python'],
    status: 'RANKED',
    stipendText: '$5000 / month',
    overallScore: 95,
    resumeScore: 90,
  });

  if (success) {
    console.log('✅ Telegram message sent successfully!');
  } else {
    console.log('❌ Failed to send Telegram message. Check your token and chat ID.');
  }

  console.log('\n==================================================\n');
}

main().catch((err) => {
  console.error('Telegram Diagnostic Error:', err);
});
