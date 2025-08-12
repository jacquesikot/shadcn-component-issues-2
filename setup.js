#!/usr/bin/env node

/**
 * Setup script for the Shadcn Issue Analyzer
 * This script helps users set up the environment and verify configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Setting up Shadcn Issue Analyzer...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 Creating .env file from .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created');
  } else {
    console.log('📝 Creating .env file...');
    const envContent = `# Shadcn Issue Analyzer Environment Variables

# Required: OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Optional: GitHub Personal Access Token (for higher rate limits)
GITHUB_TOKEN=your_github_token_here

# Optional: OpenAI Model (defaults to gpt-4-turbo-preview)
OPENAI_MODEL=gpt-4-turbo-preview

# Optional: Output directory (defaults to ./reports)
OUTPUT_DIR=./reports
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created');
  }
} else {
  console.log('✅ .env file already exists');
}

// Create reports directory
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  console.log('📁 Creating reports directory...');
  fs.mkdirSync(reportsDir, { recursive: true });
  console.log('✅ Reports directory created');
} else {
  console.log('✅ Reports directory already exists');
}

// Check if dependencies are installed
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const nodeModulesExists = fs.existsSync(path.join(__dirname, 'node_modules'));

  if (!nodeModulesExists) {
    console.log('📥 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Dependencies installed');
  } else {
    console.log('✅ Dependencies already installed');
  }
} catch (error) {
  console.log('❌ Error checking dependencies:', error.message);
}

// Build the project
console.log('\n🔨 Building TypeScript project...');
try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Project built successfully');
} catch (error) {
  console.log('❌ Build failed:', error.message);
  console.log('💡 Try running: npm run build');
}

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Edit the .env file and add your API keys:');
console.log('   - OPENAI_API_KEY (required)');
console.log('   - GITHUB_TOKEN (optional, but recommended)');
console.log('');
console.log('2. Test the analyzer:');
console.log('   npm run analyze button');
console.log('');
console.log('3. View available commands:');
console.log('   npm run dev -- --help');
console.log('');
console.log('📖 For detailed usage instructions, see:');
console.log('   - README.md');
console.log('   - USAGE_GUIDE.md');
console.log('');
console.log('🔗 Get API keys:');
console.log('   - OpenAI: https://platform.openai.com/api-keys');
console.log('   - GitHub: https://github.com/settings/tokens');
