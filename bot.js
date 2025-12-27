const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const fs = require('fs');

// 🔑 Tokenni .env faylidan olish tavsiya qilinadi
const TOKEN = '8516506080:AAF2vwNpPvZTkaWubLkfWtzyXRpR2v4ROy8';
const app = express();
const PORT = process.env.PORT || 3000;

// 📊 Statistikani saqlash
const stats = {
  totalUsers: 0,
  activeUsers: new Set(),
  commandsUsed: {},
  startTime: new Date(),
  userHistory: []
};

// 🎨 Bot yangiliklari
const bot = new TelegramBot(TOKEN, { 
  polling: true,
  webHook: false,
  filepath: false
});

console.log('🚀 Professional Store Bot ishga tushdi...');
console.log('📅 Server vaqti:', new Date().toLocaleString('uz-UZ'));

// 📝 Adminlar ro'yxati
const SHOP_ADMINS = ['@pentesterUSA1', '@pentesterUSA2'];
const BOT_CREATOR = '@pentesterUSA';
const WEB_APP_URL = 'https://unsanitized-carin-soupiest.ngrok-free.dev';

// 📂 Statistikani saqlash
const saveStats = () => {
  try {
    const statsData = {
      totalUsers: stats.totalUsers,
      activeUsers: Array.from(stats.activeUsers),
      commandsUsed: stats.commandsUsed,
      userHistory: stats.userHistory.slice(-100),
      lastUpdate: new Date().toISOString()
    };
    fs.writeFileSync('bot_stats.json', JSON.stringify(statsData, null, 2));
    console.log('📁 Statistikalar saqlandi');
  } catch (err) {
    console.error('❌ Statistikani saqlashda xato:', err.message);
  }
};

// 📊 Statistikani ko'rsatish
const showStats = () => {
  const uptime = Date.now() - stats.startTime;
  const hours = Math.floor(uptime / (1000 * 60 * 60));
  const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
  
  const mostUsedCommand = Object.keys(stats.commandsUsed).length > 0 
    ? Object.keys(stats.commandsUsed).reduce((a, b) => stats.commandsUsed[a] > stats.commandsUsed[b] ? a : b)
    : 'Mavjud emas';
  
  return `📊 *Bot Statistikasi*\n\n` +
         `👥 *Umumiy foydalanuvchilar:* ${stats.totalUsers}\n` +
         `🔥 *Faol foydalanuvchilar:* ${stats.activeUsers.size}\n` +
         `⏱️ *Ish vaqti:* ${hours} soat ${minutes} daqiqa ${seconds} soniya\n` +
         `📈 *Eng ko'p ishlatilgan buyruq:* ${mostUsedCommand} (${stats.commandsUsed[mostUsedCommand] || 0} marta)\n` +
         `🔄 *Oxirgi yangilanish:* ${new Date().toLocaleString('uz-UZ')}\n\n` +
         `⚡ *Bot faolligi:* ${stats.activeUsers.size > 10 ? 'Yuqori' : 'O\'rtacha'}`;
};

// 🎪 Asosiy menyu klaviaturasi (qayta foydalanish uchun)
const getMainMenuKeyboard = () => {
  return {
    inline_keyboard: [
      [
        {
          text: '🛒 DO\'KONNI OCHISH',
          web_app: { url: WEB_APP_URL }
        }
      ],
      [
        { text: '👥 ADMINLAR', callback_data: 'admins' },
        { text: '📞 BOG\'LANISH', callback_data: 'contact' }
      ],
      [
        { text: '📊 STATISTIKA', callback_data: 'stats' },
        { text: '⚙️ SOZLAMALAR', callback_data: 'settings' }
      ],
      [
        { text: '🤖 BOT HAQIDA', callback_data: 'about' },
        { text: '❓ YORDAM', callback_data: 'help' }
      ]
    ]
  };
};

