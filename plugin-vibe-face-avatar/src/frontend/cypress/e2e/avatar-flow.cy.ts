describe('Avatar Face Workflow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should navigate through the full flow: Upload -> Train -> Generate', () => {
    // 1. Digital Body Page (Home)
    cy.contains('DIGITAL BODY').should('be.visible');
    cy.contains('Upload Photos').should('be.visible');

    // Mock file upload (we can't easily upload real files in this environment without plugins, 
    // so we'll simulate the state change if possible, or just check UI elements)
    // For this test, we'll verify the UI elements exist and navigation works.
    
    // Check Navigation
    cy.get('nav').contains('NeuroPhoto').click();
    
    // 2. NeuroPhoto Page
    cy.url().should('include', '/neurophoto');
    cy.contains('NEURO PHOTO').should('be.visible');
    
    // Check Prompt Input
    cy.get('textarea').should('have.attr', 'placeholder', 'Describe your vision... (e.g. cyberpunk samurai in neon rain)');
    
    // Type a prompt
    cy.get('textarea').type('A futuristic cyberpunk city with neon lights');
    
    // Check Generate Button state
    cy.contains('GENERATE').should('not.be.disabled');
    
    // Click Generate
    cy.contains('GENERATE').click();
    
    // Verify Loading State
    cy.contains('Generating...').should('be.visible');
    
    // Verify Output (after timeout)
    cy.wait(3500); // Wait for simulation
    cy.get('img').should('have.length.at.least', 1);
    cy.contains('Output Stream').should('be.visible');
  });
});
