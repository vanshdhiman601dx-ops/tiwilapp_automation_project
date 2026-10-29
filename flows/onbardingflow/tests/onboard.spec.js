const {test} = require('../../../fixtures/android.fixture');
const {OnboardFlow} = require('../pages/onboard');

test('TIWIL signup flow', async ({device}) => {
  const onboardFlow = new OnboardFlow(device);
  await onboardFlow.signupFlow();
});
