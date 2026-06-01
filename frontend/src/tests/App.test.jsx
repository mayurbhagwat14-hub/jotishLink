import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// A simple dummy component test to verify React Testing Library is configured
const DummyComponent = () => {
  return <h1>JyotishLink Test</h1>;
};

describe('Frontend React Tests', () => {
  it('renders a simple React component', () => {
    render(<DummyComponent />);
    const headingElement = screen.getByText(/JyotishLink Test/i);
    expect(headingElement).toBeInTheDocument();
  });
});
