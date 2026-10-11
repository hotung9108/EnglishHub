// Test steps live here; locators and UI interactions belong to the Page Object.
export const loginFormCase = {
  id: 'QA28-SMOKE-001',
  title: 'Frontend root renders editable email, masked password and labeled submit',
  async run(page) {
    await page.assertReady();
  },
};

export function loginCase(user, role) {
  return {
    id: `QA28-LOGIN-${role.toUpperCase()}`,
    title: `Login as ${role}`,
    async run(page) {
      await page.assertReady();
      await page.login(user, role);
      await page.waitForRole(role);
    },
  };
}
