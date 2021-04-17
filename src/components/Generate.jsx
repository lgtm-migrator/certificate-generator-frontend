import React from 'react';
import { Jumbotron, Button, Row } from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import styles from '../css/Login.module.css';
import { btn } from '../css/Verify.module.css';
class Generate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isImgUploaded: false, // To check if image is uploaded
      isUploadButtonPressed: false, //To check if user has pressed the upload button
      certImage: null, // Image of certificate
      labelIdx: -1, // Index of the label which is currently uploaded
      isSizeUploadable: true,
      isResolutionUploadable: true,
      isCheckButtonPressed: false,
      resultData: [],
      columns: [],
      fields: [],
    };
  }
  componentDidMount() {
    this.cert_canvas = React.createRef();

    this.clearCanvas = this.clearCanvas.bind(this);
    this.addTexts = this.addTexts.bind(this);
    this.initCanvas = this.initCanvas.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.makeCertificate = this.makeCertificate.bind(this);
    this.downloadZip = this.downloadZip.bind(this);

    // Dummy data

    this.result_data = [];
    this.certID = null;
  }

  /*
  Clears all text from canvas leaving only certificate image
  */
  clearCanvas = () => {
    const canvas = this.cert_canvas.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.state.certImage, 0, 0);
  };

  /*
  Adds all the text from the text field to the respective location
  */
  addTexts = () => {
    const canvas = this.cert_canvas.current;
    const ctx = canvas.getContext('2d');
    this.clearCanvas();

    for (var field of this.state.fields) {
      // 0.0003 because it scaled the font well
      ctx.font = `${0.0003 * field.font * canvas.width}px sans-serif`;
      ctx.fillText(field.text, field.x, field.y);
    }
  };

  /*
  Creates the initial canvas and returns its context
  */
  initCanvas = () => {
    const canvas = this.cert_canvas.current;
    canvas.width = this.state.certImage.width;
    canvas.height = this.state.certImage.height;
    const ctx = canvas.getContext('2d');
    return ctx;
  };

  /*
  On leaving mouse click, sets all text dragging property to false
  */
  onMouseUp(e) {
    for (var field of this.state.fields) {
      field.isDragged = false;
    }
    this.setState({
      labelIdx: -1,
    });
    e.preventDefault();
  }

  /*
  Moves the text which is draggable, with mouse movement
  */
  onMouseMove(e) {
    const canvas = this.cert_canvas.current;
    const ctx = canvas.getContext('2d');
    const i = this.state.labelIdx;
    if (i !== -1 && this.state.fields[i].isDragged) {
      const scaledCanvas = canvas.getBoundingClientRect();
      const canX =
        ((e.pageX - scaledCanvas.left - window.scrollX) / scaledCanvas.width) *
        canvas.width;
      const canY =
        ((e.pageY - scaledCanvas.top - window.scrollY) / scaledCanvas.height) *
        canvas.height;
      const field = this.state.fields[i];
      const fontSize = 0.0003 * field.font * canvas.width;
      const textLength = ctx.measureText(field.text).width;
      field.x = canX - textLength / 2;
      field.y = canY + fontSize / 2;
      this.addTexts();
    }
    e.preventDefault();
  }

  /*
  Searches the box where the pointer is and sets its draggable property to true
  */
  onMouseDown(e) {
    const canvas = this.cert_canvas.current;
    const ctx = canvas.getContext('2d');
    const scaledCanvas = canvas.getBoundingClientRect();
    const canX =
      ((e.pageX - scaledCanvas.left - window.scrollX) / scaledCanvas.width) *
      canvas.width;
    const canY =
      ((e.pageY - scaledCanvas.top - window.scrollY) / scaledCanvas.height) *
      canvas.height;
    var i,
      x,
      y,
      flag = false;
    for (i in this.state.fields) {
      const field = this.state.fields[i];
      // 0.0003 because it scaled the font well
      const fontSize = 0.0003 * field.font * canvas.width;
      const textLength = field.text.length * fontSize;
      const textHeight = fontSize;
      x = field.x;
      y = field.y;
      if (canX < x + textLength && canX > x && canY > y - textHeight && canY < y) {
        flag = true;
        break;
      }
    }
    if (flag === true) {
      this.setState({
        labelIdx: i,
      });
      const field = this.state.fields[i];
      const fontSize = 0.0003 * field.font * canvas.width;
      const textLength = ctx.measureText(field.text).width;
      field.x = canX - textLength / 2;
      field.y = canY + fontSize / 2;
      this.addTexts();
      this.state.fields[i].isDragged = true;
    }
    e.preventDefault();
  }

  /*
  Creates the certificate initially and add texts with default location
  */
  makeCertificate = () => {
    const ctx = this.initCanvas();
    ctx.lineWidth = 1;
    this.addTexts();
  };

  /*
  Downloads the Zip of all the PDFs
  Implemented from: https://stackoverflow.com/a/56783750/10307491
  */
  downloadZip = () => {
    const canvas = this.cert_canvas.current;
    const ctx = canvas.getContext('2d');
    const quality = 0.5;
    const zip = new JSZip();
    const zipName = `certificate-${new Date()
      .toLocaleDateString('gu-IN')
      .split('/')
      .join('-')}.zip`;

    var initialfields = this.state.columns.map((ele, i) => {
      return {
        text: ele,
        x: this.state.fields[i].x,
        y: this.state.fields[i].y,
        font: 64,
      };
    });
    this.state.resultData.forEach((data) => {
      this.clearCanvas();
      for (var field of initialfields) {
        // 0.0003 because it scaled the font well
        ctx.font = `${0.0003 * field.font * canvas.width}px sans-serif`;

        ctx.fillText(data[field.text], field.x, field.y);
      }

      const imgData = canvas.toDataURL('image/jpeg', quality);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
      var pdfName = data['Filename'];

      zip.file(pdfName, pdf.output('blob'));
    });
    zip.generateAsync({ type: 'blob' }).then(async (content) => {
      console.dir(content);
      await fetch('https://cert-iiit.ml/upload', {
        method: 'POST',
        body: {
          id: this.state.certID,
          zip: content,
        },
      }).then((response) => console.log(response));
      saveAs(content, zipName);
    });
  };

  uploadData = () => {
    return (
      <div className={styles.root}>
        <h2>Upload Data</h2>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            let formdata = new FormData(event.target);
            var imgUrl = URL.createObjectURL(event.target[3].files[0]);
            var img = new Image();
            img.src = imgUrl;
            img.onload = () => {
              if (img.width < 1754 && img.height < 1240) {
                this.setState({
                  isResolutionUploadable: false,
                  isSizeUploadable: true,
                });
              } else {
                this.setState({
                  isImgUploaded: true,
                  certImage: img,
                  isResolutionUploadable: true,
                  isSizeUploadable: true,
                });
              }
            };
            try {
              const res = await fetch('https://cert-iiit.ml/generate', {
                method: 'POST',
                body: formdata,
              });
              if (res.status !== 200) throw new Error('Exception message');
              const result = await res.json();

              const { cert, columns, ...apiData } = result;
              // console.l
              const cert_id = cert.id;
              var resultData = [];

              for (const object in apiData) {
                resultData.push(apiData[object]);
              }
              var fields = columns.map((ele, i) => {
                return {
                  text: ele,
                  x: (i + 1) * 200,
                  y: (i + 1) * 200,
                  font: 64,
                  isDragged: false,
                };
              });

              this.setState({
                ...this.state,
                resultData: resultData,
                certID: cert_id,
                columns: columns,
                fields: fields,
              });
              console.log(this.state);
              this.setState({
                isUploadButtonPressed: true,
              });
              this.makeCertificate();
            } catch (e) {
              console.log(e);
            }
          }}
        >
          <div>
            <label>Event </label>
            <input className={styles.input} type="text" name="event" />
          </div>
          <div>
            <label>Year </label>
            <input className={styles.input} type="text" name="year" />
          </div>
          <div>
            <label>CSV </label>
            <input className={styles.input} type="file" name="csv" accept=".csv" />
          </div>
          <div>
            <label>Certificate </label>
            <input
              className={styles.input}
              type="file"
              name="image"
              accept="image/jpeg, image/png"
            />
          </div>
          <input type="hidden" name="token" value={this.props.loginToken} />
          <input type="submit" className={btn} />
        </form>
      </div>
    );
  };

  /*
  Replaces default placeholder data with real data to see how the certificate
  looks
  */
  replaceText = () => {
    if (this.state.isCheckButtonPressed === false) {
      const firstData = this.state.resultData[0];
      this.originalFields = [];
      for (var field of this.state.fields) {
        this.originalFields.push({ ...field });
        field.text = firstData[field.text];
      }
      this.addTexts();
      this.setState({
        isCheckButtonPressed: true,
      });
    }
    console.log(this.originalFields);
  };

  render() {
    return (
      <React.Fragment>
        <Jumbotron
          style={{
            display: this.state.isUploadButtonPressed ? 'block' : 'none',
          }}
          align="center"
        >
          <h2>Drag the labels to appropriate positions</h2>
          <canvas
            onMouseUp={this.onMouseUp}
            onMouseDown={this.onMouseDown}
            onMouseMove={this.onMouseMove}
            id="cert_canvas"
            ref={this.cert_canvas}
            style={{ width: '100%' }}
            width="0"
            height="0"
            className="my-5"
          />
          <Row className="d-flex justify-content-center">
            <Button
              variant="primary"
              size="lg"
              type="submit"
              style={{ marginLeft: 4 }}
              onClick={() => {
                this.replaceText();
              }}
              className="ml-3"
            >
              Check
            </Button>
            <Button
              variant="primary"
              size="lg"
              type="submit"
              onClick={() => {
                this.downloadZip();
              }}
              className="ml-3"
            >
              Download Certificates
            </Button>
          </Row>
        </Jumbotron>
        {!this.state.isUploadButtonPressed &&
          // <Jumbotron>
          //   <h1 align="center">Upload data </h1>
          //   <Form align="center" className="my-5">
          //     <Form.File
          //       id="imgForm"
          //       accept="image/jpeg, image/png"
          //       onChange={(e) => {
          //         if (e.target.files[0]) {
          //           if (e.target.files[0].size > 1048576) {
          //             this.setState({
          //               isSizeUploadable: false,
          //             });
          //             return;
          //           }
          //           var imgUrl = URL.createObjectURL(e.target.files[0]);
          //           var img = new Image();
          //           img.src = imgUrl;
          //           img.onload = () => {
          //             if (img.width < 1754 && img.height < 1240) {
          //               this.setState({
          //                 isResolutionUploadable: false,
          //                 isSizeUploadable: true,
          //               });
          //             } else {
          //               this.setState({
          //                 isImgUploaded: true,
          //                 certImage: img,
          //                 isResolutionUploadable: true,
          //                 isSizeUploadable: true,
          //               });
          //             }
          //           };
          //         } else {
          //           this.setState({ isImgUploaded: false });
          //         }
          //       }}
          //     />
          //     <div className="my-3">
          //       <p>
          //         {this.state.isSizeUploadable ? (
          //           <React.Fragment>
          //             {this.state.isImgUploaded ? (
          //               <React.Fragment>
          //                 The Certificate Image is{' '}
          //                 <span style={{ color: 'green' }}>added</span>
          //               </React.Fragment>
          //             ) : this.state.isResolutionUploadable ? (
          //               <React.Fragment>
          //                 The Certificate Image is{' '}
          //                 <span style={{ color: 'red' }}>not added</span>
          //               </React.Fragment>
          //             ) : (
          //               <React.Fragment>
          //                 <span style={{ color: 'red' }}>
          //                   Minimum Dimensions of the image should be 1754 x 1240.
          //                 </span>
          //               </React.Fragment>
          //             )}
          //           </React.Fragment>
          //         ) : (
          //           <span style={{ color: 'red' }}>
          //             The Maximum Size of image is 1MB.
          //           </span>
          //         )}
          //       </p>
          //       <Button
          //         variant="primary"
          //         size="lg"
          //         type="submit"
          //         disabled={!this.state.isImgUploaded}
          //         onClick={() => {
          //           this.setState({
          //             isUploadButtonPressed: true,
          //           });
          //           this.makeCertificate();
          //         }}
          //       >
          //         Upload Certificate Image
          //       </Button>
          //     </div>
          //   </Form>
          // </Jumbotron>
          this.uploadData()}
      </React.Fragment>
    );
  }
}

export default Generate;
