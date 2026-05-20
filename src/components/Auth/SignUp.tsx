import React from 'react';
import AgentSignUp from './AgentSignUp';

interface SignUpProps {
  onToggle: () => void;
}

export default function SignUp({ onToggle }: SignUpProps) {
  // This is a bridge component for backward compatibility
  // defaulting to AgentSignUp as it's the more common case
  // but Login.tsx should ideally use specific components.
  return <AgentSignUp onToggle={onToggle} />;
}
