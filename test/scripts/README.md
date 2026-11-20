# Test Scripts

Helper scripts for setting up, running, and reporting tests.

Selenium hiện hành: xem [README](../selenium/README.md). `Run-Admin.ps1 -CheckOnly` chỉ liệt kê, không gọi staging. `-Case USER_003` chạy đúng ca; `-Watch` mở trình duyệt, không chạy watcher cũ. Các launcher QA29/QA30/QA31 cũ ở [archive](../archive/selenium-before-layout-20261116/workspace-scripts/).

`run-tests.bat` và `run-tests.sh` cũ chỉ in tiêu đề, không chạy test, đã đưa ra backup. Dùng lệnh trong [README chính](../README.md); `npm run selenium:check` và `npm run api:check` kiểm tra offline.
