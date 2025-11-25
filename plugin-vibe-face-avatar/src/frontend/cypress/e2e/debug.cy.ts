describe('Debug - Проверка рендеринга компонентов', () => {
  it('should show all rendered elements', () => {
    cy.visit('/chat');

    // Ждем загрузки страницы
    cy.wait(2000);

    // Проверяем заголовок
    cy.contains('Добро пожаловать в чат VIBEE!').should('be.visible');

    // Проверяем наличие различных элементов
    cy.get('body').then(($body) => {
      // Проверим все textarea
      const textareas = $body.find('textarea');
      cy.log(`Найдено textarea: ${textareas.length}`);

      // Проверим все button
      const buttons = $body.find('button');
      cy.log(`Найдено button: ${buttons.length}`);

      // Проверим все input
      const inputs = $body.find('input');
      cy.log(`Найдено input: ${inputs.length}`);
    });

    // Проверим элементы с data-testid
    cy.get('body').then(($body) => {
      const textarea = $body.find('[data-testid="chat-textarea"]');
      cy.log(`Найдено [data-testid="chat-textarea"]: ${textarea.length}`);

      const button = $body.find('[data-testid="chat-submit-button"]');
      cy.log(`Найдено [data-testid="chat-submit-button"]: ${button.length}`);

      const fileInput = $body.find('[data-testid="chat-file-input"]');
      cy.log(`Найдено [data-testid="chat-file-input"]: ${fileInput.length}`);
    });

    // Сделаем скриншот для отладки
    cy.screenshot('debug-page-rendered');

    // Проверим что элементы видимы
    cy.get('textarea').should('exist');
    cy.get('button').should('exist');
  });
});
