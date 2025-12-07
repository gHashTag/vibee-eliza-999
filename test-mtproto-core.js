#!/usr/bin/env node
/**
 * Тестируем @mtproto/core - альтернативную библиотеку
 * Возможно, у неё есть методы для получения всех групп
 */

const { MTProto } = require('@mtproto/core');

const api_id = 94892;
const api_hash = 'cacf9ad137d228611b49b2ecc6d68d43';
const session_string = '1ApWapzMBu7_l3Ag6iecyMij5-mFLMmQvi5axSimPVoH2QcUb9FBcWJ8Sq3aqEEri2kYJKts-fd2pUYKGWNYxQ10YrBmP7oN-Yoedb1HO1VFolcvKrqFciy63SowMnk80GRLmrqQ7ZHxVmGbd0uO1NhoDG2sBuvCC_B_9CxCpHo8WBL_83yjJND0OaAvXAfedTrPWgjFUn7h_Fn_5B5GnrWsj6g-u14J26NqEqg0bwa1o9TfHTzH0A5xhnUC5-WqdcU23jq_4lfWtwiCafzWf7g16Rm3R48io53Sho2dKL8nyQeAtNWSXmBvcrSmVnfrXQz0EC0qA0XzriuXoHzE-fukmXns725g=';

const mtproto = new MTProto({
  api_id,
  api_hash,
  storageOptions: {
    path: './mtproto-session.json',
  },
});

async function testGetAllChats() {
  console.log('🔍 Тестируем @mtproto/core для получения всех групп...');

  try {
    // Пробуем разные методы для получения всех чатов

    // Метод 1: messages.getDialogs
    console.log('\n🎯 [1] Пробуем messages.getDialogs...');
    try {
      const dialogs = await mtproto.call('messages.getDialogs', {
        offset_id: 0,
        offset_date: 0,
        hash_id: 0,
        limit: 100,
      });
      console.log('✅ messages.getDialogs сработал!');
      console.log(`   Найдено диалогов: ${dialogs.chats?.length || 0}`);
      console.log(`   Найдено пользователей: ${dialogs.users?.length || 0}`);

      if (dialogs.chats) {
        console.log('\n📋 Список чатов:');
        dialogs.chats.slice(0, 10).forEach((chat, i) => {
          console.log(`   ${i + 1}. ${chat.title} (ID: ${chat.id})`);
        });
      }

      return dialogs;
    } catch (error) {
      console.log(`❌ messages.getDialogs не сработал: ${error.error_message || error.message}`);
    }

    // Метод 2: messages.getAllChats (если есть)
    console.log('\n🎯 [2] Пробуем messages.getAllChats...');
    try {
      const allChats = await mtproto.call('messages.getAllChats', {});
      console.log('✅ messages.getAllChats сработал!');
      console.log(`   Найдено чатов: ${allChats.chats?.length || 0}`);
      return allChats;
    } catch (error) {
      console.log(`❌ messages.getAllChats не сработал: ${error.error_message || error.message}`);
    }

    // Метод 3: channels.getChannels
    console.log('\n🎯 [3] Пробуем channels.getChannels...');
    try {
      const channels = await mtproto.call('channels.getChannels', {
        id: [],
      });
      console.log('✅ channels.getChannels сработал!');
      console.log(`   Найдено каналов: ${channels.chats?.length || 0}`);
      return channels;
    } catch (error) {
      console.log(`❌ channels.getChannels не сработал: ${error.error_message || error.message}`);
    }

    // Метод 4: Получаем своего пользователя и ищем его группы
    console.log('\n🎯 [4] Получаем информацию о себе...');
    try {
      const me = await mtproto.call('users.getFullUser', {
        id: 'me',
      });
      console.log('✅ Получена информация о пользователе!');
      console.log(`   Общих чатов: ${me.full_user.common_chats_count}`);
      return me;
    } catch (error) {
      console.log(`❌ Не удалось получить информацию: ${error.error_message || error.message}`);
    }

  } catch (error) {
    console.error(`❌ Общая ошибка: ${error.error_message || error.message}`);
  }
}

async function testUserGroups() {
  console.log('\n🔍 Тестируем получение групп пользователя @neuro_sage (144022504)...');

  try {
    // Пробуем получить все диалоги и найти в них нашего пользователя
    const dialogs = await mtproto.call('messages.getDialogs', {
      offset_id: 0,
      offset_date: 0,
      hash_id: 0,
      limit: 1000,
    });

    console.log(`📊 Всего диалогов: ${dialogs.chats?.length || 0}`);

    if (dialogs.chats) {
      // Ищем пользователя 144022504 в каждом диалоге
      const userId = 144022504;
      const foundChats = [];

      for (const chat of dialogs.chats) {
        try {
          // Пробуем получить участников чата
          const participants = await mtproto.call('channels.getParticipants', {
            channel: chat.id,
            filter: { _: 'channelParticipantsRecent' },
            offset: 0,
            limit: 100,
          });

          // Ищем нашего пользователя среди участников
          const found = participants.participants.find(p => p.user_id === userId);

          if (found) {
            foundChats.push({
              id: chat.id,
              title: chat.title,
              type: chat._,
              participant: found,
            });
            console.log(`   ✅ Найдена группа: ${chat.title} (${chat._})`);
          }
        } catch (error) {
          // Некоторые группы могут быть приватными
        }
      }

      console.log(`\n🎯 НАЙДЕНО ГРУПП: ${foundChats.length}`);
      foundChats.forEach((chat, i) => {
        console.log(`   ${i + 1}. ${chat.title} (${chat.type})`);
      });

      return foundChats;
    }

  } catch (error) {
    console.error(`❌ Ошибка: ${error.error_message || error.message}`);
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 ТЕСТИРОВАНИЕ @MTPROTO/CORE');
  console.log('='.repeat(70));

  try {
    // Тест базовых методов
    await testGetAllChats();

    // Тест поиска групп пользователя
    await testUserGroups();

  } catch (error) {
    console.error(`❌ Критическая ошибка: ${error.error_message || error.message}`);
  }

  console.log('\n✅ Тестирование завершено');
}

main();
