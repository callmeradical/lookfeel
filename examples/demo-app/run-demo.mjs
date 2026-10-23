import { startDemoServer } from './server.js';
import { captureScreens } from '../../src/capture.js';
import { startViewerServer } from '../../src/server.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, 'outputs');

async function runDemo() {
  console.log('🚀 Step 1: Starting PulseAI demo application on port 3000...');
  const appServer = startDemoServer(3000);

  // Define test screens and interactive journeys
  const screens = [
    {
      id: '01-cockpit-desktop',
      title: 'Agent Cockpit & Telemetry (Desktop)',
      url: 'http://localhost:3000',
      viewport: { width: 1440, height: 900 }
    },
    {
      id: '02-cockpit-mobile',
      title: 'Agent Cockpit (Mobile Responsive)',
      url: 'http://localhost:3000',
      viewport: { width: 390, height: 844 }
    },
    {
      id: '03-agent-inspector-modal',
      title: 'Agent Inspector Modal Dialog',
      url: 'http://localhost:3000',
      viewport: { width: 1440, height: 900 },
      action: async (page) => {
        // Trigger modal by clicking the first inspect button
        await page.click('.btn-inspect');
        await page.waitForSelector('#inspect-modal:not(.hidden)');
      }
    },
    {
      id: '04-chaos-injected-telemetry',
      title: 'Live Anomaly Injected State',
      url: 'http://localhost:3000',
      viewport: { width: 1440, height: 900 },
      action: async (page) => {
        // Click chaos event
        await page.click('#btn-trigger-anomaly');
        await page.waitForTimeout(300);
      }
    }
  ];

  console.log('\n📸 Step 2: Capturing screenshots using lookfeel harness...');
  await captureScreens(screens, {
    outputDir: OUTPUT_DIR,
    metadata: { app: 'PulseAI', version: '1.0.0-demo' }
  });

  console.log('\n🎨 Step 3: Starting LookFeel Visual Review Studio on port 8802...');
  startViewerServer({
    port: 8802,
    outputDir: OUTPUT_DIR
  });

  console.log('\n=============================================================');
  console.log('✅ Demo is fully live and ready for testing!');
  console.log('🌐 PulseAI App:             http://localhost:3000');
  console.log('🔍 LookFeel Review Studio:   http://localhost:8802');
  console.log('📁 Captured Outputs:        examples/demo-app/outputs/latest');
  console.log('=============================================================\n');
}

runDemo().catch((err) => {
  console.error('Demo error:', err);
  process.exit(1);
});
