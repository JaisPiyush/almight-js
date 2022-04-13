import React from 'react';
import App from '../../src/App';
import {mount} from "@cypress/react";


it("render learn react link", () => {
  mount(<App />);
  cy.get('a').contains('Learn React');
})


