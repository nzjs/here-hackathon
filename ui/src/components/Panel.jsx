import React from 'react';
import { Tab, Nav, Col, Row, Modal, Button, Image, Spinner } from 'react-bootstrap';

class PanelLeft extends React.Component {
  state = {
    modal: false
  }

  // Return data to callback function in App.js
  sendToParent = (d) => {
    this.props.callback(d);
  }

  // Button to reset the view
  resetView = () => {
    window.location.reload(1);
  }

  // Display or hide a modal with full image
  showModal = () => {
    // console.log('you clicked the image')
    this.setState({
      modal: true
    });
  }
  hideModal = () => {
    this.setState({
      modal: false
    });
  }

  componentDidMount() {
  }

  // componentDidUpdate(prevProps, prevState) {
  // }

  render() {
    
    return (
      <>
        <div className="panel-text">

          <div class="card mb-3">
            <h3 class="card-header"></h3>
            <div class="card-body">
              <h5 class="card-title">EduLab</h5>
              <h6 class="card-subtitle text-muted">Early Childhood Education Centre<br/>Location Analysis Tool</h6>
            </div>
            {/* <svg xmlns="http://www.w3.org/2000/svg" class="d-block user-select-none" width="100%" height="200" aria-label="Placeholder: Image cap" focusable="false" role="img" preserveAspectRatio="xMidYMid slice" viewBox="0 0 318 180" >
              <rect width="100%" height="100%" fill="#868e96"></rect>
              <text x="50%" y="50%" fill="#dee2e6" dy=".3em">Image cap</text>
            </svg> */}
            <img src="/assets/olivia-bauso-VQLyz0CpVFM-unsplash.jpg" className="img-responsive" id="play"></img>
            <div class="card-body">
              <p class="card-text">This tool aims to address planning of Early Childhood Education centre locations, and find how they can be optimised.</p>
              <p class="card-text">You can identify if existing centres are suitable for the underlying demographics, and investigate relationships with other nearby childhood centres.</p>
              <p class="card-text">Select a location on the map to get started.</p>
            </div>
            {/* <ul class="list-group list-group-flush">
              <li class="list-group-item">Cras justo odio</li>
              <li class="list-group-item">Dapibus ac facilisis in</li>
              <li class="list-group-item">Vestibulum at eros</li>
            </ul> */}
            <div class="card-body">
              <a href="https://github.com/nzjs" class="card-link">Built by John Stowell</a>
            </div>
            <div class="card-footer text-muted"></div>
          </div>
          <div class="card">
            <div class="card-body">
              <h4 class="card-title">Card title</h4>
              <h6 class="card-subtitle mb-2 text-muted">Card subtitle</h6>
              <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
              <a href="#" class="card-link">Card link</a>
              <a href="#" class="card-link">Another link</a>
            </div>
          </div>

        </div>
      </>
    )
  }
}

export default PanelLeft;