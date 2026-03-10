import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { toast } from 'react-toastify';
import reviewApi from '../../api/reviewApi';

export default function ReviewModal({ show, onHide, book, orderId, onSuccess }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!comment.trim()) {
            toast.error('Vui lòng nhập nhận xét!');
            return;
        }

        try {
            setLoading(true);
            await reviewApi.create({
                book: book._id,
                order: orderId,
                rating,
                comment
            });
            setLoading(false);
            toast.success('Đánh giá sản phẩm thành công!');
            onSuccess();
            onHide();
        } catch (error) {
            setLoading(false);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra!');
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>Đánh giá sản phẩm</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="text-center mb-3">
                    <img src={book?.imageUrl} alt={book?.name} style={{ width: '100px' }} />
                    <h6 className="mt-2">{book?.name}</h6>
                </div>

                <Form.Group className="mb-3">
                    <Form.Label>Xếp hạng:</Form.Label>
                    <div className="d-flex justify-content-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                onClick={() => setRating(star)}
                                style={{ cursor: 'pointer', fontSize: '2rem', color: star <= rating ? '#ffc107' : '#e4e5e9' }}
                            >
                                {star <= rating ? <AiFillStar /> : <AiOutlineStar />}
                            </span>
                        ))}
                    </div>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Nhận xét của bạn:</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Hủy
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
