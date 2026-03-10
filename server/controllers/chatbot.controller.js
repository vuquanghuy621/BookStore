const { GoogleGenAI } = require("@google/genai");
const Book = require("../models/books.model");
const Author = require("../models/authors.model");
const Genre = require("../models/genres.model");
const Publisher = require("../models/publishers.model");
const Voucher = require("../models/vouchers.model");
const Order = require("../models/orders.model");

// Khởi tạo AI
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

exports.chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;
        const user = req.user; // Get identified user from middleware

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Tin nhắn không được để trống",
            });
        }

        // 1. Fetch General Data
        const [books, authors, genres, publishers, vouchers] = await Promise.all([
            Book.find({}).select("name price description author genre publisher").populate("author", "name").populate("genre", "name").populate("publisher", "name").limit(50).lean(),
            Author.find({}).select("name year").lean(),
            Genre.find({}).select("name slug").lean(),
            Publisher.find({}).select("name").lean(),
            Voucher.find({}).select("code name value minimum start end").lean()
        ]);

        // 2. Fetch User Specific Data (if logged in)
        let userOrders = [];
        if (user && user.userId) {
            userOrders = await Order.find({ user: user.userId })
                .populate("products.product", "name price")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean();
        }

        // 3. Format Context
        const bookContext = books.map((b, i) => {
            const author = b.author?.map(a => a.name).join(", ") || "Không rõ";
            return `Sách ${i + 1}: "${b.name}" - ${b.price}đ - Tác giả: ${author}`;
        }).join("\n");

        const voucherContext = vouchers.map(v => `- Mã ${v.code} (${v.value}%): Đơn từ ${v.minimum}đ`).join("\n");

        // Format Orders
        let orderContext = "Khách hàng chưa đăng nhập hoặc chưa có đơn hàng.";
        if (userOrders.length > 0) {
            orderContext = userOrders.map((o, i) => {
                const products = o.products.map(p => `${p.product?.name} (SL: ${p.quantity})`).join(", ");
                const status = o.orderStatus?.text || "Đang xử lý";
                const date = new Date(o.createdAt).toLocaleDateString("vi-VN");
                return `- Đơn ${i + 1} (${date}): ${products} | Tổng tham khảo: ${o.cost?.total}đ | Trạng thái: ${status}`;
            }).join("\n");
        } else if (user && user.userId) {
            orderContext = "Khách hàng đã đăng nhập nhưng chưa có đơn hàng nào.";
        }

        // 4. Construct System Prompt
        const prompt = `
Bạn là trợ lý ảo của BookStore.
Bạn đang tư vấn cho một khách hàng ${user ? "đã đăng nhập" : "vãng lai (chưa đăng nhập)"}.

=== THÔNG TIN ĐƠN HÀNG CỦA KHÁCH (QUAN TRỌNG) ===
${orderContext}
(Nếu khách hỏi về đơn hàng:
- Nếu danh sách rỗng và khách chưa đăng nhập: Yêu cầu khách đăng nhập để xem.
- Nếu danh sách rỗng và khách đã đăng nhập: Thông báo bạn không tìm thấy đơn hàng nào gần đây.
- Nếu có đơn hàng: Tóm tắt thông tin đơn hàng cho khách.)

=== DỮ LIỆU CỬA HÀNG ===
[SÁCH MỚI CẬP NHẬT]
${bookContext}

[KHUYẾN MÃI]
${voucherContext}

=== QUY TẮC TRẢ LỜI ===
1. **Giới thiệu bản thân**: Nếu khách hỏi "Bạn là ai", hãy giới thiệu bạn là trợ lý ảo của BookStore.
2. **Đơn hàng**: Ưu tiên kiểm tra mục THÔNG TIN ĐƠN HÀNG CỦA KHÁCH.
3. **Sách & Cửa hàng**: Trả lời dựa trên dữ liệu cung cấp. Nếu không tìm thấy sách, hãy gợi ý sách khác hoặc báo chưa có.
4. **Văn phong**: Thân thiện, ngắn gọn, dùng Tiếng Việt.
5. **Linh hoạt**: Đừng trả lời "Tôi chỉ biết về sách" với các câu hỏi chào hỏi hoặc hỏi về đơn hàng.

=== CÂU HỎI ===
"${message}"

=== TRẢ LỜI ===
`;

        // 5. Call Gemini
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        const reply = response.text;

        return res.json({ reply });

    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return res.status(500).json({
            error: "Lỗi hệ thống",
        });
    }
};
