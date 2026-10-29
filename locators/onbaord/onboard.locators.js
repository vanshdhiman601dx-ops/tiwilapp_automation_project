// Source: frontend-code/Src/Screens/LandingScreens/IntroScreen/IntroScreen.js.
// Appium accessibility IDs: the runtime button has no Android resource-id.
// Its accessibility label changes from Next to Continue on the final slide.
module.exports = {
  nextButton: {desc: 'Next'},
  continueButton: {desc: 'Continue'},
  // SignUpScreen/SignUpIntro.js: actual frontend authentication labels.
  googleSignInButton: {text: 'Sign in with Google'},
  // Observed on the installed Android build.
  continueWithEmailButton: {desc: 'Continue with Email or Phone'},
  // Login/Login.js: labels in the supplied frontend version.
  emailScreenHeading: {text: 'Welcome Back'},
  emailInput: {clazz: 'android.widget.EditText', text: 'Your Email'},
  sendOtpButton: {text: 'Send OTP'},
  // OtpScreen/OtpScreen.js: email OTP screen.
  otpScreenHeading: {text: 'OTP Verification'},
  verifyOtpButton: {text: 'Verify OTP'},
  verifyingOtpButton: {text: 'Verifying...'},
  otpInputs: {pkg: 'com.tiwil', clazz: 'android.widget.EditText'},
  otpCountdown: {text: /(?:Resend code in\s*)?([0-5]):([0-5]\d)/},
  secondaryContactHeading: {text: 'Add your phone number'},
  // ProfileSetup/ProfileFlow.js: name onboarding step.
  nameScreenHeading: {text: 'What’s your name?'},
  firstNameInput: {clazz: 'android.widget.EditText', text: 'Your First Name'},
  lastNameInput: {clazz: 'android.widget.EditText', text: 'Your Last Name'},
};
