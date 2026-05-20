import React from 'react';
import Properties from '../Properties';

export default function AgencyProperties({ onAddProperty, refreshTrigger }: any) {
  return <Properties onAddProperty={onAddProperty} refreshTrigger={refreshTrigger} />;
}
