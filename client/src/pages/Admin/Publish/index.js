import { useCallback, useEffect, useState } from "react";
import PaginationBookStore from "../../../components/PaginationBookStore";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { Row, Col, Table, Spinner, Modal, Button } from "react-bootstrap";
import publisherApi from "../../../api/publisherApi";

function PublishList() {
  const [authorData, setAuthorData] = useState({});
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [rerender, setRerender] = useState(false);

  const [authorDelete, setAuthorDelete] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const [addAuthor, setAddAuthor] = useState({
    name: "",
    slug: "",
  });
  const [selectedAuthor, setSelectedAuthor] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await publisherApi.getAll({
          page: page,
          limit: 10
        });
        setLoading(false);
        setAuthorData({ authors: data});
      } catch (error) {
        setLoading(false);
        console.log(error);
      }
    };
    fetchData();
  }, [page, rerender]);

  const handleChangePage = useCallback((page) => {
    setPage(page);
  }, []);

  const handleCallApiDelete = async () => {
    try {
      await publisherApi.delete(authorDelete._id);
      setShowModal(false);
      alert("Xóa thành công!");
      setRerender(!rerender);
    } catch (error) {
      alert("Xóa thất bại!");
      setShowModal(false);
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // ✅ đảm bảo slug luôn khớp name
      const payload = { ...addAuthor};
      await publisherApi.create(payload);

      setLoading(false);
      alert("Thêm nhà xuất bản thành công!");
      setRerender(!rerender);
      setShowAddModal(false);
      setAddAuthor({ name: "", slug: "" }); // optional reset
    } catch (error) {
      setLoading(false);
      alert("Thất bại!");
      console.log(error);
    }
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      // ✅ đảm bảo slug luôn khớp name
      const payload = { ...selectedAuthor };
      await publisherApi.update(selectedAuthor?._id, payload);

      setLoading(false);
      alert("Cập nhật thành công!");
      setRerender(!rerender);
      setShowUpdateModal(false);
    } catch (error) {
      setLoading(false);
      alert("Thất bại!");
      console.log(error);
    }
  };


  return (
    <Row>
      {/* UPDATE MODAL */}
      <Modal size="lg" show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cập nhật nhà xuất bản</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmitUpdate}>
            <Row>
              <Col xl={4}>
                <label>Tên nhà xuất bản</label>
                <input
                  required
                  type="text"
                  value={selectedAuthor?.name || ""}
                  className="form-control"
                  onChange={(e) => {
                    const name = e.target.value;
                    setSelectedAuthor((prev) => ({
                      ...prev,
                      name
                    }));
                  }}
                />
              </Col>
            </Row>

            <Button disabled={loading} type="submit" variant="danger" className="mt-2">
              Lưu
            </Button>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>
            Hủy
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ADD MODAL */}
      <Modal size="lg" show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Thêm nhà xuất bản</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmitAdd}>
            <Row>
              <Col xl={4}>
                <label>Tên nhà xuất bản</label>
                <input
                  required
                  type="text"
                  value={addAuthor?.name}
                  className="form-control"
                  onChange={(e) => {
                    const name = e.target.value;
                    setAddAuthor((prev) => ({
                      ...prev,
                      name
                    }));
                  }}
                />
              </Col>
            </Row>

            <Button disabled={loading} type="submit" variant="danger" className="mt-2">
              Lưu
            </Button>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Hủy
          </Button>
        </Modal.Footer>
      </Modal>

      {/* DELETE MODAL */}
      <Modal size="lg" show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xóa tác giả</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc xóa tác giả <b>{authorDelete && authorDelete.name}</b> này không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleCallApiDelete}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* LIST */}
      <Col xl={12}>
        <div className="admin-content-wrapper">
          <div className="admin-content-header">Danh sách nhà xuất bản</div>
          <div className="admin-content-action">
            <div className="d-flex">
              <button
                type="button"
                className="btn btn-success ms-auto"
                onClick={() => setShowAddModal(true)}
              >
                Thêm nhà xuất bản
              </button>
            </div>
          </div>

          <div className="admin-content-body">
            <Table hover>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Nhà xuất bản</th>
                  <th colSpan="2">Hành động</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3}>
                      <Spinner animation="border" variant="success" />
                    </td>
                  </tr>
                ) : authorData.authors && authorData.authors.length > 0 ? (
                  authorData.authors.map((item, index) => (
                    <tr key={item._id}>
                      <td>{(page - 1) * 10 + (index + 1)}</td>
                      <td>
                        {item.name}
                      </td>
                     
                      <td>
                        <Button
                          variant="warning"
                          onClick={() => {
                            // ✅ mở update -> chuẩn hóa slug ngay theo name
                            setSelectedAuthor({ ...item});
                            setShowUpdateModal(true);
                          }}
                        >
                          <FaEdit />
                        </Button>
                      </td>

                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            setAuthorDelete({ _id: item._id, name: item.name });
                            setShowModal(true);
                          }}
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>Không có sản phẩm nào!</td>
                  </tr>
                )}
              </tbody>
            </Table>

            <div className="admin-content-pagination">
              <Row>
                <Col xl={12}>
                  {authorData.totalPage > 1 ? (
                    <PaginationBookStore
                      totalPage={authorData.totalPage}
                      currentPage={page}
                      onChangePage={handleChangePage}
                    />
                  ) : null}
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
}

export default PublishList;
