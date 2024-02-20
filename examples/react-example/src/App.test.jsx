import { render, screen } from '@testing-library/react'
import App from './App'
import React from "react";

test('renders learn react link', () => {
  render(<App />)
  expect(screen.getByText(/Send a message to turtle/i)).toBeTruthy();
})
