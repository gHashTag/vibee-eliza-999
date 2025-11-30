/**
 * Скрипт для создания базы данных "playra" в Neon через API
 * Использует NEON API для создания проекта и базы данных
 */

// Используем встроенный fetch в Node 20

// Функция для создания базы данных через Neon API
async function createNeonDatabase() {
  try {
    console.log('🚀 Создаем базу данных "playra" в Neon...');

    // Получаем API ключ из Infisical (через переменные окружения)
    const neonApiKey = process.env.NEON_API_KEY || process.env.NEON_TOKEN;

    if (!neonApiKey) {
      console.error('❌ NEON_API_KEY не найден в переменных окружения!');
      console.log('💡 Нужен NEON_API_KEY от https://neon.tech');
      process.exit(1);
    }

    console.log('🔑 API Key получен');

    // Шаг 1: Получаем список проектов
    console.log('📋 Получаем список проектов Neon...');
    const projectsResponse = await fetch('https://api.neon.tech/api/v2/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${neonApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!projectsResponse.ok) {
      throw new Error(`Не удалось получить проекты: ${projectsResponse.statusText}`);
    }

    const projects = await projectsResponse.json();
    console.log(`✅ Найдено ${projects.projects.length} проектов`);

    if (projects.projects.length === 0) {
      console.log('❌ Проекты не найдены. Нужно создать проект в Neon');
      process.exit(1);
    }

    // Берем первый проект
    const project = projects.projects[0];
    console.log(`🎯 Используем проект: ${project.name} (${project.id})`);

    // Шаг 2: Создаем базу данных "playra"
    console.log('🗄️ Создаем базу данных "playra"...');
    const dbResponse = await fetch(
      `https://api.neon.tech/api/v2/projects/${project.id}/databases`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${neonApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'playra',
          owner_id: project.owner_id,
        }),
      }
    );

    if (!dbResponse.ok) {
      const errorText = await dbResponse.text();
      if (errorText.includes('already exists')) {
        console.log('✅ База данных "playra" уже существует!');
      } else {
        throw new Error(`Не удалось создать базу: ${dbResponse.statusText} - ${errorText}`);
      }
    } else {
      const db = await dbResponse.json();
      console.log(`✅ База данных создана: ${db.name} (${db.id})`);
    }

    // Шаг 3: Получаем строку подключения
    console.log('🔗 Получаем строку подключения...');
    const branchesResponse = await fetch(
      `https://api.neon.tech/api/v2/projects/${project.id}/branches`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${neonApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!branchesResponse.ok) {
      throw new Error(`Не удалось получить ветки: ${branchesResponse.statusText}`);
    }

    const branches = await branchesResponse.json();
    if (branches.branches.length === 0) {
      throw new Error('Ветки не найдены в проекте');
    }

    const branch = branches.branches[0];
    console.log(`🌿 Используем ветку: ${branch.name} (${branch.id})`);

    // Получаем роли
    const rolesResponse = await fetch(
      `https://api.neon.tech/api/v2/projects/${project.id}/roles`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${neonApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!rolesResponse.ok) {
      throw new Error(`Не удалось получить роли: ${rolesResponse.statusText}`);
    }

    const roles = await rolesResponse.json();
    if (roles.roles.length === 0) {
      throw new Error('Роли не найдены');
    }

    const role = roles.roles[0];
    console.log(`👤 Используем роль: ${role.name} (${role.id})`);

    // Создаем строку подключения
    const connectionString = `postgresql://${role.name}:${role.password}@${project.id}-${branch.id}.pooler.neon.tech/playra?sslmode=require`;

    console.log('\n✅ ГОТОВО! Строка подключения:');
    console.log(connectionString);

    // Сохраняем в файл
    const fs = await import('fs');
    fs.writeFileSync('/tmp/playra-postgres-url.txt', connectionString);
    console.log('\n💾 Строка подключения сохранена в /tmp/playra-postgres-url.txt');

    return {
      success: true,
      connectionString,
      project: project.name,
      database: 'playra',
    };

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

// Запускаем
createNeonDatabase();
