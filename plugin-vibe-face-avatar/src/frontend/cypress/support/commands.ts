// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-testid attribute.
       * @example cy.getByTestId('greeting')
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      /**
       * Custom command to check if element contains text.
       * @example cy.containsText('Hello World')
       */
      containsText(text: string): Chainable<JQuery<HTMLElement>>;
      /**
       * Custom command to upload a file.
       * @example cy.uploadFile('input[type=file]', 'image.jpg')
       */
      uploadFile(selector: string, fileName: string): Chainable<void>;
      /**
       * Wait for chat to be ready
       * @example cy.waitForChatReady()
       */
      waitForChatReady(): Chainable<void>;
      /**
       * Type in chat textarea
       * @example cy.typeInChat('Hello world')
       */
      typeInChat(text: string): Chainable<void>;
      /**
       * Submit chat form
       * @example cy.submitChat()
       */
      submitChat(): Chainable<void>;
      /**
       * Upload files to chat
       * @example cy.uploadChatFiles(['test.jpg'])
       */
      uploadChatFiles(fileNames: string[]): Chainable<void>;
      /**
       * Mock chat API endpoints
       * @example cy.mockChatAPI()
       */
      mockChatAPI(): Chainable<void>;
    }
  }
}

// Custom command to get element by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Custom command to check if element contains text
Cypress.Commands.add('containsText', (text: string) => {
  return cy.contains(text);
});

// Custom command to upload a file
Cypress.Commands.add('uploadFile', (selector: string, fileName: string) => {
  return cy.readFile(`cypress/fixtures/${fileName}`, 'base64').then((fileContent) => {
    return cy.get(selector).selectFile({
      contents: Cypress.Buffer.from(fileContent, 'base64'),
      fileName,
      mimeType: 'image/jpeg',
    });
  });
});

// Wait for chat to be ready
Cypress.Commands.add('waitForChatReady', () => {
  cy.getByTestId('chat-textarea').should('be.visible').and('not.be.disabled');
  cy.getByTestId('chat-submit-button').should('be.visible').and('not.be.disabled');
  return cy.getByTestId('chat-file-input').should('be.visible');
});

// Type in chat textarea
Cypress.Commands.add('typeInChat', (text: string) => {
  return cy.getByTestId('chat-textarea')
    .should('be.visible')
    .and('not.be.disabled')
    .clear()
    .type(text);
});

// Submit chat form
Cypress.Commands.add('submitChat', () => {
  return cy.getByTestId('chat-submit-button')
    .should('be.visible')
    .and('not.be.disabled')
    .click();
});

// Upload files to chat
Cypress.Commands.add('uploadChatFiles', (fileNames: string[]) => {
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:5175';
  const API_BASE = 'http://localhost:3001';

  return cy.getByTestId('chat-file-input').then(($input) => {
    const files = fileNames.map(fileName => {
      return {
        contents: Cypress.Buffer.from('fake image content'),
        fileName,
        mimeType: 'image/jpeg',
      };
    });

    return cy.wrap($input).selectFile(files, { force: true });
  });
});

// Mock chat API endpoints
Cypress.Commands.add('mockChatAPI', () => {
  const baseUrl = Cypress.config('baseUrl') || 'http://localhost:5175';
  const API_BASE = 'http://localhost:3001';

  // Mock GET /api/models
  cy.intercept('GET', `${API_BASE}/api/models*`, {
    statusCode: 200,
    body: {
      success: true,
      models: []
    }
  }).as('getModels');

  // Mock POST /api/train
  cy.intercept('POST', `${API_BASE}/api/train`, {
    statusCode: 200,
    body: {
      success: true,
      model_id: `model_${Date.now()}`,
      status: 'training'
    }
  }).as('trainModel');

  // Mock POST /api/neurophoto
  cy.intercept('POST', `${API_BASE}/api/neurophoto`, {
    statusCode: 200,
    body: {
      success: true,
      image_url: 'https://picsum.photos/512/512'
    }
  }).as('generateImage');
});
