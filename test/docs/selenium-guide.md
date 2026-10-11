# Selenium guide

Framework d?ng chung theo POM: [README](../selenium/README.md).

C?i dependency trong `test/selenium`, ?i?n `.env` t? `.env.example`, ch?y `npm.cmd run test:login`. Windows launcher: `test/scripts/run-selenium-login.bat`.

Page Object: `selenium/pages/{auth,teacher,student,admin}`. Test: `selenium/tests/{auth,teacher,student,admin}`. Kh?ng t?o framework ri?ng theo m? task.

`TEST_ENV=dev` d?ng localhost khi kh?ng ??t `SELENIUM_BASE_URL`; URL trong `.env` lu?n ?u ti?n.
