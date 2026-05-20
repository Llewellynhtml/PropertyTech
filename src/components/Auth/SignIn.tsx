import React from 'react';
import AgentSignIn from './AgentSignIn';

interface SignInProps {
  onToggle: () => void;
}

export default function SignIn({ onToggle }: SignInProps) {
  return <AgentSignIn onToggle={onToggle} />;
}
