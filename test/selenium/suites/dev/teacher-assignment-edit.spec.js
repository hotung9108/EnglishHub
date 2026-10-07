import { getFrontendUrl, getUsers } from '../utils/env-helper.js';
import { createDriver } from '../utils/browser-factory.js';
import { LoginPage } from '../pages/auth/LoginPage.js';
import { TeacherAssignmentsPage } from '../pages/teacher/TeacherAssignmentsPage.js';
import { TeacherEditAssignmentPage } from '../pages/teacher/TeacherEditAssignmentPage.js';
import { AssignmentPreviewModal } from '../pages/teacher/AssignmentPreviewModal.js';

(async () => {
  let driver;
  try {
    driver = await createDriver();
    const baseUrl = getFrontendUrl();
    const users = getUsers();
    console.log('[DEV][Selenium] Starting teacher-assignment-edit flow...');
    
    const login = new LoginPage(driver);
    await login.navigate(baseUrl).login(users.teacher.email, users.teacher.password);
    await driver.sleep(2000);
    
    const list = new TeacherAssignmentsPage(driver);
    await list.navigate(baseUrl).waitForList();
    await list.clickEditFirst();
    
    const edit = new TeacherEditAssignmentPage(driver);
    await edit.waitForEditPage();
    await edit.switchTab('Writing');
    await edit.switchTab('Speaking');
    await edit.switchTab('Reading');
    await edit.switchTab('Listening');
    await edit.clickPreview();
    
    const modal = new AssignmentPreviewModal(driver);
    await modal.waitForModal();
    await modal.close();
    await edit.saveDraft();
    
    console.log('[DEV][Selenium] teacher-assignment-edit flow completed (no assertions enforced)');
  } catch (e) {
    console.error('[DEV][Selenium] Error:', e.message);
  } finally {
    if (driver) await driver.quit();
  }
})();
