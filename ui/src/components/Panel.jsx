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

          <div className="card mb-3">
            <h3 className="card-header"></h3>
            <div className="card-body">
              <h5 className="card-title">ECE Location Analysis</h5>
              <h6 className="card-subtitle text-muted">Early Childhood Education Centre<br/>Planning Tool</h6>
            </div>
            <img src="/assets/olivia-bauso-VQLyz0CpVFM-unsplash.jpg" className="img-responsive" id="play"></img>
            <div className="card-body">
              <p className="card-text">This tool aims to assist planning of Early Childhood Education centre locations in New Zealand. It helps by identifying demographics vs childhood centre enrolments for centres around the country.</p>
              <p className="card-text">You can click on a centre to generate a service area and view the underlying demographics.</p>
              <p className="card-text">Select a location on the map to start!</p>
              <p className="card-text"><hr style={{width:'50%'}}/></p>
              <p className="card-text">Built with HERE, HERE APIs, MfE APIs, Mapbox, React, Bootstrap, Carto Colors.</p>
              <a href="https://github.com/nzjs" className="card-link">Developed by John Stowell</a>
            </div>
            <div className="card-footer text-muted"></div>
          </div>

          <div class="card">
            <h3 className="card-header"></h3>
              <div className="card-body">
                <h5 className="card-title">Map Legend</h5>
                <div className="legend">
                  <span className="legend-title">Enrolment, Total Students</span>
                  <span className="left fff">Less</span>
                  <span className="right fff">More</span>
                </div>
              </div>
            <div className="card-footer text-muted"></div>
          </div>

        </div>
      </>
    )
  }
}

export default PanelLeft;