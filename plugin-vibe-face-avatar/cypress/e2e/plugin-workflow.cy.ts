describe('Avatar Face Plugin Workflow', () => {
  beforeEach(() => {
    // Visit the chat interface
    cy.visit('http://localhost:5175/chat', {
      onBeforeLoad(win) {
        // Enable API mocking
        cy.intercept('POST', '**/api/generate', {
          statusCode: 200,
          body: {
            message: {
              id: '1',
              content: {
                text: 'Тестовое сообщение от AI'
              }
            }
          }
        }).as('generateMessage');
      }
    });
  });

  it('should display chat interface', () => {
    cy.contains('Чат с AI', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="chat-input"]').should('be.visible');
  });

  it('should allow text input', () => {
    cy.get('[data-testid="chat-input"]')
      .type('/neurophoto красивый закат', { force: true })
      .should('have.value', '/neurophoto красивый закат');
  });

  it('should show file upload area', () => {
    cy.contains('Перетащите фотографии сюда').should('be.visible');
  });

  it('should accept drag and drop', () => {
    // Create a mock file
    const fileName = 'test-image.png';
    const fileContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const blob = new Blob([fileContent], { type: 'image/png' });
    const file = new File([blob], fileName, { type: 'image/png' });

    // Create a drop event
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    cy.get('[data-testid="file-drop-zone"]')
      .trigger('dragenter', { force: true })
      .trigger('dragover', { force: true, dataTransfer })
      .trigger('drop', { force: true, dataTransfer });
  });

  it('should display pending files', () => {
    // Simulate file upload by creating a pending file
    cy.window().then((win) => {
      const event = new CustomEvent('files-selected', {
        detail: {
          files: [{ name: 'test.png', size: 1024, type: 'image/png' }]
        }
      });
      win.dispatchEvent(event);
    });

    cy.contains('Загружено файлов: 1').should('be.visible');
  });

  it('should show training workflow', () => {
    cy.get('[data-testid="train-button"]').click({ force: true });
    cy.contains('Модель обучения').should('be.visible');
  });

  it('should show generation workflow', () => {
    cy.get('[data-testid="generate-button"]').click({ force: true });
    cy.contains('Генерация изображения').should('be.visible');
  });
});
