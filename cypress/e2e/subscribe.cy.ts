/// <reference types="cypress" />

describe('Subscribe flow', () => {
  // Re-use across tests
  const page = '/';                // homepage
  const formSel = 'form';
  const emailSel = `${formSel} input[type="email"]`;
  const buttonSel = `${formSel} button[type="submit"]`;

  // Fake but valid-looking email each run
  function fakeEmail() {
    return `cypress+${Date.now()}@example.com`;
  }

  it('renders the form', () => {
    cy.visit(page);
    cy.get(emailSel).should('be.visible');
    cy.get(buttonSel).contains(/subscribe/i);
  });

  it('submits successfully (200) and shows success UI', () => {
    cy.intercept('POST', '/api/subscribe', { 
      statusCode: 200,
      body: { message: 'Successfully subscribed!' }
    }).as('sub');

    cy.visit(page);
    cy.get(emailSel).type(fakeEmail());
    cy.get(buttonSel).click();

    cy.wait('@sub');
    // Check for success message
    cy.contains(/successfully subscribed/i).should('be.visible');
  });

  it('handles API failures gracefully', () => {
    cy.intercept('POST', '/api/subscribe', {
      statusCode: 400,
      body: { error: 'Bad email' }
    }).as('subFail');

    cy.visit(page);
    cy.get(emailSel).type('test@example.com');
    cy.get(buttonSel).click();

    cy.wait('@subFail');
    // Check for error message - matching what the component actually shows
    cy.contains(/bad email|subscription failed/i).should('be.visible');
  });
}); 