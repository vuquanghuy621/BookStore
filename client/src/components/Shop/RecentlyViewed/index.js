import React, { useEffect, useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import BookItem from '../BookItem';
import styles from './RecentlyViewed.module.css';

export default function RecentlyViewed() {
    const [viewedBooks, setViewedBooks] = useState([]);

    useEffect(() => {
        const books = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        setViewedBooks(books);
    }, []);

    if (viewedBooks.length === 0) return null;

    return (
        <div className={styles.recentlyViewed}>
            <div className={styles.title}>
                <h2 className={styles.titleHeading}>Sách đã xem gần đây</h2>
            </div>
            <Row className={styles.row}>
                {viewedBooks.map(book => (
                    <Col xl={2} xs={6} key={book._id}>
                        <BookItem data={book} />
                    </Col>
                ))}
            </Row>
        </div>
    );
}
