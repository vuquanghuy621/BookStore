import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

import {IoLogoFacebook, IoLogoYoutube, IoLogoInstagram } from "react-icons/io5";

import styles from "./Footer.module.css";
function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <Row>
          <Col xl={4} xs={12}>
            <div className={styles.footerGroup}>
              <Link to='/'><h1 className={`${styles.bookstoreHighlight} me-5`}>BookStore</h1></Link>
              <p>Địa chỉ: 123 Đường số 13, P.14, Q.15, TP. HCM</p>
              <p>Email: bookstore@gmail.com</p>
              <p>SĐT: 028 6210 6210</p>
            </div>
          </Col>
          <Col xl={5} xs={12}>
            <div className={styles.footerGroup}>
                <Row>
                  <Col xl={6} xs={4} className={styles.cateList}>
                    <div className={styles.footerBoxLink}>
                        <p className={styles.title}>DANH MỤC</p>
                        <Link to="/">Giới thiệu BookStore</Link>
                        <Link to="/">Điều khoản sử dụng</Link>
                        <Link to="/">Hướng dẫn mua hàng</Link>
                    </div>
                  </Col>
                  <Col xl={6} xs={6}>
                    <div className={styles.footerBoxLink}>
                        <p className={styles.title}>CHÍNH SÁCH</p>
                        <Link to="/">Chính sách bảo mật</Link>
                        <Link to="/">Chính sách đổi trả</Link>
                        <Link to="/">Chính sách vận chuyển</Link>
                    </div>
                  </Col>
                </Row>
            </div>
          </Col>
          <Col xl={3} xs={12}>
            <div className={styles.footerGroup}>
              <p className={styles.title}>THEO DÕI CHÚNG TÔI</p>
              <p>Theo dõi để nhận được được thông tin mới nhất từ chúng tôi.</p>
              <div className={styles.boxSocial}>
                <button className={`bookstore-btn ${styles.bookstoreBtn}`}><IoLogoFacebook /></button>
                <button className={`bookstore-btn ${styles.bookstoreBtn}`}><IoLogoYoutube /></button>
                <button className={`bookstore-btn ${styles.bookstoreBtn}`}><IoLogoInstagram /></button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;
