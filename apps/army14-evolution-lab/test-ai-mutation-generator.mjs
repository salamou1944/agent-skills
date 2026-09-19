import test from 'node:test'; import assert from 'node:assert/strict';
import { generateAIMutation } from './ai-mutation-generator.mjs';
test('AI mutation generator fails closed without a configured provider', async()=>{
  await assert.rejects(()=>generateAIMutation({hypothesis:{id:'h1',hypothesis:'Improve verification reliability',expected:'coverage rises',falsifier:'independent check fails'},evaluatorFiles:['apps/judge.js'],providerConfig:{}}),/llm_provider_not_configured/);
});