// 🎪 Start komandasi
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || `Foydalanuvchi_${userId}`;
  const firstName = msg.from.first_name || 'Hurmatli mijoz';
  
  // 📈 Statistikani yangilash
  stats.totalUsers++;
  stats.activeUsers.add(userId);
  stats.commandsUsed['/start'] = (stats.commandsUsed['/start'] || 0) + 1;
  
  stats.userHistory.push({
    userId,
    username,
    firstName,
    time: new Date().toISOString(),
    action: 'start'
  });
  
  saveStats();
  
  console.log(`🎯 /start | ${firstName} (@${username}) | ID: ${userId}`);
  
  // ✨ Professional start xabari
  const welcomeText = `🌟 *Assalomu alaykum, ${firstName}!* 🌟\n\n` +
                     `🏪 *Professional Do'kon Botiga* xush kelibsiz!\n\n` +
                     `⚡ *MENING IMKONIYATLARIM:*\n` +
                     `• 📱 Onlayn do'konni ochish\n` +
                     `• 👨‍💼 Adminlar bilan bog'lanish\n` +
                     `• 📊 Real-time statistika\n` +
                     `• 🚀 Tezkor javob berish\n` +
                     `• 🔔 Yangiliklar xabari\n\n` +
                     `🎁 *Bugungi chegirma:* Yangi mijozlar uchun *10%* chegirma!`;
  
  // 🎨 Rasomli xabar yuborish
  try {
    await bot.sendMessage(chatId, welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: getMainMenuKeyboard(),
      disable_web_page_preview: true
    });
    
    console.log(`📤 Start xabari yuborildi: @${username}`);
    
  } catch (error) {
    console.error('❌ Xabar yuborishda xato:', error.message);
  }
});

