describe('Chat Workflow - Полный цикл Avatar Face', () => {
  beforeEach(() => {
    cy.visit('/chat');
  });

  it('should complete full workflow: Upload Photos -> Train Model -> Generate Image', () => {
    // 1. Проверка загрузки страницы чата
    cy.contains('Добро пожаловать в чат VIBEE!').should('be.visible');
    cy.contains('Создавайте цифровые копии и генерируйте изображения').should('be.visible');

    // 2. Проверка инструкций
    cy.contains('Загрузите 10-25 фото себя').should('be.visible');
    cy.contains('/face train').should('be.visible');
    cy.contains('/neurophoto').should('be.visible');

    // Ждем загрузки всех элементов формы
    cy.wait(1000);

    // 3. Загрузка фото (симуляция через поле ввода)
    // Создаем тестовые файлы
    const fileName = 'test-photo.jpg';
    cy.readFile('cypress/fixtures/empty.txt', 'utf8').then((content) => {
      cy.writeFile(`cypress/downloads/${fileName}`, content);
    });

    // Загружаем файл через input
    cy.get('input[type="file"]', { force: true }).selectFile({
      contents: Cypress.Buffer.from('fake image content'),
      fileName,
      mimeType: 'image/jpeg',
    });

    // 4. Проверяем, что файл прикрепился
    cy.contains('Фото загружено!').should('be.visible');
    cy.contains('Загружено фото: 1').should('be.visible');
    cy.contains('/face train [название]').should('be.visible');

    // 5. Обучение модели с названием
    cy.get('textarea', { force: true }).type('/face train Мой цифровой двойник');
    cy.get('button[type="submit"]', { force: true }).click();

    // 6. Проверяем процесс обучения
    cy.contains('Обрабатываю запрос...').should('be.visible');
    cy.wait(2000);

    // 7. Проверяем ответ об успешном создании модели
    cy.contains('Модель "Мой цифровой двойник" создана').should('be.visible');
    cy.contains('отправлена на обучение').should('be.visible');

    // 8. Проверяем список моделей
    cy.contains('Мой цифровой двойник').should('be.visible');

    // 9. Генерация изображения
    cy.get('textarea', { force: true }).type('/neurophoto я в стиле киберпанк');
    cy.get('button[type="submit"]', { force: true }).click();

    // 10. Проверяем генерацию
    cy.contains('Обрабатываю запрос...').should('be.visible');
    cy.wait(2000);

    // 11. Проверяем результат генерации
    cy.contains('Изображение сгенерировано!').should('be.visible');
    cy.contains('Промпт: я в стиле киберпанк').should('be.visible');

    // 12. Проверяем наличие изображения
    cy.get('img').should('have.length.at.least', 1);

    // 13. Проверяем использование модели
    cy.contains('Модель:').should('be.visible');
  });

  it('should show error when trying to train without photos', () => {
    // Попытка обучить без фото
    cy.get('textarea', { force: true }).type('/face train Тестовая модель');
    cy.get('button[type="submit"]', { force: true }).click();

    cy.contains('Сначала загрузите 10-25 фотографий').should('be.visible');
  });

  it('should ask for model name when not provided', () => {
    // Загрузка файлa
    cy.get('input[type="file"]', { force: true }).selectFile({
      contents: Cypress.Buffer.from('fake image'),
      fileName: 'test.jpg',
      mimeType: 'image/jpeg',
    });

    cy.contains('Фото загружено!').should('be.visible');

    // Команда без названия
    cy.get('textarea', { force: true }).type('/face train');
    cy.get('button[type="submit"]', { force: true }).click();

    cy.contains('Введите название для вашей модели').should('be.visible');
  });

  it('should show error when generating without prompt', () => {
    // Попытка сгенерировать без промпта
    cy.get('textarea', { force: true }).type('/neurophoto');
    cy.get('button[type="submit"]', { force: true }).click();

    cy.contains('Укажите описание для генерации').should('be.visible');
  });

  it('should show help message for unknown commands', () => {
    // Неизвестная команда
    cy.get('textarea', { force: true }).type('какая-то случайная команда');
    cy.get('button[type="submit"]', { force: true }).click();

    cy.contains('Доступные команды').should('be.visible');
    cy.contains('/face train').should('be.visible');
    cy.contains('/neurophoto').should('be.visible');
  });

  it('should show pending files indicator in empty state', () => {
    // Загрузка файла
    cy.get('input[type="file"]', { force: true }).selectFile({
      contents: Cypress.Buffer.from('fake image'),
      fileName: 'test.jpg',
      mimeType: 'image/jpeg',
    });

    // Перезагружаем страницу (очистит сообщения)
    cy.visit('/chat');

    // Проверяем индикатор pending файлов
    cy.contains('✅ Загружено фото').should('be.visible');
    cy.contains('Теперь введите: /face train').should('be.visible');
  });

  it('should update placeholder based on state', () => {
    // Изначально
    cy.get('textarea', { force: true }).should('have.attr', 'placeholder', 'Загрузите фото или введите команду...');

    // После загрузки фото
    cy.get('input[type="file"]', { force: true }).selectFile({
      contents: Cypress.Buffer.from('fake image'),
      fileName: 'test.jpg',
      mimeType: 'image/jpeg',
    });
    cy.get('textarea', { force: true }).should('have.attr', 'placeholder', 'Теперь введите: /face train [название]');
  });
});
