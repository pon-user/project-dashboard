import test from 'node:test';import assert from 'node:assert/strict';import {obsidianUri,vaultFromUri} from '../lib/navigation.mjs';
test('real vault name from copied URL preserves Japanese and spaces',()=>{assert.equal(vaultFromUri('obsidian://open?vault='+encodeURIComponent('先輩の 脳')+'&file=test'),'先輩の 脳')});
test('a missing vault cannot silently open the vault home',()=>{assert.equal(obsidianUri('', 'a.md'),null);assert.throws(()=>vaultFromUri('https://example.com/?vault=wrong'))});
test('note path is encoded exactly once and keeps its folder hierarchy',()=>{const p='10_制作/01_成果物/メモ & 課題.md';const u=new URL(obsidianUri('My Vault',p));assert.equal(u.searchParams.get('vault'),'My Vault');assert.equal(u.searchParams.get('file'),'10_制作/01_成果物/メモ & 課題')});
