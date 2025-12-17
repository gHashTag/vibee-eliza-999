/**
 * genderDetection.ts
 *
 * Единая утилита для определения пола по русскому/английскому имени.
 * Использует библиотеку sex-by-russian-name как primary,
 * с fallback на анализ окончаний для транслитерированных имён.
 */

import { SexByRussianName } from 'sex-by-russian-name';

// Инициализируем детектор для русских имён
const russianNameDetector = new SexByRussianName();

/**
 * Исключения: мужские имена на -а/-я (русские)
 */
const MALE_NAME_EXCEPTIONS = [
  'илья', 'никита', 'саша', 'женя', 'валя', 'миша', 'коля', 'петя',
  'вася', 'дима', 'лёша', 'серёжа', 'алёша', 'ваня', 'толя', 'лёня',
  'гриша', 'стёпа', 'костя', 'витя', 'митя', 'федя', 'боря', 'юра',
  'гоша', 'лёва', 'паша', 'тёма', 'кирилла',
  // Транслит
  'ilya', 'nikita', 'sasha', 'zhenya', 'valya', 'misha', 'kolya',
  'petya', 'vasya', 'dima', 'lyosha', 'seryozha', 'vanya', 'tolya',
  'grisha', 'kostya', 'vitya', 'fedya', 'borya', 'yura', 'gosha',
  'pasha', 'tyoma', 'tema',
];

/**
 * Известные женские имена (транслит и английские)
 */
const FEMALE_NAMES = [
  // Русские (транслит)
  'marina', 'katya', 'katia', 'kate', 'karina', 'daria', 'dasha', 'polina',
  'alina', 'arina', 'kristina', 'christina', 'diana', 'lena', 'elena', 'helen',
  'irina', 'ira', 'natasha', 'tanya', 'tatiana', 'olga', 'oksana', 'yulia',
  'julia', 'maria', 'masha', 'anna', 'anya', 'nastya', 'anastasia', 'sveta',
  'svetlana', 'vera', 'vika', 'viktoria', 'alexandra', 'zhenya', 'evgenia',
  'nadia', 'nadya', 'galina', 'galya', 'lyuba', 'lyudmila', 'larisa', 'lera',
  'valeria', 'sophia', 'emma', 'olivia', 'ava', 'isabella', 'mia', 'charlotte',
  'amelia', 'harper', 'evelyn', 'abigail', 'emily', 'elizabeth', 'sofia',
  'ella', 'madison', 'scarlett', 'victoria', 'aria', 'grace', 'chloe',
  'camila', 'luna', 'zoey', 'nora', 'lily', 'eleanor', 'hannah', 'lillian',
  'addison', 'aubrey', 'ellie', 'stella', 'natalie', 'zoe', 'leah', 'hazel',
  'violet', 'aurora', 'savannah', 'audrey', 'brooklyn', 'bella', 'claire',
  'skylar', 'lucy', 'paisley', 'caroline', 'genesis', 'aaliyah', 'kennedy',
  'kinsley', 'allison', 'maya', 'sarah', 'madelyn', 'adeline', 'alexa',
  'ariana', 'gabriella', 'naomi', 'alice', 'sadie', 'hailey', 'eva', 'emilia',
  'autumn', 'quinn', 'nevaeh', 'piper', 'ruby', 'serenity', 'willow', 'everly',
  'cora', 'kaylee', 'lydia', 'aubree', 'arianna', 'eliana', 'peyton', 'melanie',
  'gianna', 'isabelle', 'valentina', 'nova', 'clara', 'vivian', 'reagan',
  'mackenzie', 'gaia',
];

/**
 * Известные мужские имена (транслит и английские)
 */
const MALE_NAMES = [
  // Русские (транслит)
  'alex', 'alexey', 'andrey', 'andrew', 'anton', 'artem', 'boris', 'denis',
  'dmitry', 'dmitri', 'evgeny', 'eugene', 'igor', 'ivan', 'kirill', 'konstantin',
  'leonid', 'maxim', 'max', 'mikhail', 'nikolay', 'oleg', 'pavel', 'roman',
  'sergey', 'sergei', 'stanislav', 'vadim', 'viktor', 'victor', 'vladimir',
  'vlad', 'yuri', 'yury', 'yaroslav',
  // Английские
  'james', 'john', 'robert', 'michael', 'david', 'william', 'richard', 'joseph',
  'thomas', 'charles', 'christopher', 'daniel', 'matthew', 'anthony', 'mark',
  'donald', 'steven', 'paul', 'joshua', 'kenneth', 'kevin', 'brian',
  'george', 'timothy', 'ronald', 'edward', 'jason', 'jeffrey', 'ryan', 'jacob',
  'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott',
  'brandon', 'benjamin', 'samuel', 'raymond', 'gregory', 'frank', 'alexander',
  'patrick', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'adam',
  'nathan', 'henry', 'douglas', 'zachary', 'peter', 'kyle', 'noah', 'ethan',
  'jeremy', 'walter', 'christian', 'keith', 'roger', 'terry', 'austin', 'sean',
  'gerald', 'carl', 'harold', 'dylan', 'arthur', 'lawrence', 'jordan', 'jesse',
  'bryan',
];

