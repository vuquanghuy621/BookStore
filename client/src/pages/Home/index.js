import { Container, Row, Col } from "react-bootstrap";
import BookItem from "../../components/Shop/BookItem";
import bookApi from "../../api/bookApi";
import { useEffect, useState } from "react";
import styles from './Home.module.css'
import Loading from "../../components/Loading"
import RecentlyViewed from "../../components/Shop/RecentlyViewed";

function Home() {
  const [books, setBooks] = useState([])
  const [bestSeller, setBestSeller] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await bookApi.getAll({ page: 1, limit: 36 })
        setBooks(data)
      } catch (error) {
        console.log(error)
      }
    }

    const fetchBestSeller = async () => {
      try {
        const { data } = await bookApi.getBestSellers()
        setBestSeller(data)
      } catch (error) {
        console.log(error)
      }
    }

    fetchData()
    fetchBestSeller()
  }, [])

  return (
    <div className="main">
      <Container>
        <div className={styles.booksList}>
          <div className={styles.title}>
            <h2 className={styles.titleHeading}>Sách mới nhất</h2>
          </div>
          <Row className={styles.row}>
            {books && books.length > 0 ? (
              books.map(book =>
                <Col xl={2} xs={6} key={book._id}>
                  <BookItem data={book} />
                </Col>)
            ) : <Loading />}
          </Row>

          <div className={styles.title}>
            <h2 className={styles.titleHeading}>Sách bán chạy</h2>
          </div>
          <Row className={styles.row}>
            {bestSeller && bestSeller.length > 0 ? (
              bestSeller.map(book =>
                <Col xl={2} xs={6} key={book._id}>
                  <BookItem data={book} />
                </Col>)
            ) : <Loading />}
          </Row>

          {/* <RecentlyViewed /> */}
        </div>
      </Container >
    </div >
  );
}

export default Home;