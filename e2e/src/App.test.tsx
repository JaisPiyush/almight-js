import React from 'react';
import App from './App';
import {mount} from "@cypress/react";
import {expect} from "chai"

it("render learn react link", () => {
  mount(<App />);
  cy.get('a').contains('Learn React');
  expect(localStorage.length).eq(0)
  localStorage.setItem("__na", "23")
  expect(localStorage.getItem("__na")).eq("23")
})