/**
 * Определение пола по имени
 *
 * Порядок проверки:
 * 1. Библиотека sex-by-russian-name (для русских/украинских имён)
 * 2. Списки известных имён (транслит + английские)
 * 3. Анализ окончаний
 * 4. Анализ username
 * 5. Default: male
 *
 * @param firstName - Имя пользователя
 * @param lastName - Фамилия (опционально)
 * @param username - Telegram username (опционально)
 * @returns 'male' или 'female'
 */
export function detectGenderByName(
  firstName?: string,
  lastName?: string,
  username?: string
): 'male' | 'female' {
  // 1. Пробуем через библиотеку sex-by-russian-name (кириллица)
  if (firstName) {
    try {
      const result = russianNameDetector.getSex({
        firstName: firstName,
        lastName: lastName || undefined,
      });

      if (result === 'male' || result === 'female') {
        console.log(`[GenderDetection] Library detected: ${result} for "${firstName}"`);
        return result;
      }
    } catch (e) {
      // Библиотека может не распознать имя - это нормально
      console.log(`[GenderDetection] Library could not detect gender for "${firstName}"`);
    }
  }

  // 2. Проверяем списки известных имён
  if (firstName) {
    const name = firstName.toLowerCase().trim();

    // Прямое совпадение с женскими именами
    if (FEMALE_NAMES.includes(name)) {
      console.log(`[GenderDetection] Known female name: "${firstName}"`);
      return 'female';
    }

    // Прямое совпадение с мужскими именами
    if (MALE_NAMES.includes(name)) {
      console.log(`[GenderDetection] Known male name: "${firstName}"`);
      return 'male';
    }

    // 3. Проверяем исключения (мужские имена на -а/-я)
    if (MALE_NAME_EXCEPTIONS.includes(name)) {
      console.log(`[GenderDetection] Male exception name: "${firstName}"`);
      return 'male';
    }

    // 4. Анализ окончаний (русские)
    const femaleEndingsRu = ['а', 'я', 'ия', 'ья'];
    for (const ending of femaleEndingsRu) {
      if (name.endsWith(ending) && name.length > ending.length + 1) {
        console.log(`[GenderDetection] Female ending (ru): "${firstName}" ends with "${ending}"`);
        return 'female';
      }
    }

    // 5. Анализ окончаний (английские)
    const femaleEndingsEn = ['a', 'ia', 'ya', 'ina', 'ena', 'ella', 'anna', 'etta', 'issa'];
    for (const ending of femaleEndingsEn) {
      if (name.endsWith(ending) && name.length > ending.length + 1) {
        console.log(`[GenderDetection] Female ending (en): "${firstName}" ends with "${ending}"`);
        return 'female';
      }
    }
  }

  // 6. Анализ username
  if (username) {
    const uname = username.toLowerCase();

    // Ищем мужские имена в username
    for (const maleName of MALE_NAMES) {
      if (uname.includes(maleName) && maleName.length >= 3) {
        console.log(`[GenderDetection] Male name in username: "${maleName}" in "${username}"`);
        return 'male';
      }
    }
    for (const maleName of MALE_NAME_EXCEPTIONS) {
      if (uname.includes(maleName) && maleName.length >= 3) {
        console.log(`[GenderDetection] Male exception in username: "${maleName}" in "${username}"`);
        return 'male';
      }
    }

    // Ищем женские имена в username
    for (const femaleName of FEMALE_NAMES) {
      if (uname.includes(femaleName) && femaleName.length >= 3) {
        console.log(`[GenderDetection] Female name in username: "${femaleName}" in "${username}"`);
        return 'female';
      }
    }
  }

  // 7. Default: male
  console.log(`[GenderDetection] Default: male for "${firstName || username || 'unknown'}"`);
  return 'male';
}

/**
 * Экспорт для обратной совместимости
 */
export const detectGender = detectGenderByName;