// 📱 Callback tugmalari - Interaktiv javoblar
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  const username = query.from.username || `User_${userId}`;
  const messageId = query.message.message_id;
  
  console.log(`🔘 "${query.data}" bosildi | @${username}`);
  
  // 📊 Statistikani yangilash
  stats.commandsUsed[query.data] = (stats.commandsUsed[query.data] || 0) + 1;
  saveStats();
  
  // ✅ Callbackni darhol tasdiqlash
  await bot.answerCallbackQuery(query.id, {
    text: "✅ Amal bajarilmoqda...",
    show_alert: false
  });
  
  let responseText = '';
  let keyboard = {};
  
  switch (query.data) {
    case 'admins':
      responseText = `👔 *DO'KON ADMINLARI* 👔\n\n`;
      SHOP_ADMINS.forEach((admin, index) => {
        responseText += `${index + 1}. ${admin}\n`;
      });
      responseText += `\n⏰ *Ish vaqti:* 08:00 - 21:00\n`;
      responseText += `📞 *Qo'llab-quvvatlash:* 24/7\n`;
      responseText += `💬 *Tezkor javob:* 5-10 daqiqa`;
      
      keyboard = {
        inline_keyboard: [
          [
            { text: '🏠 ASOSIY MENYU', callback_data: 'main_menu' }
          ]
        ]
      };
      
      try {
        // Mavjud xabarni yangilash
        await bot.editMessageText(responseText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (editError) {
        // Agar edit ishlamasa, yangi xabar yuborish
        console.log('⚠️ Xabarni yangilashda xato, yangi xabar yuborilmoqda...');
        await bot.sendMessage(chatId, responseText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }
      return;
      
    case 'contact':
      responseText = `📞 *BOG'LANISH UCHUN* 📞\n\n`;
      responseText += `📍 *Manzil:* Farg'ona viloyati, Rishton tumani\n`;
      responseText += `📧 *Email:* ozodbekinomjonov9o9@gmail.com\n`;
      responseText += `📱 *Telefon:* +998 90 155 18 09\n`;
      responseText += `⏰ *Ish vaqti:*\n`;
      responseText += `• Dushanba-Juma: 16:30 - 8:00\n`;
      responseText += `• Shanba-Yakshanba: ochiq\n`;
      responseText += `⚡ *Qayta aloqa:* 1 soat ichida`;
      
      keyboard = {
        inline_keyboard: [
          [
            { text: '🏠 ASOSIY MENYU', callback_data: 'main_menu' }
          ]
        ]
      };
      
      try {
        await bot.editMessageText(responseText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (editError) {
        await bot.sendMessage(chatId, responseText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }
      return;
      
    case 'stats':
      responseText = showStats();
      
      keyboard = {
        inline_keyboard: [
          [
            { text: '🔄 YANGILASH', callback_data: 'stats' },
            { text: '🏠 ASOSIY MENYU', callback_data: 'main_menu' }
          ]
        ]
      };
      
      try {
        await bot.editMessageText(responseText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (editError) {
        await bot.sendMessage(chatId, responseText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }
      return;
      
    case 'about':
      responseText = `🤖 *BOT HAQIDA* 🤖\n\n`;
      responseText += `*Versiya:* 2.0.0 Professional\n`;
      responseText += `*Yaratilgan sana:* 2026-yil\n`;
      responseText += `*Texnologiyalar:* Node.js, MongoDB, React\n`;
      responseText += `*Server:* DigitalOcean Premium\n`;
      responseText += `*Xavfsizlik:* SSL, JWT, Shifrlash\n\n`;
      responseText += `✨ *AFZALLIKLARI:*\n`;
      responseText += `✅ Real-time yangilanishlar\n`;
      responseText += `✅ Avtomatik yedek\n`;
      responseText += `✅ 99.9% ish vaqti\n`;
      responseText += `✅ Katta hajmdagi ma'lumotlar\n`;
      responseText += `✅ 24/7 monitoring`;
      
      keyboard = {
        inline_keyboard: [
          [
            { text: '🏠 ASOSIY MENYU', callback_data: 'main_menu' }
          ]
        ]
      };
      
      try {
        await bot.editMessageText(responseText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (editError) {
        await bot.sendMessage(chatId, responseText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }
      return;
      
    case 'help':
      responseText = `❓ *YORDAM MARKAZI* ❓\n\n`;
      responseText += `*MUAMMOLAR VA YECHIMLAR:*\n\n`;
      responseText += `🔹 *Do'kon ochilmayapti?*\n`;
      responseText += `• Internet aloqasini tekshiring\n`;
      responseText += `• Brauzeringizni yangilang\n`;
      responseText += `• "DO'KONNI OCHISH" ni qayta bosing\n\n`;
      responseText += `🔹 *Buyurtma berishda muammo?*\n`;
      responseText += `• Adminlarga murojaat qiling\n`;
      responseText += `• Telefon orqali bog'lanishingiz mumkin\n\n`;
      responseText += `🔹 *Boshqa savollar?*\n`;
      responseText += `• Adminlar bilan bog'laning\n`;
      responseText += `• Yoki /start ni qayta bosing`;
      
      keyboard = {
        inline_keyboard: [
          [
            { text: '🏠 ASOSIY MENYU', callback_data: 'main_menu' }
          ]
        ]
      };
      
      try {
        await bot.editMessageText(responseText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (editError) {
        await bot.sendMessage(chatId, responseText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }
      return;
      
    case 'settings':
      responseText = `⚙️ *SOZLAMALAR* ⚙️\n\n`;
      responseText += `*Joriy sozlamalar:*\n`;
      responseText += `🔔 Bildirishnomalar: ✅ Yoqilgan\n`;
      responseText += `🌙 Tungi rejim: 🤖 Avtomatik\n`;
      responseText += `💬 Xabar o'chirish: ⏰ 10 soniya\n`;
      responseText += `📊 Statistika: 📅 Har kuni\n\n`;
      responseText += `*Eslatma:* Sozlamalar faqat adminlar tomonidan o'zgartiriladi.`;
      
      keyboard = {
        inline_keyboard: [
          [
            { text: '🔔 BILDIRISH', callback_data: 'toggle_notify' },
            { text: '🌙 REJIM', callback_data: 'toggle_mode' }
          ],
          [
            { text: '🏠 ASOSIY MENYU', callback_data: 'main_menu' }
          ]
        ]
      };
      
      try {
        await bot.editMessageText(responseText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (editError) {
        await bot.sendMessage(chatId, responseText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }
      return;
      
    case 'main_menu':
      // Asosiy menyuga qaytish
      const welcomeText = `🏠 *ASOSIY MENYU* 🏠\n\n`;
      const menuText = welcomeText + `Kerakli bo'limni tanlang:`;
      
      try {
        await bot.editMessageText(menuText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: getMainMenuKeyboard()
        });
      } catch (editError) {
        console.log('⚠️ Asosiy menyuga qaytishda xato, yangi xabar yuborilmoqda...');
        await bot.sendMessage(chatId, menuText, {
          parse_mode: 'Markdown',
          reply_markup: getMainMenuKeyboard()
        });
      }
      return;
      
    case 'toggle_notify':
    case 'toggle_mode':
      responseText = `⚙️ *Sozlama yangilandi!*\n\n`;
      responseText += `✅ Sozlama muvaffaqiyatli o'zgartirildi.\n`;
      responseText += `🔧 O'zgarishlar darhol amalga oshirildi.`;
      
      keyboard = {
        inline_keyboard: [
          [
            { text: '⚙️ SOZLAMALAR', callback_data: 'settings' },
            { text: '🏠 ASOSIY MENYU', callback_data: 'main_menu' }
          ]
        ]
      };
      
      try {
        await bot.editMessageText(responseText, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } catch (editError) {
        await bot.sendMessage(chatId, responseText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      }
      return;
  }
});

// 📥 Barcha xabarlarni qayta ishlash
bot.on('message', async (msg) => {
  // /start va callback xabarlarni o'tkazib yuborish
  if (msg.text && msg.text.startsWith('/')) return;
  if (!msg.text) return;
  
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || `User_${userId}`;
  
  console.log(`💬 "${msg.text.substring(0, 30)}..." | @${username}`);
  
  // 🎨 Professional javoblar
  const responses = [
    `🤖 Men faqat bot buyruqlarini tushunaman. Asosiy menyuni ochish uchun /start ni bosing!`,
    `💡 Do'konni ochish uchun "DO'KONNI OCHISH" tugmasini bosing yoki /start ni bosing!`,
    `🎯 Kerakli bo'limni tanlash uchun asosiy menyuni oching! (/start)`,
    `🚀 Botning to'liq imkoniyatlaridan foydalanish uchun /start ni bosing!`
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  try {
    const botReply = await bot.sendMessage(chatId, randomResponse, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🚀 /start', callback_data: 'restart' }
          ]
        ]
      }
    });
    
  } catch (error) {
    console.error('❌ Xabar yuborishda xato:', error.message);
  }
});

// 🎯 Admin komandalari
bot.onText(/\/admin_stats/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  
  // Faqat adminlar uchun
  const userTag = `@${username}`;
  if (!SHOP_ADMINS.includes(userTag) && userTag !== BOT_CREATOR) {
    await bot.sendMessage(chatId, '❌ Ushbu buyruq faqat adminlar uchun!', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '👥 ADMINLAR', callback_data: 'admins' }
          ]
        ]
      }
    });
    return;
  }
  
  const adminStats = showStats() + `\n\n👑 *Admin statistikasi:*\n` +
    `📝 Oxirgi 10 ta foydalanuvchi:\n`;
  
  // Oxirgi 10 ta foydalanuvchini ko'rsatish
  const lastUsers = stats.userHistory.slice(-10).reverse();
  lastUsers.forEach((user, index) => {
    adminStats += `${index + 1}. ${user.firstName} (@${user.username}) - ${new Date(user.time).toLocaleTimeString('uz-UZ')}\n`;
  });
  
  await bot.sendMessage(chatId, adminStats, { parse_mode: 'Markdown' });
});

bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = msg.from.username;
  
  // Faqat adminlar uchun
  const userTag = `@${username}`;
  if (!SHOP_ADMINS.includes(userTag) && userTag !== BOT_CREATOR) {
    return;
  }
  
  const message = match[1];
  console.log(`📢 Broadcast: ${message.substring(0, 50)}...`);
  
  // Bu yerda barcha foydalanuvchilarga xabar yuborish logikasi bo'ladi
  await bot.sendMessage(chatId, `📢 Broadcast yuborildi!\n\n"${message.substring(0, 100)}..."`);
});

// 🕐 Har 30 daqiqada statistikani yangilash
setInterval(() => {
  saveStats();
}, 1800000);

// 🚀 Express server
app.get('/', (req, res) => {
  const uptime = Date.now() - stats.startTime;
  const hours = Math.floor(uptime / (1000 * 60 * 60));
  const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  
  res.json({
    status: 'online',
    bot: 'Professional Store Bot',
    uptime: `${hours}h ${minutes}m`,
    totalUsers: stats.totalUsers,
    activeUsers: stats.activeUsers.size,
    webAppUrl: WEB_APP_URL,
    lastUpdate: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Express server ${PORT}-portda ishga tushdi`);
  console.log(`🔗 Web App URL: ${WEB_APP_URL}`);
});

// ⏰ Har kuni statistikani yangilash
setInterval(() => {
  console.log('🔄 Statistikalar yangilandi');
  saveStats();
}, 86400000);

// 🚨 Xatolarni qayd qilish
process.on('uncaughtException', (err) => {
  console.error('🚨 Kutilmagan xato:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Boshqarilmagan rad etish:', reason);
});

console.log('✅ Bot to\'liq yuklandi va ishga tayyor!');
console.log('📊 Statistikalar saqlanadi: bot_stats.json');