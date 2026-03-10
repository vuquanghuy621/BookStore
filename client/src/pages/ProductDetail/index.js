import React, { useEffect, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { AiOutlineMinus, AiOutlinePlus, AiOutlineShoppingCart } from 'react-icons/ai'
import { toast } from 'react-toastify';
import stylesH from '../../components/Shop/RecentlyViewed/RecentlyViewed.module.css';
import DetailedBookInfo from '../../components/Shop/DetailedBookInfo'
import Loading from "../../components/Loading"

import { useNavigate, useParams } from 'react-router-dom';
import bookApi from "../../api/bookApi";
import userApi from "../../api/userApi";
import { addToCart } from "../../redux/actions/cart"
import { useDispatch, useSelector } from "react-redux"
import format from "../../helper/format";
import styles from './ProductDetail.module.css'
import BookItem from '../../components/Shop/BookItem';
import reviewApi from '../../api/reviewApi';
import { AiFillStar } from 'react-icons/ai';
import moment from 'moment';
import RecentlyViewed from '../../components/Shop/RecentlyViewed';

export default function ProductDetail() {

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const params = useParams()
  const { slug } = params

  const cartData = useSelector((state) => state.cart);
  const currentUser = useSelector((state) => state.auth);

  const [bookData, setBookData] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)

  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const addToCart = async () => {
      try {
        const { list } = cartData
        const newList = list.map(item => {
          return { product: item.product._id, quantity: item.quantity }
        })
        await userApi.updateCart(currentUser.userId, { cart: newList })
      } catch (error) {
        console.log(error)
      }
    }
    if (currentUser && currentUser.userId) {
      addToCart()
    }
  }, [cartData, currentUser])

  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true)
        const res = await bookApi.getBySlug(slug);
        setLoading(false)
        setBookData(res.data)
      } catch (error) {
        setLoading(false)
        console.log(error);
      }
    };
    fetchBook();
  }, [slug]);

  useEffect(() => {
    if (bookData && bookData._id) {
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

      // Remove if already exists to move it to the front
      const filtered = recentlyViewed.filter(item => item._id !== bookData._id);

      // Add current book to the front
      const updated = [bookData, ...filtered].slice(0, 36); // Keep last 10

      localStorage.setItem('recentlyViewed', JSON.stringify(updated));

      // Sync to database if user is logged in for recommendation algorithm
      if (currentUser && currentUser.userId) {
        userApi.addViewedBook(currentUser.userId, bookData._id)
          .catch(err => console.log('Error syncing viewed book to DB:', err));
      }
    }
  }, [bookData, currentUser]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        let res;
        if (currentUser && currentUser.userId) {
          res = await bookApi.getAIRecommendations(currentUser.userId);
        } else {
          res = await bookApi.getRecommendations(bookData._id);
        }
        setLoading(false)
        setRecommendations(res.data)
      } catch (error) {
        setLoading(false)
        console.log(error);
      }
    };
    if (bookData._id) {
      fetchRecommendations();
    }
  }, [bookData._id, currentUser]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await reviewApi.getByBookId(bookData._id);
        setReviews(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    if (bookData._id) {
      fetchReviews();
    }
  }, [bookData._id]);


  const decQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const incQuantity = () => {
    if (quantity < (bookData.stock || 0)) {
      setQuantity(parseInt(quantity + 1))
    }
  }

  const handleChange = (e) => {
    console.log(e.target.value);
    // /^[0-9]+$/.test(newQuantity)
    //sai khi them chu
    const newQuantity = parseInt(e.target.value)
    if (newQuantity) {
      if (newQuantity > (bookData.stock || 0)) {
        setQuantity(bookData.stock || 0)
      } else {
        setQuantity(newQuantity)
      }
    }
    else {
      setQuantity('')
    }
  }

  const handleAddToCart = () => {
    if (currentUser && currentUser.userId) {
      const { _id: productId, name, imageUrl, slug, price, discount } = bookData
      let newPrice = price
      if (discount > 0) {
        newPrice = price - price * discount / 100
      }
      const action = addToCart({
        quantity, productId, name, imageUrl, slug,
        price: newPrice,
        totalPriceItem: newPrice * quantity
      })
      dispatch(action)
      toast.success('Thêm sản phẩm vào giỏ hàng thành công!', { autoClose: 2000 })
    } else {
      toast.info('Vui lòng đăng nhập để thực hiện!', { autoClose: 2000 })
    }
  }

  const handleBuyNow = () => {
    if (currentUser && currentUser.userId) {
      const { _id: productId, name, imageUrl, slug, price, discount } = bookData
      let newPrice = price
      if (discount > 0) {
        newPrice = price - price * discount / 100
      }
      const action = addToCart({
        quantity, productId, name, imageUrl, slug,
        price: newPrice,
        totalPriceItem: newPrice * quantity
      })
      dispatch(action)
      navigate({ pathname: "/gio-hang" });
    } else {
      toast.info('Vui lòng đăng nhập để thực hiện!', { autoClose: 2000 })
    }
  }

  return (
    <div className="main">
      <Container>
        {!loading ?
          <Row className={styles.productBriefing}>
            <Col xl={4} xs={12}>
              <div className={styles.imgBriefing}>
                <img src={bookData && bookData.imageUrl} alt="" />
              </div>

              <div className={`d-flex ${styles.itemBriefing}`}>
                <div className={styles.textBold}>Số lượng: </div>
                <div className='d-flex'>
                  <button className={styles.descreaseBtn} onClick={decQuantity}>
                    <AiOutlineMinus />
                  </button>
                  <input type="text" className={styles.quantityInput} value={quantity} onChange={handleChange} />
                  <button className={styles.increaseBtn} onClick={incQuantity} disabled={quantity >= (bookData.stock || 0)}>
                    <AiOutlinePlus />
                  </button>
                </div>
                {/* {bookData.stock <= 10 && bookData.stock > 0 && ( */}
                {bookData.stock > 0 && (
                  <div style={{ color: '#d9534f', marginLeft: '10px', fontSize: '14px', alignSelf: 'center' }}>
                    Còn {bookData.stock} cuốn
                  </div>
                )}
                {bookData.stock <= 0 && (
                  <div style={{ color: '#d9534f', marginLeft: '10px', fontSize: '14px', alignSelf: 'center' }}>
                    Hết hàng
                  </div>
                )}
              </div>

              <div className={styles.actions}>
                <div className={styles.actions_bottom}>
                  <button
                    className={styles.addToCartBtn}
                    onClick={handleAddToCart}
                    disabled={bookData.stock <= 0}
                    style={bookData.stock <= 0 ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}}
                  >
                    <AiOutlineShoppingCart className={styles.addToCartIcon} />
                    {bookData.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
                  </button>
                </div>
              </div>

              <div className={styles.actions}>
                <div className={styles.actions_bottom}>
                  <button
                    className={styles.buyBtn}
                    onClick={handleBuyNow}
                    disabled={bookData.stock <= 0}
                    style={bookData.stock <= 0 ? { backgroundColor: '#ccc', cursor: 'not-allowed' } : {}}
                  >
                    {bookData.stock <= 0 ? 'Hết hàng' : 'Mua ngay'}
                  </button>
                </div>
              </div>
            </Col>

            <Col xl={8}>
              <div className={styles.infoBriefing}>
                <div>
                  <h2>{bookData && bookData.name}</h2>
                  <div className={styles.price}>
                    {bookData.discount > 0 ?
                      (<p>
                        <span>{format.formatPrice(bookData.price - bookData.price * bookData.discount / 100)}</span>
                        <span className={styles.oldPrice}>{format.formatPrice(bookData.price)}</span>
                      </p>)
                      : format.formatPrice(bookData.price)}
                  </div>

                  <div className={`d-flex ${styles.itemBriefing} ${styles.description}`}>
                    <div dangerouslySetInnerHTML={{ __html: bookData?.description }} />
                  </div>

                  <DetailedBookInfo data={bookData} />

                  <div className="mt-5">
                    <h4 className="mb-4">Đánh giá từ khách hàng ({reviews.length})</h4>
                    {reviews.length > 0 ? (
                      <div className={styles.reviewList}>
                        {reviews.map((review) => (
                          <div key={review._id} className="mb-4 pb-3 border-bottom">
                            <div className="d-flex align-items-center mb-2">
                              <div className={styles.userAvatar}>
                                {review.user?.fullName?.charAt(0).toUpperCase()}
                              </div>
                              <div className="ms-3">
                                <div className="fw-bold">{review.user?.fullName}</div>
                                <div style={{ color: '#ffc107' }}>
                                  {[...Array(5)].map((_, i) => (
                                    <AiFillStar key={i} style={{ color: i < review.rating ? '#ffc107' : '#e4e5e9' }} />
                                  ))}
                                </div>
                              </div>
                              <div className="ms-auto text-muted small">
                                {moment(review.createdAt).format('DD/MM/YYYY')}
                              </div>
                            </div>
                            <div className="ms-5 ps-2">{review.comment}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">Chưa có đánh giá nào cho sản phẩm này.</p>
                    )}
                  </div>
                </div>
              </div>
            </Col>

            <div className={stylesH.title}>
                            <h2 className={stylesH.titleHeading}>Có thể bạn thích</h2>
                        </div>
            {recommendations && recommendations.length > 0 ? (
              recommendations.map(book =>
                <Col xl={2} xs={6} key={book._id}>
                  <BookItem data={book} />
                </Col>)
            ) : <Loading />}
            <RecentlyViewed/>
          </Row>

          : <Loading />}
      </Container>
    </div>
  )
}
