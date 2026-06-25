# TTNT Review

Web ôn tập trắc nghiệm Trí tuệ nhân tạo, gồm 150 câu hỏi được tổng hợp theo các bài giảng. Ứng dụng chạy trực tiếp trên trình duyệt bằng HTML, CSS và JavaScript thuần, không cần cài đặt framework.

## Tính năng chính

- Ôn tập câu hỏi trắc nghiệm theo chương, chủ đề và độ khó.
- Hiển thị tiến độ làm bài, số câu đã làm, số câu đúng và số câu sai.
- Đánh dấu câu hỏi cần xem lại.
- Chế độ ôn lại câu sai và xem các câu đã đánh dấu.
- Xáo trộn thứ tự câu hỏi.
- Lưu tiến độ trên trình duyệt bằng `localStorage`.

## Cấu trúc file

- `index.html`: khung giao diện chính của ứng dụng.
- `styles.css`: định dạng giao diện, bố cục và trạng thái câu trả lời.
- `questions.js`: dữ liệu 150 câu hỏi, đáp án và giải thích.
- `app.js`: xử lý bộ lọc, điều hướng câu hỏi, chấm đáp án và lưu tiến độ.

## Cách sử dụng

Mở trực tiếp file `index.html` bằng trình duyệt, hoặc chạy một server tĩnh trong thư mục dự án:

```bash
python3 -m http.server 8123
```

Sau đó truy cập:

```text
http://127.0.0.1:8123/index.html
```

## Ghi chú

Tiến độ học được lưu riêng trên từng trình duyệt. Khi bấm `Xóa tiến độ`, toàn bộ câu đã làm, câu sai và câu đã đánh dấu sẽ được đặt lại.
