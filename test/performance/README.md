# Kiểm thử hiệu năng

JMeter cài local ở `test/tools/jmeter/apache-jmeter-5.6.3/apache-jmeter-5.6.3/`. Runtime, test plan và dữ liệu đang có được giữ nguyên. Bộ cài `.tgz` đã chuyển ra backup vì đã có bản giải nén.

`scenarios/login-load.js` cũ chỉ in thông báo, không tạo tải và không kiểm tra kết quả; đã đưa ra backup. Thư mục này hiện không công bố một suite tải tự động đã hoàn thiện.

Chạy tải cần phạm vi, môi trường và ngưỡng đã được thống nhất. Tra report ở [kho báo cáo](../reports/index.html); cài công cụ không đồng nghĩa đạt tiêu chí hiệu năng.
