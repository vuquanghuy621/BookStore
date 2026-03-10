const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Book = require('../models/books.model');
const Author = require('../models/authors.model');
const Genre = require('../models/genres.model');
const Publisher = require('../models/publishers.model');

const MONGO_URI = process.env.MONGODB_CONNECT_URI;
const EXCEL_FILE = path.join(__dirname, '../../ListBook.xlsx');

const DEFAULT_DESCRIPTION = `Đọc sách là một thói quen tốt mang lại nhiều giá trị to lớn cho con người trong học tập, công việc và cuộc sống tinh thần. Từ xa xưa, sách đã được xem là kho tàng tri thức của nhân loại, nơi lưu giữ những hiểu biết, kinh nghiệm và thành tựu được tích lũy qua nhiều thế hệ. Việc đọc sách giúp con người mở rộng tầm nhìn, tiếp cận những kiến thức mới về khoa học, lịch sử, văn hóa, xã hội, từ đó nâng cao hiểu biết và trình độ của bản thân.
Trước hết, đọc sách giúp phát triển tư duy và khả năng ngôn ngữ. Khi đọc, người đọc phải suy nghĩ, phân tích, liên tưởng để hiểu nội dung, nhờ đó khả năng tư duy logic và tư duy phản biện được rèn luyện. Đồng thời, vốn từ vựng và cách diễn đạt cũng trở nên phong phú hơn, giúp việc giao tiếp và viết lách trở nên mạch lạc, hiệu quả. Đối với học sinh, sinh viên, đọc sách còn hỗ trợ rất nhiều trong việc học tập, giúp tiếp thu kiến thức sâu hơn và hình thành thói quen tự học.
Bên cạnh đó, đọc sách còn có tác dụng bồi dưỡng tâm hồn và nhân cách. Những tác phẩm văn học hay giúp con người biết đồng cảm, yêu thương, sống nhân ái và có trách nhiệm hơn với bản thân cũng như cộng đồng. Qua những câu chuyện, số phận nhân vật, người đọc có thể rút ra bài học về cách sống, cách ứng xử trong cuộc đời. Ngoài ra, đọc sách còn là một hình thức giải trí lành mạnh, giúp con người thư giãn, giảm căng thẳng sau những giờ học tập và làm việc mệt mỏi.
Trong thời đại công nghệ phát triển mạnh mẽ, việc duy trì thói quen đọc sách càng trở nên cần thiết. Đọc sách không chỉ giúp con người hoàn thiện tri thức mà còn góp phần hình thành lối sống tích cực, bền vững, hướng tới những giá trị tốt đẹp trong cuộc sống.`;

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

async function upsertAuthor(name) {
    if (!name) return null;
    let author = await Author.findOne({ name: name.trim() });
    if (!author) {
        author = new Author({ name: name.trim() });
        await author.save();
        console.log(`Created new author: ${name}`);
    }
    return author._id;
}

async function upsertGenre(name) {
    if (!name) return null;
    let genre = await Genre.findOne({ name: name.trim() });
    if (!genre) {
        genre = new Genre({ name: name.trim() });
        await genre.save();
        console.log(`Created new genre: ${name}`);
    }
    return genre._id;
}

async function upsertPublisher(name) {
    if (!name) return null;
    let publisher = await Publisher.findOne({ name: name.trim() });
    if (!publisher) {
        publisher = new Publisher({ name: name.trim() });
        await publisher.save();
        console.log(`Created new publisher: ${name}`);
    }
    return publisher._id;
}

function generateBookId() {
    return 'S-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
}

async function runImport() {
    await connectDB();

    try {
        const workbook = xlsx.readFile(EXCEL_FILE);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Since the Excel file might not have headers or headers don't match, 
        // we use manual headers based on the column order:
        // 0: Name, 1: Author, 2: Genre, 3: Publisher, 4: Price, 5: Discount
        const data = xlsx.utils.sheet_to_json(sheet, {
            header: ["name", "author", "genre", "publisher", "price", "discount"]
        });

        console.log(`Found ${data.length} rows in Excel.`);

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const name = row['name'];
            const authorName = row['author'];
            const genreName = row['genre'];
            const publisherName = row['publisher'];
            const price = parseFloat(row['price']);
            const discount = parseFloat(row['discount'] || 0);

            if (!name || isNaN(price)) {
                console.warn(`Skipping row ${i + 1}: Required fields missing (Name or Price). Row content: ${JSON.stringify(row)}`);
                continue;
            }

            const authorId = await upsertAuthor(authorName);
            const genreId = await upsertGenre(genreName);
            const publisherId = await upsertPublisher(publisherName);

            const bookData = {
                bookId: generateBookId(),
                name: name.trim(),
                author: authorId ? [authorId] : [],
                genre: genreId ? [genreId] : [],
                publisher: publisherId,
                price: price,
                discount: discount,
                description: DEFAULT_DESCRIPTION,
                stock: 10, // Default stock
            };

            const book = new Book(bookData);
            await book.save();
            console.log(`Imported book: ${name}`);
        }

        console.log('Import completed successfully!');
    } catch (err) {
        console.error('Import error:', err);
    } finally {
        mongoose.connection.close();
    }
}

runImport();
