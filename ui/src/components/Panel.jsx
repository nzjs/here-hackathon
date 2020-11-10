import React from 'react';

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
            <div className="card-body">
              <h5 className="card-title">GP Clinic Locations</h5>
              <h6 className="card-subtitle text-muted">Health Risk Analysis Tool</h6>
            </div>
            <img src="./assets/ani-kolleshi-7jjnJ-QA9fY-unsplash.jpg" alt="" className="img-responsive" id="play"></img>
            <div className="card-body">
              <p className="card-text">This tool aims to assist health clinic officials in New Zealand. It helps to identify the most at risk patient locations in relation to a clinic.</p>
              <p className="card-text">Click on a health clinic to begin - this will generate a clinic service area and symbolise the most at risk areas. This information is calculated from damp and mouldy housing statistics (2018 New Zealand Census).</p>
              <hr style={{width:'50%'}}/>
              <p className="card-text">Built with HERE, HERE APIs, Stats NZ data, React, Bootstrap, and Carto Colours.</p>
              <a href="https://github.com/nzjs" rel="noreferrer" target="_blank" className="card-link">Developed by John Stowell</a>
            </div>
            <div className="card-footer text-muted"></div>
          </div>

          <div className="card">
              <div className="card-body">
                <h5 className="card-title">Map Legend</h5>
                <div className="legend">
                  <span className="legend-title">Health Risk (Damp Housing)</span>
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