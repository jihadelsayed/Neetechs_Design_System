import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateStateContracts } from '../scripts/check-state-contracts.mjs';

test('state contract source validation passes', async () => {
  const result = await validateStateContracts();
  assert.deepEqual(result.errors, []);
});

test('canonical state dimensions validate compatible and contradictory combinations', async () => {
  const api = await import('../dist/index.js');

  assert.equal(api.ntIsOperationState('pending'), true);
  assert.equal(api.ntIsContentState('maintenance'), true);
  assert.equal(api.ntIsContentState('paused'), false);

  assert.deepEqual(
    api.ntValidateStateSnapshot({
      availability: 'enabled',
      interaction: 'focus-visible',
      operation: 'pending',
      validation: 'invalid',
    }),
    { valid: true, errors: [] },
  );

  const disabledPressed = api.ntValidateStateSnapshot({
    availability: 'disabled',
    interaction: 'pressed',
  });
  assert.equal(disabledPressed.valid, false);
  assert.match(disabledPressed.errors.join('\n'), /disabled controls cannot be pressed/);

  const readOnlySubmitting = api.ntValidateStateSnapshot({
    availability: 'read-only',
    operation: 'pending',
  });
  assert.equal(readOnlySubmitting.valid, false);
  assert.match(readOnlySubmitting.errors.join('\n'), /read-only controls cannot submit/);
});
