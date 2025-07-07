import {
  faFileCsv,
  faSearch,
  faFilePdf,
  faFilter,
  faMicrochip,
  faCalendarAlt,
  faClock,
  faEye,
  faUsers,
  faCow,
  faHippo
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Table, Card, Button, Form, Spinner, Row, Col, Badge, Pagination } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { errorToast } from "../../../../shared/utils/appToaster";
import { PageTitle } from "../../../../shared/components/PageTitle/PageTitle";
import { UserTypeHook } from "../../../../shared/hooks/userTypeHook";
import {
  useGetDeviceByCodeQuery,
  useGetAllDevicesQuery,
  useGetDeviceByIdQuery,
} from "../../../device/store/deviceEndPoint";
import { roles } from "../../../../shared/utils/appRoles";
import { useGetAbsentMemberReportQuery, useLazyGetAbsentMemberReportQuery } from "../../store/recordEndPoint";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { skipToken } from "@reduxjs/toolkit/query";
import '../../Records.scss';

const getToday = () => new Date().toISOString().split("T")[0];

const AbsentMemberRecords = () => {
  const userInfo = useSelector((state) => state.userInfoSlice.userInfo);
  const userType = UserTypeHook();

  const isDairy = userType === roles.DAIRY;
  const isDevice = userType === roles.DEVICE;

  const deviceid = userInfo?.deviceid;
  const dairyCode = userInfo?.dairyCode;

  const { data: dairyDevices = [], isLoading: isDairyLoading } = useGetDeviceByCodeQuery(dairyCode, {
    skip: !isDairy,
  });

  const deviceList = isDairy ? dairyDevices : [];

  const [deviceCode, setDeviceCode] = useState("");
  const [date, setDate] = useState(getToday());
  const [shift, setShift] = useState("MORNING");
  const [viewMode, setViewMode] = useState("ALL");
  const [milkTypeFilter, setMilkTypeFilter] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [searchParams, setSearchParams] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [triggerGetAbsentMemberReport] = useLazyGetAbsentMemberReportQuery();

  useEffect(() => {
    if (isDevice && deviceid) {
      setDeviceCode(deviceid);
    }
  }, [isDevice, deviceid]);

  const handleSearch = () => {
    if (!deviceCode || !date || !shift) {
      errorToast("Please fill all required fields");
      return;
    }

    setSearchParams({
      deviceid: deviceCode,
      date,
      shift,
    });
    setCurrentPage(1);
  };

  useEffect(() => {
    if (searchParams) {
      setSearchParams((prev) => ({ ...prev }));
    }
  }, [currentPage, recordsPerPage]);

  const formattedDate = searchParams?.date?.split("-").reverse().join("/");

  const { data: resultData, isFetching } = useGetAbsentMemberReportQuery(
    searchParams
      ? {
        params: {
          deviceid: searchParams.deviceid,
          date: formattedDate,
          shift: searchParams.shift,
          page: currentPage,
          limit: recordsPerPage,
        },
      }
      : skipToken
  );

  const absent = resultData?.absentMembers || [];
  const totalCount = resultData?.totalRecords || 0;
  const totalPages = Math.ceil(totalCount / recordsPerPage);

  const filteredAbsent = absent.filter(member =>
    (milkTypeFilter === 'ALL' || member.MILKTYPE === milkTypeFilter) &&
    (String(member.CODE).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.MEMBERNAME && member.MEMBERNAME.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const {
    totalMembers = 0,
    presentCount = 0,
    absentCount = 0,
    cowAbsentCount = 0,
    bufAbsentCount = 0,
  } = resultData || {};

  const fetchAllAbsentMembersForExport = async () => {
    const formattedDate = date.split("-").reverse().join("/");
    const params = { deviceid: deviceCode, date: formattedDate, shift };
    // Do NOT include page or limit for export
    const result = await triggerGetAbsentMemberReport({ params }).unwrap();
    return result;
  };

  const handleExportCSV = async () => {
    const result = await fetchAllAbsentMembersForExport();
    const allAbsent = result?.absentMembers || [];
    if (allAbsent.length === 0) {
      alert("No data available to export.");
      return;
    }
    let csv = "";
    if (allAbsent.length > 0) {
      const memberCSV = allAbsent.map((rec, index) => ({
        "S.No": index + 1,
        "Member Code": rec?.CODE,
        "Milk Type": rec?.MILKTYPE === "C" ? "COW" : "BUFFALO",
        "Member Name": rec?.MEMBERNAME || "",
      }));
      csv += `Absent Members Report\nDate: ${date}, Shift: ${shift}, Device Code: ${deviceCode}\n`;
      csv += Papa.unparse(memberCSV);
      csv += "\n\n";
    }
    const summary = [
      {
        "Total Members": result?.totalMembers || 0,
        "Present Members": result?.presentCount || 0,
        "Absent Members": result?.absentCount || 0,
        "Cow Absent": result?.cowAbsentCount || 0,
        "Buffalo Absent": result?.bufAbsentCount || 0,
      },
    ];
    csv += `Summary\n`;
    csv += Papa.unparse(summary);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${deviceCode}_Absent_Members_Report_${date}_${shift}.csv`);
  };

  const handleExportPDF = async () => {
    const result = await fetchAllAbsentMembersForExport();
    const allAbsent = result?.absentMembers || [];
    if (allAbsent.length === 0) {
      alert("No data available to export.");
      return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const title = "Absent Members Report";
    doc.text(title, (pageWidth - doc.getTextWidth(title)) / 2, y);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Date: ${date}`, 14, y);
    doc.text(`Shift: ${shift}`, pageWidth - 50, y);
    y += 6;
    doc.text(`Device Code: ${deviceCode}`, 14, y);
    y += 8;
    if (allAbsent.length > 0) {
      const tableData = allAbsent.map((rec, i) => [
        i + 1,
        rec?.CODE,
        rec?.MILKTYPE === "C" ? "COW" : "BUFFALO",
        rec?.MEMBERNAME || "",
      ]);
      autoTable(doc, {
        startY: y,
        head: [["S.No", "Member Code", "Milk Type", "Member Name"]],
        body: tableData,
        styles: { fontSize: 10 },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 10;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Summary", 14, y);
    y += 6;
    const summaryTable = [
      [
        result?.totalMembers || 0,
        result?.presentCount || 0,
        result?.absentCount || 0,
        result?.cowAbsentCount || 0,
        result?.bufAbsentCount || 0,
      ],
    ];
    autoTable(doc, {
      startY: y,
      head: [["Total Members", "Present", "Absent", "Cow Absent", "Buffalo Absent"]],
      body: summaryTable,
      styles: { fontSize: 10 },
      theme: "striped",
    });
    doc.save(`${deviceCode}_Absent_Members_Report_${date}_${shift}.pdf`);
  };

  return (
    <div className="records-container">
      <Card className="filter-card mb-4">
        <Card.Header className="filter-card-header">
          <FontAwesomeIcon icon={faFilter} className="me-2" />
          Filter Absent Member Records
        </Card.Header>
        <Card.Body>
          <Form>
            <Row className="align-items-end">
              {isDairy && (
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-modern"><FontAwesomeIcon icon={faMicrochip} className="me-2" />Select Device</Form.Label>
                    {isDairyLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <Form.Select
                        className="form-select-modern"
                        value={deviceCode}
                        onChange={(e) => setDeviceCode(e.target.value)}
                      >
                        <option value="">Select Device Code</option>
                        {deviceList?.map((dev) => (
                          <option key={dev.deviceid} value={dev.deviceid}>
                            {dev.deviceid}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  </Form.Group>
                </Col>
              )}
              {isDevice && (
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label className="form-label-modern"><FontAwesomeIcon icon={faMicrochip} className="me-2" />Device</Form.Label>
                    <Form.Control className="form-control-modern" type="text" value={deviceCode} readOnly />
                  </Form.Group>
                </Col>
              )}
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label className="form-label-modern"><FontAwesomeIcon icon={faClock} className="me-2" />Shift</Form.Label>
                  <Form.Select className="form-select-modern" value={shift} onChange={(e) => setShift(e.target.value)}>
                    <option value="MORNING">MORNING</option>
                    <option value="EVENING">EVENING</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label className="form-label-modern"><FontAwesomeIcon icon={faCalendarAlt} className="me-2" />Date</Form.Label>
                  <Form.Control
                    className="form-control-modern"
                    type="date"
                    value={date}
                    max={getToday()}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label className="form-label-modern"><FontAwesomeIcon icon={faEye} className="me-2" />View Mode</Form.Label>
                  <Form.Select
                    className="form-select-modern"
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                  >
                    <option value="ALL">Show All</option>
                    <option value="RECORDS">Only Absent Records</option>
                    <option value="TOTALS">Only Totals</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>&nbsp;</Form.Label>
                  <Button
                    variant="primary"
                    className="w-100 modern-button"
                    onClick={handleSearch}
                    disabled={isFetching}
                  >
                    {isFetching ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      <><FontAwesomeIcon icon={faSearch} className="me-2" />Search</>
                    )}
                  </Button>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {searchParams && (
        <Card className="results-card">
          <Card.Body>
            {isFetching ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <>

                {viewMode !== "TOTALS" && (
                  <Card className="mb-4">
                    <Card.Header className="results-card-header d-flex justify-content-between align-items-center">
                      <span><FontAwesomeIcon icon={faUsers} className="me-2" />Absent Members</span>
                      <Form.Group style={{ width: '250px' }}>
                        <Form.Control
                          type="text"
                          placeholder="Search by Code or Name..."
                          className="form-control-modern"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </Form.Group>
                      <div >
                        <Button variant="outline-success" size="sm" className="export-button me-2" onClick={handleExportCSV}>
                          <FontAwesomeIcon icon={faFileCsv} className="me-2" />CSV
                        </Button>
                        <Button variant="outline-danger" size="sm" className="export-button" onClick={handleExportPDF}>
                          <FontAwesomeIcon icon={faFilePdf} className="me-2" />PDF
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      {/* Filter Bar */}
                      <div className="filter-buttons-group mb-3 d-flex align-items-center">
                        <Button
                          variant={milkTypeFilter === 'ALL' ? 'primary' : 'outline-secondary'}
                          className={`me-2 btn ${milkTypeFilter === 'ALL' ? 'active' : ''}`}
                          onClick={() => setMilkTypeFilter('ALL')}
                        >
                          <FontAwesomeIcon icon={faUsers} className="fa-icon me-1" />All
                        </Button>
                        <Button
                          variant={milkTypeFilter === 'C' ? 'info' : 'outline-info'}
                          className={`me-2 btn ${milkTypeFilter === 'C' ? 'active cow' : ''}`}
                          onClick={() => setMilkTypeFilter('C')}
                        >
                          <FontAwesomeIcon icon={faCow} className="fa-icon me-1" />Cow
                        </Button>
                        <Button
                          variant={milkTypeFilter === 'B' ? 'warning' : 'outline-warning'}
                          className={`btn ${milkTypeFilter === 'B' ? 'active buf' : ''}`}
                          onClick={() => setMilkTypeFilter('B')}
                        >
                          <FontAwesomeIcon icon={faHippo} className="fa-icon me-1" />Buffalo
                        </Button>
                      </div>
                      {/* Card Grid */}
                      {filteredAbsent.length > 0 ? (
                        <div className="records-card-grid">
                          {filteredAbsent.map((record, index) => (
                            <div
                              className={`record-card ${record.MILKTYPE === 'C' ? 'cow' : record.MILKTYPE === 'B' ? 'buf' : 'other'}`}
                              key={index}
                            >
                              <div className="record-card-header">
                                <span className="record-date">
                                  <FontAwesomeIcon icon={record.MILKTYPE === 'C' ? faCow : faHippo} className="record-value-icon" />
                                  {record.MILKTYPE === 'C' ? 'Cow' : 'Buffalo'}
                                </span>
                                <Badge bg={record.MILKTYPE === 'C' ? 'info' : 'warning'} text="dark">
                                  {record.MILKTYPE === 'C' ? 'COW' : 'BUF'}
                                </Badge>
                              </div>
                              <div className="px-3 py-2">
                                <div><strong>Member Code:</strong> {record.CODE}</div>
                                <div><strong>Name:</strong> {record.MEMBERNAME || '-'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted my-4">
                          {searchTerm ? "No members found matching your search." : "No absent members found"}
                        </div>
                      )}
                    </Card.Body>
                    {/* Pagination and rows per page */}
                    {totalCount > 0 && (
                      <Card.Footer>
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                          <div className="d-flex align-items-center gap-2">
                            <span className="text-muted">Rows per page:</span>
                            <Form.Select
                              size="sm"
                              className="form-select-modern-sm"
                              value={recordsPerPage}
                              onChange={(e) => {
                                const value = e.target.value;
                                setRecordsPerPage(parseInt(value));
                                setCurrentPage(1);
                              }}
                              style={{ width: "auto" }}
                            >
                              <option value="10">10</option>
                              <option value="20">20</option>
                              <option value="50">50</option>
                            </Form.Select>
                          </div>
                          {totalCount > recordsPerPage && (
                            <Pagination>
                              <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                              <Pagination.Prev onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} />
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
                                  {page}
                                </Pagination.Item>
                              ))}
                              <Pagination.Next onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} />
                              <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                            </Pagination>
                          )}
                        </div>
                      </Card.Footer>
                    )}
                  </Card>
                )}

                {viewMode !== "RECORDS" && (
                  <Card>
                    <Card.Header className="results-card-header">Summary</Card.Header>
                    <Card.Body>
                      <Table hover responsive className="totals-table">
                        <thead>
                          <tr>
                            <th>Total Members</th>
                            <th>Present</th>
                            <th>Absent</th>
                            <th>Cow Absent</th>
                            <th>Buffalo Absent</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{totalMembers}</td>
                            <td>{presentCount}</td>
                            <td>{absentCount}</td>
                            <td>{cowAbsentCount}</td>
                            <td>{bufAbsentCount}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      )}

      {!searchParams && (
        <div className="text-center my-5 text-muted">
          Please apply filters and click <strong>Search</strong> to view records.
        </div>
      )}
    </div>
  );
};

export default AbsentMemberRecords;