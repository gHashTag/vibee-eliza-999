/**
 * Главный файл тестов для Instagram плагина
 * Объединяет все тесты: unit, integration и e2e
 */

import './unit/parseInstagramPost.test';
import './integration/instagramService.test';
import './e2e/instagramPlugin.e2e';

console.log('✅ Все тесты Instagram плагина загружены');
