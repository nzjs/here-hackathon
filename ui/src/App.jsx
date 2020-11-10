import React from 'react';
import './App.css';
import { Container, Row, Col } from 'react-bootstrap';
import Map from './components/Map';
import Header from './components/Header';
import PanelLeft from './components/Panel';

class App extends React.Component {
  state = {
    selection: null,
    isLoading: true
  }

  callbackSelection = (selection) => {
    this.setState({
      selection: selection
    })
  }

  render() {
    return (
      <>
        <Header />
        <Container fluid>
          <Row>
            <Col xs={12} md={3} className='panel'>
              <PanelLeft />
            </Col>
            <Col xs={12} md={9} className='panel-mapbox'>
              <Map callback={this.callbackSelection}/>
            </Col>
          </Row>
        </Container>
      </>
    );
  }
}

export default App;
