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
