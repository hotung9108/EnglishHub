import assert from 'node:assert/strict';

import { randomBytes } from 'node:crypto';

import { By } from 'selenium-webdriver';

import { scenario, UI } from "../../../ui/ui.js";

const search = 'main input.adm-search-input';

const drawerName = '.adm-drawer input[placeholder="Nguyễn Văn A..."]';

const drawerEmail = '.adm-drawer input[type=email]';

const drawerSubmit = '.adm-drawer button[type=submit]';

const roleSelect = '.adm-drawer select:has(option[value=STUDENT])';

async function accounts(ctx, ui) { await ui.nav('/admin/accounts'); await ui.visible(search); }

async function find(ui, email) { await ui.fill(search, email); return ui.row(email); }

async function openCreate(ui) { await ui.button(/^(Thêm tài khoản mới|Thêm tài khoản|Tạo tài khoản|Add New User|Add User|Create User)$/i); await ui.visible(drawerName); }

async function fillAccount(ui, user) {
  await ui.fill(drawerName, user.fullName); await ui.fill(drawerEmail, user.email);
  await ui.fill('.adm-drawer input[type=password]', user.password); await ui.select(roleSelect, user.role);
}

async function readUser(ctx, user) {
  const response = await ctx.pool.get('admin', `/admin/users?q=${encodeURIComponent(user.email)}&limit=100`);
  const matches = response.data.filter(u => u.email === user.email); assert.equal(matches.length, 1); return matches[0];
}

async function freshUser(ctx) {
  const user = await ctx.pool.createUser('STUDENT', 'Account');
  return { user, publicData: { email: user.email, fullName: user.fullName, role: user.role } };
}

function account(run, prepare = freshUser) { return scenario('admin', async (ctx, ui, data) => { await ctx.step('Mở Quản lý tài khoản', () => accounts(ctx, ui)); await run(ctx, ui, data); }, prepare); }

async function reserve(ctx, role) {
  const email = `${ctx.pool.prefix}-ui-${randomBytes(5).toString('hex')}@example.invalid`.toLowerCase();
  const fullName = 'Selenium Created Through UI'; const password = 'SrsTemporary123!'; ctx.secrets.push(password);
  const resource = { type: 'user', email, fullName, role, state: 'RESERVED' }; ctx.pool.resources.push(resource); await ctx.pool.journal();
  return { email, fullName, password, role, resource };
}

async function confirmCreated(ctx, ui, user) {
  await ctx.driver.wait(async () => !(await ctx.driver.findElements(By.css('.adm-drawer'))).length, 10000);
  await find(ui, user.email);
  const saved = await readUser(ctx, user); await ctx.evidence('created-user', saved);
  Object.assign(user.resource, { id: saved.id, state: 'CREATED' }); await ctx.pool.journal();
  assert.equal(saved.fullName, user.fullName); assert.equal(saved.role, user.role);
}

export { search, drawerName, drawerEmail, drawerSubmit, roleSelect, accounts, find, openCreate, fillAccount, readUser, freshUser, account, reserve, confirmCreated };
