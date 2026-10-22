export const DEFAULT_DIMENSIONS = {
  look: {
    key: 'look',
    title: 'Look (Visual Design & Aesthetic)',
    prompt: 'Evaluate visual hierarchy, color palette, typography, brand alignment, and contrast.',
    criteria: [
      'Visual hierarchy: Does the eye naturally flow to the most important elements first?',
      'Branding & Colors: Are brand colors applied consistently and harmoniously?',
      'Typography & Contrast: Is text crisp, legible, properly sized, and accessible?',
      'Element Presentation: Are badges, tags, and data cards clearly legible?'
    ]
  },
  feel: {
    key: 'feel',
    title: 'Feel (Layout, Polish & Spacing)',
    prompt: 'Evaluate layout balance, padding, margins, whitespace, and emotional polish.',
    criteria: [
      'Whitespace & Breathing Room: Does the UI feel open and modern or cramped and claustrophobic?',
      'Alignment & Grid: Are cards, inputs, buttons, and tables aligned cleanly?',
      'Component Polish: Do borders, radius, shadows, and pill tags feel refined?',
      'Mobile/Responsive Adaptability: Does the interface adapt naturally across viewports?'
    ]
  },
  behavior: {
    key: 'behavior',
    title: 'Behavior (State, Affordance & Transitions)',
    prompt: 'Evaluate interactive affordances, state changes, feedback indicators, and error cues.',
    criteria: [
      'Affordance: Is it immediately obvious what is clickable, tappable, or interactive?',
      'State Clarity: Are active tabs, hover states, disabled buttons, and selections clear?',
      'Feedback & Validation: Does the system acknowledge actions that succeed or fail?',
      'Micro-interactions: Do loading states, spinners, and transitions maintain orientation?'
    ]
  },
  experience: {
    key: 'experience',
    title: 'Experience (Intuitiveness & Cognitive Flow)',
    prompt: 'Evaluate cognitive load, user friction, journey efficiency, and operational clarity.',
    criteria: [
      'Task Efficiency: Can a user accomplish their primary goal with minimal effort?',
      'Cognitive Simplicity: Does the screen avoid overwhelming the user with noise?',
      'Confidence: Does the user feel in complete control of their journey?',
      'Agent/Human Clarity: Is it clear what was done by an agent vs user action?'
    ]
  }
};
